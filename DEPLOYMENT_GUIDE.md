# Deployment Guide

## ✅ Build Status: Ready for Deployment

The application has been successfully built and is ready for deployment.

---

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Next.js)

**Pros:**
- Easiest deployment for Next.js
- Automatic SSL
- Global CDN
- Free tier available

**Cons:**
- SQLite not supported (need PostgreSQL)
- Serverless functions have time limits

**Steps:**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Set Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all variables from `.env` file

5. **Setup PostgreSQL Database:**
   - Use Vercel Postgres or external service (Supabase, Neon, etc.)
   - Update `DATABASE_URL` in environment variables
   - Update `prisma/schema.prisma` to use `postgresql` instead of `sqlite`
   - Run migrations: `npx prisma migrate deploy`

---

### Option 2: Railway (Recommended for SQLite)

**Pros:**
- Supports SQLite
- Easy PostgreSQL setup
- Persistent storage
- Free tier available

**Steps:**

1. **Create Railway Account:**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your repository

3. **Add PostgreSQL Database (Recommended):**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provide `DATABASE_URL`

4. **Set Environment Variables:**
   - Go to Variables tab
   - Add all required environment variables

5. **Deploy:**
   - Railway will automatically deploy on push
   - Or click "Deploy" button

6. **Update Database:**
   - Update `prisma/schema.prisma` to use `postgresql`
   - Add build command: `npm run db:generate && npm run build`
   - Add start command: `npm start`

---

### Option 3: Render

**Pros:**
- Supports both SQLite and PostgreSQL
- Persistent storage
- Free tier available

**Steps:**

1. **Create Render Account:**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Web Service:**
   - Click "New" → "Web Service"
   - Connect your GitHub repository

3. **Configure:**
   - **Build Command:** `npm install && npm run db:generate && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

4. **Add PostgreSQL Database:**
   - Click "New" → "PostgreSQL"
   - Copy `DATABASE_URL` to environment variables

5. **Set Environment Variables:**
   - Add all required variables in Environment section

6. **Deploy:**
   - Click "Create Web Service"
   - Render will build and deploy

---

### Option 4: Self-Hosted (VPS/Cloud Server)

**Requirements:**
- Node.js 18+
- PostgreSQL or SQLite
- PM2 (for process management)

**Steps:**

1. **Setup Server:**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   ```

2. **Clone Repository:**
   ```bash
   git clone <your-repo-url>
   cd CSS
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Setup Environment:**
   ```bash
   # Copy .env file
   cp .env.example .env
   # Edit .env with production values
   nano .env
   ```

5. **Setup Database:**
   ```bash
   # For PostgreSQL
   npm run db:generate
   npx prisma migrate deploy
   npm run db:seed
   ```

6. **Build Application:**
   ```bash
   npm run build
   ```

7. **Start with PM2:**
   ```bash
   pm2 start npm --name "document-system" -- start
   pm2 save
   pm2 startup
   ```

8. **Setup Nginx (Reverse Proxy):**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 📋 Required Environment Variables

Make sure to set these in your deployment platform:

```env
# Database (PostgreSQL for production)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"

# Encryption
ENCRYPTION_KEY="your-32-character-key"

# Application
APP_NAME="Confidential Document Access System"
APP_URL="https://your-domain.com"

# Email (for password reset, verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Optional
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
```

---

## 🔄 Database Migration (SQLite → PostgreSQL)

If you need to migrate from SQLite to PostgreSQL:

1. **Update `prisma/schema.prisma`:**
   ```prisma
   datasource db {
     provider = "postgresql"
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

4. **Deploy Migration:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed Database:**
   ```bash
   npm run db:seed
   ```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Change all default secrets
- [ ] Use strong, randomly generated secrets
- [ ] Enable HTTPS/SSL
- [ ] Set secure CORS policies
- [ ] Configure rate limiting
- [ ] Set up email sending (for password reset)
- [ ] Enable database backups
- [ ] Set up monitoring and alerts
- [ ] Review and update environment variables
- [ ] Test password reset flow
- [ ] Test all access control mechanisms

---

## 📊 Post-Deployment Steps

1. **Create Admin User:**
   ```bash
   npm run assign-admin <username>
   ```

2. **Verify Database:**
   ```bash
   npm run db:studio
   ```

3. **Test Application:**
   - Test login/registration
   - Test document creation
   - Test access control
   - Test password reset

4. **Monitor Logs:**
   - Check application logs
   - Monitor error rates
   - Review audit logs

---

## 🆘 Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Verify all dependencies installed
- Check for TypeScript errors

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Verify network/firewall settings

### Environment Variables Not Working
- Restart application after adding variables
- Verify variable names match exactly
- Check for typos in values

---

## 📚 Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Render Documentation](https://render.com/docs)

---

**Ready to deploy! Choose the option that best fits your needs.**

