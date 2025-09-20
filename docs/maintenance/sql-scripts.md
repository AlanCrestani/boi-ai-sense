# Scripts SQL de Manutenção

## 📋 Visão Geral

Esta documentação contém todos os scripts SQL utilizados para manutenção, otimização e operação do sistema ETL. Os scripts são organizados por categoria e incluem instruções de uso, frequência recomendada e considerações de segurança.

## 🗂️ Categorias de Scripts

### 1. Limpeza de Dados
- Remoção de dados antigos
- Limpeza de registros órfãos
- Arquivamento de dados históricos

### 2. Otimização de Performance
- Reindexação de tabelas
- Atualização de estatísticas
- Análise de consultas lentas

### 3. Monitoramento e Saúde
- Verificação de integridade
- Métricas de uso
- Detecção de anomalias

### 4. Backup e Recuperação
- Scripts de backup
- Restauração de dados
- Verificação de consistência

## 🧹 Scripts de Limpeza de Dados

### 1. Limpeza de Logs Antigos

```sql
-- /scripts/maintenance/cleanup_old_logs.sql
-- Descrição: Remove logs de ETL mais antigos que 30 dias
-- Frequência: Diária (via cron)
-- Segurança: Média - remove dados permanentemente

BEGIN;

-- Criar tabela de backup temporário se necessário
CREATE TABLE IF NOT EXISTS etl_logs_archive (
  LIKE etl_logs INCLUDING ALL
);

-- Arquivar logs importantes antes de deletar
INSERT INTO etl_logs_archive
SELECT * FROM etl_logs
WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
  AND log_level IN ('ERROR', 'FATAL')
  AND created_at > CURRENT_DATE - INTERVAL '365 days'; -- Manter até 1 ano

-- Remover logs antigos (exceto erros críticos)
DELETE FROM etl_logs
WHERE created_at < CURRENT_DATE - INTERVAL '30 days'
  AND log_level NOT IN ('ERROR', 'FATAL');

-- Remover erros críticos muito antigos (mais de 1 ano)
DELETE FROM etl_logs
WHERE created_at < CURRENT_DATE - INTERVAL '365 days';

-- Estatísticas do cleanup
SELECT
  'etl_logs' as table_name,
  COUNT(*) as remaining_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record,
  pg_size_pretty(pg_total_relation_size('etl_logs')) as table_size
FROM etl_logs;

COMMIT;
```

### 2. Arquivamento de Dados Processados

