/**
 * Database Cleanup Script
 * 
 * This script safely cleans all data from your Supabase database
 * while keeping the schema structure intact.
 * 
 * Usage:
 *   node server/database/clean_database.js
 * 
 * WARNING: This will DELETE ALL DATA from your database!
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Missing Supabase credentials');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Tables to clean in order (child tables first, then parent tables)
// Only includes tables that exist in the schema
const tablesToClean = [
  // Activity and Saved Items
  'activity_log',
  'saved_items',
  
  // Notifications and Messages
  'notifications',
  'messages',
  'conversation_participants',
  'conversations',
  
  // Reviews
  'reviews',
  
  // Invoices and Contracts
  'invoices',
  'contracts',
  
  // Training
  'training_proposals',
  'training_enrollments',
  'training_requests',
  'training_programs',
  
  // Applications
  'job_applications',
  'project_applications',
  
  // Projects and Jobs
  'jobs',
  'projects',
  
  // Portfolio and Experience
  'user_portfolio',
  'user_education',
  'user_experience',
  'user_certifications',
  'user_skills',
  'user_platforms',
  
  // Specialized Profiles
  'employer_profiles',
  'client_profiles',
  'ba_pm_profiles',
  'trainer_profiles',
  'job_seeker_profiles',
  'freelancer_profiles',
  
  // Main Profiles
  'profiles',
  
  // Users (delete last)
  'users'
  
  // Taxonomy tables (optional - uncomment if you want to clean these too)
  // 'certifications',
  // 'skills',
  // 'skill_categories',
  // 'rpa_platforms'
];

async function cleanDatabase() {
  console.log('\n🧹 Starting database cleanup...\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA from your database!\n');
  
  // Ask for confirmation (in a real scenario, you might want to add a prompt)
  // For now, we'll proceed with a warning
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (const table of tablesToClean) {
    try {
      // Delete all rows from table
      // Note: Supabase REST API doesn't support TRUNCATE, so we use DELETE
      // For better performance, you can use the SQL script in Supabase Dashboard
      const { error } = await supabase
        .from(table)
        .delete()
        .gte('created_at', '1970-01-01'); // Delete all rows (condition that matches all)
      
      if (error) {
        // If table doesn't exist, that's okay
        if (error.code === 'PGRST204' || error.message.includes('does not exist')) {
          console.log(`  ⚠️  Table '${table}' does not exist (skipping)`);
        } else {
          throw error;
        }
      } else {
        console.log(`  ✓ Cleaned table: ${table}`);
        successCount++;
      }
    } catch (error) {
      console.error(`  ✗ Error cleaning '${table}':`, error.message);
      errors.push({ table, error: error.message });
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Cleanup Summary:');
  console.log(`  ✓ Successfully cleaned: ${successCount} tables`);
  if (errorCount > 0) {
    console.log(`  ✗ Errors: ${errorCount} tables`);
    console.log('\nErrors:');
    errors.forEach(({ table, error }) => {
      console.log(`  - ${table}: ${error}`);
    });
  }
  console.log('='.repeat(50) + '\n');

  // Verify cleanup
  console.log('🔍 Verifying cleanup...\n');
  const verifyTables = ['users', 'profiles', 'projects', 'jobs'];
  
  for (const table of verifyTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && error.code !== 'PGRST204') {
        console.log(`  ⚠️  ${table}: Could not verify (${error.message})`);
      } else {
        const rowCount = count || 0;
        const status = rowCount === 0 ? '✓' : '✗';
        console.log(`  ${status} ${table}: ${rowCount} rows`);
      }
    } catch (error) {
      console.log(`  ⚠️  ${table}: Could not verify`);
    }
  }

  console.log('\n✨ Database cleanup complete!\n');
}

// Run cleanup
cleanDatabase().catch((error) => {
  console.error('\n❌ Fatal error during cleanup:', error);
  process.exit(1);
});

