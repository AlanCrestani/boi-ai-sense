// Gerar JWT válido para Supabase
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('Missing SUPABASE_JWT_SECRET environment variable');
}

// Payload para service role
const payload = {
  iss: 'supabase',
  ref: 'zirowpnlxjenkxiqcuwz',
  role: 'service_role',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 dias
};

try {
  const token = jwt.sign(payload, JWT_SECRET);
  console.log('🔑 Service Role JWT Token:');
  console.log(token);

  // Payload para anon role
  const anonPayload = {
    iss: 'supabase',
    ref: 'zirowpnlxjenkxiqcuwz',
    role: 'anon',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 dias
  };

  const anonToken = jwt.sign(anonPayload, JWT_SECRET);
  console.log('\n🔑 Anon JWT Token:');
  console.log(anonToken);

} catch (error) {
  console.error('❌ Erro ao gerar JWT:', error.message);
}