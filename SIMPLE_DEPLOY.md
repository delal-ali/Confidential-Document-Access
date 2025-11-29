# Simple Deployment Guide - From Local Machine with SQLite

## ✅ Keep SQLite - No Changes Needed!

Your `prisma/schema.prisma` is already set to SQLite - **keep it that way!**

---

## 🚀 Easiest Method: Railway (5 Minutes)

### Step 1: Install Railway CLI

**Windows (PowerShell):**
```powershell
npm install -g @railway/cli
```

**Mac/Linux:**
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```
- This will open your browser
- Sign up/login with GitHub, Google, or email

### Step 3: Initialize Project

```bash
railway init
```
- Choose "Create a new project"
- Give it a name (e.g., "document-system")

### Step 4: Set Environment Variables

```bash
# Set them one by one (replace with your actual values)
railway variables set DATABASE_URL="file:./data.db"
railway variables set JWT_SECRET="your-secret-key-min-32-characters-long"
railway variables set ENCRYPTION_KEY="exactly-32-characters-here"
railway variables set APP_URL="https://your-app.railway.app"
railway variables set NODE_ENV="production"
```

**Generate secrets:**
- **JWT_SECRET**: Use a random string generator or: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **ENCRYPTION_KEY**: Must be exactly 32 characters: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

### Step 5: Deploy

```bash
railway up
```

This will:
- Upload your code
- Install dependencies
- Build your app
- Deploy it

### Step 6: Setup Database

```bash
# Generate Prisma client
railway run npm run db:generate

# Create database tables
railway run npx prisma db push

# Seed with default roles
railway run npm run db:seed
```

### Step 7: Get Your URL

```bash
railway domain
```

Or check Railway dashboard for your app URL.

### Step 8: Update APP_URL

After you get your URL, update it:
```bash
railway variables set APP_URL="https://your-actual-url.railway.app"
```

**Done!** Your app is live! 🎉

---

## 📋 Quick Reference Commands

```bash
# Deploy
railway up

# View logs
railway logs

# Run commands
railway run npm run db:seed

# Open dashboard
railway open

# Get URL
railway domain
```

---

## 🔧 Alternative: Use the Script

I've created a PowerShell script for you:

**Windows:**
```powershell
.\railway-deploy.ps1
```

**Mac/Linux:**
```bash
chmod +x railway-deploy.sh
./railway-deploy.sh
```

---

## ❓ Why SQLite is Fine

**SQLite works great for:**
- ✅ Your project (document management system)
- ✅ Small to medium traffic
- ✅ Single server deployment
- ✅ Simpler setup (no database server needed)

**You only need PostgreSQL if:**
- You have multiple servers
- Millions of daily requests
- Need advanced database features

**For your project, SQLite is perfect!**

---

## 🆘 Troubleshooting

### "Railway command not found"
```bash
npm install -g @railway/cli
```

### "Database error"
Make sure you ran:
```bash
railway run npm run db:generate
railway run npx prisma db push
railway run npm run db:seed
```

### "Environment variables not working"
Check in Railway dashboard:
- Go to your project
- Click "Variables" tab
- Make sure all variables are set

### "Build failed"
Check logs:
```bash
railway logs
```

---

## 📝 What Happens to Your Database?

- SQLite database file (`data.db`) is stored on Railway's persistent storage
- It persists between deployments
- You can download it for backups from Railway dashboard

---

## 🎯 That's It!

1. Install Railway CLI
2. `railway login`
3. `railway init`
4. Set environment variables
5. `railway up`
6. Setup database
7. Done!

**No GitHub needed. No PostgreSQL needed. Just deploy from your local machine!** 🚀

