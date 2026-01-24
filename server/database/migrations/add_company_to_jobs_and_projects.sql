-- ============================================================================
-- Add company details to jobs and projects
-- Optional fields for posting-level company info (override/supplement profile).
-- Idempotent: safe to run multiple times.
-- ============================================================================

-- Jobs: company details
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE jobs ADD COLUMN company_name VARCHAR(200);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'company_website'
  ) THEN
    ALTER TABLE jobs ADD COLUMN company_website TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'company_description'
  ) THEN
    ALTER TABLE jobs ADD COLUMN company_description TEXT;
  END IF;
END $$;

-- Projects: company details
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE projects ADD COLUMN company_name VARCHAR(200);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'company_website'
  ) THEN
    ALTER TABLE projects ADD COLUMN company_website TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'company_description'
  ) THEN
    ALTER TABLE projects ADD COLUMN company_description TEXT;
  END IF;
END $$;
