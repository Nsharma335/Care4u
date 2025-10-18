#!/bin/bash

echo "🚀 Deploying Frontend to Vercel..."

cd frontend

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ frontend/.env not found! Please create it first."
    exit 1
fi

# Build first to check for errors
echo "📦 Building frontend..."
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
echo "   VITE_SUPABASE_URL"
echo "   VITE_SUPABASE_ANON_KEY"
echo "   VITE_API_URL"
echo ""

# Deploy with Vercel CLI
vercel --prod

echo ""
echo "✅ Frontend deployment complete!"

