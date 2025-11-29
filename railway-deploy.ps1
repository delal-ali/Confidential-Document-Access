# Railway Deployment Script for SQLite (PowerShell)
# Run this from your project root directory

Write-Host "🚀 Starting Railway Deployment..." -ForegroundColor Green

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Login to Railway
Write-Host "📝 Logging in to Railway..." -ForegroundColor Cyan
railway login

# Initialize project (if not already initialized)
if (-not (Test-Path ".railway")) {
    Write-Host "🔧 Initializing Railway project..." -ForegroundColor Cyan
    railway init
}

# Link project
Write-Host "🔗 Linking project..." -ForegroundColor Cyan
railway link

# Set environment variables
Write-Host "⚙️  Setting environment variables..." -ForegroundColor Cyan
$JWT_SECRET = Read-Host "Enter JWT_SECRET (min 32 chars)"
$ENCRYPTION_KEY = Read-Host "Enter ENCRYPTION_KEY (exactly 32 chars)"
$APP_URL = Read-Host "Enter APP_URL (will be provided after deploy, can use placeholder for now)"

railway variables set DATABASE_URL="file:./data.db"
railway variables set JWT_SECRET="$JWT_SECRET"
railway variables set ENCRYPTION_KEY="$ENCRYPTION_KEY"
railway variables set APP_URL="$APP_URL"
railway variables set NODE_ENV="production"

# Deploy
Write-Host "🚀 Deploying to Railway..." -ForegroundColor Green
railway up

# Setup database
Write-Host "🗄️  Setting up database..." -ForegroundColor Cyan
railway run npm run db:generate
railway run npx prisma db push
railway run npm run db:seed

# Get URL
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your app URL:" -ForegroundColor Cyan
railway domain

Write-Host "✨ Done! Your app is live!" -ForegroundColor Green

