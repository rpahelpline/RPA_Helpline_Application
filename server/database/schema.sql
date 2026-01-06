-- ============================================================================
-- RPA HELPLINE - COMPREHENSIVE DATABASE SCHEMA
-- ============================================================================
-- Supports: Freelancers, Job Seekers, Trainers, BA/PM, Clients, Employers
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- SECTION 1: CORE TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1.1 USERS TABLE (Base authentication)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Nullable to support OAuth users (Google, etc.)
  email_verified BOOLEAN DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  phone VARCHAR(20),
  phone_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip VARCHAR(45),
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ---------------------------------------------------------------------------
-- 1.2 USER PROFILES TABLE (Common profile info)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Basic Info
  full_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  cover_image_url TEXT,
  
  -- User Type (determines which specialized profile they have)
  user_type VARCHAR(30) NOT NULL CHECK (user_type IN (
    'freelancer',      -- RPA Freelancer/Developer for hire
    'job_seeker',      -- Looking for RPA jobs
    'trainer',         -- Provides RPA training
    'ba_pm',           -- Business Analyst / Project Manager
    'client',          -- Hires freelancers for projects
    'employer'         -- Posts full-time job listings
  )),
  
  -- Location
  country VARCHAR(100),
  state VARCHAR(100),
  city VARCHAR(100),
  timezone VARCHAR(50),
  
  -- Contact (public)
  public_email VARCHAR(255),
  website_url TEXT,
  linkedin_url TEXT,
  
  -- Bio
  headline VARCHAR(200),
  bio TEXT,
  
  -- Profile Status
  profile_completion INTEGER DEFAULT 0, -- Percentage
  is_profile_public BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  
  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_badge VARCHAR(50), -- 'basic', 'pro', 'expert'
  
  -- Stats
  profile_views INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(country, city);
CREATE INDEX IF NOT EXISTS idx_profiles_available ON profiles(is_available);

