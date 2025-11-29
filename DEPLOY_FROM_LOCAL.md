# Deploy from Local Machine (SQLite)

## ✅ Keep SQLite - No PostgreSQL Required!

You can deploy with SQLite! Here are the best options:

---

## 🚀 Option 1: Railway (Easiest - Supports SQLite)

Railway supports SQLite with persistent storage. Perfect for your use case!

### Steps:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize Railway Project:**
   ```bash
   railway init
   ```
   - This will create a new project on Railway
   - Follow the prompts

4. **Link Your Project:**
   ```bash
   railway link
   ```
   - Select your project or create a new one

5. **Set Environment Variables:**
   ```bash
   # Set each variable one by one
   railway variables set DATABASE_URL="file:./data.db"
   railway variables set JWT_SECRET="your-jwt-secret-here"
   railway variables set ENCRYPTION_KEY="your-32-character-key"
   railway variables set APP_URL="https://your-app.railway.app"
   railway variables set NODE_ENV="production"
   ```

   Or set them all at once:
   ```bash
   railway variables set DATABASE_URL="file:./data.db" JWT_SECRET="your-secret" ENCRYPTION_KEY="your-key" APP_URL="https://your-app.railway.app" NODE_ENV="production"
   ```

6. **Deploy:**
   ```bash
   railway up
   ```

7. **Setup Database:**
   ```bash
   # Generate Prisma client
   railway run npm run db:generate
   
   # Push schema
   railway run npx prisma db push
   
   # Seed database
   railway run npm run db:seed
   ```

8. **Get Your URL:**
   ```bash
   railway domain
   ```

**Done!** Your app is live with SQLite!

---

## 🚀 Option 2: Render (Supports SQLite)

### Steps:

1. **Install Render CLI:**
   ```bash
   npm install -g render-cli
   ```

2. **Login:**
   ```bash
   render login
   ```

3. **Create Service:**
   ```bash
   render create service web
   ```
   - Follow prompts to configure

