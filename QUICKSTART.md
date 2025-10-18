# Care4U Quick Start Guide

Get up and running with Care4U in under 15 minutes!

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier)
- OpenAI API key

## 5-Minute Setup

### 1. Install Dependencies

```bash
./scripts/setup.sh
```

Or manually:
```bash
npm run install:all
cd shared && npm run build
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Wait for provisioning (~2 min)
3. Get your credentials from Settings → API

### 3. Configure Environment

**Backend** (`backend/.env`):
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
OPENAI_API_KEY=sk-your_key
FRONTEND_URL=http://localhost:5173
PORT=8000
```

**Frontend** (`frontend/.env`):
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

### 4. Run Database Migrations

In Supabase Dashboard → SQL Editor, run these files in order:
1. `supabase/migrations/20240101000000_init_schema.sql`
2. `supabase/migrations/20240101000001_rls_policies.sql`
3. `supabase/migrations/20240101000002_storage.sql`

### 5. Start the App

```bash
npm run dev
```

Opens at:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000

### 6. Create Admin User

1. Visit http://localhost:5173
2. Click "Sign In" and enter your email
3. Check email for magic link
4. After login, go to Supabase → Authentication → Users
5. Click your user → Edit User Metadata:
```json
{
  "role": "institute_admin",
  "onboarded": true
}
```
6. In Supabase → Table Editor → `institute_admins`, insert:
   - user_id: (your user ID)
   - institute_name: "Your Institute"
7. Refresh browser and enjoy! 🎉

## Testing the App

### Add a Candidate
1. Admin Dashboard → "Add Candidate"
2. Fill in: John, Doe, 75
3. Click "Add Candidate"

### Register Family Member
1. Click "Add Family Member" icon next to candidate
2. Fill in: Jane, Doe, jane@example.com
3. Check "This family member is also a caregiver"
4. Click "Register & Send Link"

### Test Onboarding Flow
1. Check jane@example.com for magic link
2. Click link → Onboarding page
3. Upload a prescription image (any image with text works)
4. Review extracted schedule
5. Confirm to save

## Common Issues

**Port already in use?**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

**Database errors?**
- Verify migrations ran successfully
- Check RLS is enabled on tables
- Confirm credentials in .env files

**OpenAI errors?**
- Verify API key is valid
- Check you have credits
- Ensure using gpt-4-vision-preview model

## What's Next?

- 📖 Read [SETUP.md](SETUP.md) for detailed setup
- 🚀 Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- 💡 Explore all 4 user dashboards
- 🧪 Test medication reminders
- 📊 Check the medication calendar

## Project Structure

```
Care4u/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/    # Dashboard pages
│   │   ├── components/
│   │   ├── lib/      # API & Supabase clients
│   │   └── contexts/ # Auth context
│   └── package.json
├── backend/           # Express + TypeScript
│   ├── src/
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic
│   │   ├── config/   # Configuration
│   │   └── middleware/
│   └── package.json
├── shared/            # Shared TypeScript types
│   └── src/types.ts
└── supabase/          # Database migrations
    └── migrations/
```

## Available Commands

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Build
npm run build           # Build all
npm run build:frontend  # Build frontend only
npm run build:backend   # Build backend only

# Install
npm run install:all     # Install all dependencies
```

## Support

- Check [SETUP.md](SETUP.md) for detailed instructions
- Review [README.md](README.md) for full documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production setup

Happy caregiving! 💙

