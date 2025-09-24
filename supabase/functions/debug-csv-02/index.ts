import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { filename, organizationId } = await req.json();

    console.log(`🔄 DEBUG: Analisando CSV 02: ${filename}`);

    // Buscar o arquivo CSV
    let filePath = `${organizationId}/02/${filename}`;
    let { data: fileData, error: downloadError } = await supabase.storage
      .from('csv-uploads')
      .download(filePath);

    if (downloadError) {
      filePath = `${organizationId}/csv-processed/02/${filename}`;
      const result = await supabase.storage
        .from('csv-uploads')
        .download(filePath);
      fileData = result.data;
      downloadError = result.error;
    }

    if (downloadError) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError.message}`);
    }

    // Analisar CSV
    const csvText = await fileData.text();
    const lines = csvText.split('\n').filter(line => line.trim());

    console.log(`📄 Arquivo tem ${lines.length} linhas`);
    console.log(`📋 Primeira linha (header):`, lines[0]);

    if (lines.length > 1) {
      console.log(`📋 Segunda linha (primeira dados):`, lines[1]);
    }
    if (lines.length > 2) {
      console.log(`📋 Terceira linha:`, lines[2]);
    }

    // Analisar header
    const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
    console.log(`📋 Header processado:`, header);

    // Analisar algumas linhas de dados
    const dataLines = lines.slice(1);
    console.log(`📊 Total de linhas de dados: ${dataLines.length}`);

    let validCount = 0;
    let invalidCount = 0;

    for (let i = 0; i < Math.min(5, dataLines.length); i++) {
      const line = dataLines[i];
      const values = line.split(',').map(val => val.trim().replace(/"/g, ''));

      console.log(`📋 Linha ${i + 1}:`, values.slice(0, 8));

      // Verificar se tem data válida
      const hasValidDate = values.some(val => val && (
        val.match(/\d{4}-\d{2}-\d{2}/) ||
        val.match(/\d{2}\/\d{2}\/\d{4}/) ||
        val.match(/\d{1,2}\/\d{1,2}\/\d{4}/)
      ));

      if (hasValidDate) {
        validCount++;
        console.log(`✅ Linha ${i + 1} tem data válida`);
      } else {
        invalidCount++;
        console.log(`❌ Linha ${i + 1} não tem data válida`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          totalLines: lines.length,
          dataLines: dataLines.length,
          header: header,
          sampleValidCount: validCount,
          sampleInvalidCount: invalidCount,
          firstDataLine: dataLines.length > 0 ? dataLines[0].split(',').slice(0, 8) : null
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na análise:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});