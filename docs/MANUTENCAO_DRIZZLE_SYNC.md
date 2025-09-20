# Estratégia de Manutenção: Sincronização Drizzle ↔ Base de Dados

## Resumo
Este documento estabelece comandos e estratégias para manter o Drizzle ORM sempre sincronizado com as mudanças na base de dados de produção Supabase.

## Comandos Recomendados para Claude Code

### 1. Comando Principal de Verificação e Sincronização

```bash
# Comando unificado para Claude Code usar regularmente
npm run drizzle:sync-check
```

**O que este comando deve fazer:**
1. Conectar à base de dados Supabase
2. Extrair schema atual da produção
3. Comparar com schemas Drizzle existentes
4. Gerar relatório de diferenças
5. Sugerir atualizações necessárias

### 2. Comando de Verificação Rápida

```bash
# Para verificações rápidas durante desenvolvimento
npm run drizzle:check-drift
```

**Funcionalidade:**
- Deteta apenas se há divergências (sem detalhes)
- Retorna exit code 0 se sincronizado, 1 se há drift
- Útil para CI/CD pipelines

### 3. Comando de Atualização Automática

```bash
# Para aplicar correções automaticamente quando possível
npm run drizzle:auto-sync
```

**Comportamento:**
- Faz backup automático dos schemas atuais
- Aplica mudanças não-destrutivas automaticamente
- Reporta mudanças que precisam revisão manual

## Scripts a Implementar

### package.json - Scripts Section
```json
{
  "scripts": {
    "drizzle:sync-check": "node scripts/drizzle-sync-check.mjs",
    "drizzle:check-drift": "node scripts/drizzle-check-drift.mjs",
    "drizzle:auto-sync": "node scripts/drizzle-auto-sync.mjs",
    "drizzle:backup": "node scripts/drizzle-backup.mjs"
  }
}
```

## Estrutura dos Scripts

### 1. `/scripts/drizzle-sync-check.mjs`
```javascript
// Script principal de verificação
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 1. Conectar à base de dados
// 2. Extrair schema atual via information_schema
// 3. Comparar com arquivos Drizzle
// 4. Gerar relatório detalhado
// 5. Salvar em docs/schema-sync-report.md
```

### 2. `/scripts/drizzle-check-drift.mjs`
```javascript
// Script de verificação rápida
// Retorna apenas true/false se há divergências
// Usado para automação e CI/CD
```

### 3. `/scripts/drizzle-auto-sync.mjs`
```javascript
// Script de sincronização automática
// 1. Backup automático
// 2. Aplicar mudanças simples (novos campos, novos ENUMs)
// 3. Reportar mudanças complexas para revisão manual
```

## Workflow Recomendado para Claude Code

### Rotina Diária/Semanal
```bash
# 1. Verificar se há divergências
npm run drizzle:check-drift

# 2. Se houver drift, executar análise completa
npm run drizzle:sync-check

# 3. Revisar relatório em docs/schema-sync-report.md

# 4. Se mudanças são simples, aplicar automaticamente
npm run drizzle:auto-sync

# 5. Se mudanças são complexas, fazer manualmente
```

### Antes de Grandes Alterações
```bash
# Sempre fazer backup antes de mudanças manuais
npm run drizzle:backup

# Verificar estado atual
npm run drizzle:sync-check
```

### Após Mudanças na Base de Dados
```bash
# Imediatamente após changes em produção
npm run drizzle:sync-check
npm run drizzle:auto-sync  # se seguro
```

## Detecção de Mudanças Específicas

### Mudanças Simples (Auto-sync)
- ✅ Novos campos em tabelas existentes
- ✅ Novos valores em ENUMs existentes
- ✅ Mudanças em comentários
- ✅ Novos índices

### Mudanças Complexas (Revisão Manual)
- ⚠️ Remoção de campos ou tabelas
- ⚠️ Mudanças de tipo de dados
- ⚠️ Reestruturação de relacionamentos
- ⚠️ Mudanças em constraints

## Configuração de Monitoramento

### Variables de Ambiente
```bash
# .env
SUPABASE_SCHEMA_SYNC_ENABLED=true
SUPABASE_SCHEMA_BACKUP_AUTO=true
DRIZZLE_SYNC_LOG_LEVEL=info
```

### Configuração do VS Code
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Drizzle: Check Sync",
      "type": "shell",
      "command": "npm run drizzle:sync-check",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

## Integração com Git Hooks

### .husky/pre-commit
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Verificar se schemas estão sincronizados antes de commit
npm run drizzle:check-drift || {
  echo "⚠️  Drizzle schemas não sincronizados com a base de dados!"
  echo "Execute: npm run drizzle:sync-check"
  exit 1
}
```

## Relatórios Automáticos

### Estrutura do Relatório
```markdown
# Schema Sync Report - [DATA]

## Status: ✅ SINCRONIZADO / ⚠️ DRIFT DETECTADO

## Resumo
- Tabelas verificadas: X
- Campos verificados: Y
- Divergências encontradas: Z

## Divergências Detalhadas
### Tabela: nome_da_tabela
- **Campo Faltando**: campo_x (tipo: TEXT)
- **Tipo Diferente**: campo_y (BD: INT4, Drizzle: TEXT)

## Ações Recomendadas
1. [ ] Adicionar campo_x à schema etl.ts
2. [ ] Corrigir tipo do campo_y
```

## Comandos Específicos para Claude Code

### Para uso rotineiro:
```bash
# Comando principal que Claude deve usar semanalmente
npm run drizzle:sync-check && cat docs/schema-sync-report.md
```

### Para diagnóstico rápido:
```bash
# Verificação rápida (exit code indica status)
npm run drizzle:check-drift && echo "✅ Sincronizado" || echo "⚠️ Drift detectado"
```

### Para aplicação de correções:
```bash
# Aplicar correções automáticas quando detectado drift simples
npm run drizzle:auto-sync && npm run build
```

## Próximos Passos

1. **Implementar scripts base** em `/scripts/`
2. **Configurar package.json** com novos comandos
3. **Testar workflow** com mudança controlada na BD
4. **Documentar casos específicos** conforme surgem
5. **Integrar com CI/CD** se necessário

---

**Comando sugerido para Claude Code usar regularmente:**
```bash
npm run drizzle:sync-check
```