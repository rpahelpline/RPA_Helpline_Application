/**
 * Script to create test users for all roles
 * Run with: node server/database/create_test_users.js
 * 
 * This will generate SQL statements to insert test users for:
 * - Freelancer
 * - Job Seeker
 * - Trainer
 * - BA/PM
 * - Client
 * - Employer
 * - Admin (optional)
 */

import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test password for all users (you can change this)
const TEST_PASSWORD = 'password123';

// Hash the password
const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

// Generate SQL
const sqlStatements = [];

sqlStatements.push(`-- ============================================================================`);
sqlStatements.push(`-- TEST USERS CREATION SCRIPT`);
sqlStatements.push(`-- ============================================================================`);
sqlStatements.push(`-- Password for all test users: ${TEST_PASSWORD}`);
sqlStatements.push(`-- ============================================================================`);
sqlStatements.push(``);
sqlStatements.push(`BEGIN;`);
sqlStatements.push(``);

// Test users data
const testUsers = [
  {
    email: 'freelancer@test.com',
    full_name: 'John Freelancer',
    user_type: 'freelancer',
    headline: 'Senior RPA Developer | UiPath Expert',
    bio: 'Experienced RPA developer with 5+ years in automation. Specialized in UiPath and Automation Anywhere.',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-9876543210',
    specializedProfile: {
      table: 'freelancer_profiles',
      data: {
        title: 'Senior UiPath Developer',
        experience_years: 5,
        experience_level: 'senior',
        hourly_rate_min: 50.00,
        hourly_rate_max: 80.00,
        currency: 'USD',
        availability_status: 'available',
        hours_per_week: 40,
        preferred_project_duration: 'both',
        remote_only: true,
        completed_projects: 25,
        average_rating: 4.8,
        total_reviews: 18
      }
    }
  },
  {
    email: 'jobseeker@test.com',
    full_name: 'Sarah JobSeeker',
    user_type: 'job_seeker',
    headline: 'RPA Developer Seeking Full-Time Opportunities',
    bio: 'Passionate RPA developer looking for full-time opportunities. Strong background in Blue Prism and Power Automate.',
    city: 'Bangalore',
    country: 'India',
    phone: '+91-9876543211',
    specializedProfile: {
      table: 'job_seeker_profiles',
      data: {
        current_title: 'RPA Developer',
        experience_years: 3,
        experience_level: 'mid',
        currently_employed: true,
        current_company: 'Tech Corp',
        notice_period_days: 30,
        job_types: ['full_time'],
        remote_preference: 'hybrid',
        expected_salary_min: 800000,
        expected_salary_max: 1200000,
        salary_currency: 'INR',
        salary_period: 'yearly',
        actively_looking: true
      }
    }
  },
  {
    email: 'trainer@test.com',
    full_name: 'Dr. Michael Trainer',
    user_type: 'trainer',
    headline: 'RPA Training Expert | Certified Instructor',
    bio: 'Professional RPA trainer with 10+ years of experience. Certified in UiPath, Automation Anywhere, and Blue Prism.',
    city: 'Delhi',
    country: 'India',
    phone: '+91-9876543212',
    specializedProfile: {
      table: 'trainer_profiles',
      data: {
        training_experience_years: 10,
        total_students_trained: 500,
        offers_online: true,
        offers_in_person: true,
        offers_corporate: true,
        teaching_languages: ['English', 'Hindi'],
        hourly_rate: 100.00,
        course_rate_min: 5000.00,
        course_rate_max: 15000.00,
        currency: 'USD',
        availability_status: 'available',
        max_students_per_batch: 20,
        average_rating: 4.9,
        total_reviews: 150,
        completion_rate: 85.5
      }
    }
  },
  {
    email: 'bapm@test.com',
    full_name: 'Alex BA/PM',
    user_type: 'ba_pm',
    headline: 'RPA Business Analyst & Project Manager',
    bio: 'Strategic RPA consultant with expertise in process analysis, automation strategy, and project management.',
    city: 'Pune',
    country: 'India',
    phone: '+91-9876543213',
    specializedProfile: {
      table: 'ba_pm_profiles',
      data: {
        primary_role: 'both',
        experience_years: 7,
        experience_level: 'senior',
        methodologies: ['agile', 'scrum', 'waterfall'],
        projects_delivered: 35,
        teams_managed_size: 15,
        average_rating: 4.7,
        total_reviews: 25
      }
    }
  },
  {
    email: 'developer@test.com',
    full_name: 'David Developer',
    user_type: 'ba_pm', // Note: 'developer' is not a valid user_type in DB, using 'ba_pm' instead
    headline: 'RPA Developer & Solution Architect',
    bio: 'Full-stack RPA developer with expertise in multiple platforms. Can handle end-to-end automation projects.',
    city: 'Hyderabad',
    country: 'India',
    phone: '+91-9876543214',
    specializedProfile: {
      table: 'ba_pm_profiles',
      data: {
        primary_role: 'both',
        experience_years: 6,
        experience_level: 'senior',
        methodologies: ['agile'],
        projects_delivered: 28,
        teams_managed_size: 8,
        average_rating: 4.6,
        total_reviews: 20
      }
    }
  },
  {
    email: 'client@test.com',
    full_name: 'Emma Client',
    user_type: 'client',
    headline: 'Tech Startup Founder | Hiring RPA Talent',
    bio: 'Looking for talented RPA developers to help automate our business processes.',
    city: 'Chennai',
    country: 'India',
    phone: '+91-9876543215',
    company_name: 'InnovateTech Solutions',
    specializedProfile: {
      table: 'client_profiles',
      data: {
        company_name: 'InnovateTech Solutions',
        company_website: 'https://innovatetech.example.com',
        company_size: '51-200',
        industry: 'Technology',
        company_verified: true,
        payment_verified: true,
        total_projects_posted: 12,
        total_spent: 150000.00,
        average_rating: 4.9,
        total_reviews: 10
      }
    }
  },
  {
    email: 'employer@test.com',
    full_name: 'Robert Employer',
    user_type: 'employer',
    headline: 'HR Manager | Hiring RPA Professionals',
    bio: 'Recruiting RPA professionals for our growing automation team.',
    city: 'Gurgaon',
    country: 'India',
    phone: '+91-9876543216',
    company_name: 'Enterprise Automation Inc',
    specializedProfile: {
      table: 'employer_profiles',
      data: {
        company_name: 'Enterprise Automation Inc',
        company_website: 'https://enterpriseauto.example.com',
        company_size: '501-1000',
        industry: 'Financial Services',
        company_verified: true,
        total_jobs_posted: 8,
        total_hires: 15,
        employer_rating: 4.8,
        total_reviews: 12
      }
    }
  },
  {
    email: 'admin@test.com',
    full_name: 'Admin User',
    user_type: 'freelancer', // Admin can have any user_type
    headline: 'System Administrator',
    bio: 'Platform administrator with full access to all features.',
    city: 'Mumbai',
    country: 'India',
    phone: '+91-9876543217',
    is_admin: true,
    specializedProfile: {
      table: 'freelancer_profiles',
      data: {
        title: 'System Admin',
        experience_years: 10,
        experience_level: 'architect',
        hourly_rate_min: 0,
        hourly_rate_max: 0,
        availability_status: 'not_available'
      }
    }
  }
];

