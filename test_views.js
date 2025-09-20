import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zirowpnlxjenkxiqcuwz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inppcm93cG5seGplbmt4aXFjdXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTYwMTksImV4cCI6MjA3MzA5MjAxOX0.4WTrwYIZZSey5_9yE4mU2aP19P9tl3CeGr1RjBC7IH8'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testViews() {
  const views = [
    'view_eficiencia_distribuicao',
    'view_volume_por_dieta',
    'view_volume_por_vagao',
    'view_eficiencia_temporal'
  ]

  console.log('Testing analytics views...')

  for (const viewName of views) {
    try {
      console.log(`Testing ${viewName}...`)
      const { data, error } = await supabase
        .from(viewName)
        .select('*')
        .limit(1)

      if (error) {
        console.error(`❌ Error accessing ${viewName}:`, error.message)
      } else {
        console.log(`✅ ${viewName} is accessible, sample data:`, data)
      }
    } catch (err) {
      console.error(`❌ Error testing ${viewName}:`, err.message)
    }
  }
}

testViews().catch(console.error)