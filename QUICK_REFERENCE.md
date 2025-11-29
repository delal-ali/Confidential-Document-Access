# Quick Reference Guide

## Common Operations

### User Registration
```bash
POST /api/auth/register
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### User Login
```bash
POST /api/auth/login
{
  "username": "john_doe",
  "password": "SecurePass123!"
}
```

### Create Document
```bash
POST /api/documents
Authorization: Bearer <token>
{
  "title": "Confidential Report",
  "content": "Document content...",
  "securityLabel": "CONFIDENTIAL",
  "classification": "CONFIDENTIAL"
}
```

### Grant Document Permission (DAC)
```bash
POST /api/documents/{id}/permissions
Authorization: Bearer <token>
{
  "userId": "user_id",
  "canRead": true,
  "canWrite": false,
  "canDelete": false,
  "canShare": true
}
```

### Assign Role to User (RBAC)
```typescript
import { assignRoleToUser } from '@/lib/access-control/rbac'

await assignRoleToUser(
  userId,
  roleId,
  assignedByUserId
)
```

### Create Time-Based Rule (RuBAC)
```typescript
await prisma.accessRule.create({
  data: {
    name: 'Business Hours Only',
    ruleType: 'TIME',
    allowedStartTime: '09:00',
    allowedEndTime: '17:00',
    allowedDays: 'MON,TUE,WED,THU,FRI',
    targetType: 'document',
    targetId: documentId,
  },
})
```

### Create ABAC Policy
```typescript
await prisma.accessRule.create({
  data: {
    name: 'HR Managers Only',
    ruleType: 'ATTRIBUTE',
    attributeConditions: JSON.stringify([
      {
        attribute: 'user.role',
        operator: 'contains',
        value: 'HR Manager',
      },
      {
        attribute: 'user.department',
        operator: 'equals',
        value: 'Payroll',
      },
    ]),
    targetType: 'document',
    targetId: documentId,
  },
})
```

## Security Labels (MAC)

- `PUBLIC` (Level 0)
- `INTERNAL` (Level 1)
- `CONFIDENTIAL` (Level 2)
- `TOP_SECRET` (Level 3)

## Default Roles

- **Administrator**: Full access
- **Manager**: Create/read documents, view roles
- **Employee**: Read documents only

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Account Lockout

- 5 failed login attempts
- 30 minute lockout period
- Automatic unlock after expiration

## MFA Setup

1. Call `POST /api/auth/mfa/setup`
2. Scan QR code with authenticator app
3. Call `POST /api/auth/mfa/verify` with OTP
4. MFA enabled

## Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - NextAuth secret (min 32 chars)
- `JWT_SECRET` - JWT secret (min 32 chars)
- `ENCRYPTION_KEY` - Encryption key (exactly 32 chars)

## Access Control Check Order

1. MAC (Security clearance)
2. DAC (Ownership/permissions)
3. RBAC (Role permissions)
4. RuBAC (Time/location rules)
5. ABAC (Attribute policies)

All must pass for access to be granted.

## Audit Log Actions

Common actions logged:
- `USER_REGISTERED`
- `LOGIN_SUCCESS`
- `LOGIN_FAILED`
- `DOCUMENT_CREATED`
- `DOCUMENT_ACCESSED`
- `DOCUMENT_ACCESS_DENIED`
- `PERMISSION_GRANTED`
- `ROLE_ASSIGNED`
- `PASSWORD_CHANGED`
- `MFA_ENABLED`

## Troubleshooting

### Database locked
- Close Prisma Studio
- Restart development server

### Authentication fails
- Check JWT_SECRET is set
- Verify token expiration
- Check account lockout status

### Access denied
- Check user's security label
- Verify document permissions
- Check role assignments
- Review access rules
- Check audit logs for reason

