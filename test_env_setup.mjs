// Testar se todas as variáveis de ambiente estão configuradas
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🧪 Testando configuração de variáveis de ambiente...\n');

// Variáveis requeridas
const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_PROJECT_REF',
  'SUPABASE_ACCESS_TOKEN',
  'SUPABASE_JWT_SECRET',
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'GITHUB_TOKEN'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

console.log('\n📋 Resumo:');
if (allPresent) {
  console.log('✅ Todas as variáveis de ambiente estão configuradas!');
} else {
  console.log('❌ Algumas variáveis de ambiente estão faltando.');
}

// Testar geração de JWT
if (process.env.SUPABASE_JWT_SECRET) {
  try {
    console.log('\n🔑 Testando geração de JWT...');

    // Importar dinamicamente o jsonwebtoken
    const jwt = await import('jsonwebtoken');

    const payload = {
      iss: 'supabase',
      ref: process.env.SUPABASE_PROJECT_REF,
      role: 'anon',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 horas
    };

    const token = jwt.default.sign(payload, process.env.SUPABASE_JWT_SECRET);
    console.log('✅ JWT gerado com sucesso!');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);

  } catch (error) {
    console.log('❌ Erro ao gerar JWT:', error.message);
  }
}

console.log('\n🎯 Configuração de ambiente testada!');