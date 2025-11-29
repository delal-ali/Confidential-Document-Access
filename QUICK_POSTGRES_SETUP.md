# Quick PostgreSQL Setup - Do This Now!

## ✅ Step 1: DONE!
- Schema updated to PostgreSQL ✅
- Prisma client generated ✅

---

## 🚀 Step 2: Create Database (Choose One)

### Option A: Vercel Postgres (2 minutes)

1. **Open:** https://vercel.com/delal-alis-projects/confidential-document-system
2. **Click:** "Storage" tab (left sidebar)
3. **Click:** "Create Database" → "Postgres"
4. **Name:** `document-db`
5. **Click:** "Create"
6. **Copy:** The `POSTGRES_URL` shown

### Option B: Supabase (3 minutes)

1. **Go to:** https://supabase.com → Sign up
2. **New Project** → Name: `document-system`
3. **Save the password!**
4. **Settings** → **Database** → Copy **Connection string (URI)**
5. **Replace** `[YOUR-PASSWORD]` with your actual password

---

## ⚙️ Step 3: Add Environment Variables

**In Vercel Dashboard → Settings → Environment Variables:**

1. **DATABASE_URL:**
   - Key: `DATABASE_URL`
   - Value: (paste connection string from step 2)
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Save

2. **Generate Secrets:**
   ```powershell
   # Run these commands:
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(16).toString('hex'))"
   ```

3. **Add to Vercel:**
   - `JWT_SECRET` = (from command above)
   - `ENCRYPTION_KEY` = (from command above)
   - `APP_URL` = `https://confidential-document-system-1w1tvtkbf-delal-alis-projects.vercel.app`
   - `NODE_ENV` = `production`

---

## 🗄️ Step 4: Run These Commands

```powershell
# Get environment variables from Vercel
vercel env pull .env.local

# Create migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy

# Seed database
npm run db:seed
```

---

## 🚀 Step 5: Redeploy

```powershell
vercel --prod
```

---

## ✅ Done!

Your app will work with PostgreSQL!

**Start with Step 2 - Create your database now!** 🎯