```sql
-- /scripts/maintenance/archive_processed_data.sql
-- Descrição: Move dados processados antigos para tabelas de arquivo
-- Frequência: Semanal
-- Segurança: Baixa - apenas move dados

BEGIN;

-- Criar tabelas de arquivo se não existirem
CREATE TABLE IF NOT EXISTS etl_file_archive (
  LIKE etl_file INCLUDING ALL
) PARTITION BY RANGE (updated_at);

CREATE TABLE IF NOT EXISTS animal_measurements_archive (
  LIKE animal_measurements INCLUDING ALL
) PARTITION BY RANGE (measurement_date);

-- Criar partições para o arquivo se necessário
-- Função auxiliar para criar partições automáticas
CREATE OR REPLACE FUNCTION create_archive_partition(
  table_name TEXT,
  start_date DATE,
  end_date DATE
) RETURNS void AS $$
DECLARE
  partition_name TEXT;
BEGIN
  partition_name := table_name || '_' ||
                   to_char(start_date, 'YYYY_MM');

  -- Verificar se partição já existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = partition_name
  ) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF %I
       FOR VALUES FROM (%L) TO (%L)',
      partition_name, table_name, start_date, end_date
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Criar partições para os últimos 6 meses
DO $$
DECLARE
  current_month DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months');
  end_month DATE;
BEGIN
  WHILE current_month < DATE_TRUNC('month', CURRENT_DATE) LOOP
    end_month := current_month + INTERVAL '1 month';

    PERFORM create_archive_partition(
      'etl_file_archive',
      current_month,
      end_month
    );

    PERFORM create_archive_partition(
      'animal_measurements_archive',
      current_month,
      end_month
    );

    current_month := end_month;
  END LOOP;
END $$;

-- Arquivar arquivos ETL processados há mais de 90 dias
WITH archived_files AS (
  INSERT INTO etl_file_archive
  SELECT * FROM etl_file
  WHERE status IN ('loaded', 'error')
    AND updated_at < CURRENT_DATE - INTERVAL '90 days'
  RETURNING id
)
DELETE FROM etl_file
WHERE id IN (SELECT id FROM archived_files);

-- Arquivar medições antigas (mais de 2 anos)
WITH archived_measurements AS (
  INSERT INTO animal_measurements_archive
  SELECT * FROM animal_measurements
  WHERE measurement_date < CURRENT_DATE - INTERVAL '2 years'
  RETURNING id
)
DELETE FROM animal_measurements
WHERE id IN (SELECT id FROM archived_measurements);

-- Relatório do arquivamento
SELECT
  'Archive Summary' as report_type,
  'etl_file' as table_name,
  (SELECT COUNT(*) FROM etl_file) as current_records,
  (SELECT COUNT(*) FROM etl_file_archive) as archived_records,
  pg_size_pretty(pg_total_relation_size('etl_file')) as current_size,
  pg_size_pretty(pg_total_relation_size('etl_file_archive')) as archive_size

UNION ALL

SELECT
  'Archive Summary',
  'animal_measurements',
  (SELECT COUNT(*) FROM animal_measurements),
  (SELECT COUNT(*) FROM animal_measurements_archive),
  pg_size_pretty(pg_total_relation_size('animal_measurements')),
  pg_size_pretty(pg_total_relation_size('animal_measurements_archive'));

COMMIT;
```

### 3. Limpeza de Dead Letter Queue

```sql
-- /scripts/maintenance/cleanup_dlq.sql
-- Descrição: Remove entradas resolvidas da DLQ e processa automáticas
-- Frequência: Diária
-- Segurança: Média

BEGIN;

-- Backup de entradas que serão removidas
CREATE TEMP TABLE dlq_cleanup_backup AS
SELECT * FROM etl_dead_letter_queue
WHERE resolved = true
  AND resolved_at < CURRENT_DATE - INTERVAL '30 days';

-- Remover entradas resolvidas antigas
DELETE FROM etl_dead_letter_queue
WHERE resolved = true
  AND resolved_at < CURRENT_DATE - INTERVAL '30 days';

-- Processar automaticamente erros transientes antigos
UPDATE etl_dead_letter_queue
SET
  resolved = true,
  resolved_at = CURRENT_TIMESTAMP,
  resolved_by = NULL,
  resolution_notes = 'Auto-resolved: transient error timeout'
WHERE error_type IN ('timeout', 'connection', 'rate_limited')
  AND created_at < CURRENT_DATE - INTERVAL '7 days'
  AND resolved = false
  AND retry_count >= max_retries;

-- Marcar para revisão manual erros críticos antigos
UPDATE etl_dead_letter_queue
SET resolution_notes = COALESCE(resolution_notes, '') ||
    ' [NEEDS_REVIEW: Old unresolved error]'
WHERE error_type IN ('validation', 'business_rule')
  AND created_at < CURRENT_DATE - INTERVAL '14 days'
  AND resolved = false
  AND resolution_notes NOT LIKE '%NEEDS_REVIEW%';

-- Estatísticas da DLQ
SELECT
  error_type,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE resolved = false) as unresolved,
  COUNT(*) FILTER (WHERE resolved = true) as resolved,
  COUNT(*) FILTER (WHERE created_at > CURRENT_DATE - INTERVAL '24 hours') as last_24h,
  AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, CURRENT_TIMESTAMP) - created_at))/3600) as avg_resolution_hours
FROM etl_dead_letter_queue
GROUP BY error_type
ORDER BY unresolved DESC;

COMMIT;
```

## ⚡ Scripts de Otimização de Performance