4. **Or Use Web Dashboard:**
   - Go to [render.com](https://render.com)
   - Sign up
   - Click "New" → "Web Service"
   - Choose "Deploy from local machine"
   - Upload your project folder

5. **Configure:**
   - **Build Command:** `npm install && npm run db:generate && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node

6. **Set Environment Variables:**
   - In Render dashboard → Environment
   - Add all your `.env` variables

7. **Deploy:**
   - Click "Deploy"

---

## 🚀 Option 3: Fly.io (Great for SQLite)

### Steps:

1. **Install Fly CLI:**
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **Initialize:**
   ```bash
   fly launch
   ```
   - Follow prompts
   - Choose a region
   - Don't create Postgres (we're using SQLite)

4. **Create `fly.toml` (if not auto-generated):**
   ```toml
   app = "your-app-name"
   primary_region = "iad"
   
   [build]
   
   [http_service]
     internal_port = 3000
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true
     min_machines_running = 0
   
   [[vm]]
     memory_mb = 512
   ```

5. **Set Secrets:**
   ```bash
   fly secrets set DATABASE_URL="file:./data.db"
   fly secrets set JWT_SECRET="your-secret"
   fly secrets set ENCRYPTION_KEY="your-key"
   fly secrets set APP_URL="https://your-app.fly.dev"
   ```

6. **Deploy:**
   ```bash
   fly deploy
   ```

7. **Setup Database:**
   ```bash
   fly ssh console
   # Then inside the machine:
   npm run db:generate
   npx prisma db push
   npm run db:seed
   ```

---

## 🚀 Option 4: Docker + Any Cloud Provider

### Create Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npm run db:generate

# Copy app files
COPY . .

# Build app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### Create docker-compose.yml:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./data.db
      - JWT_SECRET=${JWT_SECRET}
      - ENCRYPTION_KEY=${ENCRYPTION_KEY}
      - APP_URL=${APP_URL}
      - NODE_ENV=production
    volumes:
      - ./data:/app/data  # Persist SQLite database
    restart: unless-stopped
```

### Deploy:

1. **Build and run locally first:**
   ```bash
   docker-compose up -d
   ```

2. **Then deploy to:**
   - DigitalOcean App Platform
   - AWS ECS
   - Google Cloud Run
   - Azure Container Instances

---

## 🚀 Option 5: Self-Hosted VPS (Full Control)

### Steps:

1. **Get a VPS:**
   - DigitalOcean Droplet ($5/month)
   - Linode ($5/month)
   - Vultr ($5/month)
   - AWS EC2

2. **SSH into server:**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

5. **Upload your project:**
   ```bash
   # On your local machine
   scp -r . root@your-server-ip:/var/www/document-system
   ```

   Or use Git (if you create a repo later):
   ```bash
   git clone your-repo-url /var/www/document-system
   ```

6. **On server, setup:**
   ```bash
   cd /var/www/document-system
   npm install
   npm run db:generate
   npm run build
   ```

7. **Create .env file:**
   ```bash
   nano .env
   # Add all your environment variables
   ```

8. **Initialize database:**
   ```bash
   npx prisma db push
   npm run db:seed
   ```

9. **Start with PM2:**
   ```bash
   pm2 start npm --name "document-system" -- start
   pm2 save
   pm2 startup
   ```

10. **Setup Nginx:**
    ```bash
    sudo apt install nginx
    ```

    Create config:
    ```bash
    sudo nano /etc/nginx/sites-available/document-system
    ```

    Add:
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

    Enable:
    ```bash
    sudo ln -s /etc/nginx/sites-available/document-system /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

11. **Setup SSL (Let's Encrypt):**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

**Done!** Your app is live at `https://your-domain.com`

---

## 📋 Environment Variables for SQLite

```env
# Database (SQLite - keep as is!)
DATABASE_URL="file:./data.db"

# JWT
JWT_SECRET="your-secret-key-min-32-chars"

# Encryption
ENCRYPTION_KEY="your-32-character-key"

# Application
APP_NAME="Confidential Document Access System"
APP_URL="https://your-app-url.com"

# Email (optional but recommended)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Node Environment
NODE_ENV="production"
```

---

## ✅ Why SQLite Works Fine!

**SQLite is perfect for:**
- ✅ Small to medium applications
- ✅ Single-server deployments
- ✅ Development and staging
- ✅ Applications with < 100K daily requests
- ✅ When you want simplicity

**You only need PostgreSQL if:**
- ❌ Multiple servers (SQLite doesn't work across servers)
- ❌ Very high traffic (millions of requests)
- ❌ Need advanced features (replication, etc.)

**For your project, SQLite is perfectly fine!**

---

## 🎯 Recommended: Railway (Easiest)

**Why Railway?**
- ✅ Deploy from local machine (no GitHub needed)
- ✅ Supports SQLite natively
- ✅ Persistent storage
- ✅ Free tier available
- ✅ Simple CLI commands
- ✅ Automatic HTTPS

**Quick Start:**
```bash
npm install -g @railway/cli
railway login
railway init
railway link
railway variables set DATABASE_URL="file:./data.db" JWT_SECRET="your-secret" ENCRYPTION_KEY="your-key"
railway up
```

**That's it!** Your app will be live in minutes.

---

## 📝 Notes

1. **Keep `prisma/schema.prisma` as SQLite** - No need to change!
2. **Database file will persist** - Railway/Render store it in persistent volumes
3. **Backup your database** - Download `data.db` regularly
4. **Environment variables** - Set them in your deployment platform

---

## 🆘 Need Help?

If you get stuck:
1. Check the platform's documentation
2. Look at error logs in the dashboard
3. Make sure all environment variables are set
4. Verify database file permissions

**You're all set! Deploy with SQLite from your local machine!** 🚀

