# 🔑 Supabase Setup Guide

## Finding Your Correct Supabase Keys

The key you provided (`sb_publishable_...`) is **not** the correct format for Supabase.

### ✅ Supabase Key Format

Supabase API keys can be in different formats:
- **JWT tokens** (most common): Start with `eyJ` and are 200+ characters long
- **Other formats**: May vary depending on your Supabase setup

**Important**: Copy the **entire key** exactly as shown in the dashboard, regardless of format.

### 📍 Where to Find Your Keys

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project**
   - Click on your project (or create one if needed)

3. **Navigate to Settings → API**
   - Click the **⚙️ Settings** icon (bottom left)
   - Click **API** in the settings menu

4. **Copy the Keys**

   You'll see three sections:

   ```
   Project URL
   └─ https://hzdmqkcqqqxukuejeuby.supabase.co
      ↑ Copy this → SUPABASE_URL

   Project API keys
   └─ anon public
      [Your actual key here - copy the entire key]
      ↑ Copy this → SUPABASE_ANON_KEY

   └─ service_role secret
      [Your actual key here - copy the entire key]
      ↑ Copy this → SUPABASE_SERVICE_ROLE_KEY
   ```

### 📝 Update Your `.env` File

Open `server/.env` and make sure it looks like this:

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase (REPLACE WITH YOUR ACTUAL KEYS)
SUPABASE_URL=https://hzdmqkcqqqxukuejeuby.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZG1xa2NxcXh4dWt1ZWpldWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2NzI4NDAsImV4cCI6MjA1MTI0ODg0MH0.xxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6ZG1xa2NxcXh4dWt1ZWpldWJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTY3Mjg0MCwiZXhwIjoyMDUxMjQ4ODQwfQ.xxxxx...

# JWT
JWT_SECRET=YourSecretKeyHereMinimum32CharactersLong
JWT_EXPIRES_IN=7d

# Frontend
FRONTEND_URL=http://localhost:5173
```

### ⚠️ Important Notes

1. **Never commit `.env` to Git** - It contains secrets!
2. **Service Role Key is SECRET** - Never expose in frontend
3. **Copy the entire key** - Make sure you copy the complete key from Supabase
4. **No spaces or line breaks** - Keys should be on one line
5. **Key format varies** - Your keys may not start with "eyJ" - that's okay!

### ✅ Verify Your Keys

After updating, run:

```bash
cd server
node check-env.js
```

This will verify your configuration is correct.

### 🗄️ Next: Run Database Schema

Once keys are correct, run the schema:

1. Open Supabase Dashboard → **SQL Editor**
2. Copy contents of `server/database/schema.sql`
3. Paste and click **Run**

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs/guides/api
- Your project URL: https://hzdmqkcqqqxukuejeuby.supabase.co

