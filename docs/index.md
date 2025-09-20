---
layout: home
title: "Sistema ETL Conecta Boi"
description: "Documenta��o completa da plataforma de gerenciamento de dados de pecu�ria"
---

# Sistema ETL Conecta Boi

Bem-vindo � documenta��o oficial do **Sistema ETL Conecta Boi** - uma plataforma avan�ada para processamento, valida��o e an�lise de dados de pecu�ria com pipelines ETL inteligentes e monitoramento em tempo real.

## =� In�cio R�pido

### Para Desenvolvedores
- [**API Reference**](api/typedoc/) - Documenta��o completa da API
- [**Guias de Pipeline**](pipeline-flows/overview) - Entenda a arquitetura dos pipelines
- [**Configura��o Local**](README#configura��o-e-deploy) - Setup do ambiente de desenvolvimento

### Para Operadores
- [**Manual Operacional**](operations/runbook) - Procedimentos e troubleshooting
- [**Scripts de Manuten��o**](maintenance/sql-scripts) - Scripts SQL para manuten��o
- [**Monitoramento**](README#m�tricas-e-kpis) - KPIs e alertas do sistema

### Para Analistas de Dados
- [**Regras de Valida��o**](mappings/validation-rules) - Valida��es aplicadas nos dados
- [**Mapeamento de Campos**](mappings/header-mappings) - Como os dados s�o mapeados
- [**Transforma��es**](mappings/transformation-logic) - L�gica de enriquecimento

## <� Arquitetura do Sistema

O Sistema ETL Conecta Boi � composto por **4 pipelines especializados**:

| Pipeline | Fun��o | Status |
|----------|--------|---------|
| **Pipeline 01** | [Base e Valida��o](pipeline-flows/pipeline01-base) |  Ativo |
| **Pipeline 02** | [Detec��o de Desvios](pipeline-flows/pipeline02-desvios) |  Ativo |
| **Pipeline 03** | [Mapeamento de Headers](pipeline-flows/pipeline03-mapping) |  Ativo |
| **Pipeline 04** | [ETL Principal](pipeline-flows/pipeline04-etl) |  Ativo |

### Fluxo de Dados

```mermaid
flowchart TD
    A[Upload CSV] --> B[Pipeline 01: Valida��o]
    B --> C[Pipeline 02: Detec��o de Desvios]
    C --> D[Pipeline 03: Mapeamento]
    D --> E[Pipeline 04: ETL Final]
    E --> F[Dados Processados]

    B --> G[Relat�rio de Valida��o]
    C --> H[Alertas de Anomalias]
    D --> I[Mapeamento Confirmado]
    E --> J[Logs de Processamento]
```

## =� Dashboard de M�tricas

| M�trica | Valor Atual | Objetivo |
|---------|-------------|----------|
| **Uptime** | 99.95% | > 99.9% |
| **Throughput** | 8,500 reg/min | > 10,000 reg/min |
| **Precis�o Valida��o** | 97.3% | > 95% |
| **Tempo M�dio Processamento** | 18s | < 30s |

## = Recursos Principais

### ( Processamento Inteligente
- **Valida��o autom�tica** com 50+ regras de neg�cio
- **Mapeamento fuzzy** para headers com varia��es
- **Detec��o de anomalias** usando machine learning
- **Retry logic** com exponential backoff

### =� Monitoramento e Alertas
- **Dashboard em tempo real** com m�tricas essenciais
- **Sistema de alertas** via m�ltiplos canais
- **Rastreamento de erros** com Sentry
- **Logs estruturados** para auditoria

### =' Opera��o e Manuten��o
- **Health checks** autom�ticos
- **Scripts de manuten��o** para otimiza��o
- **Backup e recovery** de dados cr�ticos
- **Runbook completo** para emerg�ncias

## =� Stack Tecnol�gico

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Monitoramento**: Sentry, Custom Metrics Dashboard
- **Documentation**: TypeDoc, Jekyll (GitHub Pages)

## =� Documenta��o Completa

Explore toda a documenta��o:

- [=� **Vis�o Geral Completa**](README) - �ndice de toda a documenta��o
- [<� **Arquitetura e Pipelines**](pipeline-flows/) - Detalhes t�cnicos dos pipelines
- [= **Mapeamentos e Transforma��es**](mappings/) - Como os dados s�o processados
- [=� **Opera��es e Manuten��o**](operations/) - Guias operacionais
- [=� **API e C�digo**](api/typedoc/) - Refer�ncia t�cnica completa

---

## =� Suporte

- **Documenta��o T�cnica**: [API Reference](api/typedoc/)
- **Emerg�ncias**: Consulte o [Runbook Operacional](operations/runbook)
- **Issues**: [GitHub Issues](https://github.com/your-org/conecta-boi/issues)

> **�ltima atualiza��o**: {{ site.time | date: "%d/%m/%Y" }}
> **Vers�o**: 1.0.0
> **Status**:  Operacional