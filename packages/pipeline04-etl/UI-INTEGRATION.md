# Pipeline 04 ETL - UI Integration Guide

Este documento descreve como integrar as interfaces do Pipeline 04 ETL no aplicativo principal Conecta Boi.

## Componentes UI Implementados

### 1. PendingEntriesManager
**Arquivo**: `src/ui/PendingEntriesManager.tsx`

Interface para resolução manual de entradas pendentes (currais e dietas não encontrados).

**Funcionalidades**:
- ✅ Listagem de entradas pendentes por tipo (curral/dieta)
- ✅ Criação de novas dimensões
- ✅ Mapeamento para dimensões existentes
- ✅ Rejeição com motivos
- ✅ Filtros e visualização temporal
- ✅ Interface responsiva com Tailwind CSS

```tsx
import { PendingEntriesManager } from '@conecta-boi/pipeline04-etl/ui/PendingEntriesManager';

<PendingEntriesManager
  organizationId="org-123"
  onPendingResolved={(pendingId, resolvedValue) => {
    console.log('Resolvido:', pendingId, resolvedValue);
  }}
  onPendingRejected={(pendingId, reason) => {
    console.log('Rejeitado:', pendingId, reason);
  }}
/>
```

### 2. Pipeline04Dashboard
**Arquivo**: `src/ui/Pipeline04Dashboard.tsx`

Dashboard principal com visão geral, estatísticas e logs do Pipeline 04.

**Funcionalidades**:
- ✅ Estatísticas de processamento em tempo real
- ✅ Indicadores de saúde do sistema
- ✅ Logs de eventos e atividades
- ✅ Navegação por abas
- ✅ Integração com PendingEntriesManager
- ✅ Exportação de dados

```tsx
import { Pipeline04Dashboard } from '@conecta-boi/pipeline04-etl/ui/Pipeline04Dashboard';

<Pipeline04Dashboard
  organizationId="org-123"
  stats={processingStats}
  onRefreshStats={() => loadStats()}
  onExportData={() => exportToCsv()}
/>
```

### 3. Pipeline04Integration
**Arquivo**: `src/ui/Pipeline04Integration.tsx`

Componente de integração principal que conecta todos os serviços.

**Funcionalidades**:
- ✅ Integração completa com Supabase
- ✅ Gerenciamento de estado
- ✅ Navegação e breadcrumbs
- ✅ Alertas de status flutuantes
- ✅ Tratamento de erros
- ✅ Loading states

```tsx
import { Pipeline04Integration } from '@conecta-boi/pipeline04-etl/ui/Pipeline04Integration';

<Pipeline04Integration
  supabaseClient={supabase}
  organizationId="org-123"
  currentUser={{
    id: "user-123",
    email: "user@fazenda.com",
    name: "João Silva"
  }}
  onNavigate={(path) => router.push(path)}
/>
```

## Serviços de Integração

### Pipeline04UIService
**Arquivo**: `src/services/ui-integration.ts`

Serviço que conecta as UIs ao backend Supabase.

**Funcionalidades**:
- ✅ Gerenciamento de pending entries
- ✅ Estatísticas de processamento
- ✅ Logs de eventos
- ✅ Exportação de dados CSV
- ✅ Resolução/rejeição de entradas

```tsx
const uiService = new Pipeline04UIService(supabaseClient, organizationId);

// Obter entradas pendentes
const pendingEntries = await uiService.getUIPendingEntries();

// Resolver entrada pendente
await uiService.resolvePendingEntry(pendingId, resolvedValue, userId);

// Obter estatísticas
const stats = await uiService.getProcessingStats();
```

## Estrutura de Banco de Dados Necessária

### Tabelas Supabase

```sql
-- Tabela de entradas pendentes
CREATE TABLE pipeline04_pending_entries (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('curral', 'dieta')),
  code TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by TEXT,
  resolved_value TEXT,
  notes TEXT
);

-- Tabela de logs de processamento
CREATE TABLE pipeline04_processing_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warning', 'error', 'success')),
  message TEXT NOT NULL,
  details TEXT,
  organization_id TEXT NOT NULL,
  file_id TEXT,
  record_count INTEGER
);

-- Tabela de staging
CREATE TABLE pipeline04_staging (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  file_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'ready_for_processing', 'processed', 'pending_resolution', 'rejected')),
  curral_codigo TEXT,
  curral_id TEXT,
  dieta_nome TEXT,
  dieta_id TEXT,
  trateiro TEXT,
  trateiro_id TEXT,
  raw_data JSONB,
  processed_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_pending_entries_org_status ON pipeline04_pending_entries(organization_id, status);
CREATE INDEX idx_processing_logs_org_timestamp ON pipeline04_processing_logs(organization_id, timestamp);
CREATE INDEX idx_staging_org_status ON pipeline04_staging(organization_id, status);
```