### 1. Reindexação Inteligente

```sql
-- /scripts/maintenance/smart_reindex.sql
-- Descrição: Reindexação baseada em métricas de fragmentação
-- Frequência: Semanal
-- Segurança: Baixa - operação de manutenção

-- Função para obter estatísticas de índices
CREATE OR REPLACE FUNCTION get_index_stats()
RETURNS TABLE (
  schemaname text,
  tablename text,
  indexname text,
  num_rows bigint,
  table_size_mb numeric,
  index_size_mb numeric,
  bloat_ratio numeric,
  needs_reindex boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.schemaname,
    s.tablename,
    s.indexname,
    s.reltuples::bigint as num_rows,
    ROUND(pg_relation_size(s.relid) / 1024.0 / 1024.0, 2) as table_size_mb,
    ROUND(pg_relation_size(s.indexrelid) / 1024.0 / 1024.0, 2) as index_size_mb,
    ROUND(
      CASE
        WHEN pg_relation_size(s.indexrelid) > 0 THEN
          (pg_relation_size(s.indexrelid)::numeric /
           NULLIF(pg_relation_size(s.relid)::numeric, 0)) * 100
        ELSE 0
      END, 2
    ) as bloat_ratio,
    CASE
      WHEN pg_relation_size(s.indexrelid) > 100 * 1024 * 1024 -- 100MB
        AND pg_relation_size(s.indexrelid)::numeric /
            NULLIF(pg_relation_size(s.relid)::numeric, 0) > 0.3 -- 30% do tamanho da tabela
      THEN true
      ELSE false
    END as needs_reindex
  FROM pg_stat_user_indexes s
  JOIN pg_class c ON c.oid = s.relid
  WHERE s.schemaname = 'public'
    AND c.reltuples > 1000; -- Apenas tabelas com dados
END;
$$ LANGUAGE plpgsql;

-- Executar análise de índices
DO $$
DECLARE
  index_rec RECORD;
  reindex_sql TEXT;
  start_time TIMESTAMP;
  end_time TIMESTAMP;
BEGIN
  -- Log início da reindexação
  RAISE NOTICE 'Iniciando análise de índices: %', CURRENT_TIMESTAMP;

  -- Criar tabela temporária para resultados
  CREATE TEMP TABLE reindex_results (
    schema_name TEXT,
    table_name TEXT,
    index_name TEXT,
    before_size_mb NUMERIC,
    after_size_mb NUMERIC,
    duration_seconds INTEGER,
    status TEXT
  );

  -- Processar cada índice que precisa de reindexação
  FOR index_rec IN
    SELECT * FROM get_index_stats()
    WHERE needs_reindex = true
    ORDER BY index_size_mb DESC
  LOOP
    BEGIN
      start_time := CURRENT_TIMESTAMP;

      RAISE NOTICE 'Reindexando: %.% (%.MB)',
        index_rec.tablename, index_rec.indexname, index_rec.index_size_mb;

      -- Executar reindex
      reindex_sql := format('REINDEX INDEX CONCURRENTLY %I', index_rec.indexname);
      EXECUTE reindex_sql;

      end_time := CURRENT_TIMESTAMP;

      -- Obter novo tamanho
      INSERT INTO reindex_results VALUES (
        index_rec.schemaname,
        index_rec.tablename,
        index_rec.indexname,
        index_rec.index_size_mb,
        ROUND(pg_relation_size(index_rec.indexname::regclass) / 1024.0 / 1024.0, 2),
        EXTRACT(EPOCH FROM (end_time - start_time))::INTEGER,
        'SUCCESS'
      );

    EXCEPTION WHEN OTHERS THEN
      -- Log erro mas continua com próximo índice
      INSERT INTO reindex_results VALUES (
        index_rec.schemaname,
        index_rec.tablename,
        index_rec.indexname,
        index_rec.index_size_mb,
        index_rec.index_size_mb,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - start_time))::INTEGER,
        'ERROR: ' || SQLERRM
      );
    END;
  END LOOP;

  -- Relatório final
  RAISE NOTICE 'Reindexação concluída: %', CURRENT_TIMESTAMP;

END $$;

-- Mostrar resultados da reindexação
SELECT
  table_name,
  index_name,
  before_size_mb,
  after_size_mb,
  ROUND(((before_size_mb - after_size_mb) / NULLIF(before_size_mb, 0)) * 100, 2) as space_saved_pct,
  duration_seconds,
  status
FROM reindex_results
ORDER BY (before_size_mb - after_size_mb) DESC;
```

