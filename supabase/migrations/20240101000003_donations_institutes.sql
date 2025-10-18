-- Create Institutes Table
CREATE TABLE IF NOT EXISTS institutes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('institute', 'non_profit', 'charity', 'hospital', 'clinic')),
  address TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Donations Table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  institute_id UUID NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  donation_type TEXT NOT NULL CHECK (donation_type IN ('general', 'specific_patient')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'approved', 'rejected')),
  payment_method TEXT,
  transaction_id TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_institute_id ON donations(institute_id);
CREATE INDEX IF NOT EXISTS idx_donations_candidate_id ON donations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_institutes_type ON institutes(type);
CREATE INDEX IF NOT EXISTS idx_institutes_is_active ON institutes(is_active);

-- Enable RLS on new tables
ALTER TABLE institutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Institutes
CREATE POLICY "Anyone can view active institutes" ON institutes
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can view all institutes" ON institutes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

-- RLS Policies for Donations
CREATE POLICY "Users can view own donations" ON donations
  FOR SELECT USING (auth.uid() = donor_id);

CREATE POLICY "Users can create donations" ON donations
  FOR INSERT WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admins can view donations for their institute" ON donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM institute_admins 
      WHERE user_id = auth.uid() 
      AND institute_id = donations.institute_id
    )
  );

CREATE POLICY "Admins can update donations for their institute" ON donations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM institute_admins 
      WHERE user_id = auth.uid() 
      AND institute_id = donations.institute_id
    )
  );

-- Insert some sample institutes for testing
INSERT INTO institutes (id, name, description, type, address, phone, email, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Sunrise Care Center', 'A comprehensive care facility for elderly patients', 'institute', '123 Main St, City, State', '+1-555-0123', 'info@sunrisecare.com', TRUE),
  ('550e8400-e29b-41d4-a716-446655440002', 'Hope Medical Foundation', 'Non-profit organization providing medical care', 'non_profit', '456 Health Ave, City, State', '+1-555-0456', 'contact@hopemedical.org', TRUE),
  ('550e8400-e29b-41d4-a716-446655440003', 'Community Health Clinic', 'Local clinic serving the community', 'clinic', '789 Community Blvd, City, State', '+1-555-0789', 'hello@communityhealth.org', TRUE)
ON CONFLICT (id) DO NOTHING;
