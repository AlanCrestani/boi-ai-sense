# Parâmetros dos Alertas - Sistema Conecta Boi

Este documento descreve os critérios e parâmetros utilizados para gerar os alertas do sistema, divididos em três categorias principais.

---

## 1. Análise Estatística (Coeficiente de Variação - CV)

### Descrição
Analisa a **consistência do consumo** ao longo do tempo, medindo o quanto o consumo realizado varia entre os dias.

### Métrica Principal
**Coeficiente de Variação (CV)** = (Desvio Padrão / Média) × 100

### Faixas de Classificação

| Severidade | Faixa CV | Badge | Cor | Descrição |
|------------|----------|-------|-----|-----------|
| **Bom** | CV ≤ 5% | Boa Consistência | Verde `#22C55E` | Variação muito baixa e controlada |
| **Amarelo** | 5% < CV ≤ 10% | Consistência em Observação | Amarelo `#EAB308` | Variação moderada no consumo |
| **Laranja** | 10% < CV ≤ 15% | Consistência Baixa | Laranja `#FB923C` | Alta variabilidade no consumo |
| **Vermelho** | CV > 15% | Consistência Crítica | Vermelho `#EF4444` | Variabilidade crítica no consumo |

### Formato do Alerta
```
Título: [Badge] - [Curral Lote]
Exemplo: "Consistência em Observação - 53 - 36-G3-25"

Descrição: "Coeficiente de Variação de X.XX% indica [classificação]."
Exemplo: "Coeficiente de Variação de 8.27% indica variação moderada no consumo."

Métrica: CV: X.XX%
```

### Interpretação
- **CV ≤ 5%**: Excelente! Consumo muito estável e previsível
- **CV 5-10%**: Boa consistência, variação aceitável
- **CV 10-15%**: Variação moderada, monitorar fatores externos
- **CV > 15%**: Alta variabilidade, investigação necessária

---

## 2. Desvio de Consumo MS (Precisão da Previsão)

### Descrição
Mede o quanto o **consumo realizado se desvia do previsto**, avaliando a precisão do planejamento alimentar.

### Métrica Principal
**Desvio Médio Percentual** = Média dos |Desvio %| absolutos entre previsto e realizado

### Faixas de Classificação

| Severidade | Faixa Desvio | Badge | Cor | Descrição |
|------------|--------------|-------|-----|-----------|
| **Bom** | Desvio ≤ 2% | Boa Precisão | Verde `#22C55E` | Previsão muito precisa |
| **Amarelo** | 2% < Desvio ≤ 5% | Necessita de Atenção | Amarelo `#EAB308` | Desvio moderado |
| **Laranja** | 5% < Desvio ≤ 10% | Precisão Baixa | Laranja `#FB923C` | Desvio alto |
| **Vermelho** | Desvio > 10% | Precisão Crítica | Vermelho `#EF4444` | Desvio crítico |

### Formato do Alerta
```
Título: [Badge] - [Curral Lote]
Exemplo: "Necessita de Atenção - 53 - 36-G3-25"

Descrição: "X de Y dias ≤2% (XX.XX% Dias no Target). Desvio médio de X.XX% entre previsto e realizado."
Exemplo: "5 de 10 dias ≤2% (50.00% Dias no Target). Desvio médio de 4.62% entre previsto e realizado."

Métrica: Desvio: X.XX%
```

### Informações Incluídas
O alerta mostra:
- **Dias no Target**: Quantos dias tiveram desvio ≤2% (considerado bom)
- **Percentual no Target**: % de dias dentro do target ideal
- **Desvio Médio**: Média dos desvios percentuais absolutos

### Interpretação
- **Desvio ≤ 2%**: Excelente! Previsão muito precisa
- **Desvio 2-5%**: Atenção moderada, revisar se necessário
- **Desvio 5-10%**: Precisão precisa melhorar
- **Desvio > 10%**: Situação crítica, ajuste urgente necessário

---

## 3. Compliance (Dias no Target)

### Descrição
Mede o **percentual de dias dentro do target ideal** (desvio ≤2%), independente do desvio médio. Um lote pode ter um desvio médio aceitável, mas se tiver muitos dias fora do target, isso é prejudicial para a engorda.

### Métrica Principal
**Compliance (%)** = (Dias com Desvio ≤2% / Total de Dias) × 100

### Faixas de Classificação

| Severidade | Faixa Compliance | Badge | Cor | Descrição |
|------------|------------------|-------|-----|-----------|
| **Bom** | Compliance ≥ 83% | Bom | Verde `#22C55E` | Alta consistência no target |
| **Amarelo** | 75% ≤ Compliance < 83% | Atenção | Amarelo `#EAB308` | Compliance moderado |
| **Laranja** | 50% ≤ Compliance < 75% | Compliance Baixa | Laranja `#FB923C` | Compliance baixo |
| **Vermelho** | Compliance < 50% | Compliance Crítica | Vermelho `#EF4444` | Compliance crítico |

