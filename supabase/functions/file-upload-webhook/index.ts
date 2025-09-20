import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface StorageObjectEvent {
  type: string;
  table: string;
  record: {
    id: string;
    bucket_id: string;
    name: string;
    owner: string;
    created_at: string;
    updated_at: string;
    last_accessed_at: string;
    metadata: {
      eTag: string;
      size: number;
      mimetype: string;
      cacheControl: string;
      lastModified: string;
      contentLength: number;
      httpStatusCode: number;
    };
  };
  schema: string;
  old_record: null;
}

/**
 * Extract organization_id from file path
 * Expected format: /{organization_id}/pipeline/{pipeline_id}/filename.csv
 * Or: /uploads/{organization_id}/filename.csv
 */
function extractOrganizationId(filePath: string): string | null {
  // Remove leading slash if present
  const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const parts = cleanPath.split('/');
  
  // Check if first part is a valid UUID (organization_id)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (parts.length >= 1 && uuidRegex.test(parts[0])) {
    return parts[0];
  }
  
  // Alternative: check if second part is organization_id (uploads/{org_id}/...)
  if (parts.length >= 2 && parts[0] === 'uploads' && uuidRegex.test(parts[1])) {
    return parts[1];
  }
  
  return null;
}

/**
 * Compute SHA256 checksum of file content
 */
async function computeChecksum(fileContent: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', fileContent);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Register file in etl_file table
 */
async function registerFile(
  organizationId: string,
  bucket: string,
  path: string,
  checksum: string,
  sizeBytes: number,
  mimeType: string
) {
  try {
    // First check if file already exists (idempotency)
    const { data: existing, error: checkError } = await supabase
      .from('etl_file')
      .select('file_id, status')
      .eq('organization_id', organizationId)
      .eq('storage_bucket', bucket)
      .eq('storage_path', path)
      .eq('checksum', checksum)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing file:', checkError);
      throw checkError;
    }

    if (existing) {
      console.log(`File already registered with ID: ${existing.file_id}, status: ${existing.status}`);
      return existing.file_id;
    }

    // Insert new file record
    const { data: newFile, error: insertError } = await supabase
      .from('etl_file')
      .insert({
        organization_id: organizationId,
        storage_bucket: bucket,
        storage_path: path,
        size_bytes: sizeBytes,
        checksum: checksum,
        mime_type: mimeType,
        status: 'uploaded'
      })
      .select('file_id')
      .single();

    if (insertError) {
      console.error('Error inserting file record:', insertError);
      throw insertError;
    }

    console.log(`New file registered with ID: ${newFile.file_id}`);
    return newFile.file_id;

  } catch (error) {
    console.error('Error in registerFile:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse webhook payload
    const webhookPayload: StorageObjectEvent = await req.json();
    
    console.log('Received storage webhook:', JSON.stringify(webhookPayload, null, 2));

    // Only process object.created events
    if (webhookPayload.type !== 'INSERT') {
      console.log(`Ignoring event type: ${webhookPayload.type}`);
      return new Response(JSON.stringify({ 
        message: 'Event ignored', 
        eventType: webhookPayload.type 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const record = webhookPayload.record;
    const bucket = record.bucket_id;
    const filePath = record.name;
    const sizeBytes = record.metadata?.size || record.metadata?.contentLength || 0;
    const mimeType = record.metadata?.mimetype || 'application/octet-stream';

    // Extract organization_id from file path
    const organizationId = extractOrganizationId(filePath);
    
    if (!organizationId) {
      console.log(`Could not extract organization_id from path: ${filePath}`);
      return new Response(JSON.stringify({ 
        message: 'Organization ID not found in file path',
        filePath: filePath
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Download file to compute checksum
    const { data: fileData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(filePath);

    if (downloadError) {
      console.error('Error downloading file for checksum:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Convert file to Uint8Array for checksum computation
    const fileBuffer = new Uint8Array(await fileData.arrayBuffer());
    const checksum = await computeChecksum(fileBuffer);

    console.log(`File details: bucket=${bucket}, path=${filePath}, size=${sizeBytes}, checksum=${checksum}`);

    // Register file in etl_file table
    const fileId = await registerFile(
      organizationId,
      bucket,
      filePath,
      checksum,
      sizeBytes,
      mimeType
    );

    console.log(`✅ File upload webhook processed successfully. File ID: ${fileId}`);

    return new Response(JSON.stringify({
      success: true,
      fileId: fileId,
      organizationId: organizationId,
      bucket: bucket,
      path: filePath,
      checksum: checksum,
      sizeBytes: sizeBytes,
      message: 'File registered successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing file upload webhook:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});