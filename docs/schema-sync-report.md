# Schema Sync Report - 24/09/2025, 09:23:47

## Status: ✅ SINCRONIZADO

## Resumo Executivo
- **Tabelas na BD**: 21
- **Tabelas no Drizzle**: 21
- **ENUMs na BD**: 4
- **ENUMs no Drizzle**: 4
- **Issues Encontradas**: 0



## Detalhes da Comparação

### Tabelas na Base de Dados
- `etl_file`
- `etl_run`
- `etl_run_log`
- `etl_dead_letter_queue`
- `etl_reprocessing_log`
- `staging_01_historico_consumo`
- `staging_02_desvio_carregamento`
- `staging_03_desvio_distribuicao`
- `staging_04_itens_trato`
- `staging_05_trato_por_curral`
- `staging_csv_raw`
- `staging_csv_processed`
- `staging_livestock_data`
- `fato_carregamento`
- `fato_distribuicao`
- `fato_historico_consumo`
- `user_organizations`
- `organizations`
- `profiles`
- `user_roles`
- `invitations`

### Tabelas no Drizzle
- `organizations` (core.ts)
- `profiles` (core.ts)
- `user_roles` (core.ts)
- `invitations` (core.ts)
- `user_organizations` (core.ts)
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
- `staging_01_historico_consumo` (staging.ts)
- `staging_03_desvio_distribuicao` (staging.ts)
- `staging_05_trato_por_curral` (staging.ts)
- `fato_carregamento` (facts.ts)
- `fato_distribuicao` (facts.ts)
- `fato_historico_consumo` (facts.ts)





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
- ✅ `core.ts` (121 linhas, 5KB)
- ✅ `etl.ts` (177 linhas, 8KB)
- ✅ `staging.ts` (178 linhas, 8KB)
- ✅ `facts.ts` (114 linhas, 5KB)

## Próximos Passos Recomendados


✅ **Schemas estão sincronizados!** Nenhuma ação necessária.


---
*Relatório gerado automaticamente em 2025-09-24T12:23:47.808Z*
*Comando: `npm run drizzle:sync-check`*
