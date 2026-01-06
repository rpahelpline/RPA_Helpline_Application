 -- ============================================================================
-- TEST USERS CREATION SCRIPT
-- ============================================================================
-- Password for all test users: password123
-- ============================================================================

BEGIN;

-- ============================================================================
-- User: John Freelancer (freelancer)
-- Email: freelancer@test.com
-- Password: password123
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'freelancer@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543210',
    true,
    false,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'John Freelancer',
    'John',
    'freelancer',
    'Senior RPA Developer | UiPath Expert',
    'Experienced RPA developer with 5+ years in automation. Specialized in UiPath and Automation Anywhere.',
    'Mumbai',
    'India',
    false,
    true,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO freelancer_profiles (profile_id, title, experience_years, experience_level, hourly_rate_min, hourly_rate_max, currency, availability_status, hours_per_week, preferred_project_duration, remote_only, completed_projects, average_rating, total_reviews)
SELECT profile_id, 'Senior UiPath Developer', 5, 'senior', 50, 80, 'USD', 'available', 40, 'both', true, 25, 4.8, 18
FROM new_profile;

-- ============================================================================
-- User: Sarah JobSeeker (job_seeker)
-- Email: jobseeker@test.com
-- Password: password123
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'jobseeker@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543211',
    true,
    false,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'Sarah JobSeeker',
    'Sarah',
    'job_seeker',
    'RPA Developer Seeking Full-Time Opportunities',
    'Passionate RPA developer looking for full-time opportunities. Strong background in Blue Prism and Power Automate.',
    'Bangalore',
    'India',
    false,
    true,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO job_seeker_profiles (profile_id, current_title, experience_years, experience_level, currently_employed, current_company, notice_period_days, job_types, remote_preference, expected_salary_min, expected_salary_max, salary_currency, salary_period, actively_looking)
SELECT profile_id, 'RPA Developer', 3, 'mid', true, 'Tech Corp', 30, ARRAY['full_time'], 'hybrid', 800000, 1200000, 'INR', 'yearly', true
FROM new_profile;

-- ============================================================================
-- User: Dr. Michael Trainer (trainer)
-- Email: trainer@test.com
-- Password: password123
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'trainer@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543212',
    true,
    false,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'Dr. Michael Trainer',
    'Dr.',
    'trainer',
    'RPA Training Expert | Certified Instructor',
    'Professional RPA trainer with 10+ years of experience. Certified in UiPath, Automation Anywhere, and Blue Prism.',
    'Delhi',
    'India',
    false,
    true,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO trainer_profiles (profile_id, training_experience_years, total_students_trained, offers_online, offers_in_person, offers_corporate, teaching_languages, hourly_rate, course_rate_min, course_rate_max, currency, availability_status, max_students_per_batch, average_rating, total_reviews, completion_rate)
SELECT profile_id, 10, 500, true, true, true, ARRAY['English', 'Hindi'], 100, 5000, 15000, 'USD', 'available', 20, 4.9, 150, 85.5
FROM new_profile;

-- ============================================================================
-- User: Alex BA/PM (ba_pm)
-- Email: bapm@test.com
-- Password: password123
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'bapm@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543213',
    true,
    false,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'Alex BA/PM',
    'Alex',
    'ba_pm',
    'RPA Business Analyst & Project Manager',
    'Strategic RPA consultant with expertise in process analysis, automation strategy, and project management.',
    'Pune',
    'India',
    false,
    true,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO ba_pm_profiles (profile_id, primary_role, experience_years, experience_level, methodologies, projects_delivered, teams_managed_size, average_rating, total_reviews)
SELECT profile_id, 'both', 7, 'senior', ARRAY['agile', 'scrum', 'waterfall'], 35, 15, 4.7, 25
FROM new_profile;

-- ============================================================================
-- User: David Developer (ba_pm)
-- Email: developer@test.com
-- Password: password123
-- Note: Using 'ba_pm' as user_type since 'developer' is not a valid user_type in the schema
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'developer@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543214',
    true,
    false,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'David Developer',
    'David',
    'ba_pm',
    'RPA Developer & Solution Architect',
    'Full-stack RPA developer with expertise in multiple platforms. Can handle end-to-end automation projects.',
    'Hyderabad',
    'India',
    false,
    true,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO ba_pm_profiles (profile_id, primary_role, experience_years, experience_level, methodologies, projects_delivered, teams_managed_size, average_rating, total_reviews)
SELECT profile_id, 'both', 6, 'senior', ARRAY['agile'], 28, 8, 4.6, 20
FROM new_profile;

-- ============================================================================
-- User: Emma Client (client)
-- Email: client@test.com
-- Password: password123
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'client@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543215',
    true,
    false,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'Emma Client',
    'Emma',
    'client',
    'Tech Startup Founder | Hiring RPA Talent',
    'Looking for talented RPA developers to help automate our business processes.',
    'Chennai',
    'India',
    false,
    false,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO client_profiles (profile_id, company_name, company_website, company_size, industry, company_verified, payment_verified, total_projects_posted, total_spent, average_rating, total_reviews)
SELECT profile_id, 'InnovateTech Solutions', 'https://innovatetech.example.com', '51-200', 'Technology', true, true, 12, 150000, 4.9, 10
FROM new_profile;

-- ============================================================================
-- User: Robert Employer (employer)
-- Email: employer@test.com
-- Password: password123
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'employer@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543216',
    true,
    false,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'Robert Employer',
    'Robert',
    'employer',
    'HR Manager | Hiring RPA Professionals',
    'Recruiting RPA professionals for our growing automation team.',
    'Gurgaon',
    'India',
    false,
    false,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO employer_profiles (profile_id, company_name, company_website, company_size, industry, company_verified, total_jobs_posted, total_hires, employer_rating, total_reviews)
SELECT profile_id, 'Enterprise Automation Inc', 'https://enterpriseauto.example.com', '501-1000', 'Financial Services', true, 8, 15, 4.8, 12
FROM new_profile;

-- ============================================================================
-- User: Admin User (freelancer)
-- Email: admin@test.com
-- Password: password123
-- ============================================================================

WITH new_user AS (
  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)
  VALUES (
    gen_random_uuid(),
    'admin@test.com',
    '$2a$12$jcZs9dmBgRYuMo.ZvcPYMuuCRx5oRUhD/pFUEIOsEaCOaDLt4306C',
    true,
    NOW(),
    '+91-9876543217',
    true,
    true,
    NOW()
  )
  RETURNING id AS user_id
),
new_profile AS (
  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)
  SELECT
    gen_random_uuid(),
    user_id,
    'Admin User',
    'Admin',
    'freelancer',
    'System Administrator',
    'Platform administrator with full access to all features.',
    'Mumbai',
    'India',
    true,
    true,
    85,
    NOW()
  FROM new_user
  RETURNING id AS profile_id
)
INSERT INTO freelancer_profiles (profile_id, title, experience_years, experience_level, hourly_rate_min, hourly_rate_max, availability_status)
SELECT profile_id, 'System Admin', 10, 'architect', 0, 0, 'not_available'
FROM new_profile;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify users were created:
--
-- SELECT u.email, u.is_admin, p.full_name, p.user_type FROM users u JOIN profiles p ON p.user_id = u.id ORDER BY p.user_type;
--
-- ============================================================================