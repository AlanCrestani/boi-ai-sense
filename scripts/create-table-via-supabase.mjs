import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zirowpnlxjenkxiqcuwz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTYwMTksImV4cCI6MjA3MzA5MjAxOX0.4WTrwYIZZSey5_9yE4mU2aP19P9tl3CeGr1RjBC7IH8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');

    // Test by fetching from organizations table
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error);
    } else {
      console.log('Connected to Supabase successfully');
      console.log('Sample data:', data);
    }

    // Check if staging_03_desvio_distribuicao exists
    const { data: tableData, error: tableError } = await supabase
      .from('staging_03_desvio_distribuicao')
      .select('*')
      .limit(1);

    if (tableError) {
      console.log('Table staging_03_desvio_distribuicao does not exist or error:', tableError.message);
    } else {
      console.log('Table staging_03_desvio_distribuicao exists');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();