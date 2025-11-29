# Deploy to Vercel - Complete Guide

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Login

```powershell
vercel login
```
- Opens browser to login/signup
- Use GitHub, GitLab, or email

### Step 3: Deploy

```powershell
vercel --prod
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No** (first time)
- Project name? **document-system** (or any name)
- Directory? **./** (current directory)
- Override settings? **No**

**Done!** Your app will be deployed.

---

## ⚠️ Database Setup Required

Vercel is serverless and doesn't support SQLite well. You need PostgreSQL.

### Option 1: Vercel Postgres (Easiest)

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click your project

2. **Add Postgres:**
   - Go to "Storage" tab
   - Click "Create Database"
   - Select "Postgres"
   - Choose a name
   - Click "Create"

3. **Get Connection String:**
   - Go to "Storage" → Your database
   - Copy the `POSTGRES_URL` or `DATABASE_URL`

4. **Update Environment Variables:**
   - Go to "Settings" → "Environment Variables"
   - Add `DATABASE_URL` with the connection string

5. **Update Prisma Schema:**
   - Change `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

6. **Redeploy:**
   ```powershell
   vercel --prod
   ```

7. **Run Migrations:**
   ```powershell
   vercel env pull .env.local
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

### Option 2: Supabase (Free PostgreSQL)

1. **Create Supabase Account:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up (free)

2. **Create Project:**
   - Click "New Project"
   - Choose organization
   - Name: "document-system"
   - Database password: (save this!)
   - Region: Choose closest
   - Click "Create new project"

3. **Get Connection String:**
   - Go to "Settings" → "Database"
   - Find "Connection string" → "URI"
   - Copy it (looks like: `postgresql://postgres:[password]@[host]:5432/postgres`)

4. **Update Environment Variables in Vercel:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add `DATABASE_URL` with Supabase connection string

5. **Update Prisma Schema:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

6. **Redeploy:**
   ```powershell
   vercel --prod
   ```

7. **Run Migrations:**
   ```powershell
   # Get environment variables
   vercel env pull .env.local
   
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Seed database
   npx prisma db seed
   ```

---

### Option 3: Neon (Free PostgreSQL)

1. **Create Neon Account:**
   - Go to [neon.tech](https://neon.tech)
   - Sign up (free)

2. **Create Project:**
   - Click "Create Project"
   - Name: "document-system"
   - Click "Create"

3. **Get Connection String:**
   - Copy the connection string from dashboard

4. **Update Environment Variables in Vercel:**
   - Add `DATABASE_URL` with Neon connection string

5. **Update Prisma Schema:**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

6. **Redeploy and migrate** (same as Supabase)

---

## 📋 Complete Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
JWT_SECRET="your-secret-key-min-32-chars"
ENCRYPTION_KEY="your-32-character-key"
APP_URL="https://your-app.vercel.app"
NODE_ENV="production"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

---

## 🔄 Migration Steps (After Setting Up PostgreSQL)

1. **Update `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"  // Change this
     url      = env("DATABASE_URL")
   }
   ```

2. **Generate Prisma Client:**
   ```powershell
   npx prisma generate
   ```

3. **Create Migration:**
   ```powershell
   npx prisma migrate dev --name init
   ```

4. **Deploy Migration:**
   ```powershell
   # Get env vars from Vercel
   vercel env pull .env.local
   
   # Deploy migration
   npx prisma migrate deploy
   
   # Seed database
   npx prisma db seed
   ```

5. **Redeploy:**
   ```powershell
   vercel --prod
   ```

---

## 🚀 Quick Deploy Script

I've created a script for you:

```powershell
.\vercel-deploy.ps1
```

Or manually:

```powershell
npm install -g vercel
vercel login
vercel --prod
```

---

## 📝 Post-Deployment Checklist

- [ ] App deployed to Vercel
- [ ] PostgreSQL database set up (Vercel Postgres, Supabase, or Neon)
- [ ] `DATABASE_URL` environment variable set
- [ ] Prisma schema updated to `postgresql`
- [ ] Migrations run
- [ ] Database seeded
- [ ] All environment variables set
- [ ] App tested and working

---

## 🆘 Troubleshooting

### "Build failed"
- Check build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Verify Node.js version (18+)

### "Database connection error"
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Make sure migrations ran

### "Environment variables not working"
- Set them in Vercel dashboard (not just `.env`)
- Redeploy after adding variables
- Check variable names match exactly

---

## ✅ That's It!

1. Deploy to Vercel: `vercel --prod`
2. Set up PostgreSQL (Vercel Postgres recommended)
3. Update Prisma schema to `postgresql`
4. Run migrations
5. Done!

**Your app will be live at `https://your-app.vercel.app`** 🎉

