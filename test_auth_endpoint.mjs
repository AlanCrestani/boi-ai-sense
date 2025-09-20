// Testar endpoint de auth com diferentes abordagens
async function testAuthEndpoint() {
  try {
    console.log('🧪 Testando endpoint /auth/v1/settings...');

    // Primeiro, verificar configurações do projeto
    const settingsResponse = await fetch('https://zirowpnlxjenkxiqcuwz.supabase.co/auth/v1/settings', {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjQ5OTUsImV4cCI6MjA3MzgwMDk5NX0._wkw_at8eiLU7pjQMQtJbTdb3Hf9DIBAnQiHC5a_Sbc'
      }
    });

    console.log(`📊 Settings Status: ${settingsResponse.status}`);

    if (settingsResponse.ok) {
      const settings = await settingsResponse.json();
      console.log('✅ Auth endpoint está funcionando!');
      console.log('📋 Settings:', JSON.stringify(settings, null, 2));
    } else {
      const errorText = await settingsResponse.text();
      console.log('❌ Auth endpoint com problema');
      console.log('🔍 Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro ao testar auth endpoint:', error.message);
  }
}

testAuthEndpoint();