### Formato do Alerta
```
Título: [Badge] - [Curral Lote]
Exemplo: "Atenção - 53 - 36-G3-25"

Descrição: "X de Y dias ≤2% (XX.XX% de Compliance)."
Exemplo: "8 de 14 dias ≤2% (57.14% de Compliance)."

Métrica: Compliance: XX.XX%
```

### Por que Compliance é importante?
Um lote pode ter:
- **Desvio médio de 3%** (aparentemente bom)
- Mas **apenas 5 de 14 dias no target** (35.7% de Compliance - crítico!)

Isso significa:
- 9 dias tiveram desvios maiores compensando
- Alta variabilidade dia a dia
- **Prejudicial para a engorda** mesmo com média aceitável
- Gera alerta de Compliance, não de Desvio

### Interpretação
- **Compliance ≥ 83%**: Excelente! Consistência alta no target
- **Compliance 75-82%**: Atenção, pode melhorar
- **Compliance 50-74%**: Baixo, investigar causas
- **Compliance < 50%**: Crítico, ação urgente necessária

---

## 4. Leitura de Cocho (Acurácia)

### Descrição
Avalia a **precisão das notas de leitura de cocho** dadas pelo tratador, comparando se a nota dada ontem foi correta baseado no que aconteceu hoje.

### Métrica Principal
**Taxa de Acerto (%)** = (Total de Acertos / Total de Validações Compliance) × 100

### Pré-requisito: Compliance do Tratador
A validação **só ocorre** se o tratador executou corretamente ontem:
- Realizado/Previsto entre 0.98 e 1.02 (±2%)

### Faixas de Classificação

| Severidade | Faixa Taxa | Badge | Cor | Descrição |
|------------|------------|-------|-----|-----------|
| **Bom** | Taxa ≥ 85% | Bom | Verde `#22C55E` | Alta acurácia (≥12/14 acertos) |
| **Amarelo** | 71% ≤ Taxa < 85% | Atenção | Amarelo `#EAB308` | Acurácia moderada (≥10/14 acertos) |
| **Vermelho** | Taxa < 71% | Tem que Melhorar | Vermelho `#EF4444` | Acurácia baixa (<10/14 acertos) |

### Formato do Alerta
```
Título: [Badge] - [Curral Lote]
Exemplo: "Atenção - 53 - 36-G3-25"

Descrição: "Taxa de acerto de XX.XX% (X/Y validações)."
Exemplo: "Taxa de acerto de 78.57% (11/14 validações)."

Métrica: Taxa de Acerto: XX.XX%
```

### Regras de Validação

#### Nota 1 (OBJETIVO - Manter)
- ✅ **Acerto**: Se HOJE também deu nota 1 (pode repetir)
- ❌ **Erro**: Se HOJE deu outra nota (já podia ter ajustado ontem)

#### Notas -2, -1, 0 (Aumentar quantidade)
- ✅ **Acerto**: Se HOJE a nota melhorou em direção ao 1
- ❌ **Erro Leve**: Se HOJE repetiu a mesma nota (podia mais)
- ❌ **Erro Grave**: Se HOJE ultrapassou o 1 (ex: de 0 para 2)

#### Notas 2, 3, 4 (Diminuir quantidade)
- ✅ **Acerto**: Se HOJE a nota melhorou em direção ao 1
- ❌ **Erro Leve**: Se HOJE repetiu a mesma nota (podia menos)
- ❌ **Erro Grave**: Se HOJE ultrapassou o 1 (ex: de 2 para -1)

### Tipos de Erro
- **Acertos**: Nota correta e leitura precisa
- **Erros Leves**: Podia ter dado mais/menos
- **Erros Graves**: Direção totalmente errada
- **Notas Repetidas**: Repetiu nota quando não deveria (exceto nota 1)

---

## Período de Análise

### Janela de Dados
- **14 dias**: Da data mais recente até 13 dias atrás
- **Filtro dinâmico**:
  - Se hoje tem `realizado = 0`: Usa 13 dias (exclui hoje)
  - Se hoje tem `realizado > 0`: Usa 14 dias (inclui hoje)

### Dados Válidos
- Apenas dias com `cms_realizado_kg > 0` (após arredondamento)
- Valores arredondados para 2 casas decimais
- Agrupamento por **lote** (não por curral), usando posição atual

