/**
 * Migration: Make password_hash nullable for OAuth users
 * 
 * Run this script to update the database schema:
 * node database/migrations/run_make_password_hash_nullable.js
 */

import { supabaseAdmin } from '../../src/config/supabase.js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function runMigration() {
  console.log('Running migration: make_password_hash_nullable...');
  
  try {
    // First, check if the column is already nullable
    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking users table:', checkError);
      return;
    }
    
    // Use raw SQL to alter the column
    // Note: Supabase doesn't have a direct way to alter columns via JS
    // You'll need to run this SQL directly in Supabase SQL Editor or psql
    
    console.log('\n⚠️  IMPORTANT: Run this SQL in Supabase SQL Editor:');
    console.log('\nALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;');
    console.log('\nOr use psql:');
    console.log('psql -h <your-db-host> -U postgres -d postgres -c "ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;"');
    console.log('\nAfter running the SQL, the migration will be complete.');
    
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigration();

