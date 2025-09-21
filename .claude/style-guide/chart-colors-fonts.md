# Guia de Estilo - Cores e Fontes para Gráficos

## Padrão de Cores dos Gráficos

### Cores Principais (Baseado em "Previsto x Realizado por Ingrediente")

#### Barras/Colunas
- **Previsto**: `#3b82f6` (Azul)
- **Realizado**: `#10b981` (Verde)
- **Diferença Positiva**: `#eab308` (Amarelo)
- **Diferença Negativa**: `#ef4444` (Vermelho)

#### Estados de Hover/Ênfase
- **Previsto (hover)**: `#2563eb` (Azul mais escuro)
- **Realizado (hover)**: `#059669` (Verde mais escuro)

### Cores de Fundo e UI

#### Tooltip/Modal
- **Background**: `#1f2937` (Cinza escuro)
- **Border**: `#374151` (Cinza médio)
- **Text**: `#ffffff` (Branco)

#### Eixos e Grid
- **Linhas dos Eixos**: `#4b5563` (Cinza)
- **Grid Lines**: `#374151` (Cinza, tracejado)
- **Labels dos Eixos**: `#ffffff` (Branco)

### Tipografia

#### Tamanhos de Fonte
- **Título do Gráfico**: `16px` (bold)
- **Labels dos Eixos**: `12px-14px`
- **Tooltip Text**: `12px`
- **Legend**: `12px`

#### Cores de Texto
- **Título Principal**: `#1f2937` (Escuro) ou `#ffffff` (Branco para temas escuros)
- **Subtítulos**: `#6b7280` (Cinza médio)
- **Labels**: `#ffffff` (Branco para gráficos)
- **Tooltip**: `#ffffff` (Branco)

## Aplicação por Tipo de Gráfico

### 1. Gráfico de Barras (EChartsBar)
```typescript
// Cores das séries
series: [
  {
    name: 'Previsto (kg)',
    itemStyle: { color: '#3b82f6' },
    emphasis: { itemStyle: { color: '#2563eb' } }
  },
  {
    name: 'Realizado (kg)',
    itemStyle: { color: '#10b981' },
    emphasis: { itemStyle: { color: '#059669' } }
  }
]

// Tooltip
tooltip: {
  backgroundColor: '#1f2937',
  borderColor: '#374151',
  textStyle: { color: '#ffffff' }
}
```

### 2. Gráfico de Pizza (EChartsPie)
```typescript
// Usar paleta baseada nas cores principais
const colors = [
  '#3b82f6', '#10b981', '#eab308', '#ef4444',
  '#8b5cf6', '#f59e0b', '#06b6d4', '#84cc16'
];
```

### 3. Gráfico de Dietas (DietaChart)
```typescript
// Manter consistência com padrão principal
series: [
  {
    name: 'Previsto',
    itemStyle: { color: '#3b82f6' },
    emphasis: { itemStyle: { color: '#2563eb' } }
  },
  {
    name: 'Realizado',
    itemStyle: { color: '#10b981' },
    emphasis: { itemStyle: { color: '#059669' } }
  }
]
```

## Formatação de Dados

### Números
```typescript
// Formato brasileiro com separador de milhares
value.toLocaleString('pt-BR')

// Percentuais
`${value.toFixed(1)}%`

// Diferenças com sinal
`${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR')}`
```

### Tooltip Pattern
```typescript
formatter: function (params) {
  return `
    <div style="padding: 8px;">
      <div style="font-weight: bold; margin-bottom: 4px;">${item.name}</div>
      <div style="color: #3b82f6;">Previsto: ${item.previsto.toLocaleString('pt-BR')} kg</div>
      <div style="color: #10b981;">Realizado: ${item.realizado.toLocaleString('pt-BR')} kg</div>
      <div style="color: ${item.diferenca >= 0 ? '#eab308' : '#ef4444'};">
        Diferença: ${item.diferenca > 0 ? '+' : ''}${item.diferenca.toLocaleString('pt-BR')} kg
      </div>
    </div>
  `;
}
```

## Configuração Padrão do ECharts

### Grid
```typescript
grid: {
  left: '12%',     // Espaço para labels do eixo Y
  right: '5%',     // Margem direita
  bottom: '15%',   // Espaço para labels rotacionados do eixo X
  top: '15%',      // Espaço para legend
  containLabel: false
}
```

### Animação
```typescript
animation: true,
animationDuration: 500,
animationEasing: 'cubicOut'
```

### Responsividade
```typescript
// Border radius para barras
borderRadius: [4, 4, 0, 0]

// Rotação de labels para nomes longos
axisLabel: {
  rotate: 45,
  interval: 0,
  fontSize: 12
}
```

## Checklist de Implementação

- [ ] Cores consistentes: Previsto (#3b82f6), Realizado (#10b981)
- [ ] Tooltip com fundo escuro (#1f2937) e texto branco
- [ ] Formatação brasileira de números (toLocaleString('pt-BR'))
- [ ] Labels dos eixos em branco (#ffffff)
- [ ] Animação suave (500ms, cubicOut)
- [ ] Border radius nas barras (4px no topo)
- [ ] Grid lines tracejadas (#374151)
- [ ] Hover states com cores mais escuras
- [ ] Diferenças com cores condicionais (verde/vermelho)
- [ ] Font sizes adequados (12-16px)

---
*Documento criado em 20/09/2025 - Padronização baseada no componente EChartsBar existente*