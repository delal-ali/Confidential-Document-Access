# Run Application Locally on localhost:3000

## 🚀 Quick Start

### Step 1: Switch Back to SQLite (for Local Development)

Since you're running locally, SQLite is easier. Update `prisma/schema.prisma`:

**Change line 9 from:**
```prisma
provider = "postgresql"
```

**To:**
```prisma
provider = "sqlite"
```

**And line 10:**
```prisma
url      = env("DATABASE_URL")
```

**Should use:**
```prisma
url      = env("DATABASE_URL")
```

### Step 2: Create/Update .env File

Create a `.env` file in the root directory with:

```env
# Database (SQLite for local)
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret
JWT_SECRET="your-local-jwt-secret-key-min-32-characters-long-change-this"

# Encryption Key (exactly 32 characters)
ENCRYPTION_KEY="your-32-character-key-here"

# Application
APP_NAME="Confidential Document Access System"
APP_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"
```

### Step 3: Setup Local Database

```powershell
# Generate Prisma client
npx prisma generate

# Create database and tables
npx prisma db push

# Seed database with default roles
npm run db:seed
```

### Step 4: Run Development Server

```powershell
npm run dev
```

### Step 5: Open Browser

Go to: **http://localhost:3000**

---

## ✅ That's It!

Your app is now running locally on **http://localhost:3000**

---

## 📋 Quick Commands

```powershell
# Start dev server
npm run dev

# Stop server
Ctrl + C

# Reset database (if needed)
npx prisma migrate reset

# View database
npx prisma studio
```

---

## 🔄 Switching Between Local (SQLite) and Production (PostgreSQL)

### For Local Development:
- Use SQLite in `prisma/schema.prisma`
- `DATABASE_URL="file:./prisma/dev.db"`

### For Production (Vercel):
- Use PostgreSQL in `prisma/schema.prisma`
- `DATABASE_URL` from Vercel Postgres

**You can keep both - just change before deploying!**

---

**Run `npm run dev` to start!** 🚀

