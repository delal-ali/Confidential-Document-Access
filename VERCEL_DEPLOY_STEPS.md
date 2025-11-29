# Deploy to Vercel - Step by Step

## 🚀 Quick Deployment Steps

### Step 1: Login to Vercel

Open PowerShell and run:
```powershell
vercel login
```

This will:
- Open your browser
- Ask you to login/signup
- Link your account

**Press ENTER when it says "Press [ENTER] to open the browser"**

---

### Step 2: Deploy to Vercel

After logging in, run:
```powershell
vercel --prod
```

Follow the prompts:
- **Set up and deploy?** → Type `Y` and press ENTER
- **Which scope?** → Select your account
- **Link to existing project?** → Type `N` (first time)
- **What's your project's name?** → Type `document-system` (or any name)
- **In which directory is your code located?** → Type `./` and press ENTER
- **Want to override the settings?** → Type `N` and press ENTER

**Vercel will now deploy your app!**

---

### Step 3: Get Your App URL

After deployment, Vercel will show you:
```
✅ Production: https://your-app-name.vercel.app
```

**Copy this URL!**

---

### Step 4: Set Environment Variables

Go to [vercel.com/dashboard](https://vercel.com/dashboard):
1. Click on your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-min-32-chars
ENCRYPTION_KEY=your-32-character-key
APP_URL=https://your-app-name.vercel.app
NODE_ENV=production
```

**⚠️ IMPORTANT:** You need to set up PostgreSQL first (see below)

---

### Step 5: Setup PostgreSQL Database

Vercel doesn't support SQLite. You need PostgreSQL.

#### Option A: Vercel Postgres (Easiest)

1. In Vercel Dashboard → Your Project
2. Click **Storage** tab
3. Click **Create Database**
4. Select **Postgres**
5. Name it: `document-db`
6. Click **Create**
7. Copy the `POSTGRES_URL` or `DATABASE_URL`
8. Go to **Settings** → **Environment Variables**
9. Add `DATABASE_URL` with the copied value

#### Option B: Supabase (Free)

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free)
3. Create new project
4. Go to **Settings** → **Database**
5. Copy **Connection string** (URI)
6. Add to Vercel environment variables as `DATABASE_URL`

---

### Step 6: Update Prisma Schema

Change `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

---

### Step 7: Run Migrations

On your local machine:

```powershell
# Pull environment variables from Vercel
vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name init

# Deploy migration
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

---

### Step 8: Redeploy

```powershell
vercel --prod
```

---

## ✅ Done!

Your app is now live at: `https://your-app-name.vercel.app`

---

## 🆘 Quick Commands Reference

```powershell
# Deploy
vercel --prod

# View logs
vercel logs

# Open dashboard
vercel open

# Pull environment variables
vercel env pull .env.local
```

---

## 📝 What You Need

1. ✅ Vercel account (free)
2. ✅ PostgreSQL database (Vercel Postgres or Supabase - both free)
3. ✅ Environment variables set
4. ✅ Prisma schema updated to PostgreSQL
5. ✅ Migrations run

---

**Ready? Run `vercel login` to start!** 🚀

