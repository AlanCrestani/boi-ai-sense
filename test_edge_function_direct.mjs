// Teste direto da edge function com curl
import { execSync } from 'child_process';

async function testWithCurl() {
  try {
    console.log('🧪 Testando edge function process-csv-03 com curl...');

    const payload = {
      filename: "03_desvio_distribuicao.csv",
      organizationId: "b7a05c98-9fc5-4aef-b92f-bfa0586bf495",
      fileId: "test-debug-" + Date.now()
    };

    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    // Usar curl para fazer a requisição
    const curlCommand = `curl -X POST https://zirowpnlxjenkxiqcuwz.supabase.co/functions/v1/process-csv-03 \\
      -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjMzMzA0NywiZXhwIjoyMDQxOTA5MDQ3fQ.K1HoFf8kYmcWNI6Y7KI7PnGO2YeCovVkNh2_OLw5sGo" \\
      -H "Content-Type: application/json" \\
      -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNjMzMzA0NywiZXhwIjoyMDQxOTA5MDQ3fQ.K1HoFf8kYmcWNI6Y7KI7PnGO2YeCovVkNh2_OLw5sGo" \\
      -d '${JSON.stringify(payload)}' \\
      --max-time 120`;

    console.log('🚀 Executando curl...');
    const result = execSync(curlCommand, { encoding: 'utf8', timeout: 120000 });

    console.log('📄 Response:', result);

    try {
      const jsonResponse = JSON.parse(result);
      console.log('📋 Resultado estruturado:', JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('⚠️ Resposta não é JSON válido ou contém outros dados');
    }

  } catch (error) {
    console.error('❌ Erro ao testar edge function:', error.message);

    // Se for erro de processo, mostrar stderr
    if (error.stderr) {
      console.error('🔍 stderr:', error.stderr.toString());
    }

    // Se for erro de processo, mostrar stdout
    if (error.stdout) {
      console.log('📄 stdout:', error.stdout.toString());
    }
  }
}

testWithCurl();