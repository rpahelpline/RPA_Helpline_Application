-- ============================================================================
-- Ensure resume and job-application support in DB
-- Run this if profiles.resume_url or related columns are missing.
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- Profiles: resume_url (used by profile dashboard resume upload)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'resume_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN resume_url TEXT;
  END IF;
END $$;

-- Job applications already have resume_url, employer_notes, viewed_at in schema.
-- No migration needed for job_applications unless you used an older schema.
