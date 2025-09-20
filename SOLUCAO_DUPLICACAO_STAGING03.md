# Solução para Duplicação de Dados - Staging 03

## Problema Identificado
Os dados da staging 03 estavam sendo duplicados ao usar `forceOverwrite: true`. A edge function tinha duas verificações de duplicação:

1. **Por `file_id`**: Removia dados com o mesmo file_id ✅
2. **Por `merge keys`**: Apenas verificava, mas não removia dados similares ❌

## Solução Implementada

### 1. Correção da Edge Function `process-csv-03`
**Arquivo**: `supabase/functions/process-csv-03/index.ts`

**Problema**: A segunda verificação (linhas 371-373) não removia dados duplicados:
```typescript
} else {
  console.log(`🔄 Forçando processamento apesar de ${duplicateCheck.length} dados similares existentes`);
}
```

**Solução**: Adicionada limpeza por merge keys quando `forceOverwrite: true`:
```typescript
} else {
  console.log(`🔄 Forçando sobrescrita - removendo ${duplicateCheck.length} dados similares existentes por merge keys...`);

  // Remove dados duplicados baseados em merge keys
  const allMergeKeys = processedData.map(row => row.merge);
  await supabase
    .from('staging_03_desvio_distribuicao')
    .delete()
    .eq('organization_id', organizationId)
    .in('merge', allMergeKeys);

  console.log(`✅ Dados similares removidos, processando com novos merge keys...`);
}
```

### 2. Edge Function de Limpeza de Duplicados
**Arquivo**: `supabase/functions/clean-duplicates-03/index.ts`

Criada edge function dedicada para limpar duplicados existentes:
- Identifica registros com merge keys duplicados
- Mantém apenas o registro mais recente para cada merge key
- Remove duplicados em lotes para performance
- Retorna estatísticas da limpeza

### 3. Interface de Usuário Atualizada

#### Hook `useCsvProcessor`
**Arquivo**: `src/hooks/useCsvProcessor.tsx`

Adicionada função `cleanDuplicates`:
```typescript
const cleanDuplicates = async (pipeline: string) => {
  // Chama edge function clean-duplicates-XX
  // Exibe toast com resultado
}

return {
  processCsv,
  cleanDuplicates,        // ← Nova função
  isProcessing,
  isCleaningDuplicates    // ← Novo estado
};
```

#### Componente `CsvProcessor`
**Arquivo**: `src/components/CsvProcessor.tsx`

Adicionado botão "Limpar Duplicados":
- Botão outline com ícone de lixeira
- Estado de loading independente
- Desabilita outros botões durante operação

## Como Usar

### Opção 1: Interface Web (Recomendado)
1. Acesse `/csv-upload`
2. Encontre o card "Desvio Distribuição" (Pipeline 03)
3. Clique em **"Limpar Duplicados"** primeiro
4. Aguarde conclusão da limpeza
5. Se necessário, marque "Forçar sobrescrita" e clique "Processar"

### Opção 2: Reprocessamento Direto
1. Acesse `/csv-upload`
2. Encontre o card "Desvio Distribuição" (Pipeline 03)
3. Marque **"Forçar sobrescrita de dados existentes"**
4. Clique **"Processar"**
5. A nova lógica irá limpar duplicados automaticamente

## Resultado
- ✅ **Duplicação eliminada**: Edge function agora remove dados duplicados corretamente
- ✅ **Interface amigável**: Botão dedicado para limpeza de duplicados
- ✅ **Compatibilidade mantida**: Merge fields entre staging 03 e 05 compatíveis
- ✅ **Performance otimizada**: Limpeza em lotes para grandes volumes

## Arquivos Modificados
1. `supabase/functions/process-csv-03/index.ts` - Correção da lógica de forceOverwrite
2. `supabase/functions/clean-duplicates-03/index.ts` - Nova edge function de limpeza
3. `src/hooks/useCsvProcessor.tsx` - Adicionada função cleanDuplicates
4. `src/components/CsvProcessor.tsx` - Adicionado botão de limpeza

## Status
✅ **Implementado e deployado**
- Edge functions deployadas no Supabase
- Interface atualizada e funcional
- Solução testada e validada