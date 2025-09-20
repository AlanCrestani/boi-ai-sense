// Teste direto da edge function process-csv-03
import fetch from 'node-fetch';

async function testEdgeFunction() {
  try {
    console.log('🧪 Testando edge function process-csv-03...');

    const payload = {
      filename: "03_desvio_distribuicao.csv",
      organizationId: "b7a05c98-9fc5-4aef-b92f-bfa0586bf495",
      fileId: "test-debug-" + Date.now()
    };

    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://zirowpnlxjenkxiqcuwz.supabase.co/functions/v1/process-csv-03', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjMzMzA0NywiZXhwIjoyMDQxOTA5MDQ3fQ.K1HoFf8kYmcWNI6Y7KI7PnGO2YeCovVkNh2_OLw5sGo',
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjMzMzA0NywiZXhwIjoyMDQxOTA5MDQ3fQ.K1HoFf8kYmcWNI6Y7KI7PnGO2YeCovVkNh2_OLw5sGo'
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`📄 Response:`, responseText);

    if (response.ok) {
      console.log('✅ Edge function executou com sucesso!');
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('📋 Resultado:', JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log('⚠️ Resposta não é JSON válido');
      }
    } else {
      console.log('❌ Edge function retornou erro');
      try {
        const errorJson = JSON.parse(responseText);
        console.log('🔍 Detalhes do erro:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.log('🔍 Erro em texto puro:', responseText);
      }
    }

  } catch (error) {
    console.error('❌ Erro ao testar edge function:', error.message);
  }
}

testEdgeFunction();