### 2. Atualização de Estatísticas

```sql
-- /scripts/maintenance/update_statistics.sql
-- Descrição: Atualiza estatísticas do banco para otimizar query planner
-- Frequência: Diária
-- Segurança: Baixa

-- Função para atualizar estatísticas inteligentemente
CREATE OR REPLACE FUNCTION smart_analyze()
RETURNS TABLE (
  table_name text,
  rows_count bigint,
  pages_count bigint,
  last_analyze timestamp with time zone,
  stats_updated boolean
) AS $$
DECLARE
  table_rec RECORD;
  analyze_sql TEXT;
BEGIN
  -- Atualizar estatísticas para tabelas que precisam
  FOR table_rec IN
    SELECT
      schemaname,
      tablename,
      n_tup_ins + n_tup_upd + n_tup_del as total_changes,
      last_analyze,
      pg_class.reltuples,
      pg_class.relpages
    FROM pg_stat_user_tables
    JOIN pg_class ON pg_class.oid = pg_stat_user_tables.relid
    WHERE schemaname = 'public'
      AND (
        -- Tabela nunca foi analisada
        last_analyze IS NULL
        -- Ou muitas mudanças desde último ANALYZE
        OR (n_tup_ins + n_tup_upd + n_tup_del) > pg_class.reltuples * 0.1
        -- Ou último ANALYZE há mais de 1 dia
        OR last_analyze < CURRENT_TIMESTAMP - INTERVAL '1 day'
      )
  LOOP
    BEGIN
      analyze_sql := format('ANALYZE %I.%I', table_rec.schemaname, table_rec.tablename);
      EXECUTE analyze_sql;

      -- Retornar informações da tabela atualizada
      RETURN QUERY
      SELECT
        table_rec.tablename,
        table_rec.reltuples::bigint,
        table_rec.relpages::bigint,
        table_rec.last_analyze,
        true;

    EXCEPTION WHEN OTHERS THEN
      -- Log erro mas continua
      RAISE NOTICE 'Erro ao analisar tabela %: %', table_rec.tablename, SQLERRM;

      RETURN QUERY
      SELECT
        table_rec.tablename,
        table_rec.reltuples::bigint,
        table_rec.relpages::bigint,
        table_rec.last_analyze,
        false;
    END;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Executar atualização de estatísticas
SELECT * FROM smart_analyze();

-- Relatório de estatísticas do banco
SELECT
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_tup_ins + n_tup_upd + n_tup_del as total_changes,
  last_analyze,
  last_autoanalyze,
  CASE
    WHEN last_analyze IS NULL THEN 'NEVER'
    WHEN last_analyze < CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 'OLD'
    WHEN last_analyze < CURRENT_TIMESTAMP - INTERVAL '1 day' THEN 'STALE'
    ELSE 'FRESH'
  END as analyze_status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY total_changes DESC;
```

### 3. Análise de Queries Lentas

