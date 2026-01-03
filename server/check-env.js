// Quick script to verify .env configuration
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('\n🔍 Checking Supabase Configuration...\n');

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const jwtSecret = process.env.JWT_SECRET?.trim();

let hasErrors = false;

// Check SUPABASE_URL
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is missing');
  hasErrors = true;
} else if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error(`❌ SUPABASE_URL format is invalid: ${supabaseUrl}`);
  console.error('   Expected: https://YOUR_PROJECT_ID.supabase.co');
  hasErrors = true;
} else {
  console.log(`✓ SUPABASE_URL: ${supabaseUrl}`);
}

// Check SUPABASE_ANON_KEY
if (!supabaseAnonKey) {
  console.error('❌ SUPABASE_ANON_KEY is missing');
  hasErrors = true;
} else if (supabaseAnonKey.length < 20) {
  console.error(`❌ SUPABASE_ANON_KEY appears too short (${supabaseAnonKey.length} chars)`);
  console.error(`   Please ensure you copied the entire key`);
  hasErrors = true;
} else {
  console.log(`✓ SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 30)}... (${supabaseAnonKey.length} chars)`);
}

// Check SUPABASE_SERVICE_ROLE_KEY
if (!supabaseServiceKey) {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is missing (optional but recommended)');
} else if (supabaseServiceKey.length < 20) {
  console.error(`❌ SUPABASE_SERVICE_ROLE_KEY appears too short (${supabaseServiceKey.length} chars)`);
  hasErrors = true;
} else {
  console.log(`✓ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey.substring(0, 30)}... (${supabaseServiceKey.length} chars)`);
}

// Check JWT_SECRET
if (!jwtSecret) {
  console.error('❌ JWT_SECRET is missing');
  hasErrors = true;
} else if (jwtSecret.length < 32) {
  console.error(`❌ JWT_SECRET is too short (${jwtSecret.length} chars, need at least 32)`);
  hasErrors = true;
} else {
  console.log(`✓ JWT_SECRET: Set (${jwtSecret.length} chars)`);
}

console.log('\n' + '='.repeat(60) + '\n');

if (hasErrors) {
  console.error('❌ Configuration has errors. Please fix them in server/.env\n');
  console.log('📝 How to get your Supabase keys:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Click Settings (⚙️) → API');
  console.log('   4. Copy:');
  console.log('      - Project URL → SUPABASE_URL');
  console.log('      - anon public → SUPABASE_ANON_KEY');
  console.log('      - service_role secret → SUPABASE_SERVICE_ROLE_KEY\n');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set correctly!\n');
  console.log('💡 Next step: Run the database schema in Supabase SQL Editor');
  console.log('   File: server/database/schema.sql\n');
}