// Insert each user using WITH clauses to ensure IDs match
for (const userData of testUsers) {
  // Insert user
  sqlStatements.push(`-- ============================================================================`);
  sqlStatements.push(`-- User: ${userData.full_name} (${userData.user_type})`);
  sqlStatements.push(`-- Email: ${userData.email}`);
  sqlStatements.push(`-- Password: ${TEST_PASSWORD}`);
  sqlStatements.push(`-- ============================================================================`);
  sqlStatements.push(``);
  
  sqlStatements.push(`WITH new_user AS (`);
  sqlStatements.push(`  INSERT INTO users (id, email, password_hash, email_verified, email_verified_at, phone, is_active, is_admin, created_at)`);
  sqlStatements.push(`  VALUES (`);
  sqlStatements.push(`    gen_random_uuid(),`);
  sqlStatements.push(`    '${userData.email}',`);
  sqlStatements.push(`    '${passwordHash}',`);
  sqlStatements.push(`    true,`);
  sqlStatements.push(`    NOW(),`);
  sqlStatements.push(`    '${userData.phone}',`);
  sqlStatements.push(`    true,`);
  sqlStatements.push(`    ${userData.is_admin ? 'true' : 'false'},`);
  sqlStatements.push(`    NOW()`);
  sqlStatements.push(`  )`);
  sqlStatements.push(`  RETURNING id AS user_id`);
  sqlStatements.push(`),`);
  sqlStatements.push(`new_profile AS (`);
  sqlStatements.push(`  INSERT INTO profiles (id, user_id, full_name, display_name, user_type, headline, bio, city, country, is_verified, is_available, profile_completion, created_at)`);
  sqlStatements.push(`  SELECT`);
  sqlStatements.push(`    gen_random_uuid(),`);
  sqlStatements.push(`    user_id,`);
  sqlStatements.push(`    '${userData.full_name}',`);
  sqlStatements.push(`    '${userData.full_name.split(' ')[0]}',`);
  sqlStatements.push(`    '${userData.user_type}',`);
  sqlStatements.push(`    '${userData.headline}',`);
  sqlStatements.push(`    '${userData.bio}',`);
  sqlStatements.push(`    '${userData.city}',`);
  sqlStatements.push(`    '${userData.country}',`);
  sqlStatements.push(`    ${userData.is_admin ? 'true' : 'false'},`);
  sqlStatements.push(`    ${userData.user_type === 'client' || userData.user_type === 'employer' ? 'false' : 'true'},`);
  sqlStatements.push(`    85,`);
  sqlStatements.push(`    NOW()`);
  sqlStatements.push(`  FROM new_user`);
  sqlStatements.push(`  RETURNING id AS profile_id`);
  sqlStatements.push(`)`);

  // Insert specialized profile
  if (userData.specializedProfile) {
    const { table, data } = userData.specializedProfile;
    const columns = Object.keys(data);
    const values = Object.values(data).map(val => {
      if (Array.isArray(val)) {
        return `ARRAY[${val.map(v => `'${v}'`).join(', ')}]`;
      } else if (typeof val === 'string') {
        return `'${val.replace(/'/g, "''")}'`;
      } else if (val === null) {
        return 'NULL';
      } else {
        return val;
      }
    });

    sqlStatements.push(`INSERT INTO ${table} (profile_id, ${columns.join(', ')})`);
    sqlStatements.push(`SELECT profile_id, ${values.join(', ')}`);
    sqlStatements.push(`FROM new_profile;`);
  } else {
    sqlStatements.push(`SELECT * FROM new_profile;`);
  }

  sqlStatements.push(``);
}

sqlStatements.push(`COMMIT;`);
sqlStatements.push(``);
sqlStatements.push(`-- ============================================================================`);
sqlStatements.push(`-- VERIFICATION QUERIES`);
sqlStatements.push(`-- ============================================================================`);
sqlStatements.push(`-- Run these to verify users were created:`);
sqlStatements.push(`--`);
sqlStatements.push(`-- SELECT u.email, u.is_admin, p.full_name, p.user_type FROM users u JOIN profiles p ON p.user_id = u.id ORDER BY p.user_type;`);
sqlStatements.push(`--`);
sqlStatements.push(`-- ============================================================================`);

// Write to file
const outputPath = join(__dirname, 'create_test_users.sql');
writeFileSync(outputPath, sqlStatements.join('\n'), 'utf8');

console.log('✅ Test users SQL script generated successfully!');
console.log(`📁 File location: ${outputPath}`);
console.log(`\n📝 Test users created:`);
testUsers.forEach(user => {
  console.log(`   - ${user.email} (${user.user_type}) - Password: ${TEST_PASSWORD}`);
});
console.log(`\n💡 To apply the script, run:`);
console.log(`   psql -U your_username -d your_database -f ${outputPath}`);
console.log(`\n   Or execute the SQL in your database client.`);

