#!/usr/bin/env node
import { supabaseManager } from './index.js';

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');

  // Get environment variables
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ Missing environment variables:');
    console.error('  - VITE_SUPABASE_URL or SUPABASE_URL');
    console.error('  - VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
    process.exit(1);
  }

  try {
    // Initialize client
    supabaseManager.initialize({
      url,
      anonKey,
    });

    // Test connection
    const result = await supabaseManager.testConnection();

    if (result.success) {
      console.log('✅ Supabase connection successful!');
      console.log('📦 Storage buckets accessible');
    } else {
      console.error('❌ Supabase connection failed:');
      console.error(`   ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testSupabaseConnection();
}