import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { authUsers, profiles } from './src/schema.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function setupCorrectData() {
  try {
    // IDs reais fornecidos pelo usuário
    const USER_ID = '2a1e3816-0893-4111-8bd4-a19949808df1';
    const ORGANIZATION_ID = 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495';
    
    console.log('🔍 Verificando usuário real...');
    const userCheck = await db
      .select()
      .from(authUsers)
      .where(eq(authUsers.id, USER_ID))
      .limit(1);
    
    if (userCheck.length > 0) {
      console.log('✅ Usuário encontrado:', userCheck[0]);
    }
    
    console.log('📊 Verificando se já existe profile...');
    const existingProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, USER_ID))
      .limit(1);
    
    if (existingProfile.length === 0) {
      console.log('➕ Criando profile para o usuário...');
      
      // Criar tabela profiles se não existir
      await client`
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id),
          full_name TEXT,
          phone TEXT,
          avatar_url TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
      
      console.log('✅ Tabela profiles criada/verificada');
      
      // Inserir dados via SQL direto para evitar problemas de tipagem
      const insertResult = await client`
        INSERT INTO profiles (user_id, full_name, phone, is_active)
        VALUES (${USER_ID}, 'Alan Crestani', '+55 11 99999-0000', true)
        RETURNING *
      `;
      
      console.log('✅ Profile criado:', insertResult[0]);
    } else {
      console.log('✅ Profile já existe:', existingProfile[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await client.end();
  }
}

setupCorrectData();