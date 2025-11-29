# Vercel Deployment Script (PowerShell)
# Run this from your project root directory

Write-Host "🚀 Starting Vercel Deployment..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login to Vercel
Write-Host "📝 Logging in to Vercel..." -ForegroundColor Cyan
vercel login

# Deploy
Write-Host "🚀 Deploying to Vercel..." -ForegroundColor Green
vercel --prod

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Your app is live on Vercel!" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: You need to set up PostgreSQL for the database." -ForegroundColor Yellow
Write-Host "   Options:" -ForegroundColor Yellow
Write-Host "   1. Vercel Postgres (recommended)" -ForegroundColor Yellow
Write-Host "   2. Supabase (free PostgreSQL)" -ForegroundColor Yellow
Write-Host "   3. Neon (free PostgreSQL)" -ForegroundColor Yellow
Write-Host ""
Write-Host "   See DEPLOY_VERCEL.md for database setup instructions." -ForegroundColor Cyan

