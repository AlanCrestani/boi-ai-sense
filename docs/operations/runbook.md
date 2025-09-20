# Runbook Operacional - ETL Conecta Boi

## 🚨 Procedimentos de Emergência

### Contatos de Emergência
- **Equipe ETL**: etl-team@conectaboi.com
- **DevOps**: devops@conectaboi.com
- **Gerência**: manager@conectaboi.com
- **Plantão 24/7**: +55 11 9999-9999

### Escalação
1. **Nível 1** (0-30 min): Desenvolvedor responsável
2. **Nível 2** (30-60 min): Tech Lead + DevOps
3. **Nível 3** (60+ min): Gerência + C-Level

---

## 📊 Dashboard Principal

### URLs Importantes
- **Dashboard Métricas**: `/metrics-dashboard`
- **Operações ETL**: `/etl-operations`
- **Sentry (Erros)**: https://sentry.io/organizations/conectaboi/
- **Supabase (DB)**: https://supabase.com/dashboard/projects

### Indicadores Críticos
- ✅ **Verde**: Taxa de sucesso > 95%, tempo < SLA
- ⚠️ **Amarelo**: Taxa de sucesso 90-95%, tempo próximo ao SLA
- ❌ **Vermelho**: Taxa de sucesso < 90%, tempo > SLA, erros críticos

---

## 🔄 Procedimentos Operacionais Padrão

### 1. Verificação Matinal (Daily Health Check)

#### Checklist Diário (8:00 AM)
```bash
# 1. Verificar status dos pipelines
curl -X GET "${API_URL}/health" | jq .

# 2. Verificar métricas das últimas 24h
tail -n 100 /var/log/etl/etl-service.log

# 3. Verificar DLQ (Dead Letter Queue)
psql -c "SELECT COUNT(*) FROM etl_dead_letter_queue WHERE resolved = false;"

# 4. Verificar alertas ativos
psql -c "SELECT * FROM etl_alert_history WHERE resolved = false ORDER BY triggered_at DESC LIMIT 10;"
```

#### Ações por Status
- **Verde**: Documentar status OK no log operacional
- **Amarelo**: Monitorar próximo ciclo, preparar ações preventivas
- **Vermelho**: Executar procedimentos de correção imediatos

### 2. Monitoramento de Arquivos

#### Verificar Arquivos Pendentes
```sql
-- Arquivos aguardando processamento há mais de 1 hora
SELECT
    id, filename, status, uploaded_at,
    NOW() - uploaded_at as waiting_time
FROM etl_file
WHERE status IN ('uploaded', 'processing')
    AND uploaded_at < NOW() - INTERVAL '1 hour'
ORDER BY uploaded_at;
```

#### Reprocessar Arquivo Específico
```bash
# Via API
curl -X POST "${API_URL}/files/${FILE_ID}/reprocess" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json"

# Via interface web
# 1. Acesse /etl-operations
# 2. Localize o arquivo
# 3. Clique em "Processar"
```

### 3. Monitoramento de Performance

#### Verificar Tempo de Processamento
```sql
-- Arquivos com processamento mais lento (últimas 24h)
SELECT
    filename,
    EXTRACT(EPOCH FROM (completed_at - processing_started_at))/60 as duration_minutes
FROM etl_file
WHERE completed_at > NOW() - INTERVAL '24 hours'
    AND processing_started_at IS NOT NULL
ORDER BY duration_minutes DESC
LIMIT 10;
```

#### Análise de Bottlenecks
```bash
# Verificar uso de CPU e memória
top -p $(pgrep -f "etl-service")

# Verificar conexões ativas no banco
psql -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

# Verificar espaço em disco
df -h /var/log/etl/
```

---

## 🚨 Cenários de Incident Response

### Cenário 1: Pipeline Completamente Parado

#### Sintomas
- Nenhum arquivo sendo processado há > 30 minutos
- Interface mostra todos os pipelines inativos
- Logs mostram erros de conexão

