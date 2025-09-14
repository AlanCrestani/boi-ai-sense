-- Create storage policies for csv-processed folders

-- Allow authenticated users to insert files in csv-processed folders
CREATE POLICY "Users can upload to csv-processed folders" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'csv-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'csv-processed'
  AND (storage.foldername(name))[2] IN ('01', '02', '03', '04', '05')
);

-- Allow authenticated users to view files in csv-processed folders
CREATE POLICY "Users can view csv-processed files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'csv-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'csv-processed'
);

-- Allow authenticated users to delete files from original csv-uploads folders (for moving)
CREATE POLICY "Users can delete CSV files after processing" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'csv-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN ('01', '02', '03', '04', '05')
);