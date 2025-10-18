#!/bin/bash

echo "🚀 Deploying Backend to Vercel..."

cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ backend/.env not found! Please create it first."
    exit 1
fi

# Build first to check for errors
echo "📦 Building backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚀 Deploying to Vercel..."
echo ""
echo "⚠️  Make sure to set these environment variables in Vercel:"
echo "   SUPABASE_URL"
echo "   SUPABASE_ANON_KEY"
echo "   SUPABASE_SERVICE_KEY"
echo "   OPENAI_API_KEY"
echo "   FRONTEND_URL (update with your frontend URL after deploying frontend)"
echo "   PORT=8000"
echo ""

# Deploy with Vercel CLI
vercel --prod

echo ""
echo "✅ Backend deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Copy the backend URL"
echo "2. Update frontend VITE_API_URL to point to backend URL"
echo "3. Redeploy frontend with updated API URL"

