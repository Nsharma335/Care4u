# Care4U Deployment Guide

## Prerequisites

- Vercel account (or Render for backend)
- Supabase production project
- OpenAI API key
- Domain name (optional)

## Step 1: Prepare Supabase for Production

### 1.1 Create Production Project

1. Create a new Supabase project for production
2. Run all migrations from `supabase/migrations/`
3. Verify RLS policies are enabled
4. Test with sample data

### 1.2 Configure Storage

1. Go to Storage in Supabase Dashboard
2. Verify `prescriptions` bucket exists
3. Check storage policies are active

### 1.3 Configure Auth

1. Go to Authentication → Settings
2. Add your production URL to "Site URL"
3. Add production URLs to "Redirect URLs"
4. Configure email templates (optional)

## Step 2: Deploy Backend

### Option A: Vercel

```bash
cd backend

# Build the project first
npm run build

# Deploy to Vercel
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set framework preset: "Other"
# - Build command: npm run build
# - Output directory: dist
# - Install command: npm install
```

#### Set Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add the following:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_KEY=your_production_service_key
OPENAI_API_KEY=sk-your_openai_key
FRONTEND_URL=https://your-frontend-url.vercel.app
PORT=8000
```

4. Redeploy to apply environment variables

### Option B: Render

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your repository
5. Configure:
   - Name: `care4u-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
6. Add environment variables (same as above)
7. Click "Create Web Service"


## Step 3: Deploy Frontend

```bash
cd frontend

# Deploy to Vercel
vercel

# Follow prompts:
# - Link to existing project or create new
# - Framework: Vite detected automatically
# - Build command: npm run build
# - Output directory: dist
```

### Set Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Settings → Environment Variables
3. Add the following:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_API_URL=https://your-backend-url.vercel.app
```

4. Redeploy to apply environment variables

## Step 4: Configure Custom Domain (Optional)

### Frontend Domain

1. In Vercel Dashboard, go to your frontend project
2. Settings → Domains
3. Add your domain (e.g., `care4u.yourdomain.com`)
4. Follow DNS configuration instructions
5. Wait for SSL certificate to be issued

### Backend Domain

1. In Vercel/Render Dashboard, go to your backend project
2. Settings → Domains
3. Add your API subdomain (e.g., `api.care4u.yourdomain.com`)
4. Update CORS settings in backend to allow your frontend domain

## Step 5: Update Frontend with Backend URL

1. Update `frontend/.env` or Vercel environment variables:
```
VITE_API_URL=https://api.care4u.yourdomain.com
```

2. Redeploy frontend

## Step 6: Final Configurations

### Update Supabase Redirect URLs

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your production URLs:
   - Site URL: `https://care4u.yourdomain.com`
   - Redirect URLs: `https://care4u.yourdomain.com/**`

### Test Email Delivery

1. Create a test candidate
2. Register a test family member
3. Verify magic link email is delivered
4. Test login flow

### Configure CORS

Update backend CORS settings if using custom domains:

```typescript
// backend/src/index.ts
app.use(cors({
  origin: [
    'https://care4u.yourdomain.com',
    'https://www.care4u.yourdomain.com',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  credentials: true
}));
```

## Step 7: Set Up Monitoring

### Vercel Analytics

1. Enable Vercel Analytics in project settings
2. Monitor performance and errors

### Supabase Monitoring

1. Monitor Database performance in Supabase Dashboard
2. Set up database backups
3. Review Auth logs regularly

### Error Tracking (Optional)

Consider adding:
- Sentry for error tracking
- LogRocket for session replay
- Google Analytics for usage tracking

## Step 8: Create First Admin User

1. Visit your production URL
2. Sign in with magic link
3. Go to Supabase Dashboard → Authentication → Users
4. Find your user and set metadata:
```json
{
  "role": "institute_admin",
  "onboarded": true
}
```
5. Create institute_admins record in database

## Post-Deployment Checklist

- [ ] Frontend is accessible at production URL
- [ ] Backend API is responding at `/health`
- [ ] Magic link authentication works
- [ ] Can create candidates
- [ ] Can register family members
- [ ] Email delivery is working
- [ ] Prescription upload and processing works
- [ ] Medication reminders are being created
- [ ] All dashboards are accessible
- [ ] Mobile responsiveness is good
- [ ] SSL certificates are active
- [ ] Database backups are configured
- [ ] Monitoring is set up

## Rollback Plan

If something goes wrong:

1. **Frontend Issues**: Revert deployment in Vercel
2. **Backend Issues**: Rollback to previous deployment
3. **Database Issues**: Restore from Supabase backup
4. **Auth Issues**: Check Supabase Auth settings

## Scaling Considerations

As your app grows:

1. **Database**: Upgrade Supabase plan for more connections
2. **Storage**: Monitor prescription file storage usage
3. **API**: Consider adding caching (Redis)
4. **CDN**: Use Vercel Edge for global distribution
5. **Background Jobs**: Move reminder service to separate worker

## Security Checklist

- [ ] All API keys are in environment variables
- [ ] RLS policies are enabled on all tables
- [ ] CORS is properly configured
- [ ] Rate limiting is considered
- [ ] Input validation is in place
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] HTTPS is enforced
- [ ] Security headers are set

## Performance Optimization

1. **Frontend**:
   - Enable Vercel Edge caching
   - Optimize images
   - Code splitting is automatic with Vite

2. **Backend**:
   - Add Redis caching for frequently accessed data
   - Optimize database queries
   - Add database indexes (already in migrations)

3. **Database**:
   - Monitor slow queries
   - Add indexes as needed
   - Consider connection pooling

## Support

For deployment issues:
- Vercel: [https://vercel.com/support](https://vercel.com/support)
- Render: [https://render.com/support](https://render.com/support)
- Supabase: [https://supabase.com/support](https://supabase.com/support)

