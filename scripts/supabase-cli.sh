#!/bin/bash

# Script para facilitar acesso ao Supabase CLI com credenciais do projeto
# Uso: ./scripts/supabase-cli.sh [comando]
# Exemplo: ./scripts/supabase-cli.sh inspect db table-sizes

# Configuração do projeto
export SUPABASE_ACCESS_TOKEN=sbp_62c84ba609b88c8a20d2219358f129f713055a9a
export SUPABASE_PROJECT_REF=zirowpnlxjenkxiqcuwz

# Executar comando Supabase
if [ $# -eq 0 ]; then
    echo "📊 Conecta Boi - Supabase CLI Helper"
    echo ""
    echo "Comandos úteis de inspeção do banco:"
    echo "  ./scripts/supabase-cli.sh inspect db table-sizes     # Tamanhos das tabelas"
    echo "  ./scripts/supabase-cli.sh inspect db table-stats     # Estatísticas das tabelas"
    echo "  ./scripts/supabase-cli.sh inspect db index-sizes     # Tamanhos dos índices"
    echo "  ./scripts/supabase-cli.sh inspect db cache-hit       # Taxa de cache hit"
    echo "  ./scripts/supabase-cli.sh inspect db bloat           # Bloat das tabelas"
    echo "  ./scripts/supabase-cli.sh inspect db locks           # Locks ativos"
    echo "  ./scripts/supabase-cli.sh inspect db vacuum-stats    # Estatísticas de vacuum"
    echo ""
    echo "Comandos de migração:"
    echo "  ./scripts/supabase-cli.sh migration list             # Listar migrações"
    echo "  ./scripts/supabase-cli.sh db pull                    # Puxar schema remoto"
    echo "  ./scripts/supabase-cli.sh db push                    # Aplicar migrações"
    echo ""
    echo "Edge Functions:"
    echo "  ./scripts/supabase-cli.sh functions list             # Listar functions"
    echo "  ./scripts/supabase-cli.sh functions deploy [nome]    # Deploy function"
    echo ""
    echo "Sincronização de tipos:"
    echo "  ./scripts/supabase-cli.sh sync-types                 # Atualizar types.ts com schema atual"
    echo ""
    echo "Outros comandos:"
    echo "  ./scripts/supabase-cli.sh projects list              # Listar projetos"
    echo "  ./scripts/supabase-cli.sh status                     # Status do projeto"
    echo ""
elif [ "$1" = "sync-types" ]; then
    echo "🔄 Sincronizando tipos TypeScript com schema do banco..."
    npx supabase gen types typescript --linked > src/integrations/supabase/types.ts
    echo "✅ Arquivo src/integrations/supabase/types.ts atualizado!"
    echo "📊 Verificando tabelas principais encontradas..."
    grep -E "fato_|staging_|view_" src/integrations/supabase/types.ts | head -10
else
    npx supabase "$@"
fi