```sql
-- /scripts/maintenance/slow_query_analysis.sql
-- Descrição: Identifica e analisa queries mais lentas
-- Frequência: Semanal
-- Segurança: Baixa - apenas leitura

-- Habilitar captura de queries lentas se não estiver ativo
-- (requer reinicialização do PostgreSQL)
/*
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 segundo
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET log_statement = 'none';
SELECT pg_reload_conf();
*/

-- Verificar configurações atuais
SELECT
  name,
  setting,
  unit,
  context
FROM pg_settings
WHERE name IN (
  'log_min_duration_statement',
  'log_line_prefix',
  'log_statement',
  'shared_preload_libraries'
);

-- Queries mais lentas (se pg_stat_statements estiver habilitado)
SELECT
  query,
  calls,
  total_time,
  mean_time,
  stddev_time,
  min_time,
  max_time,
  rows,
  100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 10  -- Apenas queries executadas várias vezes
ORDER BY total_time DESC
LIMIT 20;

-- Queries com maior tempo médio
SELECT
  query,
  calls,
  mean_time,
  total_time,
  rows,
  100.0 * shared_blks_hit / NULLIF(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE calls > 5
ORDER BY mean_time DESC
LIMIT 15;

-- Análise de uso de índices
SELECT
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 10 THEN 'RARELY_USED'
    WHEN idx_scan < 100 THEN 'MODERATELY_USED'
    ELSE 'HEAVILY_USED'
  END as usage_category,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;

-- Tabelas com muitos sequential scans
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  seq_tup_read / NULLIF(seq_scan, 0) as avg_tup_per_scan,
  idx_scan,
  n_tup_ins + n_tup_upd + n_tup_del as total_modifications,
  pg_size_pretty(pg_total_relation_size(relid)) as table_size
FROM pg_stat_user_tables
WHERE seq_scan > 100
ORDER BY seq_tup_read DESC;
```

## 📊 Scripts de Monitoramento e Saúde

### 1. Verificação de Integridade

```sql
-- /scripts/maintenance/integrity_check.sql
-- Descrição: Verifica integridade referencial e consistência dos dados
-- Frequência: Diária
-- Segurança: Baixa - apenas verificação

-- Função para verificar integridade referencial
CREATE OR REPLACE FUNCTION check_referential_integrity()
RETURNS TABLE (
  check_name text,
  issue_count bigint,
  severity text,
  description text
) AS $$
BEGIN

  -- Verificar animais órfãos (sem fazenda válida)
  RETURN QUERY
  SELECT
    'orphaned_animals'::text,
    COUNT(*)::bigint,
    'HIGH'::text,
    'Animais sem fazenda válida'::text
  FROM animals a
  LEFT JOIN farms f ON f.id = a.current_farm_id AND f.organization_id = a.organization_id
  WHERE a.current_farm_id IS NOT NULL
    AND f.id IS NULL;

  -- Verificar medições órfãs (sem animal válido)
  RETURN QUERY
  SELECT
    'orphaned_measurements'::text,
    COUNT(*)::bigint,
    'MEDIUM'::text,
    'Medições sem animal válido'::text
  FROM animal_measurements am
  LEFT JOIN animals a ON a.id = am.animal_id AND a.organization_id = am.organization_id
  WHERE a.id IS NULL;

  -- Verificar arquivos ETL órfãos (sem organização)
  RETURN QUERY
  SELECT
    'orphaned_etl_files'::text,
    COUNT(*)::bigint,
    'LOW'::text,
    'Arquivos ETL sem organização válida'::text
  FROM etl_file ef
  LEFT JOIN organizations o ON o.id = ef.organization_id
  WHERE o.id IS NULL;

  -- Verificar inconsistências de data
  RETURN QUERY
  SELECT
    'future_measurements'::text,
    COUNT(*)::bigint,
    'HIGH'::text,
    'Medições com data futura'::text
  FROM animal_measurements
  WHERE measurement_date > CURRENT_TIMESTAMP;

  -- Verificar pesos impossíveis
  RETURN QUERY
  SELECT
    'impossible_weights'::text,
    COUNT(*)::bigint,
    'MEDIUM'::text,
    'Pesos fora dos limites biológicos'::text
  FROM animal_measurements
  WHERE weight_kg < 10 OR weight_kg > 2500;

  -- Verificar duplicatas de medição
  RETURN QUERY
  SELECT
    'duplicate_measurements'::text,
    COUNT(*)::bigint,
    'MEDIUM'::text,
    'Medições duplicadas (mesmo animal/data)'::text
  FROM (
    SELECT animal_id, measurement_date, organization_id, COUNT(*) as cnt
    FROM animal_measurements
    GROUP BY animal_id, measurement_date, organization_id
    HAVING COUNT(*) > 1
  ) duplicates;

  -- Verificar métricas inconsistentes
  RETURN QUERY
  SELECT
    'inconsistent_metrics'::text,
    COUNT(*)::bigint,
    'LOW'::text,
    'Métricas de performance inconsistentes'::text
  FROM etl_metrics
  WHERE metric_value < 0
    OR (metric_name LIKE '%_time' AND metric_value > 3600000); -- Mais de 1 hora

END;
$$ LANGUAGE plpgsql;

-- Executar verificação de integridade
SELECT * FROM check_referential_integrity()
ORDER BY
  CASE severity
    WHEN 'HIGH' THEN 1
    WHEN 'MEDIUM' THEN 2
    ELSE 3
  END,
  issue_count DESC;

-- Verificar consistência de partições
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE '%_y____m__'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. Métricas de Uso do Sistema

```sql
-- /scripts/maintenance/system_metrics.sql
-- Descrição: Coleta métricas de uso e performance do sistema
-- Frequência: Hourly
-- Segurança: Baixa

