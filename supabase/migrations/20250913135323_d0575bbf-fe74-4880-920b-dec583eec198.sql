-- Create storage bucket for CSV files
INSERT INTO storage.buckets (id, name, public) VALUES ('csv-uploads', 'csv-uploads', false);

-- Create policies for CSV uploads
CREATE POLICY "Users can upload CSV files to their organization folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'csv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND (storage.extension(name)) = 'csv'
);

CREATE POLICY "Users can view their CSV files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'csv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their CSV files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'csv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their CSV files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'csv-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);