import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ MISSING SUPABASE ENVIRONMENT VARIABLES\n');
  console.error('Required variables in server/.env:');
  console.error('  - SUPABASE_URL');
  console.error('  - SUPABASE_ANON_KEY');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY (optional but recommended)\n');
  
  if (!supabaseUrl) console.error('  ✗ SUPABASE_URL is missing');
  if (!supabaseAnonKey) console.error('  ✗ SUPABASE_ANON_KEY is missing');
  
  console.error('\nCurrent values:');
  console.error(`  SUPABASE_URL: ${supabaseUrl ? '✓ Set' : '✗ Missing'}`);
  console.error(`  SUPABASE_ANON_KEY: ${supabaseAnonKey ? `✓ Set (${supabaseAnonKey.substring(0, 20)}...)` : '✗ Missing'}`);
  console.error(`  SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? `✓ Set (${supabaseServiceKey.substring(0, 20)}...)` : '✗ Missing'}\n`);
  
  process.exit(1);
}

// Validate URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('\n❌ INVALID SUPABASE_URL FORMAT\n');
  console.error(`Current value: ${supabaseUrl}`);
  console.error('Expected format: https://YOUR_PROJECT_ID.supabase.co\n');
  process.exit(1);
}

// Validate key format - accept any format (Supabase keys can vary)
if (supabaseAnonKey.length < 20) {
  console.error('\n❌ SUPABASE_ANON_KEY appears too short\n');
  console.error(`Current length: ${supabaseAnonKey.length} characters`);
  console.error('Please ensure you copied the entire key from Supabase dashboard\n');
  process.exit(1);
}

// Client for public operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for server-side operations (bypasses RLS)
// Use service_role key if available, otherwise fall back to anon key
const adminKey = supabaseServiceKey || supabaseAnonKey;

if (!supabaseServiceKey) {
  console.warn('\n⚠️  WARNING: Using anon key for admin operations. For production, use SUPABASE_SERVICE_ROLE_KEY\n');
}

export const supabaseAdmin = createClient(supabaseUrl, adminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection on startup
(async () => {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected if schema not run)
      if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
        console.error('\n❌ SUPABASE AUTHENTICATION FAILED\n');
        console.error('Error:', error.message);
        console.error('\nPlease verify your API keys in server/.env:');
        console.error('  1. Go to Supabase Dashboard → Project Settings → API');
        console.error('  2. Copy the correct keys');
        console.error('  3. Update server/.env file\n');
      }
    } else {
      console.log('✓ Supabase connection successful\n');
    }
  } catch (err) {
    // Silently fail on startup - connection will be tested on first request
  }
})();

export default supabase;

