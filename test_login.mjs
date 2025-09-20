// Teste de login direto com a API
async function testLogin() {
  try {
    console.log('🧪 Testando login na API do Supabase...');

    const response = await fetch('https://zirowpnlxjenkxiqcuwz.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMjUwNjYsImV4cCI6MTc2MDgxNzA2Nn0.lN8krA7vhXxRryOIx9FvvO8rfPamS952B2wKqh3tg6U'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login API funcionando!');
      console.log('📋 Response:', JSON.stringify(data, null, 2));
    } else {
      const errorData = await response.text();
      if (response.status === 400) {
        console.log('ℹ️ Credenciais inválidas (esperado para teste), mas API está funcionando');
      } else if (response.status === 401) {
        console.log('❌ Token JWT ainda está inválido');
      }
      console.log('🔍 Response:', errorData);
    }

  } catch (error) {
    console.error('❌ Erro ao testar login:', error.message);
  }
}

testLogin();