### Exemplo Prático
```
Data mais recente: 2025-10-06
Período: 2025-09-23 até 2025-10-06 (14 dias)

Se 06/10 tem realizado = 0:
  → Usa: 23/09 até 05/10 (13 dias)

Se 06/10 tem realizado > 0:
  → Usa: 23/09 até 06/10 (14 dias)
```

---

## Filtros e Ordenação em /alerts

### Filtros Disponíveis

#### Por Categoria
- Todas as Categorias
- Análise Estatística
- Desvio de Consumo
- Compliance
- Leitura de Cocho

#### Por Severidade
- Todas as Severidades
- Necessita de Atenção (amarelo)
- Alerta Laranja (laranja)
- Alerta Vermelho (vermelho)

### Ordenação

#### Por Maior Gravidade (padrão)
- Vermelho > Laranja > Amarelo
- Dentro de cada cor: maior métrica = mais grave
  - **Exceção**: Leitura de Cocho (menor taxa = mais grave)

#### Por Curral/Lote
- Ordenação alfabética por `curral_lote`

#### Por Categoria
- Ordenação alfabética

### Status Geral
- **Alerta Vermelho**: Se houver algum alerta vermelho
- **Alerta Laranja**: Se houver algum laranja (sem vermelho)
- **Atenção**: Se houver algum amarelo (sem laranja/vermelho)
- **Normal**: Se não houver alertas

---

## Processamento de Dados

### Agrupamento por Lote

#### Problema de Transferência
Se um lote mudou de curral durante o período:
- **Incorreto**: Calcular separadamente para cada curral
- **Correto**: Agrupar todo o histórico sob o curral atual

#### Solução Implementada
```typescript
1. Identificar posição atual de cada lote (data mais recente)
2. Agrupar TODOS os dados históricos sob o curral_lote atual
3. Calcular métricas com histórico completo
```

#### Exemplo
```
Lote "36-G3-25":
- Dias 1-10: Estava no curral 36
- Dias 11-14: Transferido para curral 53

Comportamento:
✅ Correto: Um único alerta "53 - 36-G3-25" com CV dos 14 dias
❌ Incorreto: Dois alertas separados (curral 36 e 53)
```

### Arredondamento de Valores

#### Ordem Crítica
1. **Arredondar PRIMEIRO** todos os valores para 2 casas decimais
2. **Filtrar DEPOIS** valores > 0
3. **Calcular** com valores já arredondados

#### Motivo
Evitar inconsistências onde valores como `0.004`:
- Passam no filtro `> 0` (valor bruto)
- Mas viram `0.00` após arredondamento
- Gerando contagem incorreta de dias válidos

---

## Cores do Sistema

| Cor | Hex | Uso |
|-----|-----|-----|
| Verde | `#22C55E` | Bom / Sem problemas |
| Amarelo | `#EAB308` | Atenção / Moderado |
| Laranja | `#FB923C` | Baixo / Alto |
| Vermelho | `#EF4444` | Crítico / Urgente |

---

## Logs de Debug

### Para Depuração
Logs incluem (para lote específico `36-G3-25`):

#### useSystemAlerts.tsx
```
🔍 DEBUG ALERTAS - Curral 53: 36-G3-25
Total de dados no período: 14
Último dia: 2025-10-06 realizado: 0
Último dia tem dados? false
Dados válidos após filtro: 13
Valores realizados (já arredondados): [array de valores]

📊 Cálculo CV:
Média: 450.25
Desvio Padrão: 34.87
CV: 7.73
```

#### EstatisticasConsumoCard.tsx
```
🔍 DEBUG FEED-READING - Curral 53: 36-G3-25
Total de dados no período: 14
Último dia: 2025-10-06 realizado: 0
Último dia tem dados? false
Dados válidos após filtro: 13
Valores realizados: [array de valores]

📊 Cálculo CV (FEED-READING):
Média: 450.25
Desvio Padrão: 34.87
CV: 7.73
```

---

## Arquivos de Código

### Hooks
- `/src/hooks/useSystemAlerts.tsx` - Geração de alertas
- `/src/hooks/useMateriaSecaDataView.tsx` - Dados de consumo para gráficos
- `/src/hooks/useAcuraciaLeituraCocho.tsx` - Cálculo de acurácia

### Componentes
- `/src/pages/Alerts.tsx` - Página de alertas
- `/src/components/dashboard/EstatisticasConsumoCard.tsx` - Card de CV
- `/src/components/dashboard/PrecisaoPrevisaoCard.tsx` - Card de desvio
- `/src/components/dashboard/AcuraciaLeituraCard.tsx` - Card de acurácia

### Views no Banco
- `view_consumo_materia_seca` - Dados de consumo de matéria seca
- `view_acuracia_leitura_cocho` - Dados de acurácia da leitura

---

_Última atualização: 2025-10-06_
