-- ============================================================================
-- VERIFICATION REQUESTS TABLE
-- ============================================================================
-- Stores verification requests from users
-- ============================================================================

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Request details
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  profile_completion INTEGER NOT NULL, -- Profile completion at time of request
  
  -- Admin action
  reviewed_by UUID REFERENCES users(id), -- Admin who reviewed
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT, -- Optional notes from admin
  
  -- Verification badge if approved
  verification_badge VARCHAR(50), -- 'basic', 'pro', 'expert'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_requests_profile ON verification_requests(profile_id);
CREATE INDEX idx_verification_requests_user ON verification_requests(user_id);
CREATE INDEX idx_verification_requests_status ON verification_requests(status);
CREATE INDEX idx_verification_requests_pending ON verification_requests(status, created_at) WHERE status = 'pending';






