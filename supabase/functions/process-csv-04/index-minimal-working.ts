import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filename, fileId, organizationId } = await req.json();

    console.log(`🚀 Processando arquivo: ${filename}`);
    console.log(`📋 File ID: ${fileId}, Organization ID: ${organizationId}`);

    return new Response(JSON.stringify({
      success: true,
      filename,
      fileId: fileId || crypto.randomUUID(),
      rowsProcessed: 0,
      rowsInserted: 0,
      message: 'Versão mínima de teste da Pipeline 04'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro na pipeline 04:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});