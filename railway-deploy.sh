#!/bin/bash

# Railway Deployment Script for SQLite
# Run this from your project root directory

echo "🚀 Starting Railway Deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "📝 Logging in to Railway..."
railway login

# Initialize project (if not already initialized)
if [ ! -f ".railway" ]; then
    echo "🔧 Initializing Railway project..."
    railway init
fi

# Link project
echo "🔗 Linking project..."
railway link

# Set environment variables
echo "⚙️  Setting environment variables..."
read -p "Enter JWT_SECRET (min 32 chars): " JWT_SECRET
read -p "Enter ENCRYPTION_KEY (exactly 32 chars): " ENCRYPTION_KEY
read -p "Enter APP_URL (will be provided after deploy): " APP_URL

railway variables set DATABASE_URL="file:./data.db"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set ENCRYPTION_KEY="$ENCRYPTION_KEY"
railway variables set APP_URL="$APP_URL"
railway variables set NODE_ENV="production"

# Deploy
echo "🚀 Deploying to Railway..."
railway up

# Setup database
echo "🗄️  Setting up database..."
railway run npm run db:generate
railway run npx prisma db push
railway run npm run db:seed

# Get URL
echo "✅ Deployment complete!"
echo "🌐 Your app URL:"
railway domain

echo "✨ Done! Your app is live!"

