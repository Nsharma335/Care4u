#!/bin/bash

# Care4U Setup Script
echo "🚀 Setting up Care4U..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install shared dependencies and build
echo "📦 Installing shared types..."
cd shared
npm install
npm run build
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Create uploads directory
mkdir -p uploads

# Copy environment example if .env doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating backend .env file..."
    cp .env.example .env
    echo "⚠️  Please update backend/.env with your credentials"
fi

cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install

# Copy environment example if .env doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating frontend .env file..."
    cp .env.example .env
    echo "⚠️  Please update frontend/.env with your credentials"
fi

cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update backend/.env with your Supabase and OpenAI credentials"
echo "2. Update frontend/.env with your Supabase credentials"
echo "3. Run database migrations in Supabase"
echo "4. Run 'npm run dev' to start both frontend and backend"
echo ""
echo "📚 See SETUP.md for detailed instructions"