#### Diagnóstico
```bash
# 1. Verificar se o serviço está rodando
systemctl status etl-service

# 2. Verificar conectividade com banco
psql -c "SELECT 1;"

# 3. Verificar logs recentes
journalctl -u etl-service -f --since "10 minutes ago"
```

#### Resolução
```bash
# 1. Restart do serviço
sudo systemctl restart etl-service

# 2. Se falhar, verificar configuração
cat /etc/etl/config.json

# 3. Restart completo se necessário
sudo systemctl stop etl-service
sleep 10
sudo systemctl start etl-service

# 4. Monitorar recuperação
tail -f /var/log/etl/etl-service.log
```

### Cenário 2: Taxa de Erro Alta (>10%)

#### Sintomas
- Dashboard mostra vermelho
- Muitos arquivos em status "error"
- DLQ crescendo rapidamente

#### Diagnóstico
```sql
-- Tipos de erro mais comuns
SELECT
    error_message,
    COUNT(*) as count,
    MAX(updated_at) as last_occurrence
FROM etl_file
WHERE status = 'error'
    AND updated_at > NOW() - INTERVAL '4 hours'
GROUP BY error_message
ORDER BY count DESC;
```

#### Resolução
1. **Erro de Validação**: Verificar formato dos arquivos recentes
2. **Erro de Conexão**: Verificar conectividade de rede
3. **Erro de Resource**: Verificar CPU/RAM/Disk
4. **Erro de Data**: Verificar integridade dos dados de entrada

### Cenário 3: Dead Letter Queue Cheia (>100 entradas)

#### Sintomas
- DLQ com muitas entradas não resolvidas
- Alertas de DLQ sendo disparados
- Performance degradada

#### Diagnóstico
```sql
-- Análise do DLQ
SELECT
    error_type,
    entity_type,
    COUNT(*) as count,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
FROM etl_dead_letter_queue
WHERE resolved = false
GROUP BY error_type, entity_type
ORDER BY count DESC;
```

#### Resolução
```bash
# 1. Resolver entradas automáticas (transient errors)
curl -X POST "${API_URL}/dlq/resolve-transient" \
  -H "Authorization: Bearer ${API_TOKEN}"

# 2. Revisar entradas manuais
curl -X GET "${API_URL}/dlq?status=unresolved&limit=50" \
  -H "Authorization: Bearer ${API_TOKEN}"

# 3. Resolver individualmente via interface
# Acesse /etl-operations → aba "Dead Letter Queue"
```

### Cenário 4: Degradação de Performance

#### Sintomas
- Processamento > 2x mais lento que normal
- Timeout em operações
- CPU/RAM alto

#### Diagnóstico
```bash
# 1. Verificar recursos do sistema
htop

# 2. Verificar queries lentas
psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# 3. Verificar logs de performance
grep "SLOW_QUERY" /var/log/etl/etl-service.log | tail -20
```

#### Resolução
1. **Scale Vertical**: Aumentar CPU/RAM temporariamente
2. **Scale Horizontal**: Iniciar instância adicional
3. **Otimização**: Aplicar índices ou otimizar queries
4. **Load Balancing**: Distribuir carga entre instâncias

---

## 🔧 Manutenção Preventiva

### Tarefas Semanais (Segundas, 6:00 AM)

```bash
# 1. Limpeza de logs antigos (>30 dias)
find /var/log/etl/ -name "*.log" -mtime +30 -delete

# 2. Arquivamento de dados processados (>90 dias)
psql -f /opt/etl/scripts/archive_old_data.sql

# 3. Análise de performance da semana
psql -f /opt/etl/scripts/weekly_performance_report.sql > /tmp/perf_report.txt

# 4. Backup de configurações
tar -czf /backup/etl-config-$(date +%Y%m%d).tar.gz /etc/etl/
```

### Tarefas Mensais (Primeiro domingo, 4:00 AM)