## Integração no App Principal

### 1. Adicionar ao Router (React Router v6)

```tsx
// src/App.tsx ou router.tsx
import { Pipeline04Integration } from '@conecta-boi/pipeline04-etl/ui/Pipeline04Integration';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      // ... outras rotas
      {
        path: "/etl/pipeline04",
        element: (
          <Pipeline04Integration
            supabaseClient={supabase}
            organizationId={currentOrg.id}
            currentUser={currentUser}
            onNavigate={(path) => navigate(path)}
          />
        ),
      },
    ],
  },
]);
```

### 2. Adicionar ao Menu de Navegação

```tsx
// src/components/AppSidebar.tsx
const menuItems = [
  // ... outros itens
  {
    title: "ETL",
    icon: "🔄",
    children: [
      {
        title: "Pipeline 04 - Trato por Curral",
        icon: "🐄",
        href: "/etl/pipeline04",
      },
    ],
  },
];
```

### 3. Adicionar ao Dashboard Principal

```tsx
// src/pages/ConectaBoiDashboard.tsx
import { Pipeline04UIService } from '@conecta-boi/pipeline04-etl/services/ui-integration';

const Dashboard = () => {
  const [pipeline04Stats, setPipeline04Stats] = useState(null);

  useEffect(() => {
    const loadPipeline04Stats = async () => {
      const uiService = new Pipeline04UIService(supabase, organizationId);
      const stats = await uiService.getProcessingStats();
      setPipeline04Stats(stats);
    };

    loadPipeline04Stats();
  }, []);

  return (
    <div className="dashboard">
      {/* ... outros widgets */}

      {/* Widget Pipeline 04 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Pipeline 04 - Trato por Curral</h3>

        {pipeline04Stats && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Processados Hoje</p>
              <p className="text-2xl font-bold">{pipeline04Stats.recordsToday}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pipeline04Stats.pendingEntriesCount}
              </p>
            </div>
          </div>
        )}

        <Link
          to="/etl/pipeline04"
          className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
        >
          Ver detalhes →
        </Link>
      </div>
    </div>
  );
};
```

## Dependências Necessárias

Adicionar ao `package.json` principal:

```json
{
  "dependencies": {
    "@conecta-boi/pipeline04-etl": "workspace:*",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

## Configurações de Build

### Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  // ... outras configurações
  optimizeDeps: {
    include: ['@conecta-boi/pipeline04-etl']
  }
});
```

### TypeScript Config

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@conecta-boi/pipeline04-etl/*": ["./packages/pipeline04-etl/src/*"]
    }
  }
}
```

## Exemplo de Uso Completo

```tsx
// src/pages/Pipeline04Page.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSupabase } from '../hooks/useSupabase';
import { Pipeline04Integration } from '@conecta-boi/pipeline04-etl/ui/Pipeline04Integration';

export const Pipeline04Page: React.FC = () => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const organizationId = user?.organizationId;

  if (!organizationId) {
    return <div>Organização não encontrada</div>;
  }

  return (
    <Pipeline04Integration
      supabaseClient={supabase}
      organizationId={organizationId}
      currentUser={{
        id: user.id,
        email: user.email,
        name: user.name,
      }}
      onNavigate={(path) => {
        // Implementar navegação conforme seu router
        window.location.href = path;
      }}
    />
  );
};
```

## Notas de Implementação

1. **Autenticação**: As UIs assumem que o usuário está autenticado e tem permissões na organização
2. **Supabase RLS**: Configurar Row Level Security nas tabelas para isolamento por organização
3. **Permissões**: Implementar verificação de permissões para operações críticas
4. **Realtime**: Opcional - adicionar subscriptions Supabase para updates em tempo real
5. **Testes**: Componentes incluem prop interfaces para facilitar testes unitários

## Próximos Passos

1. Implementar as tabelas Supabase conforme especificação
2. Adicionar as rotas no app principal
3. Configurar permissões e RLS
4. Testar integração completa
5. Implementar notificações em tempo real (opcional)