# Setup Guide - Confidential Document Access & User Management System

This guide will help you set up and run the project step by step.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Basic understanding of Next.js and TypeScript

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production-min-32-chars"

# JWT
JWT_SECRET="your-jwt-secret-key-change-this-min-32-chars"

# Email (for verification and notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"

# Encryption (for logs and sensitive data)
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Application
APP_NAME="Confidential Document Access System"
APP_URL="http://localhost:3000"

# CAPTCHA (reCAPTCHA v2 or hCaptcha)
CAPTCHA_SECRET_KEY="your-captcha-secret-key"
CAPTCHA_SITE_KEY="your-captcha-site-key"
```

**Important:** 
- Generate secure random strings for `NEXTAUTH_SECRET`, `JWT_SECRET`, and `ENCRYPTION_KEY`
- The `ENCRYPTION_KEY` must be exactly 32 characters long
- For production, use strong, randomly generated secrets

## Step 3: Database Setup

1. Generate Prisma Client:
```bash
npm run db:generate
```

2. Create database and run migrations:
```bash
npm run db:push
```

3. Seed the database with default roles and permissions:
```bash
npm run db:seed
```

This will create:
- Default permissions (document:create, document:read, etc.)
- Default roles (Administrator, Manager, Employee)
- Permission-role mappings

## Step 4: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 5: Create Your First Admin User

1. Register a new account through the registration page
2. The first user will need to be manually assigned the Administrator role through the database or API

Alternatively, you can create an admin user directly in the database:

```bash
npm run db:studio
```

Then manually create a user and assign the Administrator role.

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── documents/     # Document management
│   │   ├── roles/         # Role management
│   │   └── audit-logs/    # Audit log endpoints
│   ├── dashboard/         # Dashboard pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/login page
├── lib/                    # Utility libraries
│   ├── auth/              # Authentication utilities
│   ├── access-control/    # Access control implementations
│   │   ├── mac.ts         # Mandatory Access Control
│   │   ├── dac.ts         # Discretionary Access Control
│   │   ├── rbac.ts        # Role-Based Access Control
│   │   ├── ruac.ts        # Rule-Based Access Control
│   │   └── abac.ts        # Attribute-Based Access Control
│   ├── audit/             # Audit logging
│   ├── backup/            # Backup functionality
│   ├── db.ts              # Prisma client
│   └── encryption.ts      # Encryption utilities
├── prisma/                # Database schema
│   ├── schema.prisma      # Prisma schema
│   └── seed.ts            # Database seed script
└── public/                # Static assets
```

## Key Features Implemented

### Access Control
- ✅ **MAC (Mandatory Access Control)**: Security labels and clearance levels
- ✅ **DAC (Discretionary Access Control)**: Document ownership and permissions
- ✅ **RBAC (Role-Based Access Control)**: Role-based permissions
- ✅ **RuBAC (Rule-Based Access Control)**: Time, location, and device-based rules
- ✅ **ABAC (Attribute-Based Access Control)**: Fine-grained attribute-based policies

### Authentication & Security
- ✅ User registration with email verification
- ✅ Password policies and secure hashing (bcrypt)
- ✅ Account lockout protection (5 failed attempts = 30 min lockout)
- ✅ Multi-Factor Authentication (MFA) with TOTP
- ✅ Token-based authentication (JWT)
- ✅ Session management

### Audit & Logging
- ✅ Comprehensive user activity logging
- ✅ System event logging
- ✅ Encrypted log storage
- ✅ Centralized logging
- ✅ Security alert mechanisms

### Data Management
- ✅ Document access control
- ✅ User profile management
- ✅ Data backup functionality

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify MFA

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/[id]` - Get document (with access control checks)
- `POST /api/documents/[id]/permissions` - Grant document permissions

### Roles & Permissions
- `GET /api/roles` - List roles
- `POST /api/roles` - Create role

### Audit
- `GET /api/audit-logs` - View audit logs

## Testing Access Control

### MAC Testing
1. Create a user with `CONFIDENTIAL` security label
2. Create a document with `TOP_SECRET` classification
3. Try to access - should be denied

### DAC Testing
1. Create a document as User A
2. Grant read permission to User B
3. User B should be able to read but not write

### RBAC Testing
1. Assign "Manager" role to a user
2. User should have manager permissions
3. Remove role - permissions should be revoked

### RuBAC Testing
1. Create a time-based rule (e.g., only 9 AM - 5 PM)
2. Try accessing outside hours - should be denied

### ABAC Testing
1. Create attribute-based policy (e.g., "Manager in Finance Department")
2. Test with different user attributes

## Security Best Practices

1. **Change all default secrets** in production
2. **Use HTTPS** in production
3. **Implement rate limiting** for API endpoints
4. **Regular security audits** of access logs
5. **Backup database regularly**
6. **Keep dependencies updated**

## Troubleshooting

### Database Issues
- Ensure SQLite file permissions are correct
- Run `npm run db:push` to reset schema
- Check `.env` file has correct `DATABASE_URL`

### Authentication Issues
- Verify JWT_SECRET is set correctly
- Check token expiration times
- Ensure cookies are enabled in browser

### Access Control Issues
- Check user roles and permissions
- Verify security labels match requirements
- Review audit logs for denied access attempts

## Next Steps

1. Implement CAPTCHA for registration
2. Add email/SMS verification
3. Implement file upload for documents
4. Add document encryption at rest
5. Create admin dashboard for role management
6. Add more comprehensive audit log viewer
7. Implement automated backup scheduling

## Support

For issues or questions, refer to the project documentation or contact the development team.

