-- ============================================================================
-- DATABASE CLEANUP SCRIPT
-- ============================================================================
-- WARNING: This will DELETE ALL DATA from your database!
-- Use with caution. This script keeps the schema structure intact.
-- ============================================================================

-- Disable foreign key checks temporarily (PostgreSQL doesn't have this, but we'll use CASCADE)
-- We'll delete in the correct order to respect foreign keys

-- ============================================================================
-- OPTION 1: TRUNCATE ALL TABLES (Keeps schema, faster, resets sequences)
-- ============================================================================
-- This is the RECOMMENDED approach for cleaning data while keeping structure

BEGIN;

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Delete in reverse dependency order (child tables first, then parent tables)
-- This ensures foreign key constraints are respected

-- Delete from all tables with CASCADE to handle dependencies
-- Tables are listed in reverse dependency order (child tables first)
TRUNCATE TABLE 
  -- Activity and Saved Items
  activity_log,
  saved_items,
  
  -- Notifications and Messages
  notifications,
  messages,
  conversation_participants,
  conversations,
  
  -- Reviews
  reviews,
  
  -- Invoices and Contracts
  invoices,
  contracts,
  
  -- Training
  training_proposals,
  training_enrollments,
  training_requests,
  training_programs,
  
  -- Applications
  job_applications,
  project_applications,
  
  -- Projects and Jobs
  jobs,
  projects,
  
  -- Portfolio and Experience
  user_portfolio,
  user_education,
  user_experience,
  user_certifications,
  user_skills,
  user_platforms,
  
  -- Specialized Profiles (delete before main profiles)
  employer_profiles,
  client_profiles,
  ba_pm_profiles,
  trainer_profiles,
  job_seeker_profiles,
  freelancer_profiles,
  
  -- Main Profiles (delete before users)
  profiles,
  
  -- Users (delete last)
  users
  
  -- Taxonomy (optional - usually you want to keep this)
  -- Uncomment if you want to clean taxonomy too:
  -- certifications,
  -- skills,
  -- skill_categories,
  -- rpa_platforms
  
CASCADE;

-- Re-enable triggers
SET session_replication_role = 'origin';

COMMIT;

-- ============================================================================
-- OPTION 2: DROP ALL TABLES (Removes schema completely)
-- ============================================================================
-- Uncomment below if you want to completely remove all tables
-- WARNING: You'll need to run schema.sql again after this!

/*
BEGIN;

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS 
  activity_log CASCADE,
  saved_items CASCADE,
  notifications CASCADE,
  messages CASCADE,
  conversation_participants CASCADE,
  conversations CASCADE,
  reviews CASCADE,
  invoices CASCADE,
  contracts CASCADE,
  training_proposals CASCADE,
  training_enrollments CASCADE,
  training_requests CASCADE,
  training_programs CASCADE,
  job_applications CASCADE,
  project_applications CASCADE,
  jobs CASCADE,
  projects CASCADE,
  user_portfolio CASCADE,
  user_education CASCADE,
  user_experience CASCADE,
  user_certifications CASCADE,
  user_skills CASCADE,
  user_platforms CASCADE,
  employer_profiles CASCADE,
  client_profiles CASCADE,
  ba_pm_profiles CASCADE,
  trainer_profiles CASCADE,
  job_seeker_profiles CASCADE,
  freelancer_profiles CASCADE,
  profiles CASCADE,
  users CASCADE,
  certifications CASCADE,
  skills CASCADE,
  skill_categories CASCADE,
  rpa_platforms CASCADE;

-- Drop extensions if needed
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
-- DROP EXTENSION IF EXISTS "pg_trgm" CASCADE;

COMMIT;
*/

-- ============================================================================
-- VERIFICATION: Check if tables are empty
-- ============================================================================
-- Run these queries to verify cleanup:

-- SELECT 'users' as table_name, COUNT(*) as row_count FROM users
-- UNION ALL
-- SELECT 'profiles', COUNT(*) FROM profiles
-- UNION ALL
-- SELECT 'freelancer_profiles', COUNT(*) FROM freelancer_profiles
-- UNION ALL
-- SELECT 'projects', COUNT(*) FROM projects
-- UNION ALL
-- SELECT 'jobs', COUNT(*) FROM jobs;

