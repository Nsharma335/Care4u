-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for prescriptions bucket
CREATE POLICY "Users can upload prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view prescriptions"
ON storage.objects FOR SELECT
USING (bucket_id = 'prescriptions');

CREATE POLICY "Users can update own prescriptions"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'prescriptions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own prescriptions"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'prescriptions' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

