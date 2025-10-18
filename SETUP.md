# Care4U Setup Guide

Complete step-by-step guide to set up and run the Care4U application.

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- OpenAI API key
- Git

## Step 1: Clone and Install

```bash
cd /Users/akshay/Documents/MyProjects/Care4u
npm run install:all
```

## Step 2: Set Up Supabase

### 2.1 Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `care4u` (or any name you prefer)
   - Database Password: (generate a strong password)
   - Region: Choose closest to you
6. Click "Create new project"
7. Wait for the project to be provisioned (~2 minutes)

### 2.2 Get Your Supabase Credentials

Once the project is ready:

1. Go to Settings → API
2. Copy the following values:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - anon/public key
   - service_role key (keep this secret!)

### 2.3 Run Database Migrations

Option A: Using Supabase MCP (recommended if you have it configured):

```bash
# Use the Supabase MCP tools to run the migrations
# Files: supabase/migrations/*.sql
```

Option B: Using Supabase Dashboard:

1. Go to your Supabase project
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of each migration file in order:
   - `supabase/migrations/20240101000000_init_schema.sql`
   - `supabase/migrations/20240101000001_rls_policies.sql`
   - `supabase/migrations/20240101000002_storage.sql`
5. Run each migration by clicking "Run"

Option C: Using Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

## Step 3: Set Up OpenAI

1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign in or create an account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key (you won't be able to see it again!)

## Step 4: Configure Environment Variables

### 4.1 Backend Environment

Create `backend/.env`:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and add your credentials:

```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
OPENAI_API_KEY=sk-your_openai_key_here
FRONTEND_URL=http://localhost:5173
PORT=8000
```

### 4.2 Frontend Environment

Create `frontend/.env`:

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:8000
```

## Step 5: Build Shared Types

```bash
cd ../shared
npm run build
```

## Step 6: Run the Application

### Option A: Run Both Frontend and Backend Together

From the root directory:

```bash
cd ..
npm run dev
```

This will start:
- Backend API on http://localhost:8000
- Frontend on http://localhost:5173

### Option B: Run Separately (for debugging)

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

## Step 7: Create Your First Admin User

Since this is a fresh installation, you'll need to manually create the first admin user:

### 7.1 Sign Up

1. Open http://localhost:5173
2. Click "Sign In"
3. Enter your email address
4. Check your email for the magic link
5. Click the link to log in

### 7.2 Set Admin Role

After logging in for the first time, you need to set your role to admin:

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user
3. Click on the user
4. Scroll down to "User Metadata"
5. Click "Edit"
6. Add the following JSON:

```json
{
  "role": "institute_admin",
  "onboarded": true
}
```

7. Click "Save"

### 7.3 Create Institute Admin Record

1. Go to Supabase Dashboard → Table Editor
2. Select `institute_admins` table
3. Click "Insert row"
4. Fill in:
   - user_id: (copy your user ID from auth.users table)
   - institute_name: "Your Institute Name"
5. Click "Save"

### 7.4 Refresh Your Browser

Now log out and log back in. You should see the Admin Dashboard!

## Step 8: Test the Application

### Create a Test Candidate

1. In Admin Dashboard, click "Add Candidate"
2. Fill in:
   - First Name: John
   - Last Name: Doe
   - Age: 75
3. Click "Add Candidate"

### Register a Family Member

1. Click "Add Family Member" (user icon) next to the candidate
2. Fill in:
   - Select the candidate
   - First Name: Jane
   - Last Name: Doe
   - Email: jane@example.com
   - Check "This family member is also a caregiver"
3. Click "Register & Send Link"

### Test Onboarding

1. Check the email (jane@example.com)
2. Click the magic link
3. You'll be redirected to the onboarding flow
4. Upload a test prescription image
5. Review the extracted medication schedule
6. Confirm to save

## Troubleshooting

### "Failed to fetch" errors

- Make sure both backend and frontend are running
- Check that PORT 8000 and 5173 are not in use
- Verify CORS settings in backend

### Database connection errors

- Verify Supabase credentials in .env files
- Check that migrations ran successfully
- Ensure RLS policies are enabled

### OpenAI errors

- Verify your OpenAI API key is valid
- Check that you have credits in your OpenAI account
- Ensure you're using a supported model (gpt-4-vision-preview)

### Authentication not working

- Clear browser cookies and try again
- Check Supabase Auth settings
- Verify email configuration in Supabase

### File upload fails

- Check that the `uploads` directory exists in backend
- Verify file size is under 10MB
- Ensure Supabase Storage is properly configured

## Next Steps

Once everything is working:

1. **Add more candidates and family members**
2. **Test medication reminders** (they run every minute)
3. **Try the wellness check-in** feature
4. **Explore the accessibility features** in the candidate dashboard
5. **Check the medication calendar** for adherence visualization

## Production Deployment

See the main README.md for deployment instructions to:
- Vercel (Frontend)
- Vercel or Render (Backend)
- Supabase (Database + Auth)

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check backend logs in the terminal
3. Review Supabase logs in the dashboard
4. Verify all environment variables are set correctly

