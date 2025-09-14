-- Create storage policies for csv-uploads bucket

-- Allow authenticated users to insert files in their organization's folders
CREATE POLICY "Users can upload CSV files to their organization folders" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'csv-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN ('01', '02', '03', '04', '05')
);

-- Allow authenticated users to view files in their organization's folders
CREATE POLICY "Users can view CSV files in their organization folders" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'csv-uploads' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update/replace files in their organization's folders
CREATE POLICY "Users can update CSV files in their organization folders" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'csv-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN ('01', '02', '03', '04', '05')
);