# Conecta Boi ETL System - Documentação Completa

Bem-vindo à documentação completa do Sistema ETL Conecta Boi, uma plataforma abrangente para gerenciamento de dados de pecuária com pipelines ETL avançados, monitoramento em tempo real e análises inteligentes.

## 📚 Índice da Documentação

### 🏗️ Arquitetura e Pipelines

- **[Visão Geral dos Pipelines](./pipeline-flows/overview.md)** - Arquitetura geral e fluxo de dados
- **[Pipeline 01: Base e Validação](./pipeline-flows/pipeline01-base.md)** - Validação e limpeza de dados
- **[Pipeline 02: Detecção de Desvios](./pipeline-flows/pipeline02-desvios.md)** - Análise de anomalias e alertas
- **[Pipeline 03: Mapeamento de Headers](./pipeline-flows/pipeline03-mapping.md)** - Mapeamento inteligente de colunas
- **[Pipeline 04: ETL Principal](./pipeline-flows/pipeline04-etl.md)** - Transformação e carregamento final

### 🔄 Mapeamentos e Transformações

- **[Mapeamento de Headers](./mappings/header-mappings.md)** - Regras de mapeamento de colunas
- **[Regras de Validação](./mappings/validation-rules.md)** - Validações de negócio e dados
- **[Lógica de Transformação](./mappings/transformation-logic.md)** - Enriquecimento e cálculos

### 🛠️ Operações e Manutenção

- **[Manual Operacional](./operations/runbook.md)** - Procedimentos operacionais e emergenciais
- **[Scripts de Manutenção](./maintenance/sql-scripts.md)** - Scripts SQL para manutenção e otimização

### 📊 API e Código

- **[Documentação da API TypeDoc](./api/typedoc/index.html)** - Documentação completa da API gerada automaticamente
- **[Módulos e Componentes](./api/typedoc/modules.html)** - Estrutura detalhada dos módulos
- **[Hierarquia de Classes](./api/typedoc/hierarchy.html)** - Hierarquia e relacionamentos

## 🚀 Funcionalidades Principais

### ETL e Processamento de Dados
- **4 Pipelines ETL** especializados para diferentes estágios de processamento
- **Validação automática** com regras de negócio customizáveis
- **Mapeamento inteligente** de headers com fuzzy matching
- **Detecção de anomalias** com algoritmos de machine learning
- **Retry logic** com exponential backoff e Dead Letter Queue

### Monitoramento e Observabilidade
- **Dashboard de métricas** em tempo real
- **Sistema de alertas** configurável com múltiplos canais
- **Rastreamento de performance** com Sentry
- **Logging estruturado** para auditoria e debug
- **Health checks** automáticos dos pipelines

### Interface de Usuário
- **Interface web moderna** construída com React 18 e TypeScript
- **Componentes reutilizáveis** com shadcn/ui
- **Dashboard interativo** com gráficos e métricas
- **Gerenciamento de arquivos** CSV com preview e validação
- **Sistema de notificações** em tempo real

## 🏛️ Arquitetura Técnica

### Stack Tecnológico
- **Frontend**: React 18, TypeScript, TailwindCSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Estado**: React Context + React Query
- **UI**: shadcn/ui components
- **Gráficos**: Recharts
- **Monitoramento**: Sentry para error tracking
- **Documentação**: TypeDoc para API docs

### Padrões de Desenvolvimento
- **Atomic Design** para componentes UI
- **Custom hooks** para lógica de negócio
- **Context API** para gerenciamento de estado global
- **Error boundaries** para tratamento de erros
- **TypeScript** para type safety
- **ESLint** para qualidade de código

## 📈 Métricas e KPIs

### Performance
- **Tempo de processamento** < 30 segundos para arquivos até 10MB
- **Throughput** de 10,000 registros por minuto
- **Uptime** > 99.9% para pipelines críticos
- **Latência** < 200ms para operações de UI

### Qualidade de Dados
- **Taxa de validação** > 95% dos registros processados
- **Precisão do mapeamento** > 98% para headers conhecidos
- **Detecção de anomalias** com 92% de precision e 89% de recall

## 🔧 Configuração e Deploy

### Variáveis de Ambiente
```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Sentry (Opcional)
VITE_SENTRY_DSN=your_sentry_dsn

# Versioning
VITE_APP_VERSION=1.0.0
```

### Scripts de Desenvolvimento
```bash
npm install          # Instalar dependências
npm run dev         # Servidor de desenvolvimento
npm run build       # Build de produção
npm run preview     # Preview do build
npm run lint        # Verificação de código
```

## 📝 Logs e Auditoria

### Tipos de Log
- **ETL Processing**: Logs detalhados de cada etapa do pipeline
- **User Actions**: Rastreamento de ações do usuário
- **System Events**: Eventos de sistema e integrações
- **Error Tracking**: Erros e exceções com stack traces

### Retenção
- **Logs operacionais**: 90 dias
- **Logs de auditoria**: 2 anos
- **Métricas de performance**: 1 ano
- **Dados de usuário**: Conforme LGPD

## 🛡️ Segurança e Compliance

### Autenticação e Autorização
- **Supabase Auth** para gerenciamento de usuários
- **Row Level Security (RLS)** para isolamento de dados
- **Role-based access control** (RBAC)
- **JWT tokens** para autenticação stateless

### Proteção de Dados
- **Criptografia em trânsito** (HTTPS/TLS)
- **Criptografia em repouso** (PostgreSQL encryption)
- **Sanitização de dados** para prevenção de injection
- **Auditoria de acesso** para compliance

## 📞 Suporte e Contato

### Documentação Técnica
- **API Reference**: `/docs/api/typedoc/`
- **Runbook Operacional**: `/docs/operations/runbook.md`
- **FAQ**: Consulte os READMEs específicos de cada módulo

### Desenvolvimento
- **Repositório**: GitHub (branch: `main`)
- **Issues**: GitHub Issues para bugs e features
- **CI/CD**: GitHub Actions para deploy automático
- **Monitoring**: Sentry para monitoramento de erros

---

> **Última atualização**: 16 de Setembro de 2025
> **Versão da documentação**: 1.0.0
> **Status do sistema**: ✅ Operacional