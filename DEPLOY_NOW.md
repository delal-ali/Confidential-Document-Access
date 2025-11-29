# Deploy to Vercel - Right Now! 🚀

## Follow These Steps:

### Step 1: Login to Vercel

Open PowerShell in your project folder and run:

```powershell
vercel login
```

**What happens:**
- Browser will open
- Login with GitHub, GitLab, or email
- Come back to PowerShell when done

---

### Step 2: Deploy

After login, run:

```powershell
vercel
```

**Answer the questions:**
- Set up and deploy? → **Y**
- Which scope? → **Select your account** (press arrow keys, then ENTER)
- Link to existing project? → **N** (first time)
- Project name? → **document-system** (or press ENTER for default)
- Directory? → **./** (press ENTER)
- Override settings? → **N** (press ENTER)

**Vercel will deploy your app!**

---

### Step 3: Get Your URL

After deployment, you'll see:
```
✅ Production: https://your-app.vercel.app
```

**Copy this URL!**

---

### Step 4: Set Up Database (IMPORTANT!)

Vercel needs PostgreSQL (not SQLite). Choose one:

#### 🎯 Option 1: Vercel Postgres (Easiest)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Click **Storage** tab
4. Click **Create Database** → **Postgres**
5. Name: `document-db`
6. Click **Create**
7. Copy the `POSTGRES_URL`
8. Go to **Settings** → **Environment Variables**
9. Add: `DATABASE_URL` = (paste the URL)

#### 🎯 Option 2: Supabase (Free)

1. Go to [supabase.com](https://supabase.com) → Sign up
2. **New Project** → Name: `document-system`
3. **Settings** → **Database** → Copy **Connection string (URI)**
4. In Vercel: **Settings** → **Environment Variables**
5. Add: `DATABASE_URL` = (paste connection string)

---

### Step 5: Update Prisma Schema

Edit `prisma/schema.prisma`:

**Change line 9 from:**
```prisma
provider = "sqlite"
```

**To:**
```prisma
provider = "postgresql"
```

**Save the file!**

---

### Step 6: Set All Environment Variables

In Vercel Dashboard → **Settings** → **Environment Variables**, add:

```
DATABASE_URL=postgresql://... (from step 4)
JWT_SECRET=generate-a-random-32-char-string
ENCRYPTION_KEY=generate-a-random-32-char-string
APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

**Generate secrets:**
```powershell
# JWT_SECRET (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ENCRYPTION_KEY (exactly 32 chars)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

### Step 7: Run Database Setup

On your local machine:

```powershell
# Get environment variables from Vercel
vercel env pull .env.local

# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init

# Deploy migration
npx prisma migrate deploy

# Seed database
npm run db:seed
```

---

### Step 8: Redeploy

```powershell
vercel --prod
```

---

## ✅ Done!

Your app is live at: `https://your-app.vercel.app`

---

## 🆘 If Something Goes Wrong

### "Build failed"
- Check Vercel dashboard → **Deployments** → Click failed deployment → **View Logs**

### "Database connection error"
- Make sure `DATABASE_URL` is set correctly
- Make sure you ran migrations (Step 7)

### "Environment variables not working"
- Set them in Vercel dashboard (not just `.env`)
- Redeploy after adding variables

---

## 📋 Quick Checklist

- [ ] `vercel login` - Done
- [ ] `vercel` - Deployed
- [ ] Got app URL
- [ ] Set up PostgreSQL (Vercel Postgres or Supabase)
- [ ] Updated `prisma/schema.prisma` to `postgresql`
- [ ] Set all environment variables in Vercel
- [ ] Ran migrations locally
- [ ] `vercel --prod` - Redeployed
- [ ] App working! 🎉

---

**Start with Step 1: `vercel login`** 🚀

