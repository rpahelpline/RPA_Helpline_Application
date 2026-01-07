# Database Cleanup Guide

This guide explains how to clean your entire database safely.

## ⚠️ WARNING

**This will DELETE ALL DATA from your database!** Make sure you have backups if you need to preserve any data.

## Methods

### Method 1: Using SQL Script (Recommended for Supabase Dashboard)

1. **Open Supabase Dashboard**
   - Go to your project: https://app.supabase.com
   - Navigate to **SQL Editor**

2. **Run the cleanup script**
   - Open `server/database/clean_database.sql`
   - Copy the **OPTION 1** section (TRUNCATE)
   - Paste into SQL Editor
   - Click **Run**

3. **Verify cleanup**
   - Run the verification queries at the bottom of the script
   - All tables should show `row_count: 0`

### Method 2: Using Node.js Script

1. **Run the cleanup script**
   ```bash
   cd server
   node database/clean_database.js
   ```

2. **The script will:**
   - Clean all tables in the correct order
   - Show progress for each table
   - Verify cleanup at the end

### Method 3: Manual SQL (Supabase Dashboard)

If you prefer to do it manually:

```sql
-- Clean all data (keeps schema)
TRUNCATE TABLE 
  notifications,
  messages,
  conversations,
  project_applications,
  job_applications,
  reviews,
  projects,
  jobs,
  training_enrollments,
  training_programs,
  user_portfolio,
  user_experience,
  user_education,
  user_certifications,
  user_skills,
  user_platforms,
  employer_profiles,
  client_profiles,
  ba_pm_profiles,
  trainer_profiles,
  job_seeker_profiles,
  freelancer_profiles,
  profiles,
  users
CASCADE;
```

### Method 4: Complete Reset (Drops All Tables)

If you want to completely remove everything and start fresh:

1. **Drop all tables** (use SQL script OPTION 2)
2. **Re-run schema**
   ```bash
   # In Supabase Dashboard SQL Editor, run:
   # server/database/schema.sql
   ```

## After Cleanup

1. **Re-run schema** (if you used Method 4)
   - Run `server/database/schema.sql` in Supabase SQL Editor

2. **Restart your server**
   ```bash
   npm run dev
   ```

3. **Test registration**
   - Create a new test account
   - Verify everything works

## Notes

- **Taxonomy tables** (platforms, skills) are NOT cleaned by default
- If you want to clean taxonomy too, uncomment those lines in the script
- **Extensions** (uuid-ossp, pg_trgm) are preserved
- **Indexes and constraints** are preserved

## Troubleshooting

### Error: "relation does not exist"
- Some tables might not exist yet - this is normal
- The script will skip missing tables

### Error: "permission denied"
- Make sure you're using `SUPABASE_SERVICE_ROLE_KEY` (not anon key)
- Check your Supabase project permissions

### Foreign Key Errors
- The script handles dependencies automatically
- If you get errors, run the tables in the order listed in the script




