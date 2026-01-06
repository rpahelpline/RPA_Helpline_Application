-- ============================================================================
-- PERFORMANCE INDEXES MIGRATION
-- ============================================================================
-- These indexes significantly improve query performance for common operations
-- Run this migration in your Supabase SQL editor
-- ============================================================================

-- Jobs table indexes
-- Index for filtering by status (most common filter)
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Index for employer's job listings
CREATE INDEX IF NOT EXISTS idx_jobs_employer_id ON jobs(employer_id);

-- Index for sorting by created_at (default sort)
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Composite index for common query pattern: active jobs sorted by date
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at DESC);

-- Index for employment type filter
CREATE INDEX IF NOT EXISTS idx_jobs_employment_type ON jobs(employment_type);

-- Index for work arrangement filter (remote/onsite/hybrid)
CREATE INDEX IF NOT EXISTS idx_jobs_work_arrangement ON jobs(work_arrangement);

-- ============================================================================
-- Job Applications indexes
-- ============================================================================

-- Index for fetching all applications for a job
CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);

-- Index for fetching user's applications
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant ON job_applications(applicant_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);

-- Composite index for employer view: applications by job and status
CREATE INDEX IF NOT EXISTS idx_job_applications_job_status ON job_applications(job_id, status);

-- Index for checking duplicate applications
CREATE INDEX IF NOT EXISTS idx_job_applications_job_applicant ON job_applications(job_id, applicant_id);

-- ============================================================================
-- Profiles indexes
-- ============================================================================

-- Index for user type filter (freelancer, employer, etc.)
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Index for user_id lookup (foreign key from users table)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- Index for verification status
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);

-- Index for availability filter
CREATE INDEX IF NOT EXISTS idx_profiles_is_available ON profiles(is_available);

-- ============================================================================
-- Projects indexes
-- ============================================================================

-- Index for status filter
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Index for client's projects
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);

-- Index for sorting by created_at
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================================================
-- Project Applications indexes
-- ============================================================================

-- Index for fetching all applications for a project
CREATE INDEX IF NOT EXISTS idx_project_applications_project ON project_applications(project_id);

-- Index for fetching freelancer's applications
CREATE INDEX IF NOT EXISTS idx_project_applications_freelancer ON project_applications(freelancer_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON project_applications(status);

-- ============================================================================
-- Taxonomy indexes (platforms, skills)
-- ============================================================================

-- Index for active platforms
CREATE INDEX IF NOT EXISTS idx_rpa_platforms_active ON rpa_platforms(is_active);

-- Index for active skills
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);

-- Index for skill category (using category_id foreign key)
CREATE INDEX IF NOT EXISTS idx_skills_category_id ON skills(category_id);

-- ============================================================================
-- Users indexes
-- ============================================================================

-- Index for email lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ============================================================================
-- Verification requests indexes
-- ============================================================================

-- Index for status filter (pending requests for admin)
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- Index for profile lookup
CREATE INDEX IF NOT EXISTS idx_verification_requests_profile ON verification_requests(profile_id);

-- ============================================================================
-- Messages and Notifications indexes
-- ============================================================================

-- Index for user's notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================================================
-- ANALYZE tables to update statistics after creating indexes
-- ============================================================================

ANALYZE jobs;
ANALYZE job_applications;
ANALYZE profiles;
ANALYZE projects;
ANALYZE project_applications;
ANALYZE rpa_platforms;
ANALYZE skills;
ANALYZE users;
ANALYZE verification_requests;
ANALYZE notifications;

