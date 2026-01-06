-- ============================================================================
-- OTP VERIFICATION TABLE
-- ============================================================================
-- Stores OTP codes for email and phone verification
-- ============================================================================

CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Type of verification
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'phone')),
  
  -- Identifier (email address or phone number)
  identifier VARCHAR(255) NOT NULL,
  
  -- OTP code (6 digits)
  otp_code VARCHAR(10) NOT NULL,
  
  -- Expiry
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Verification tracking
  attempts INTEGER DEFAULT 0,
  is_used BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_otp_user_type ON otp_verifications(user_id, type);
CREATE INDEX idx_otp_identifier ON otp_verifications(identifier);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);
CREATE INDEX idx_otp_unused ON otp_verifications(user_id, type, is_used) WHERE is_used = false;

-- ============================================================================
-- UPDATE PROFILES TABLE - Add missing fields
-- ============================================================================

-- Add alternate phone number if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'alternate_phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN alternate_phone VARCHAR(20);
  END IF;
END $$;

-- Add current company if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'current_company'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_company VARCHAR(200);
  END IF;
END $$;

-- Add resume URL if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN resume_url TEXT;
  END IF;
END $$;

-- Add total experience years if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'total_experience_years'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_experience_years INTEGER;
  END IF;
END $$;

-- Add RPA experience years if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'rpa_experience_years'
  ) THEN
    ALTER TABLE profiles ADD COLUMN rpa_experience_years INTEGER;
  END IF;
END $$;


