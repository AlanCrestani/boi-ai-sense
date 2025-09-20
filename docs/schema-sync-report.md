# Schema Sync Report - 18/09/2025, 16:14:44

## Status: ⚠️ DRIFT DETECTADO

## Resumo Executivo
- **Tabelas na BD**: 15
- **Tabelas no Drizzle**: 16
- **ENUMs na BD**: 4
- **ENUMs no Drizzle**: 4
- **Issues Encontradas**: 1


### Issues Detectadas:
- 1 tabelas extras no Drizzle


## Detalhes da Comparação

### Tabelas na Base de Dados
- `etl_file`
- `etl_run`
- `etl_run_log`
- `etl_dead_letter_queue`
- `etl_reprocessing_log`
- `staging_02_desvio_carregamento`
- `staging_04_itens_trato`
- `staging_csv_raw`
- `staging_csv_processed`
- `staging_livestock_data`
- `fato_carregamento`
- `organizations`
- `profiles`
- `user_roles`
- `invitations`

### Tabelas no Drizzle
- `organizations` (core.ts)
- `profiles` (core.ts)
- `user_roles` (core.ts)
- `invitations` (core.ts)
- `etl_file` (etl.ts)
- `etl_run` (etl.ts)
- `etl_run_log` (etl.ts)
- `etl_dead_letter_queue` (etl.ts)
- `etl_reprocessing_log` (etl.ts)
- `staging_02_desvio_carregamento` (etl.ts)
- `staging_04_itens_trato` (etl.ts)
- `staging_csv_raw` (staging.ts)
- `staging_csv_processed` (staging.ts)
- `staging_livestock_data` (staging.ts)
- `staging_03_desvio_distribuicao` (staging.ts)
- `fato_carregamento` (facts.ts)




### ⚠️ Tabelas Extras no Drizzle
- `staging_03_desvio_distribuicao`


### ENUMs na Base de Dados
- `app_role`: [admin, user]
- `invitation_status`: [pending, accepted, rejected]
- `etl_state`: [pending, running, completed, failed]
- `log_level`: [info, warn, error]

### ENUMs no Drizzle
- `app_role` (core.ts)
- `invitation_status` (core.ts)
- `etl_state` (etl.ts)
- `log_level` (etl.ts)





## Arquivos Drizzle Analisados
- ✅ `core.ts` (100 linhas, 4KB)
- ✅ `etl.ts` (177 linhas, 8KB)
- ✅ `staging.ts` (102 linhas, 5KB)
- ✅ `facts.ts` (36 linhas, 1KB)

## Próximos Passos Recomendados


⚠️ **Correções necessárias:**






3. **Revisar tabelas extras no Drizzle:**
   - Verificar se `staging_03_desvio_distribuicao` ainda é necessária



---
*Relatório gerado automaticamente em 2025-09-18T19:14:44.349Z*
*Comando: `npm run drizzle:sync-check`*