-- Métricas de ETL por organização (últimas 24h)
WITH etl_metrics AS (
  SELECT
    ef.organization_id,
    COUNT(*) as files_processed,
    COUNT(*) FILTER (WHERE ef.status = 'loaded') as successful_files,
    COUNT(*) FILTER (WHERE ef.status = 'error') as failed_files,
    SUM(ef.total_rows) as total_rows_processed,
    AVG(EXTRACT(EPOCH FROM (ef.processing_completed_at - ef.processing_started_at))/60) as avg_processing_minutes,
    MAX(EXTRACT(EPOCH FROM (ef.processing_completed_at - ef.processing_started_at))/60) as max_processing_minutes
  FROM etl_file ef
  WHERE ef.created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    AND ef.processing_started_at IS NOT NULL
  GROUP BY ef.organization_id
)
SELECT
  o.name as organization_name,
  em.*,
  ROUND((em.successful_files::decimal / NULLIF(em.files_processed, 0)) * 100, 2) as success_rate_pct
FROM etl_metrics em
JOIN organizations o ON o.id = em.organization_id
ORDER BY em.files_processed DESC;

-- Uso de recursos do banco
SELECT
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value,
  'Total database size' as description

UNION ALL

SELECT
  'Active Connections',
  COUNT(*)::text,
  'Currently active connections'
FROM pg_stat_activity
WHERE state = 'active'

UNION ALL

SELECT
  'Cache Hit Ratio',
  ROUND(
    100.0 * sum(blks_hit) / NULLIF(sum(blks_hit) + sum(blks_read), 0), 2
  )::text || '%',
  'Buffer cache hit ratio'
FROM pg_stat_database

UNION ALL

SELECT
  'Index Usage Ratio',
  ROUND(
    100.0 * sum(idx_tup_fetch) / NULLIF(sum(idx_tup_fetch) + sum(seq_tup_read), 0), 2
  )::text || '%',
  'Percentage of tuples fetched via index'
FROM pg_stat_user_tables;

-- Top 10 tabelas por tamanho
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) -
                 pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Estatísticas de Dead Letter Queue
SELECT
  error_type,
  COUNT(*) as total_entries,
  COUNT(*) FILTER (WHERE resolved = false) as unresolved,
  COUNT(*) FILTER (WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours') as last_24h,
  MIN(created_at) as oldest_entry,
  AVG(EXTRACT(EPOCH FROM (COALESCE(resolved_at, CURRENT_TIMESTAMP) - created_at))/3600) as avg_resolution_hours
FROM etl_dead_letter_queue
GROUP BY error_type
ORDER BY unresolved DESC, total_entries DESC;
```

## 💾 Scripts de Backup e Recuperação

### 1. Backup Incremental

```bash
#!/bin/bash
# /scripts/backup/incremental_backup.sh
# Descrição: Backup incremental das tabelas principais
# Frequência: Diário
# Segurança: Alta - backup de dados críticos

set -e

# Configurações
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-conecta_boi}"
DB_USER="${DB_USER:-etl_user}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/conecta-boi}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Data para nomear arquivos
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")

