# Setup PostgreSQL for Vercel - Quick Guide

## ✅ Step 1: Schema Updated!

I've already updated `prisma/schema.prisma` to use PostgreSQL.

---

## 🚀 Step 2: Create PostgreSQL Database

### Option A: Vercel Postgres (Easiest - Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/delal-alis-projects/confidential-document-system
   - Or: https://vercel.com/dashboard → Click your project

2. **Create Database:**
   - Click **"Storage"** tab (left sidebar)
   - Click **"Create Database"**
   - Select **"Postgres"**
   - Name: `document-db` (or any name)
   - Click **"Create"**

3. **Get Connection String:**
   - After creation, you'll see connection details
   - Copy the **`POSTGRES_URL`** or **`DATABASE_URL`**
   - It looks like: `postgres://default:password@host:5432/verceldb`

4. **Add to Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Click **"Add New"**
   - Key: `DATABASE_URL`
   - Value: (paste the connection string)
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click **"Save"**

---

### Option B: Supabase (Free Alternative)

1. **Sign Up:**
   - Go to https://supabase.com
   - Click "Start your project" → Sign up (free)

2. **Create Project:**
   - Click "New Project"
   - Organization: Create new or use existing
   - Name: `document-system`
   - Database Password: (save this password!)
   - Region: Choose closest to you
   - Click "Create new project"
   - Wait 2-3 minutes for setup

3. **Get Connection String:**
   - Go to **Settings** (gear icon) → **Database**
   - Scroll to **"Connection string"**
   - Select **"URI"** tab
   - Copy the connection string
   - Replace `[YOUR-PASSWORD]` with your actual password
   - It looks like: `postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres`

4. **Add to Vercel:**
   - Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
   - Add `DATABASE_URL` with the Supabase connection string

---

## 🔧 Step 3: Set All Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add these:

### Required Variables:

```
DATABASE_URL=postgresql://... (from step 2)
JWT_SECRET=your-secret-here
ENCRYPTION_KEY=your-32-character-key
APP_URL=https://confidential-document-system-1w1tvtkbf-delal-alis-projects.vercel.app
NODE_ENV=production
```

### Generate Secrets:

Run these in PowerShell to generate secure secrets:

```powershell
# Generate JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Copy the outputs and use them as your secrets.

### Optional (for email features):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com
```

**Important:** For each variable, select all environments (Production, Preview, Development) before saving.

---

## 🗄️ Step 4: Run Database Migration

On your local machine, run these commands:

```powershell
# Pull environment variables from Vercel
vercel env pull .env.local

# Generate Prisma client for PostgreSQL
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Deploy migration to production database
npx prisma migrate deploy

# Seed database with default roles and permissions
npm run db:seed
```

**Note:** The `migrate dev` command will ask to create a new migration. Type `Y` and press ENTER.

---

## 🚀 Step 5: Redeploy

After setting up the database and running migrations:

```powershell
vercel --prod
```

This will redeploy your app with PostgreSQL.

---

## ✅ Verification

After redeploy:

1. **Visit your app:**
   - https://confidential-document-system-1w1tvtkbf-delal-alis-projects.vercel.app

2. **Test:**
   - Try to register a new user
   - Try to login
   - Check if database operations work

3. **Check Logs (if issues):**
   ```powershell
   vercel logs
   ```

---

## 🆘 Troubleshooting

### "Database connection error"
- Verify `DATABASE_URL` is correct in Vercel
- Make sure you ran `npx prisma migrate deploy`
- Check database is accessible (not paused)

### "Migration failed"
- Make sure `DATABASE_URL` is set correctly
- Try: `npx prisma migrate reset` (WARNING: deletes all data)
- Then: `npx prisma migrate deploy` and `npm run db:seed`

### "Environment variables not working"
- Set them in Vercel dashboard (not just `.env.local`)
- Make sure you selected all environments
- Redeploy after adding variables

---

## 📋 Quick Checklist

- [ ] Updated `prisma/schema.prisma` to `postgresql` ✅ (Done!)
- [ ] Created PostgreSQL database (Vercel Postgres or Supabase)
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Generated and added `JWT_SECRET`
- [ ] Generated and added `ENCRYPTION_KEY`
- [ ] Added `APP_URL` and `NODE_ENV`
- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma migrate dev --name init`
- [ ] Ran `npx prisma migrate deploy`
- [ ] Ran `npm run db:seed`
- [ ] Redeployed with `vercel --prod`
- [ ] Tested the app

---

**Start with Step 2: Create your PostgreSQL database!** 🚀

