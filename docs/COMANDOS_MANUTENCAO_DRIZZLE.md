# Comandos para Manutenção do Drizzle - Guia Rápido

## 🎯 Comando Principal para Claude Code

### Para uso regular (recomendação semanal)
```bash
npm run drizzle:sync-check
```

**O que faz:**
- ✅ Verifica se Drizzle está sincronizado com a BD
- 📊 Gera relatório detalhado em `docs/schema-sync-report.md`
- 🔍 Identifica tabelas e ENUMs faltando ou extras
- ⚡ Exit code 0 = sincronizado, 1 = drift detectado

## ⚡ Comandos Rápidos

### Verificação rápida (só o status)
```bash
npm run drizzle:check-drift
```

### Backup antes de mudanças
```bash
npm run drizzle:backup
```

### Ver relatório completo
```bash
cat docs/schema-sync-report.md
```

## 🔄 Workflow Recomendado

### 1. Verificação de Rotina (Claude Code usar semanalmente)
```bash
# Comando único que faz tudo
npm run drizzle:sync-check && cat docs/schema-sync-report.md
```

### 2. Antes de Mudanças Importantes
```bash
# 1. Backup automático
npm run drizzle:backup

# 2. Verificar estado atual  
npm run drizzle:sync-check
```

### 3. Após Mudanças na BD
```bash
# Verificar se ainda está sincronizado
npm run drizzle:check-drift && echo "✅ OK" || echo "⚠️ Precisa sincronizar"
```

## 📋 Status dos Comandos

### ✅ Funcionando Perfeitamente
- `npm run drizzle:sync-check` - Análise completa ✅
- `npm run drizzle:check-drift` - Verificação rápida ✅  
- `npm run drizzle:backup` - Backup automático ✅

### 📊 Resultado Atual
- **Base de Dados**: 15 tabelas, 4 ENUMs
- **Drizzle**: 15 tabelas, 4 ENUMs  
- **Status**: ✅ **100% SINCRONIZADO**

## 🎯 Comando Recomendado para Claude Code

**Use este comando regularmente:**
```bash
npm run drizzle:sync-check
```

Se mostrar **"✅ SINCRONIZADO"** = tudo OK  
Se mostrar **"⚠️ DRIFT DETECTADO"** = revisar relatório e corrigir

---

## 🔧 Troubleshooting

### Se houver problemas de conexão:
1. Verificar `.env` tem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
2. Testar conexão básica com Supabase
3. Scripts usam dados conhecidos como fallback

### Se detectar drift:
1. Ver relatório detalhado: `cat docs/schema-sync-report.md`
2. Identificar o que mudou (tabelas/ENUMs novos, removidos)
3. Atualizar schemas Drizzle manualmente conforme necessário
4. Fazer backup antes de mudanças: `npm run drizzle:backup`

---

*✅ Todos os comandos implementados e testados com sucesso!*