# Função para log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$BACKUP_DIR/backup.log"
}

log "Iniciando backup incremental: $BACKUP_DATE"

# Backup das tabelas principais
TABLES=(
    "etl_file"
    "animal_measurements"
    "etl_metrics"
    "etl_dead_letter_queue"
    "organizations"
    "animals"
    "farms"
)

for table in "${TABLES[@]}"; do
    log "Backup da tabela: $table"

    # Backup completo para tabelas pequenas
    if [[ "$table" == "organizations" || "$table" == "farms" ]]; then
        pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
                --table="$table" \
                --data-only \
                --no-owner \
                --no-privileges \
                -f "$BACKUP_DIR/${table}_${BACKUP_DATE}.sql"
    else
        # Backup incremental (últimas 24h) para tabelas grandes
        psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
             -c "COPY (
                   SELECT * FROM $table
                   WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
                   OR updated_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
                 ) TO STDOUT WITH (FORMAT csv, HEADER true)" \
             > "$BACKUP_DIR/${table}_incremental_${BACKUP_DATE}.csv"
    fi
done

# Backup do schema
log "Backup do schema"
pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
        --schema-only \
        --no-owner \
        --no-privileges \
        -f "$BACKUP_DIR/schema_${BACKUP_DATE}.sql"

# Compactar backups
log "Compactando backups"
cd "$BACKUP_DIR"
tar -czf "backup_${BACKUP_DATE}.tar.gz" *_${BACKUP_DATE}.*
rm -f *_${BACKUP_DATE}.sql *_${BACKUP_DATE}.csv

# Limpeza de backups antigos
log "Removendo backups antigos (mais de $RETENTION_DAYS dias)"
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Verificar integridade do backup
log "Verificando integridade do backup"
if tar -tzf "backup_${BACKUP_DATE}.tar.gz" > /dev/null 2>&1; then
    log "Backup criado com sucesso: backup_${BACKUP_DATE}.tar.gz"
    BACKUP_SIZE=$(du -h "backup_${BACKUP_DATE}.tar.gz" | cut -f1)
    log "Tamanho do backup: $BACKUP_SIZE"
else
    log "ERRO: Backup corrompido ou incompleto"
    exit 1
fi

log "Backup incremental concluído"
```

### 2. Verificação de Consistência

```sql
-- /scripts/maintenance/consistency_check.sql
-- Descrição: Verifica consistência dos dados após backup/restauração
-- Frequência: Após restaurações
-- Segurança: Baixa - apenas verificação

-- Verificar contagens de registros por tabela
SELECT
  schemaname,
  tablename,
  n_tup_ins as total_inserts,
  n_tup_upd as total_updates,
  n_tup_del as total_deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- Verificar sequências
SELECT
  sequence_name,
  last_value,
  start_value,
  increment_by,
  is_called
FROM information_schema.sequences s
JOIN pg_sequences ps ON ps.sequencename = s.sequence_name
WHERE s.sequence_schema = 'public';

-- Verificar constraints violadas
DO $$
DECLARE
  constraint_rec RECORD;
  violation_count INTEGER;
  check_sql TEXT;
