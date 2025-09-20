# Revisão de `src/pages/Analytics.tsx` (rota `/desvios`)

## Visão geral
- Página de Análise de Desvios acessada via `/desvios` e listada no `AppSidebar`.
- Estrutura com duas abas: "Desvios em Carregamento" (usa hooks reais) e "Desvios em Distribuição" (usa dados mock).
- Integra componentes do design system (shadcn/ui), `CarregamentoFilters`, `CarregamentoMetrics` e `LazyChartContainer`.

## Pontos positivos
- Estados de loading e erro cobertos de forma explícita.
- Uso consistente do design system e utilitário `cn`.
- Boa separação parcial via `CarregamentoFilters`, `CarregamentoMetrics` e `LazyChartContainer`.
- Métricas e gráficos com tooltips e limites configurados, facilitando leitura.

## Problemas encontrados
1) Imports/estados/variáveis não utilizados (quebram ESLint no-unused-vars)
- Imports não usados: `BarChart3`, `TrendingDown`, `Select*` (select UI), `Legend`, `Cell`, `MetricCard`.
- Estados/constantes não usados: `selectedVagao`, `CustomBar`, `data = generateMockData()`.
- Impacto: build/lint falham; ruído e custo cognitivo.

2) `refetch()` após `setAppliedFilters()` pode usar filtros antigos e é redundante
- Em `handleApplyFilters`, `setAppliedFilters(filters)` é seguido de `refetch()` imediato.
- `useDesviosData` reexecuta automaticamente quando `appliedFilters` muda (via `useCarregamentoData`).
- Impacto: potencial refetch com filtros desatualizados + chamada duplicada.
- Correção: remover o `refetch()` dali e, se necessário, disparar refetch via `useEffect` observando `appliedFilters`.

3) Dados mock e cálculos gerados a cada render
- Arrays (histogramas, timelines, produtividade) são recalculados em todo re-render e vivem dentro do componente.
- Impacto: custo desnecessário e hardcode de mocks na página.
- Correção: mover mocks para `src/lib/mocks/desvios.ts` e proteger com `import.meta.env.DEV`; use `useMemo`.

4) Botões de chat duplicados e inconsistentes
- Dois FABs distintos (cores/estilos diferentes) nas duas abas.
- Impacto: duplicação de código e inconsistência visual.
- Correção: extrair `FloatingChatButton` reutilizável e unificar estilo.

5) Breadcrumb com `href` (full reload)
- `BreadcrumbLink href="/dashboard"` provoca navegação completa.
- Impacto: perde estado do SPA/HMR e pior UX.
- Correção: usar `asChild` + `Link to="/dashboard"` (react-router) ou remover o link e manter o botão de voltar.

6) Botão "Aplicar Filtro" na aba Distribuição sem efeito
- Não está ligado a nenhum estado/consulta dessa aba.
- Impacto: UX confusa (ação sem efeito).
- Correção: implementar filtros reais para Distribuição ou desabilitar/esconder até existir dados reais.

7) Logs de debug em produção
- `console.log` sem guarda.
- Impacto: polui console e potencialmente vaza informação.
- Correção: condicionar a `if (import.meta.env.DEV) { ... }` ou remover.

8) Acessibilidade
- FABs de chat sem `aria-label` e ícones sem texto alternativo.
- Impacto: navegação por leitores de tela prejudicada.
- Correção: adicionar `aria-label`/`title` e foco visível.

9) Cores fixas nos eixos ("white")
- Eixos usam `stroke="white"` em vez de tokens do tema.
- Impacto: pode quebrar em tema claro e foge do design system.
- Correção: usar tokens do tema (`hsl(var(--foreground))`) ou classes Tailwind temáticas.

10) Nome do arquivo x rota (opcional)
- Página chama `Analytics` e rota é `/desvios`. Não é erro, mas pode reduzir descobribilidade.
- Correção: opcional renomear para `Desvios.tsx` no futuro.

11) Tipagem de erro como string
- `error` vem como `string | null` e é envolvido em `new Error(error)` para alguns componentes.
- Impacto: inconsistência de contratos.
- Correção: padronizar o hook para retornar `error: Error | null` ou sempre strings e ajustar os consumidores.

12) Complexidade/arquivo grande
- 680+ linhas misturam UI, dados mock e controle de abas.
- Impacto: manutenção difícil e maior chance de regressões.
- Correção: extrair `CarregamentoTab`, `DistribuicaoTab` e um `DateRangePicker` compartilhado.

## Plano de ação (priorizado)
Curto prazo (qualidade e UX)
- Remover imports/estados/variáveis não utilizados.
- Trocar `BreadcrumbLink` para `Link` (`asChild`) ou manter apenas o botão "Voltar".
- Adicionar `aria-label` aos FABs de chat e unificar o estilo.
- Guardar/remover `console.log` com `import.meta.env.DEV`.
- Desabilitar/ocultar o "Aplicar Filtro" da aba Distribuição até ter implementação real.

