import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const organizationId = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';

console.log('Testando view_ingrediente_resumo para organization_id:', organizationId);

// Teste 1: Buscar dados sem filtro
console.log('\n1. Buscando todos os dados da view (sem filtro):');
const { data: allData, error: allError } = await supabase
  .from('view_ingrediente_resumo')
  .select('*')
  .limit(5);

if (allError) {
  console.error('Erro:', allError);
} else {
  console.log('Dados encontrados:', allData?.length || 0);
  if (allData && allData.length > 0) {
    console.log('Primeira linha:', allData[0]);
    console.log('Organization IDs encontrados:', [...new Set(allData.map(d => d.organization_id))]);
  }
}

// Teste 2: Buscar dados com filtro de organization_id
console.log('\n2. Buscando dados com filtro de organization_id:');
const { data: filteredData, error: filteredError } = await supabase
  .from('view_ingrediente_resumo')
  .select('*')
  .eq('organization_id', organizationId);

if (filteredError) {
  console.error('Erro:', filteredError);
} else {
  console.log('Dados encontrados para a org:', filteredData?.length || 0);
  if (filteredData && filteredData.length > 0) {
    console.log('Primeira linha:', filteredData[0]);
  }
}

// Teste 3: Buscar diretamente da tabela staging_02
console.log('\n3. Buscando dados diretamente da staging_02_desvio_carregamento:');
const { data: stagingData, error: stagingError } = await supabase
  .from('staging_02_desvio_carregamento')
  .select('organization_id, ingrediente, data, previsto_kg, realizado_kg')
  .limit(5);

if (stagingError) {
  console.error('Erro:', stagingError);
} else {
  console.log('Dados encontrados na staging_02:', stagingData?.length || 0);
  if (stagingData && stagingData.length > 0) {
    console.log('Primeira linha:', stagingData[0]);
    console.log('Organization IDs na staging_02:', [...new Set(stagingData.map(d => d.organization_id))]);
  }
}

// Teste 4: Contar dados por organization_id
console.log('\n4. Contando dados por organization_id na staging_02:');
const { data: countData, error: countError } = await supabase
  .from('staging_02_desvio_carregamento')
  .select('organization_id', { count: 'exact', head: true })
  .eq('organization_id', organizationId);

if (countError) {
  console.error('Erro:', countError);
} else {
  console.log('Total de registros para a org na staging02:', countData);
}

process.exit(0);