BEGIN
  CREATE TEMP TABLE constraint_violations (
    table_name TEXT,
    constraint_name TEXT,
    constraint_type TEXT,
    violation_count INTEGER
  );

  -- Verificar foreign key constraints
  FOR constraint_rec IN
    SELECT
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
  LOOP
    check_sql := format(
      'SELECT COUNT(*) FROM %I t1 LEFT JOIN %I t2 ON t1.%I = t2.%I WHERE t1.%I IS NOT NULL AND t2.%I IS NULL',
      constraint_rec.table_name,
      constraint_rec.foreign_table_name,
      constraint_rec.column_name,
      constraint_rec.foreign_column_name,
      constraint_rec.column_name,
      constraint_rec.foreign_column_name
    );

    EXECUTE check_sql INTO violation_count;

    IF violation_count > 0 THEN
      INSERT INTO constraint_violations VALUES (
        constraint_rec.table_name,
        constraint_rec.constraint_name,
        constraint_rec.constraint_type,
        violation_count
      );
    END IF;
  END LOOP;

  -- Mostrar violações encontradas
  RAISE NOTICE 'Verificação de constraints concluída';

  IF EXISTS (SELECT 1 FROM constraint_violations) THEN
    RAISE NOTICE 'ATENÇÃO: Violações de constraint encontradas:';
    FOR constraint_rec IN SELECT * FROM constraint_violations LOOP
      RAISE NOTICE 'Tabela: %, Constraint: %, Tipo: %, Violações: %',
        constraint_rec.table_name,
        constraint_rec.constraint_name,
        constraint_rec.constraint_type,
        constraint_rec.violation_count;
    END LOOP;
  ELSE
    RAISE NOTICE 'Nenhuma violação de constraint encontrada';
  END IF;
END $$;

-- Verificar totalizações críticas
SELECT 'Organizações' as entity, COUNT(*) as total FROM organizations
UNION ALL
SELECT 'Fazendas', COUNT(*) FROM farms
UNION ALL
SELECT 'Animais', COUNT(*) FROM animals
UNION ALL
SELECT 'Medições (último mês)', COUNT(*) FROM animal_measurements
WHERE measurement_date > CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 'Arquivos ETL (último mês)', COUNT(*) FROM etl_file
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 'DLQ não resolvida', COUNT(*) FROM etl_dead_letter_queue
WHERE resolved = false;
```

## 🔄 Agendamento de Scripts

### Configuração do Cron

```bash
# /etc/cron.d/conecta-boi-maintenance
# Configuração de agendamento para scripts de manutenção

# Limpeza diária de logs (2:00 AM)
0 2 * * * postgres /scripts/maintenance/cleanup_old_logs.sql > /var/log/conecta-boi/cleanup.log 2>&1

# Backup incremental diário (3:00 AM)
0 3 * * * postgres /scripts/backup/incremental_backup.sh > /var/log/conecta-boi/backup.log 2>&1

# Atualização de estatísticas (4:00 AM)
0 4 * * * postgres psql -d conecta_boi -f /scripts/maintenance/update_statistics.sql > /var/log/conecta-boi/statistics.log 2>&1

# Limpeza de DLQ (5:00 AM)
0 5 * * * postgres psql -d conecta_boi -f /scripts/maintenance/cleanup_dlq.sql > /var/log/conecta-boi/dlq.log 2>&1

# Verificação de integridade diária (6:00 AM)
0 6 * * * postgres psql -d conecta_boi -f /scripts/maintenance/integrity_check.sql > /var/log/conecta-boi/integrity.log 2>&1

# Métricas de sistema (a cada hora)
0 * * * * postgres psql -d conecta_boi -f /scripts/maintenance/system_metrics.sql > /var/log/conecta-boi/metrics.log 2>&1

# Reindexação semanal (domingo, 1:00 AM)
0 1 * * 0 postgres psql -d conecta_boi -f /scripts/maintenance/smart_reindex.sql > /var/log/conecta-boi/reindex.log 2>&1

# Arquivamento semanal (domingo, 2:00 AM)
0 2 * * 0 postgres psql -d conecta_boi -f /scripts/maintenance/archive_processed_data.sql > /var/log/conecta-boi/archive.log 2>&1

# Análise de queries lentas (semanal, domingo 7:00 AM)
0 7 * * 0 postgres psql -d conecta_boi -f /scripts/maintenance/slow_query_analysis.sql > /var/log/conecta-boi/slow_queries.log 2>&1
```

---

**Documento Anterior**: [Lógica de Transformação](../mappings/transformation-logic.md)
**Próximo Documento**: [Procedimentos de Arquivamento](archiving.md)