-- ============================================================================
-- SECTION 2: RPA TECHNOLOGY & SKILLS TAXONOMY
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 2.1 RPA PLATFORMS (UiPath, AA, Blue Prism, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rpa_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  description TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default platforms
INSERT INTO rpa_platforms (name, slug, display_order) VALUES
  ('UiPath', 'uipath', 1),
  ('Automation Anywhere', 'automation-anywhere', 2),
  ('Blue Prism', 'blue-prism', 3),
  ('Microsoft Power Automate', 'power-automate', 4),
  ('WorkFusion', 'workfusion', 5),
  ('Pega', 'pega', 6),
  ('NICE', 'nice', 7),
  ('Kofax', 'kofax', 8),
  ('Appian', 'appian', 9),
  ('Nintex', 'nintex', 10),
  ('SAP Intelligent RPA', 'sap-irpa', 11),
  ('IBM RPA', 'ibm-rpa', 12)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2.2 SKILL CATEGORIES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skill_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES skill_categories(id),
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert skill categories
INSERT INTO skill_categories (name, slug, display_order) VALUES
  ('RPA Development', 'rpa-development', 1),
  ('Process Analysis', 'process-analysis', 2),
  ('AI/ML Integration', 'ai-ml-integration', 3),
  ('Testing & QA', 'testing-qa', 4),
  ('Infrastructure', 'infrastructure', 5),
  ('Business Analysis', 'business-analysis', 6),
  ('Project Management', 'project-management', 7),
  ('Training & Enablement', 'training-enablement', 8)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2.3 SKILLS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES skill_categories(id),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common RPA skills
INSERT INTO skills (name, slug, category_id) VALUES
  -- RPA Development
  ('RE Framework', 're-framework', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  ('Orchestrator', 'orchestrator', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  ('Bot Development', 'bot-development', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  ('API Integration', 'api-integration', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  ('Web Scraping', 'web-scraping', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  ('Excel Automation', 'excel-automation', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  ('SAP Automation', 'sap-automation', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  ('Citrix Automation', 'citrix-automation', (SELECT id FROM skill_categories WHERE slug = 'rpa-development')),
  
  -- AI/ML
  ('Document Understanding', 'document-understanding', (SELECT id FROM skill_categories WHERE slug = 'ai-ml-integration')),
  ('IQ Bot', 'iq-bot', (SELECT id FROM skill_categories WHERE slug = 'ai-ml-integration')),
  ('AI Center', 'ai-center', (SELECT id FROM skill_categories WHERE slug = 'ai-ml-integration')),
  ('Machine Learning', 'machine-learning', (SELECT id FROM skill_categories WHERE slug = 'ai-ml-integration')),
  ('NLP', 'nlp', (SELECT id FROM skill_categories WHERE slug = 'ai-ml-integration')),
  ('Computer Vision', 'computer-vision', (SELECT id FROM skill_categories WHERE slug = 'ai-ml-integration')),
  
  -- Business Analysis
  ('Process Mapping', 'process-mapping', (SELECT id FROM skill_categories WHERE slug = 'business-analysis')),
  ('Requirements Gathering', 'requirements-gathering', (SELECT id FROM skill_categories WHERE slug = 'business-analysis')),
  ('PDD/SDD Documentation', 'pdd-sdd-documentation', (SELECT id FROM skill_categories WHERE slug = 'business-analysis')),
  ('ROI Analysis', 'roi-analysis', (SELECT id FROM skill_categories WHERE slug = 'business-analysis')),
  
  -- Project Management
  ('Agile/Scrum', 'agile-scrum', (SELECT id FROM skill_categories WHERE slug = 'project-management')),
  ('COE Setup', 'coe-setup', (SELECT id FROM skill_categories WHERE slug = 'project-management')),
  ('Stakeholder Management', 'stakeholder-management', (SELECT id FROM skill_categories WHERE slug = 'project-management')),
  ('Risk Management', 'risk-management', (SELECT id FROM skill_categories WHERE slug = 'project-management'))
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2.4 CERTIFICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_id UUID REFERENCES rpa_platforms(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  level VARCHAR(50), -- 'associate', 'professional', 'expert', 'master'
  description TEXT,
  verification_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert common certifications
INSERT INTO certifications (name, slug, level, platform_id) VALUES
  ('UiPath Certified RPA Associate', 'uipath-rpa-associate', 'associate', (SELECT id FROM rpa_platforms WHERE slug = 'uipath')),
  ('UiPath Certified Advanced RPA Developer', 'uipath-advanced-developer', 'professional', (SELECT id FROM rpa_platforms WHERE slug = 'uipath')),
  ('UiPath Certified Solution Architect', 'uipath-solution-architect', 'expert', (SELECT id FROM rpa_platforms WHERE slug = 'uipath')),
  ('Automation Anywhere Certified Advanced RPA Professional', 'aa-advanced-professional', 'professional', (SELECT id FROM rpa_platforms WHERE slug = 'automation-anywhere')),
  ('Automation Anywhere Certified Master RPA Professional', 'aa-master-professional', 'master', (SELECT id FROM rpa_platforms WHERE slug = 'automation-anywhere')),
  ('Blue Prism Developer', 'blue-prism-developer', 'professional', (SELECT id FROM rpa_platforms WHERE slug = 'blue-prism')),
  ('Blue Prism Solution Designer', 'blue-prism-solution-designer', 'expert', (SELECT id FROM rpa_platforms WHERE slug = 'blue-prism')),
  ('Microsoft Power Automate RPA Developer', 'power-automate-developer', 'professional', (SELECT id FROM rpa_platforms WHERE slug = 'power-automate'))
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SECTION 3: SPECIALIZED PROFILE TABLES
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 3.1 FREELANCER PROFILES (RPA Developers for hire)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Professional Info
  title VARCHAR(200), -- "Senior UiPath Developer", "RPA Solution Architect"
  experience_years INTEGER DEFAULT 0,
  experience_level VARCHAR(30) CHECK (experience_level IN ('entry', 'junior', 'mid', 'senior', 'lead', 'architect')),
  
  -- Rates
  hourly_rate_min DECIMAL(10, 2),
  hourly_rate_max DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  rate_negotiable BOOLEAN DEFAULT true,
  
  -- Availability
  availability_status VARCHAR(30) DEFAULT 'available' CHECK (availability_status IN (
    'available',           -- Open to new projects
    'partially_available', -- Has some capacity
    'busy',               -- Currently busy but can be contacted
    'not_available'       -- Not taking projects
  )),
  hours_per_week INTEGER, -- Available hours per week
  preferred_project_duration VARCHAR(50), -- 'short_term', 'long_term', 'both'
  
  -- Work Preferences
  remote_only BOOLEAN DEFAULT false,
  willing_to_relocate BOOLEAN DEFAULT false,
  preferred_contract_type VARCHAR(30)[], -- ['hourly', 'fixed', 'retainer']
  
  -- Portfolio
  portfolio_url TEXT,
  github_url TEXT,
  
  -- Stats
  completed_projects INTEGER DEFAULT 0,
  total_hours_worked INTEGER DEFAULT 0,
  repeat_client_rate DECIMAL(5, 2) DEFAULT 0, -- Percentage
  
  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- Response
  response_time_hours INTEGER, -- Average response time
  response_rate DECIMAL(5, 2), -- Percentage
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_freelancer_profile ON freelancer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_rate ON freelancer_profiles(hourly_rate_min, hourly_rate_max);
CREATE INDEX IF NOT EXISTS idx_freelancer_availability ON freelancer_profiles(availability_status);
CREATE INDEX IF NOT EXISTS idx_freelancer_rating ON freelancer_profiles(average_rating DESC);

-- ---------------------------------------------------------------------------
-- 3.2 JOB SEEKER PROFILES (Looking for RPA employment)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_seeker_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Professional Info
  current_title VARCHAR(200),
  experience_years INTEGER DEFAULT 0,
  experience_level VARCHAR(30),
  
  -- Current Employment
  currently_employed BOOLEAN DEFAULT false,
  current_company VARCHAR(200),
  notice_period_days INTEGER,
  
  -- Job Preferences
  job_types VARCHAR(30)[] DEFAULT '{}', -- ['full_time', 'part_time', 'contract', 'internship']
  preferred_locations TEXT[], -- Cities/Countries
  remote_preference VARCHAR(30) CHECK (remote_preference IN ('remote_only', 'hybrid', 'onsite', 'flexible')),
  willing_to_relocate BOOLEAN DEFAULT false,
  relocation_locations TEXT[],
  
  -- Salary Expectations
  expected_salary_min DECIMAL(12, 2),
  expected_salary_max DECIMAL(12, 2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  salary_period VARCHAR(20) DEFAULT 'yearly', -- 'hourly', 'monthly', 'yearly'
  
  -- Availability
  available_from DATE,
  actively_looking BOOLEAN DEFAULT true,
  
  -- Resume
  resume_url TEXT,
  resume_updated_at TIMESTAMP WITH TIME ZONE,
  
  -- Job Search Stats
  applications_count INTEGER DEFAULT 0,
  interviews_count INTEGER DEFAULT 0,
  profile_views_by_employers INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_seeker_profile ON job_seeker_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_job_seeker_active ON job_seeker_profiles(actively_looking);
CREATE INDEX IF NOT EXISTS idx_job_seeker_salary ON job_seeker_profiles(expected_salary_min, expected_salary_max);

-- ---------------------------------------------------------------------------
-- 3.3 TRAINER PROFILES (RPA Training providers)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trainer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Professional Info
  training_experience_years INTEGER DEFAULT 0,
  total_students_trained INTEGER DEFAULT 0,
  
  -- Training Formats
  offers_online BOOLEAN DEFAULT true,
  offers_in_person BOOLEAN DEFAULT false,
  offers_corporate BOOLEAN DEFAULT false,
  offers_one_on_one BOOLEAN DEFAULT true,
  offers_group BOOLEAN DEFAULT true,
  
  -- Languages
  teaching_languages VARCHAR(50)[] DEFAULT '{English}',
  
  -- Rates
  hourly_rate DECIMAL(10, 2),
  course_rate_min DECIMAL(10, 2),
  course_rate_max DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Availability
  availability_status VARCHAR(30) DEFAULT 'available',
  max_students_per_batch INTEGER,
  
  -- Content
  sample_content_url TEXT,
  youtube_channel_url TEXT,
  
  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0, -- Student completion rate
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trainer_profile ON trainer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_trainer_rating ON trainer_profiles(average_rating DESC);

-- ---------------------------------------------------------------------------
-- 3.4 BA/PM PROFILES (Business Analysts & Project Managers)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ba_pm_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role Type
  primary_role VARCHAR(30) CHECK (primary_role IN ('business_analyst', 'project_manager', 'both')),
  
  -- Professional Info
  experience_years INTEGER DEFAULT 0,
  experience_level VARCHAR(30),
  
  -- Specializations
  specializations TEXT[], -- ['process_discovery', 'coe_setup', 'change_management']
  
  -- Methodologies
  methodologies TEXT[], -- ['agile', 'waterfall', 'six_sigma', 'lean']
  
  -- Domain Experience
  industries TEXT[], -- ['banking', 'healthcare', 'insurance', 'retail']
  
  -- Rates
  hourly_rate_min DECIMAL(10, 2),
  hourly_rate_max DECIMAL(10, 2),
  day_rate DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Availability
  availability_status VARCHAR(30) DEFAULT 'available',
  
  -- Portfolio
  case_studies_url TEXT,
  
  -- Stats
  projects_delivered INTEGER DEFAULT 0,
  processes_automated INTEGER DEFAULT 0,
  teams_managed_size INTEGER, -- Largest team size managed
  
  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ba_pm_profile ON ba_pm_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_ba_pm_role ON ba_pm_profiles(primary_role);

-- ---------------------------------------------------------------------------
-- 3.5 CLIENT PROFILES (Hire freelancers for projects)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Company Info
  company_name VARCHAR(200),
  company_size VARCHAR(30) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  company_type VARCHAR(50), -- 'startup', 'enterprise', 'agency', 'consulting'
  industry VARCHAR(100),
  company_website TEXT,
  company_logo_url TEXT,
  
  -- Location
  headquarters_country VARCHAR(100),
  headquarters_city VARCHAR(100),
  
  -- Hiring Preferences
  typical_project_size VARCHAR(30), -- 'small', 'medium', 'large', 'enterprise'
  preferred_engagement VARCHAR(30)[], -- ['hourly', 'fixed', 'dedicated']
  
  -- Verification
  company_verified BOOLEAN DEFAULT false,
  payment_verified BOOLEAN DEFAULT false,
  
  -- Stats
  total_projects_posted INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  total_spent DECIMAL(12, 2) DEFAULT 0,
  
  -- Ratings (how clients are rated by freelancers)
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  payment_score DECIMAL(3, 2) DEFAULT 0, -- How well they pay on time
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_profile ON client_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_client_company ON client_profiles(company_name);
CREATE INDEX IF NOT EXISTS idx_client_verified ON client_profiles(company_verified, payment_verified);

-- ---------------------------------------------------------------------------
-- 3.6 EMPLOYER PROFILES (Post full-time jobs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Company Info (similar to client but for employment)
  company_name VARCHAR(200) NOT NULL,
  company_size VARCHAR(30),
  industry VARCHAR(100),
  company_description TEXT,
  company_website TEXT,
  company_logo_url TEXT,
  
  -- Company Culture
  culture_description TEXT,
  benefits TEXT[],
  perks TEXT[],
  
  -- Locations
  office_locations JSONB, -- [{city, country, is_headquarters}]
  
  -- Verification
  company_verified BOOLEAN DEFAULT false,
  
  -- Social
  linkedin_url TEXT,
  glassdoor_url TEXT,
  
  -- Stats
  total_jobs_posted INTEGER DEFAULT 0,
  total_hires INTEGER DEFAULT 0,
  active_employees INTEGER,
  
  -- Ratings
  employer_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employer_profile ON employer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_employer_company ON employer_profiles(company_name);

-- ============================================================================
-- SECTION 4: PROFILE SKILLS & CERTIFICATIONS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 4.1 USER PLATFORM EXPERTISE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_platforms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  platform_id UUID NOT NULL REFERENCES rpa_platforms(id),
  proficiency_level VARCHAR(30) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, platform_id)
);

CREATE INDEX IF NOT EXISTS idx_user_platforms_profile ON user_platforms(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_platforms_platform ON user_platforms(platform_id);

-- ---------------------------------------------------------------------------
-- 4.2 USER SKILLS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id),
  proficiency_level VARCHAR(30) CHECK (proficiency_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  endorsement_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_user_skills_profile ON user_skills(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(skill_id);

-- ---------------------------------------------------------------------------
-- 4.3 USER CERTIFICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certification_id UUID REFERENCES certifications(id),
  custom_certification_name VARCHAR(200), -- For certs not in our list
  issuing_organization VARCHAR(200),
  credential_id VARCHAR(200),
  credential_url TEXT,
  issued_date DATE,
  expiry_date DATE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_certs_profile ON user_certifications(profile_id);

-- ---------------------------------------------------------------------------
-- 4.4 USER WORK EXPERIENCE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_experience (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  company_name VARCHAR(200) NOT NULL,
  company_url TEXT,
  location VARCHAR(200),
  
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if current
  is_current BOOLEAN DEFAULT false,
  
  description TEXT,
  achievements TEXT[],
  technologies_used TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_exp_profile ON user_experience(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_exp_dates ON user_experience(start_date, end_date);

-- ---------------------------------------------------------------------------
-- 4.5 USER EDUCATION
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_education (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  institution VARCHAR(200) NOT NULL,
  degree VARCHAR(200),
  field_of_study VARCHAR(200),
  
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  
  grade VARCHAR(50),
  activities TEXT,
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_edu_profile ON user_education(profile_id);

-- ---------------------------------------------------------------------------
-- 4.6 USER PORTFOLIO ITEMS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_portfolio (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  project_type VARCHAR(50), -- 'automation', 'integration', 'consulting', 'training'
  
  -- Links
  project_url TEXT,
  demo_url TEXT,
  github_url TEXT,
  
  -- Media
  thumbnail_url TEXT,
  images TEXT[],
  video_url TEXT,
  
  -- Details
  client_name VARCHAR(200),
  is_client_confidential BOOLEAN DEFAULT false,
  completion_date DATE,
  duration_months INTEGER,
  
  -- Technologies
  platforms_used UUID[], -- References rpa_platforms
  skills_used UUID[], -- References skills
  
  -- Results
  key_results TEXT[],
  
  -- Visibility
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_profile ON user_portfolio(profile_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON user_portfolio(is_featured);

-- ============================================================================
-- SECTION 5: OPPORTUNITIES (Projects, Jobs, Training)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 5.1 PROJECTS (Freelance opportunities)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Type & Category
  project_type VARCHAR(50) CHECK (project_type IN (
    'new_automation',
    'maintenance',
    'migration',
    'consulting',
    'training',
    'poc',
    'coe_setup',
    'other'
  )),
  
  -- Requirements
  required_platforms UUID[], -- References rpa_platforms
  required_skills UUID[], -- References skills
  experience_level VARCHAR(30) CHECK (experience_level IN ('any', 'junior', 'mid', 'senior', 'expert')),
  
  -- Scope
  estimated_duration VARCHAR(50), -- '1-2 weeks', '1-3 months', etc.
  estimated_hours INTEGER,
  
  -- Budget
  budget_type VARCHAR(20) CHECK (budget_type IN ('hourly', 'fixed', 'negotiable')),
  budget_min DECIMAL(12, 2),
  budget_max DECIMAL(12, 2),
  budget_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Timeline
  start_date DATE,
  deadline DATE,
  urgency VARCHAR(20) DEFAULT 'normal' CHECK (urgency IN ('low', 'normal', 'high', 'urgent')),
  
  -- Work Arrangement
  work_arrangement VARCHAR(30) CHECK (work_arrangement IN ('remote', 'onsite', 'hybrid')),
  location VARCHAR(200), -- Required if onsite/hybrid
  timezone_preference VARCHAR(50),
  
  -- Attachments
  attachments JSONB, -- [{name, url, type, size}]
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft',
    'open',
    'in_review',
    'in_progress',
    'completed',
    'cancelled',
    'on_hold'
  )),
  
  -- Visibility
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'invite_only')),
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  
  -- Timestamps
  published_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_urgency ON projects(urgency);
CREATE INDEX IF NOT EXISTS idx_projects_budget ON projects(budget_min, budget_max);
CREATE INDEX IF NOT EXISTS idx_projects_published ON projects(published_at DESC);

-- ---------------------------------------------------------------------------
-- 5.2 JOBS (Full-time/Part-time employment)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Job Type
  employment_type VARCHAR(30) CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship', 'freelance')),
  
  -- Experience Requirements
  experience_min INTEGER DEFAULT 0,
  experience_max INTEGER,
  experience_level VARCHAR(30),
  
  -- Requirements
  required_platforms UUID[],
  required_skills UUID[],
  required_certifications UUID[],
  preferred_qualifications TEXT,
  
  -- Compensation
  salary_min DECIMAL(12, 2),
  salary_max DECIMAL(12, 2),
  salary_currency VARCHAR(3) DEFAULT 'USD',
  salary_period VARCHAR(20) DEFAULT 'yearly' CHECK (salary_period IN ('hourly', 'monthly', 'yearly')),
  show_salary BOOLEAN DEFAULT true,
  
  -- Benefits
  benefits TEXT[],
  
  -- Location
  work_arrangement VARCHAR(30) CHECK (work_arrangement IN ('remote', 'onsite', 'hybrid')),
  locations JSONB, -- [{city, country, is_primary}]
  timezone_requirements VARCHAR(100),
  visa_sponsorship BOOLEAN DEFAULT false,
  
  -- Application
  application_deadline DATE,
  external_apply_url TEXT, -- If applying externally
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paused', 'closed', 'filled')),
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  application_count INTEGER DEFAULT 0,
  
  -- Timestamps
  published_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_employer ON jobs(employer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(employment_type);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_jobs_published ON jobs(published_at DESC);

-- ---------------------------------------------------------------------------
-- 5.3 TRAINING PROGRAMS (Courses offered by trainers)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Basic Info
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  short_description VARCHAR(500),
  
  -- Category
  category VARCHAR(50) CHECK (category IN (
    'beginner',
    'intermediate', 
    'advanced',
    'certification_prep',
    'corporate',
    'bootcamp'
  )),
  
  -- Platforms & Skills covered
  platforms_covered UUID[],
  skills_covered UUID[],
  
  -- Format
  format VARCHAR(30) CHECK (format IN ('live_online', 'self_paced', 'in_person', 'hybrid', 'corporate_onsite')),
  
  -- Duration
  duration_hours INTEGER,
  duration_weeks INTEGER,
  sessions_count INTEGER,
  
  -- Schedule (for live courses)
  schedule_info TEXT,
  start_date DATE,
  end_date DATE,
  timezone VARCHAR(50),
  
  -- Language
  language VARCHAR(50) DEFAULT 'English',
  subtitles_available TEXT[],
  
  -- Pricing
  price DECIMAL(10, 2),
  original_price DECIMAL(10, 2), -- For showing discounts
  currency VARCHAR(3) DEFAULT 'USD',
  pricing_type VARCHAR(30) CHECK (pricing_type IN ('free', 'paid', 'subscription', 'corporate')),
  
  -- Capacity
  max_students INTEGER,
  current_enrollments INTEGER DEFAULT 0,
  
  -- Content
  curriculum JSONB, -- [{module, topics, duration}]
  prerequisites TEXT,
  learning_outcomes TEXT[],
  
  -- Materials
  includes_materials BOOLEAN DEFAULT true,
  includes_certificate BOOLEAN DEFAULT true,
  includes_support BOOLEAN DEFAULT true,
  support_duration_days INTEGER,
  
  -- Media
  thumbnail_url TEXT,
  preview_video_url TEXT,
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'sold_out')),
  
  -- Ratings
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,
  
  -- Timestamps
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_trainer ON training_programs(trainer_id);
CREATE INDEX IF NOT EXISTS idx_training_status ON training_programs(status);
CREATE INDEX IF NOT EXISTS idx_training_category ON training_programs(category);
CREATE INDEX IF NOT EXISTS idx_training_format ON training_programs(format);
CREATE INDEX IF NOT EXISTS idx_training_price ON training_programs(price);
CREATE INDEX IF NOT EXISTS idx_training_rating ON training_programs(average_rating DESC);

-- ---------------------------------------------------------------------------
-- 5.4 TRAINING REQUESTS (Companies/Individuals seeking training)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Request Type
  request_type VARCHAR(30) CHECK (request_type IN ('individual', 'corporate', 'team')),
  
  -- Training Details
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  
  -- Requirements
  platforms_needed UUID[],
  skills_needed UUID[],
  current_level VARCHAR(30) CHECK (current_level IN ('none', 'beginner', 'intermediate', 'advanced')),
  target_level VARCHAR(30),
  
  -- Participants
  num_participants INTEGER DEFAULT 1,
  participant_details TEXT,
  
  -- Format Preferences
  preferred_format VARCHAR(30)[] DEFAULT '{}',
  preferred_language VARCHAR(50) DEFAULT 'English',
  
  -- Schedule
  preferred_start_date DATE,
  flexible_dates BOOLEAN DEFAULT true,
  preferred_times TEXT,
  timezone VARCHAR(50),
  
  -- Budget
  budget_min DECIMAL(10, 2),
  budget_max DECIMAL(10, 2),
  budget_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Location (for in-person)
  location VARCHAR(200),
  
  -- Status
  status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_discussion', 'booked', 'completed', 'cancelled')),
  
  -- Stats
  proposal_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_req_requester ON training_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_training_req_status ON training_requests(status);
CREATE INDEX IF NOT EXISTS idx_training_req_type ON training_requests(request_type);

-- ============================================================================
-- SECTION 6: APPLICATIONS & MATCHING
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 6.1 PROJECT APPLICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS project_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Proposal
  cover_letter TEXT NOT NULL,
  proposed_rate DECIMAL(10, 2),
  rate_type VARCHAR(20) CHECK (rate_type IN ('hourly', 'fixed')),
  proposed_duration VARCHAR(100),
  proposed_start_date DATE,
  
  -- Attachments
  attachments JSONB,
  
  -- Questions/Answers (if client asked questions)
  answers JSONB,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'viewed',
    'shortlisted',
    'interview',
    'accepted',
    'rejected',
    'withdrawn'
  )),
  
  -- Client Actions
  viewed_at TIMESTAMP WITH TIME ZONE,
  shortlisted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Interview
  interview_scheduled_at TIMESTAMP WITH TIME ZONE,
  interview_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, freelancer_id)
);

CREATE INDEX IF NOT EXISTS idx_proj_app_project ON project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_app_freelancer ON project_applications(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_proj_app_status ON project_applications(status);

-- ---------------------------------------------------------------------------
-- 6.2 JOB APPLICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Application
  cover_letter TEXT,
  resume_url TEXT,
  resume_text TEXT, -- Parsed/uploaded resume text for search
  
  -- Salary Expectation
  expected_salary DECIMAL(12, 2),
  expected_salary_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Availability
  notice_period_days INTEGER,
  available_from DATE,
  
  -- Answers to screening questions
  screening_answers JSONB,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'reviewed',
    'phone_screen',
    'interview',
    'technical_round',
    'offer',
    'accepted',
    'rejected',
    'withdrawn'
  )),
  
  -- Tracking
  viewed_at TIMESTAMP WITH TIME ZONE,
  last_status_change TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Notes (internal for employer)
  employer_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(job_id, applicant_id)
);

CREATE INDEX IF NOT EXISTS idx_job_app_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_app_applicant ON job_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_job_app_status ON job_applications(status);

-- ---------------------------------------------------------------------------
-- 6.3 TRAINING ENROLLMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Enrollment Details
  enrollment_type VARCHAR(30) CHECK (enrollment_type IN ('individual', 'corporate', 'scholarship')),
  
  -- Payment
  amount_paid DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_status VARCHAR(30) CHECK (payment_status IN ('pending', 'paid', 'refunded', 'waived')),
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Progress
  status VARCHAR(30) DEFAULT 'enrolled' CHECK (status IN (
    'enrolled',
    'in_progress',
    'completed',
    'dropped',
    'refunded'
  )),
  progress_percentage INTEGER DEFAULT 0,
  
  -- Completion
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  certificate_url TEXT,
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  
  -- Feedback
  has_reviewed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(program_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollment_program ON training_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_student ON training_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_status ON training_enrollments(status);

-- ---------------------------------------------------------------------------
-- 6.4 TRAINING PROPOSALS (Trainers responding to requests)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS training_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES training_requests(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Proposal
  proposal_text TEXT NOT NULL,
  proposed_curriculum JSONB,
  proposed_duration VARCHAR(100),
  proposed_format VARCHAR(30),
  
  -- Pricing
  proposed_price DECIMAL(10, 2) NOT NULL,
  price_includes TEXT,
  
  -- Availability
  available_dates JSONB,
  
  -- Status
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'viewed',
    'shortlisted',
    'accepted',
    'rejected',
    'withdrawn'
  )),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(request_id, trainer_id)
);

CREATE INDEX IF NOT EXISTS idx_training_prop_request ON training_proposals(request_id);
CREATE INDEX IF NOT EXISTS idx_training_prop_trainer ON training_proposals(trainer_id);

-- ============================================================================
-- SECTION 7: CONTRACTS & PAYMENTS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 7.1 CONTRACTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type
  contract_type VARCHAR(30) CHECK (contract_type IN ('project', 'job', 'training')),
  
  -- References
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  training_program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL,
  application_id UUID, -- Reference to the accepted application
  
  -- Parties
  client_id UUID NOT NULL REFERENCES profiles(id),
  provider_id UUID NOT NULL REFERENCES profiles(id), -- freelancer/trainer
  
  -- Terms
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Payment Terms
  payment_type VARCHAR(30) CHECK (payment_type IN ('hourly', 'fixed', 'milestone')),
  rate DECIMAL(10, 2),
  total_amount DECIMAL(12, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Milestones (for fixed/milestone contracts)
  milestones JSONB, -- [{name, amount, due_date, status}]
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft',
    'pending_approval',
    'active',
    'completed',
    'cancelled',
    'disputed'
  )),
  
  -- Signatures
  client_signed_at TIMESTAMP WITH TIME ZONE,
  provider_signed_at TIMESTAMP WITH TIME ZONE,
  
  -- Completion
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contracts_client ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_provider ON contracts(provider_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(contract_type);

-- ---------------------------------------------------------------------------
-- 7.2 INVOICES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  
  -- Parties
  from_user_id UUID NOT NULL REFERENCES profiles(id),
  to_user_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Items
  line_items JSONB NOT NULL, -- [{description, quantity, rate, amount}]
  
  -- Amounts
  subtotal DECIMAL(12, 2) NOT NULL,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  tax_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Dates
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft',
    'sent',
    'viewed',
    'paid',
    'overdue',
    'cancelled',
    'refunded'
  )),
  
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_amount DECIMAL(12, 2),
  payment_method VARCHAR(50),
  
  -- Notes
  notes TEXT,
  terms TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_from ON invoices(from_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_to ON invoices(to_user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);

-- ============================================================================
-- SECTION 8: REVIEWS & RATINGS
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 8.1 REVIEWS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type
  review_type VARCHAR(30) CHECK (review_type IN (
    'project_to_freelancer',  -- Client reviews freelancer
    'project_to_client',      -- Freelancer reviews client
    'training_program',       -- Student reviews training
    'trainer',               -- Student reviews trainer
    'employer'               -- Employee reviews employer
  )),
  
  -- References
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  training_program_id UUID REFERENCES training_programs(id) ON DELETE SET NULL,
  
  -- Parties
  reviewer_id UUID NOT NULL REFERENCES profiles(id),
  reviewee_id UUID NOT NULL REFERENCES profiles(id),
  
  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  
  -- Detailed ratings (optional, based on type)
  ratings_breakdown JSONB, -- {communication: 5, quality: 4, timeliness: 5, ...}
  
  -- Content
  title VARCHAR(200),
  content TEXT NOT NULL,
  
  -- Pros/Cons
  pros TEXT[],
  cons TEXT[],
  
  -- Response
  response_text TEXT,
  response_date TIMESTAMP WITH TIME ZONE,
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false, -- Verified purchase/contract
  
  -- Helpful votes
  helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_type ON reviews(review_type);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(overall_rating);

-- ============================================================================
-- SECTION 9: MESSAGING & COMMUNICATION
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 9.1 CONVERSATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Type
  conversation_type VARCHAR(30) CHECK (conversation_type IN (
    'direct',
    'project',
    'job_application',
    'training',
    'support'
  )),
  
  -- References
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  application_id UUID,
  
  -- Subject
  subject VARCHAR(200),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  
  -- Last activity
  last_message_at TIMESTAMP WITH TIME ZONE,
  last_message_preview TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_project ON conversations(project_id);
CREATE INDEX IF NOT EXISTS idx_conversations_job ON conversations(job_id);

-- ---------------------------------------------------------------------------
-- 9.2 CONVERSATION PARTICIPANTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Role in conversation
  role VARCHAR(30) DEFAULT 'participant',
  
  -- Read status
  last_read_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  
  -- Notifications
  is_muted BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  left_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_part_conversation ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_part_user ON conversation_participants(user_id);

-- ---------------------------------------------------------------------------
-- 9.3 MESSAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Content
  content TEXT NOT NULL,
  content_type VARCHAR(30) DEFAULT 'text' CHECK (content_type IN ('text', 'file', 'image', 'system')),
  
  -- Attachments
  attachments JSONB, -- [{name, url, type, size}]
  
  -- Reply
  reply_to_id UUID REFERENCES messages(id),
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- SECTION 10: NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Type
  notification_type VARCHAR(50) NOT NULL,
  
  -- Content
  title VARCHAR(200) NOT NULL,
  content TEXT,
  
  -- Action
  action_url TEXT,
  action_text VARCHAR(100),
  
  -- References
  reference_type VARCHAR(30), -- 'project', 'job', 'message', etc.
  reference_id UUID,
  
  -- From (optional)
  from_user_id UUID REFERENCES profiles(id),
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Email
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- ============================================================================
-- SECTION 11: SAVED/FAVORITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Item type and reference
  item_type VARCHAR(30) NOT NULL CHECK (item_type IN ('project', 'job', 'training', 'freelancer', 'trainer')),
  item_id UUID NOT NULL,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_type ON saved_items(item_type, item_id);

-- ============================================================================
-- SECTION 12: ACTIVITY LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Activity
  activity_type VARCHAR(50) NOT NULL,
  description TEXT,
  
  -- Target
  target_type VARCHAR(30),
  target_id UUID,
  
  -- Metadata
  metadata JSONB,
  
  -- Context
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- ============================================================================
-- SECTION 13: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_seeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ba_pm_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 14: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name FROM information_schema.columns 
    WHERE column_name = 'updated_at' 
    AND table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- Update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update freelancer stats
  IF TG_TABLE_NAME = 'reviews' AND NEW.review_type = 'project_to_freelancer' THEN
    UPDATE freelancer_profiles
    SET 
      average_rating = (
        SELECT AVG(overall_rating) FROM reviews 
        WHERE reviewee_id = NEW.reviewee_id AND review_type = 'project_to_freelancer'
      ),
      total_reviews = (
        SELECT COUNT(*) FROM reviews 
        WHERE reviewee_id = NEW.reviewee_id AND review_type = 'project_to_freelancer'
      )
    WHERE profile_id = NEW.reviewee_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_stats_on_review ON reviews;
CREATE TRIGGER update_stats_on_review
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_profile_stats();

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
