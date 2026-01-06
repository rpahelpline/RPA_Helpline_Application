# Test Users Creation Guide

This directory contains scripts to create test users for all roles in the RPA Helpline application.

## Quick Start

### Option 1: Using the Node.js Script (Recommended)

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Run the script:
   ```bash
   node database/create_test_users.js
   ```

3. This will generate `create_test_users.sql` with properly hashed passwords.

4. Execute the SQL file in your database:
   ```bash
   psql -U your_username -d your_database -f database/create_test_users.sql
   ```

   Or use your database client (pgAdmin, DBeaver, etc.) to execute the SQL file.

### Option 2: Direct SQL Execution

If you prefer, you can directly execute the generated `create_test_users.sql` file in your database client.

## Test Users Created

All test users have the password: **`password123`**

| Email | Role | Name | Description |
|-------|------|------|-------------|
| `freelancer@test.com` | Freelancer | John Freelancer | Senior RPA Developer with UiPath expertise |
| `jobseeker@test.com` | Job Seeker | Sarah JobSeeker | RPA Developer seeking full-time opportunities |
| `trainer@test.com` | Trainer | Dr. Michael Trainer | RPA Training Expert with 10+ years experience |
| `bapm@test.com` | BA/PM | Alex BA/PM | Business Analyst & Project Manager |
| `developer@test.com` | Developer | David Developer | RPA Developer & Solution Architect |
| `client@test.com` | Client | Emma Client | Tech Startup Founder hiring RPA talent |
| `employer@test.com` | Employer | Robert Employer | HR Manager recruiting RPA professionals |
| `admin@test.com` | Admin | Admin User | System Administrator with full access |

## Verification

After running the script, verify the users were created:

```sql
SELECT 
  u.email, 
  u.is_admin, 
  p.full_name, 
  p.user_type,
  p.headline
FROM users u 
JOIN profiles p ON p.user_id = u.id 
ORDER BY p.user_type;
```

## Testing Features by Role

### Freelancer (`freelancer@test.com`)
- Browse and apply to projects
- Manage portfolio
- View applications
- Update profile and skills

### Job Seeker (`jobseeker@test.com`)
- Browse and apply to jobs
- Track applications
- View application timeline
- Update resume

### Trainer (`trainer@test.com`)
- Create and manage courses
- View students
- Track enrollments
- Manage training programs

### BA/PM (`bapm@test.com`)
- Browse projects
- Apply to consulting opportunities
- Manage project analytics
- View applications

### Developer (`developer@test.com`)
- Similar to BA/PM but with developer focus
- Browse projects
- Apply to development opportunities

### Client (`client@test.com`)
- Post projects
- Browse talent
- Manage applications
- View project analytics

### Employer (`employer@test.com`)
- Post jobs
- Browse talent
- Manage job applications
- View hiring analytics

### Admin (`admin@test.com`)
- Access admin dashboard
- Manage all users
- Manage jobs and projects
- Handle verification requests
- Manage platforms and skills

## Notes

- All users have **email_verified = true** for easy testing
- All users have **profile_completion = 85%** to test verification requests
- Specialized profiles are created for each role with realistic data
- The admin user has `is_admin = true` in the users table

## Troubleshooting

**Issue**: Foreign key constraint errors
- **Solution**: Make sure you've run the main schema.sql first to create all tables

**Issue**: Duplicate email errors
- **Solution**: Delete existing test users first or modify the email addresses in the script

**Issue**: Password doesn't work
- **Solution**: The password is `password123` for all test users. Make sure you're using the correct password.

## Customization

To customize the test users, edit `create_test_users.js` and modify the `testUsers` array. Then regenerate the SQL file.


