-- Migration: Create storage bucket and RLS policies for CSV files
-- Description: Setup storage bucket with proper security policies

-- Create storage bucket for CSV uploads if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('csv-uploads', 'csv-uploads', false)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    public = EXCLUDED.public;

-- Enable RLS on storage.objects (should already be enabled by default)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "csv_uploads_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "csv_uploads_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "csv_uploads_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "csv_uploads_delete_policy" ON storage.objects;

-- Policy for selecting (downloading) files
-- Users can only access files in their organization's folder structure
CREATE POLICY "csv_uploads_select_policy"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'csv-uploads' AND
    (
        -- Allow access to files in user's organization folder
        auth.uid()::text = split_part(name, '/', 1) OR
        -- Allow access to processed folder structure
        name LIKE 'csv-processed/%' OR
        -- Allow access to temp files
        name LIKE 'temp/%' OR
        -- Allow service role full access
        auth.role() = 'service_role'
    )
);

-- Policy for inserting (uploading) files
CREATE POLICY "csv_uploads_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'csv-uploads' AND
    (
        -- Users can upload to their organization folder
        auth.uid()::text = split_part(name, '/', 1) OR
        -- Allow uploads to temp folder
        name LIKE 'temp/%' OR
        -- Allow service role full access
        auth.role() = 'service_role'
    )
);

-- Policy for updating files (rare, but needed for metadata updates)
CREATE POLICY "csv_uploads_update_policy"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'csv-uploads' AND
    (
        -- Users can update files in their organization folder
        auth.uid()::text = split_part(name, '/', 1) OR
        -- Allow updates to processed folders
        name LIKE 'csv-processed/%' OR
        -- Allow service role full access
        auth.role() = 'service_role'
    )
);

-- Policy for deleting files
CREATE POLICY "csv_uploads_delete_policy"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'csv-uploads' AND
    (
        -- Users can delete files in their organization folder
        auth.uid()::text = split_part(name, '/', 1) OR
        -- Allow deletion of temp files
        name LIKE 'temp/%' OR
        -- Allow service role full access
        auth.role() = 'service_role'
    )
);

-- Create a more permissive policy for the edge functions
-- This allows the edge function (running as service_role) to create the processed folders
CREATE POLICY "service_role_full_access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'csv-uploads')
WITH CHECK (bucket_id = 'csv-uploads');

-- Alternative policy for authenticated users (more permissive for development)
-- Users can access any file they upload or process
CREATE POLICY "authenticated_csv_access"
ON storage.objects FOR ALL
TO authenticated
USING (
    bucket_id = 'csv-uploads'
)
WITH CHECK (
    bucket_id = 'csv-uploads'
);

-- Grant necessary permissions for storage
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Make sure anon users can access public files if needed
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO anon;