```bash
# 1. Reindex do banco de dados
psql -c "REINDEX DATABASE etl_production;"

# 2. Update de estatísticas
psql -c "ANALYZE;"

# 3. Limpeza profunda de dados temporários
psql -f /opt/etl/scripts/deep_cleanup.sql

# 4. Review de alertas e thresholds
grep "ALERT" /var/log/etl/etl-service.log | awk '{print $4}' | sort | uniq -c
```

---

## 📈 Métricas de SLA

### Targets Operacionais
- **Disponibilidade**: 99.5% (máximo 3.6 horas de downtime/mês)
- **Tempo de Processamento**: < 2 horas para 95% dos arquivos
- **Taxa de Sucesso**: > 98% dos arquivos processados com sucesso
- **Tempo de Recovery**: < 15 minutos para falhas automáticas

### Métricas de Monitoramento
```sql
-- SLA Dashboard Query
WITH recent_files AS (
    SELECT
        COUNT(*) as total_files,
        COUNT(*) FILTER (WHERE status = 'loaded') as successful_files,
        AVG(EXTRACT(EPOCH FROM (completed_at - processing_started_at))/60) as avg_processing_minutes
    FROM etl_file
    WHERE uploaded_at > NOW() - INTERVAL '24 hours'
)
SELECT
    total_files,
    successful_files,
    ROUND((successful_files::float / total_files * 100), 2) as success_rate_percent,
    ROUND(avg_processing_minutes, 2) as avg_processing_minutes,
    CASE
        WHEN (successful_files::float / total_files * 100) >= 98 THEN '✅ SLA OK'
        WHEN (successful_files::float / total_files * 100) >= 95 THEN '⚠️ SLA Warning'
        ELSE '❌ SLA Breach'
    END as sla_status
FROM recent_files;
```

---

## 📞 Comunicação Durante Incidentes

### Template de Comunicação

#### Incident Declaration
```
🚨 INCIDENT DECLARED: ETL Pipeline Issue

Severity: [P1/P2/P3/P4]
Start Time: [YYYY-MM-DD HH:MM UTC]
Affected Services: [Pipeline X, Dashboard, etc.]
Impact: [Description of business impact]
Incident Commander: [Name]

Updates will be provided every 30 minutes.
Incident Channel: #incident-etl-YYYYMMDD
```

#### Status Update
```
📊 INCIDENT UPDATE: ETL Pipeline Issue

Time: [YYYY-MM-DD HH:MM UTC]
Status: [Investigating/Identified/Monitoring/Resolved]
Actions Taken: [Description of actions]
Next Steps: [What's being done next]
ETA: [Expected resolution time]

Next update in 30 minutes unless resolved.
```

#### Resolution
```
✅ INCIDENT RESOLVED: ETL Pipeline Issue

Resolution Time: [YYYY-MM-DD HH:MM UTC]
Total Duration: [X hours Y minutes]
Root Cause: [Brief description]
Resolution: [What was done to fix]
Prevention: [Steps to prevent recurrence]

Post-mortem will be conducted within 24 hours.
```

---

## 🔍 Log Analysis

### Locais dos Logs
```bash
# Aplicação principal
/var/log/etl/etl-service.log

# Erros críticos
/var/log/etl/errors.log

# Métricas de performance
/var/log/etl/metrics.log

# Audit trail
/var/log/etl/audit.log
```

### Comandos Úteis
```bash
# Buscar erros nas últimas 4 horas
grep -E "(ERROR|FATAL)" /var/log/etl/etl-service.log | grep "$(date -d '4 hours ago' '+%Y-%m-%d')"

# Analisar padrões de erro
awk '/ERROR/ {print $6}' /var/log/etl/errors.log | sort | uniq -c | sort -nr

# Monitorar logs em tempo real
multitail /var/log/etl/etl-service.log /var/log/etl/errors.log

# Extrair métricas de performance
grep "PROCESSING_TIME" /var/log/etl/metrics.log | awk '{sum+=$5; count++} END {print "Average:", sum/count "ms"}'
```

---

**Última atualização**: Janeiro 2025
**Próxima revisão**: Fevereiro 2025
**Responsável**: Equipe ETL DevOps