Médio prazo (funcionalidade e performance)
- Ajustar `handleApplyFilters`: remover `refetch()` e confiar no hook; se preciso, `useEffect` baseado em `appliedFilters`.
- Extrair `FloatingChatButton` reutilizável.
- Mover mocks para `src/lib/mocks/desvios.ts` e usar `useMemo`.
- Substituir `stroke="white"` dos gráficos por tokens do tema.

Longo prazo (arquitetura e DX)
- Extrair componentes: `CarregamentoTab`, `DistribuicaoTab`, `DateRangePicker`.
- Unificar o modelo de filtros entre as abas.
- Padronizar tipagem de `error` nos hooks e componentes consumidores.
- Avaliar renomear o arquivo para `Desvios.tsx` e alinhar denominação com a rota.

## Sugestões de patch (exemplos)
- Remover refetch redundante:
```ts
// Antes
const handleApplyFilters = () => {
  if (isValidDateRange) {
    setAppliedFilters(filters);
    refetch(); // redundante e potencialmente com filtros antigos
  }
};

// Depois
const handleApplyFilters = () => {
  if (isValidDateRange) {
    setAppliedFilters(filters);
  }
};
// O hook já refaz a busca quando os filtros mudam
```

- Breadcrumb com Link do router:
```tsx
import { Link } from 'react-router-dom';
...
<BreadcrumbLink asChild>
  <Link to="/dashboard">Dashboard</Link>
</BreadcrumbLink>
```

- Guardar logs em DEV:
```ts
useEffect(() => {
  if (!import.meta.env.DEV) return;
  console.log('🔍 Analytics Debug - Dados recebidos:', { loading, error, appliedFilters, metrics });
}, [loading, error, appliedFilters, metrics]);
```

- Acessibilidade no FAB:
```tsx
<Button aria-label="Abrir chat de desvios" ...>
  <MessageCircle className="h-6 w-6" />
</Button>
```

## Próximos passos sugeridos
- Aplicar hotfixes do curto prazo e rodar `npm run lint` e `npm run build`.
- Abrir uma issue/PR para refatoração das abas e mocks (médio prazo).
- Documentar no README a fonte de dados da aba Distribuição e o plano para trocar mocks por dados reais.

---
Gerado automaticamente pela revisão de código do arquivo `src/pages/Analytics.tsx`.

## Atualização: problema de runtime e correções aplicadas

### Erro no console
- Mensagem: `Warning: Maximum update depth exceeded` (loop de renderização).
- Stack envolvia Radix DropdownMenu e `LanguageSelector`, mas a causa raiz estava nos hooks de dados usados em `/desvios`.

### Causa raiz
- `useDesviosData` criava um objeto `filters` novo a cada render (dependência instável).
- `useCarregamentoData` tinha `fetchAllData` dependente de valores que mudavam a cada render, re-disparando `setState` continuamente.
- `Analytics.tsx` chamava `refetch()` imediatamente após `setAppliedFilters`, podendo duplicar buscas e agravar ciclos.

### Correções implementadas (neste patch)
- Estabilização de filtros com `useMemo`:
  - Arquivo: `src/hooks/useDesviosData.tsx`
  - Ação: `const filters = useMemo(... [startDate?.getTime(), endDate?.getTime()])`
- Dependências estáveis para `fetchAllData`:
  - Arquivo: `src/hooks/useCarregamentoData.tsx`
  - Ação: `useCallback` agora depende de `organization.id` e `getTime()` das datas; removido `buildDateFilter` não utilizado.
- Remoção de `refetch()` redundante ao aplicar filtros:
  - Arquivo: `src/pages/Analytics.tsx`
  - Ação: confiar na reexecução automática do hook ao alterar `appliedFilters`.
- Logs de debug guardados para DEV:
  - Arquivo: `src/pages/Analytics.tsx`
  - Ação: `if (!import.meta.env.DEV) return;` em volta dos `console.log`.
- Lint de import não usado no `LanguageSelector`:
  - Arquivo: `src/components/LanguageSelector.tsx`
  - Ação: remoção de `ChevronDown` não utilizado.

### Resultado esperado
- O warning de “Maximum update depth exceeded” deixa de ocorrer.
- A aba de carregamento refaz a busca somente quando os filtros mudam.
- Menos ruído no console em produção e lint mais limpo.

### Pendências ainda recomendadas (não implementadas aqui)
- Breadcrumb com `Link` do router (`asChild`) em vez de `href`.
- Acessibilidade e unificação do botão flutuante de chat.
- Substituir cores fixas “white” por tokens do tema em eixos dos gráficos.
- Extrair mocks para `src/lib/mocks/desvios.ts` e memoizar com `useMemo`.
- Padronizar tipagem de `error` nos hooks/componentes.
- Extrair `CarregamentoTab`, `DistribuicaoTab`, `DateRangePicker` e, opcionalmente, renomear o arquivo para `Desvios.tsx`.
