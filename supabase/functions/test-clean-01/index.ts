import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  console.log('Testing clean-duplicates-01 function...');

  const response = await fetch('https://zirowpnlxjenkxiqcuwz.supabase.co/functions/v1/clean-duplicates-01', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
    },
    body: JSON.stringify({
      organizationId: 'b7a05c98-9fc5-4aef-b92f-bfa0586bf495'
    })
  });

  const result = await response.json();
  console.log('Clean duplicates result:', result);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});