-- ============================================================================
-- Support Submissions Table
-- ============================================================================
-- Stores customer support inquiries and feedback from users

CREATE TABLE IF NOT EXISTS support_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  
  -- Submission Content
  subject VARCHAR(255),
  message TEXT NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  
  -- Admin Notes (internal)
  admin_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_support_submissions_status ON support_submissions(status);
CREATE INDEX IF NOT EXISTS idx_support_submissions_email ON support_submissions(email);
CREATE INDEX IF NOT EXISTS idx_support_submissions_created ON support_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_submissions_resolved_by ON support_submissions(resolved_by);

