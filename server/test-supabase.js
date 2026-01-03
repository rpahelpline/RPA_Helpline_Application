// Test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

console.log('\n🧪 Testing Supabase Connection...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key Length: ${supabaseAnonKey?.length || 0} chars`);
console.log(`Service Key Length: ${supabaseServiceKey?.length || 0} chars\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required keys');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Test 1: Simple query
console.log('Test 1: Testing basic connection...');
try {
  const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
  
  if (error) {
    if (error.code === 'PGRST116') {
      console.log('✓ Connection works! (Table "users" doesn\'t exist yet - need to run schema)');
    } else if (error.message.includes('Invalid API key') || error.message.includes('JWT')) {
      console.error('❌ Invalid API key');
      console.error('Error:', error.message);
      console.error('\n💡 Your API keys might be incorrect or incomplete.');
      console.error('   Please verify in Supabase Dashboard → Settings → API');
    } else {
      console.error('❌ Error:', error.message);
    }
  } else {
    console.log('✓ Connection successful!');
  }
} catch (err) {
  console.error('❌ Connection failed:', err.message);
}

// Test 2: Check if we can access auth
console.log('\nTest 2: Testing authentication access...');
try {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) {
    console.error('❌ Auth access failed:', error.message);
    if (error.message.includes('Invalid API key')) {
      console.error('\n💡 This usually means:');
      console.error('   1. Your SUPABASE_SERVICE_ROLE_KEY is incorrect');
      console.error('   2. Or you\'re using anon key instead of service_role key');
    }
  } else {
    console.log('✓ Auth access works!');
  }
} catch (err) {
  console.error('❌ Auth test failed:', err.message);
}

console.log('\n');


