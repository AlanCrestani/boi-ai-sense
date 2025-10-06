# Demanda - Acompanhamento Técnico

## Objetivo
Documentar as necessidades de controle e acompanhamento técnico das operações do confinamento.

## Checagens Necessárias

### 1. Checagem Peso Vagão
**O que preciso controlar:**
- [Descreva aqui o que precisa ser registrado]
1. Preciso q registre:
    - data
    - hora
    - Vagão q está sendo checado
    - peso vazio do vagão, pesado no balanção (balança rodoviaria da fazenda),
    - peso carregado do vagão, pesado no balanção
    - peso mostrado no visor da balança do vagão
    - id_carregamento para comparação dos pesos q foram registrado x peso do balançao.


- [Frequência de checagem]
1. Preciso q faça essa checagem 1x por semana, vamos deixar combinado q seja toda segunda-feira

- [Valores esperados/tolerâncias]
1. - Peso Liquido Balanção = Peso Visor Balança do Vagão
    - Peso Liquido Balanação = Peso vagão carregado - Peso vagão vazio
    - Peso Visor da Balança do Vagão = Valor Informado pelo usuario
    - Peso id_carregamento = sistema identifica qual fato_carregamento.id_carregamento q está sendo checado no balanção procurando pelo id_carregamento com primeiro hora antes da hora de pesagem no balanção... por exemplo na data 2025-10-04 a pesagem de checagem teve sua primeira pesagem na hora = 07:15, logo o id_carregamento é 166109970000000 q teve o ultimo ingrediente carregado as 07:11:13... (obs: sempre verificar qual vagão está sendo checado para buscar a hora do id_carregamento do vagão certo)

2. Analises a se fazer:
    - Peso Liquido Vagão (Balanção) x Peso Visor Balança do Vagão
    - Peso Visor Balança do Vagão x Peso id_carregamento
    - Peso fato_carregamento.id_carregamento x Soma Peso distribuido do fato_distribuicao.id_carregamento. Exemplo id_carregamento = 166109700000000 -> 8024,89 x 7930 diferença de =~ -1,1824%

3. Tolerâncias
    - 0 a 2% = Verde
    - 2 a 5% = Amarelo
    - 5 a 10% = Vermelho
    - acima de 10% Vermelho Escuro


- [Ações quando fora do padrão]
1. Emitir alerta em Insights de IA/Alertas & Feedbacks
    - quando estiver funcionando o Agente de IA reponsavel em Alertar & Feedback deve mandar msg no whatsapp do supervisor do confinamento e para o responsavel administrativo.

### 2. Checagem Qualidade da Mistura
**O que preciso controlar:**
- [Descreva aqui os parâmetros de qualidade]
1. Os parametras para registrar são:
    - data da coleta da amostra
    - hora da coleta da amostra
    - id_carregamento (sistema identifica o id_carregamento da mesma maneira que em "Checagem Peso Vagão")
    - Pelo id_carregamento sabe-se qual dieta.


- [Como é feita a avaliação]
1. Supervisor do confinamento recolhe um total de 9 amostras, sendo elas:
    - Inicio da distribuição de ração nos cochos, coletar 3 amostras e homegeneizar tudo em apenas uma amostragem (quando o vagão tiver carregado entre 7000 kg a 8000 kg)
    - Meio da distribuição de ração nos cochos, coletar 3 amostras e homegeneizar tudo em apenas uma amostragem (quando o vagão tiver carregado entre 3500 kg a 4500 kg)
    - Final da distribuição de ração nos cochos, coletar 3 amostras e homegeneizar tudo em apenas uma amostragem (quando o vagão tiver carregado entre 0 kg a 1000 kg)

2. Penn State
    - Pesar em torno de 0,500 kg de cada amostra e fazer a analise com a penn state para cada amostra separadamente.


- [Critérios de conformidade]
a penn state tem 4 repartições: 19mm, 8mm, 4mm e fundo, então para q a qualidade de mistura esteja conforme deve seguir o esquema da tabela abaixo:

---------+----------+---------+----------+----------+-----------------+-----------------+----------+
Peneira  |  Inicio  |  Meio   |  Fim     |  Média   |  Desvio Padrão  |  Variabilidade  |  Status  |
---------+----------+---------+----------+----------+-----------------+-----------------+----------+
19mm     |   10%    |   09%   |   10%    |  09,66%  |       ???       |       ???       |    ???   |
---------+----------+---------+----------+----------+-----------------+-----------------+----------+
08mm     |   70%    |   68%   |   68%    |  68,66%  |       ???       |       ???       |    ???   |
---------+----------+---------+----------+----------+-----------------+-----------------+----------+
04mm     |   15%    |   16%   |   17%    |  16,00%  |       ???       |       ???       |    ???   |
---------+----------+---------+----------+----------+-----------------+-----------------+----------+
Fundo    |   05%    |   07%   |   05%    |  05,66%  |       ???       |       ???       |    ???   |
---------+----------+---------+----------+----------+-----------------+-----------------+----------+
Total    |   100%   |   100%  |   100%   | 100,00%  | média ponderada | média ponderada |    ???   |
---------+----------+---------+----------+----------+-----------------+-----------------+----------+

- [Frequência de análise]
1. Uma vez por semana, em todas as dietas ativas 
2. Analises a se fazer:
    - Comparação Semana Passada x Semana Atual (Comparar todas as dietas (Recria, Adaptação, Crescimento e Terminação) q estão rodando)
    - Comparação entre dietas semana Atual
    - Comparação entre Vagões


### 3. Checagem Granulometria dos Grãos
**O que preciso controlar:**
- [Tamanho ideal das partículas]
- [Método de medição]
- [Tolerâncias aceitáveis]
- [Impacto na nutrição animal]

### 4. Checagem Limpeza dos Bebedouros
**O que preciso controlar:**
- [Itens a verificar]
- [Frequência de limpeza]
- [Padrões de higiene]
- [Registro de manutenções]

### 5. Checagem Processo de Ensilagem
**O que preciso controlar:**
- [Parâmetros a medir (pH, matéria seca, etc)]
- [Fases do processo]
- [Indicadores de qualidade]
- [Periodicidade de análise]

## Informações Gerais que Preciso em Todas as Checagens
- [ ] Data e hora da checagem
- [ ] Responsável pela execução
- [ ] Status (Conforme/Não Conforme/Pendente)
- [ ] Observações detalhadas
- [ ] Ações corretivas tomadas
- [ ] Próxima data prevista
- [ ] Anexos (fotos, laudos, etc)
- [ ] [Adicione outros campos necessários]

## Relatórios e Dashboards Necessários
- [Descreva que tipo de visualizações e relatórios você precisa]
- [Indicadores chave (KPIs)]
- [Alertas automáticos]
- [Integrações com outros sistemas]

## Regras de Negócio
- [Quem pode fazer checagens]
- [Quem pode aprovar]
- [Fluxo de aprovação]
- [Notificações necessárias]

## Outras Considerações
[Adicione aqui qualquer outra informação relevante para o sistema]