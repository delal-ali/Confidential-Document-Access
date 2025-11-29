# Fix Login/Register Not Working

## 🔍 Problem
Registration and login don't work after deployment.

## ✅ Solution: Set Up Database

The app needs a PostgreSQL database to work. Here's how to fix it:

---

## 🚀 Step 1: Create PostgreSQL Database

### Option A: Vercel Postgres (Easiest)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/delal-alis-projects/confidential-document-system
   - Or: https://vercel.com/dashboard → Click your project

2. **Create Database:**
   - Click **"Storage"** tab (left sidebar)
   - Click **"Create Database"**
   - Select **"Postgres"**
   - Name: `document-db`
   - Click **"Create"**

3. **Copy Connection String:**
   - After creation, you'll see connection details
   - Copy the **`POSTGRES_URL`** or **`DATABASE_URL`**
   - It looks like: `postgres://default:password@host:5432/verceldb`

---

### Option B: Supabase (Free Alternative)

1. **Sign Up:**
   - Go to https://supabase.com
   - Click "Start your project" → Sign up (free)

2. **Create Project:**
   - Click "New Project"
   - Name: `document-system`
   - **Save the password!**
   - Region: Choose closest
   - Click "Create new project"
   - Wait 2-3 minutes

3. **Get Connection String:**
   - Go to **Settings** (gear icon) → **Database**
   - Scroll to **"Connection string"**
   - Select **"URI"** tab
   - Copy the connection string
   - **Replace** `[YOUR-PASSWORD]` with your actual password
   - Example: `postgresql://postgres:yourpassword@db.xxxxx.supabase.co:5432/postgres`

---

## ⚙️ Step 2: Add Environment Variables

**In Vercel Dashboard → Settings → Environment Variables:**

Add these variables (select **all environments**: Production, Preview, Development):

### 1. DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** (paste connection string from Step 1)
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Save**

### 2. JWT_SECRET
- **Key:** `JWT_SECRET`
- **Value:** `88114ba2ab5483297a22ca96734e44e6a0fc636277e1585fa1e2f2ad137ae1a7`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Save**

### 3. ENCRYPTION_KEY
- **Key:** `ENCRYPTION_KEY`
- **Value:** `b9e81c74289d7248ff809d2422fde2c1`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Save**

### 4. APP_URL
- **Key:** `APP_URL`
- **Value:** `https://confidential-document-system-9uaf67pi3-delal-alis-projects.vercel.app`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Save**

### 5. NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- **Save**

---

## 🗄️ Step 3: Setup Database Tables

After adding `DATABASE_URL`, run these commands on your local machine:

```powershell
# Pull environment variables from Vercel
vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Deploy migration to production database
npx prisma migrate deploy

# Seed database with default roles and permissions
npm run db:seed
```

**Important:** When running `npx prisma migrate dev`, it will ask to create a new migration. Type `Y` and press ENTER.

---

## 🚀 Step 4: Redeploy

After setting up the database and running migrations:

```powershell
vercel --prod
```

This will redeploy with the database connection.

---

## ✅ Step 5: Test

1. **Visit your app:**
   - https://confidential-document-system-9uaf67pi3-delal-alis-projects.vercel.app

2. **Try to register:**
   - Click "Register"
   - Fill in the form
   - Submit

3. **Try to login:**
   - Use the credentials you just registered
   - Should work now!

---

## 🆘 Troubleshooting

### "Database connection error"
- Verify `DATABASE_URL` is correct in Vercel
- Make sure you ran `npx prisma migrate deploy`
- Check database is not paused (Supabase/Vercel Postgres)

### "Migration failed"
- Make sure `DATABASE_URL` is set correctly
- Try: `npx prisma migrate reset` (WARNING: deletes all data)
- Then: `npx prisma migrate deploy` and `npm run db:seed`

### "Still not working after redeploy"
- Check Vercel logs: `vercel logs`
- Make sure all environment variables are set
- Verify database is accessible

### "Can't connect to database"
- Check if database is paused (Supabase pauses after inactivity)
- Verify connection string format
- Make sure password is correct (for Supabase)

---

## 📋 Quick Checklist

- [ ] Created PostgreSQL database (Vercel Postgres or Supabase)
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Added `JWT_SECRET` to Vercel environment variables
- [ ] Added `ENCRYPTION_KEY` to Vercel environment variables
- [ ] Added `APP_URL` to Vercel environment variables
- [ ] Added `NODE_ENV` to Vercel environment variables
- [ ] Ran `vercel env pull .env.local`
- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma migrate dev --name init`
- [ ] Ran `npx prisma migrate deploy`
- [ ] Ran `npm run db:seed`
- [ ] Ran `vercel --prod` to redeploy
- [ ] Tested registration and login

---

**Start with Step 1: Create your PostgreSQL database!** 🚀

