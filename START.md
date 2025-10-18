# 🚀 Start Here!

## Quick Setup (5 minutes)

1. **Install dependencies:**
   ```bash
   ./scripts/setup.sh
   ```

2. **Get Supabase credentials:**
   - Create project at [supabase.com](https://supabase.com)
   - Copy URL and keys from Settings → API

3. **Add to `.env` files:**
   
   `backend/.env`:
   ```
   SUPABASE_URL=your_url
   SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_KEY=your_service_key
   OPENAI_API_KEY=sk-your_key
   FRONTEND_URL=http://localhost:5173
   PORT=8000
   ```
   
   `frontend/.env`:
   ```
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   VITE_API_URL=http://localhost:8000
   ```

4. **Run migrations in Supabase SQL Editor:**
   - Copy/paste files from `supabase/migrations/` in order

5. **Start app:**
   ```bash
   npm run dev
   ```

6. **Create admin:**
   - Visit http://localhost:5173
   - Sign in with email
   - In Supabase → Users → Your user → Edit metadata:
   ```json
   {"role": "institute_admin", "onboarded": true}
   ```
   - Create row in `institute_admins` table

Done! 🎉

See QUICKSTART.md for detailed steps.

