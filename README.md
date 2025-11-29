# Confidential Document Access & User Management System

A comprehensive security system implementing multiple access control mechanisms, authentication, and audit logging for managing confidential documents.

## 🎯 Project Overview

This system implements **five different access control mechanisms** (MAC, DAC, RBAC, RuBAC, ABAC) along with comprehensive authentication, audit logging, and security features as required for the Computer System Security project.

## ✨ Features

### Access Control Mechanisms
- ✅ **Mandatory Access Control (MAC)**: Security labels and clearance levels
- ✅ **Discretionary Access Control (DAC)**: Resource owner permission management
- ✅ **Role-Based Access Control (RBAC)**: Role-based permissions with dynamic assignment
- ✅ **Rule-Based Access Control (RuBAC)**: Time, location, and device-based rules
- ✅ **Attribute-Based Access Control (ABAC)**: Fine-grained attribute-based policies

### Authentication & Security
- ✅ User registration with email/phone verification support
- ✅ Password policies (min 8 chars, complexity requirements)
- ✅ Secure password hashing (bcrypt, 12 rounds)
- ✅ Account lockout protection (5 attempts = 30 min lockout)
- ✅ Multi-Factor Authentication (MFA) with TOTP/OTP
- ✅ Token-based authentication (JWT)
- ✅ Session management
- 🔄 CAPTCHA integration points (ready for implementation)

### Audit Trails and Logging
- ✅ Comprehensive user activity logging
- ✅ System event logging
- ✅ Encrypted log storage (AES-256-GCM)
- ✅ Centralized logging
- ✅ Security alert mechanisms (brute force, unusual patterns)

### Data Management
- ✅ Document access control with multi-layer security
- ✅ User profile management
- ✅ Data backup functionality
- ✅ Permission audit trails

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
JWT_SECRET="your-jwt-secret-min-32-chars"
ENCRYPTION_KEY="your-32-character-key"
```

3. **Initialize database:**
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

4. **Start development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup and configuration guide
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Access control implementation details
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete project overview

## 🏗️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite (via Prisma)
- **ORM**: Prisma
- **Authentication**: JWT, bcryptjs
- **MFA**: TOTP (otpauth)
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **Encryption**: Node.js crypto (AES-256-GCM)

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── page.tsx           # Login/Register page
├── lib/                    # Core libraries
│   ├── auth/              # Authentication
│   ├── access-control/    # Access control implementations
│   ├── audit/             # Audit logging
│   └── backup/            # Backup functionality
├── prisma/                # Database schema
└── public/                # Static assets
```

## 🔐 Security Features

- ✅ Defense in depth (multiple access control layers)
- ✅ Encrypted audit logs
- ✅ Secure password storage
- ✅ Account lockout protection
- ✅ Multi-factor authentication
- ✅ Comprehensive audit trail
- ✅ Principle of least privilege

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify MFA

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/[id]` - Get document (with access control)
- `POST /api/documents/[id]/permissions` - Grant permissions

### Roles & Audit
- `GET /api/roles` - List roles
- `GET /api/audit-logs` - View audit logs

## 🧪 Testing Access Control

See [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md) for detailed examples of testing each access control mechanism.

## 📋 Requirements Checklist

### Access Control ✅
- [x] Mandatory Access Control (MAC)
- [x] Discretionary Access Control (DAC)
- [x] Role-Based Access Control (RBAC)
- [x] Rule-Based Access Control (RuBAC)
- [x] Attribute-Based Access Control (ABAC)

### Authentication ✅
- [x] User registration
- [x] Email/phone verification
- [x] Password policies
- [x] Password hashing
- [x] Account lockout
- [x] Secure password transmission
- [x] Password change
- [x] Token-based authentication
- [x] Session management
- [x] Multi-Factor Authentication (MFA)

### Audit & Logging ✅
- [x] User activity logging
- [x] System events logging
- [x] Log encryption
- [x] Centralized logging
- [x] Alerting mechanisms

### Data Backups ✅
- [x] Regular backups
- [x] Backup history
- [x] Restore functionality

## 🎓 Academic Project

This project was developed for the **Computer System Security** course at Addis Ababa Science and Technology University, Department of Software Engineering.

## 📄 License

This project is for academic purposes.

## 🤝 Contributing

This is an academic project. For questions or improvements, please refer to the documentation files.

