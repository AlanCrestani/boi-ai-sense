// Script para verificar se precisamos das chaves do dashboard
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Verificando configuração atual do Supabase...\n');

console.log('📋 Chaves atuais no .env:');
console.log(`VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL}`);
console.log(`VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY?.substring(0, 50)}...`);
console.log(`SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50)}...`);

console.log('\n📋 O que você precisa fazer:');
console.log('1. Acesse: https://supabase.com/dashboard/project/zirowpnlxjenkxiqcuwz/settings/api');
console.log('2. Copie as chaves atuais:');
console.log('   - Project URL');
console.log('   - anon public key');
console.log('   - service_role secret key');
console.log('3. Compare com as chaves no .env atual');
console.log('4. Se diferentes, atualize o .env');

console.log('\n🎯 Não precisamos do Legacy JWT Secret para login normal!');
console.log('As chaves anon/service_role do dashboard são suficientes.');