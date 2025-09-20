import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testView() {
  console.log('Testando view_ingrediente_resumo...');

  const organizationId = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
  const testDate = '2025-09-01';

  try {
    // Teste 1: Buscar sem filtro de data
    console.log('\n1. Buscando todos os dados da organização:');
    const { data: allData, error: allError } = await supabase
      .from('view_ingrediente_resumo')
      .select('*')
      .eq('organization_id', organizationId)
      .limit(5);

    if (allError) {
      console.error('Erro ao buscar todos os dados:', allError);
    } else {
      console.log('Total de registros:', allData?.length);
      console.log('Primeira linha:', allData?.[0]);
    }

    // Teste 2: Buscar com filtro de data específica
    console.log('\n2. Buscando dados para data específica:', testDate);
    const { data: dateData, error: dateError } = await supabase
      .from('view_ingrediente_resumo')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('data', testDate);

    if (dateError) {
      console.error('Erro ao buscar por data:', dateError);
    } else {
      console.log('Total de registros para', testDate + ':', dateData?.length);
      if (dateData && dateData.length > 0) {
        console.log('Ingredientes encontrados:');
        dateData.forEach(item => {
          console.log(`  - ${item.ingrediente}: Previsto=${item.previsto_kg}kg, Realizado=${item.realizado_kg}kg`);
        });
      }
    }

    // Teste 3: Buscar datas disponíveis
    console.log('\n3. Buscando datas disponíveis:');
    const { data: datesData, error: datesError } = await supabase
      .from('view_ingrediente_resumo')
      .select('data')
      .eq('organization_id', organizationId)
      .order('data', { ascending: false })
      .limit(10);

    if (datesError) {
      console.error('Erro ao buscar datas:', datesError);
    } else {
      const uniqueDates = [...new Set(datesData?.map(d => d.data))];
      console.log('Datas disponíveis:', uniqueDates);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testView();