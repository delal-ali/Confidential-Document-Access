# Quick Deployment Guide - FROM LOCAL MACHINE

## ✅ Keep SQLite - No PostgreSQL Needed!

Your project uses SQLite - **keep it that way!** No need to change to PostgreSQL.

---

## 🚀 Fastest Way: Railway (5 minutes) - FROM LOCAL

### Step-by-Step:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize:**
   ```bash
   railway init
   ```

4. **Set Environment Variables:**
   ```bash
   railway variables set DATABASE_URL="file:./data.db"
   railway variables set JWT_SECRET="your-secret"
   railway variables set ENCRYPTION_KEY="your-32-char-key"
   railway variables set APP_URL="https://your-app.railway.app"
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Setup Database:**
   ```bash
   railway run npm run db:generate
   railway run npx prisma db push
   railway run npm run db:seed
   ```

**Done!** Your app is live with SQLite!

---

## ❌ OLD OPTIONS (Ignore if deploying from local)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow prompts:**
   - Login to Vercel
   - Link project
   - Deploy

4. **Add Environment Variables:**
   - Go to Vercel Dashboard
   - Settings → Environment Variables
   - Add all variables from `.env`

5. **Setup PostgreSQL:**
   - Use Vercel Postgres or Supabase
   - Update `DATABASE_URL`
   - Change `prisma/schema.prisma` to `postgresql`
   - Run: `npx prisma migrate deploy`

**Done!** Your app is live at `https://your-project.vercel.app`

---

### Option 2: Railway (10 minutes)

1. **Go to [railway.app](https://railway.app)**
2. **Click "New Project" → "Deploy from GitHub"**
3. **Select your repository**
4. **Add PostgreSQL database:**
   - Click "New" → "Database" → "PostgreSQL"
5. **Add environment variables:**
   - Copy from `.env` file
6. **Update schema:**
   - Change `prisma/schema.prisma` to `postgresql`
   - Railway will auto-deploy

**Done!** Your app is live!

---

## ⚠️ Important: Database Migration

**Before deploying, you MUST:**

1. **Update `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. **Generate Prisma Client:**
   ```bash
   npm run db:generate
   ```

3. **Create Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Deploy Migration (on production):**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed Database:**
   ```bash
   npm run db:seed
   ```

---

## 📋 Environment Variables Checklist

Make sure to set these in your deployment platform:

✅ `DATABASE_URL` - PostgreSQL connection string  
✅ `JWT_SECRET` - Random 32+ character string  
✅ `ENCRYPTION_KEY` - Exactly 32 characters  
✅ `APP_URL` - Your production URL  
✅ `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD` - For emails  

---

## 🎯 Recommended: Railway

**Why Railway?**
- ✅ Supports SQLite (can keep it)
- ✅ Easy PostgreSQL setup
- ✅ Free tier
- ✅ Automatic deployments
- ✅ Simple configuration

**Steps:**
1. Sign up at railway.app
2. Deploy from GitHub
3. Add PostgreSQL database
4. Set environment variables
5. Done!

---

## 📞 Need Help?

Check `DEPLOYMENT_GUIDE.md` for detailed instructions.

