# User Activity Logging Implementation

## ✅ Implementation Complete

The system now comprehensively logs all user activities with detailed information including username, timestamp, IP address, and specific actions performed.

---

## 📋 What is Logged

### Authentication Activities
- **LOGIN_SUCCESS** - Successful user login
  - Username, IP address, user agent, timestamp
- **LOGIN_FAILED** - Failed login attempts
  - Username attempted, IP address, reason (user not found, invalid password)
- **LOGIN_BLOCKED** - Account locked due to failed attempts
  - Username, IP address, lockout duration
- **USER_REGISTERED** - New user registration
  - Username, email, role assigned, IP address
- **PASSWORD_CHANGED** - User changed password
  - Username, IP address, timestamp
- **MFA_VERIFICATION_SUCCESS** - Successful MFA verification
  - Username, IP address, timestamp
- **MFA_VERIFICATION_FAILED** - Failed MFA verification
  - Username, IP address, reason

### Document Activities
- **DOCUMENT_CREATED** - Document creation
  - Username, document title, security label, classification, IP address
- **DOCUMENT_ACCESSED** - Document viewing
  - Username, document title, owner, access method (admin/owner/permission/public), IP address
- **DOCUMENT_DELETED** - Document deletion
  - Username, document title, owner, deletion reason, IP address
- **DOCUMENTS_LISTED** - Document listing/viewing
  - Username, IP address, timestamp

### Permission Activities
- **PERMISSION_GRANTED** - Permission granted to user
  - Who granted (username), who received (username, email), document details, permissions granted
- **PERMISSION_MODIFIED** - Permission updated
  - Who modified (username), who had permissions modified, previous permissions, new permissions
- **PERMISSION_REVOKED** - Permission removed
  - Who revoked (username), who had permissions revoked, previous permissions
- **PERMISSION_DENIED** - Access denied
  - Username, resource type, action attempted, reason

### Role Management Activities
- **ROLE_CREATED** - New role created
  - Username (creator), role name, IP address
- **ROLE_ASSIGNED** - Role assigned to user
  - Username (assigner), username (assigned to), role name, IP address
- **ROLES_VIEWED** - Roles list viewed
  - Username, view type (full/basic), IP address
- **ROLE_REQUEST_CREATED** - Role change request submitted
  - Username, requested role, reason, IP address
- **ROLE_REQUEST_APPROVED** - Role change request approved
  - Username (reviewer), username (requester), requested role, review notes
- **ROLE_REQUEST_DENIED** - Role change request denied
  - Username (reviewer), username (requester), requested role, review notes
- **ROLE_REQUEST_CANCELLED** - Role change request cancelled
  - Username, requested role

### Access Control Activities
- **ACCESS_RULES_VIEWED** - Access rules list viewed
  - Username, IP address
- **ACCESS_RULE_CREATED** - New access rule created
  - Username, rule name, rule type, IP address
- **ACCESS_RULE_DELETED** - Access rule deleted
  - Username, rule name, IP address

### User Profile Activities
- **PROFILE_UPDATED** - User profile updated
  - Username, updated fields (firstName, lastName, department, location), IP address

### Security Events
- **SECURITY:** prefix for security-related events
  - Failed login attempts, account lockouts, suspicious activities

---

## 🔧 Implementation Details

### Enhanced Audit Logger (`lib/audit/logger.ts`)

The audit logging system has been enhanced to automatically include:

1. **Username** - Automatically fetched and included in all logs when `userId` is provided
2. **Timestamp** - Explicitly included in encrypted details (in addition to database timestamp)
3. **IP Address** - Extracted from request headers (`x-forwarded-for` or `x-real-ip`)
4. **User Agent** - Browser/client information
5. **Action Details** - Specific action performed with context

#### Key Functions:

```typescript
// Main logging function - automatically includes username
createAuditLog(data: AuditLogData): Promise<void>

// Enhanced helper for API routes
logUserActivityFromRequest(
  userId: string,
  action: string,
  request: Request,
  additionalDetails?: Record<string, any>
): Promise<void>
```

### Automatic Username Inclusion

The `createAuditLog` function now automatically:
1. Fetches the username from the database when `userId` is provided
2. Includes username in the encrypted details
3. Adds explicit timestamp to details
4. Encrypts all sensitive details before storage

### Log Structure

Each audit log entry contains:
- **userId** - User ID (for database relationship)
- **action** - Action performed (e.g., "DOCUMENT_CREATED")
- **resourceType** - Type of resource (e.g., "document", "user", "role")
- **resourceId** - ID of the resource (if applicable)
- **ipAddress** - IP address of the user
- **userAgent** - Browser/client information
- **location** - Geographic location (if available)
- **deviceType** - Device type (mobile, desktop, etc.)
- **details** - Encrypted JSON containing:
  - Username
  - Timestamp (ISO format)
  - Additional action-specific details
- **status** - SUCCESS, FAILURE, or WARNING
- **errorMessage** - Error message (if status is FAILURE)
- **timestamp** - Database timestamp

---

## 📊 Logged Information Per Activity

### Example: Document Creation
```json
{
  "userId": "cmijyidgg000d6t9anwv37miv",
  "action": "DOCUMENT_CREATED",
  "resourceType": "document",
  "resourceId": "cmik2b6tw000d11gvxqwxxoex",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "details": {
    "username": "john_doe",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "title": "Project Proposal",
    "securityLabel": "CONFIDENTIAL",
    "classification": "INTERNAL",
    "createdByManager": true,
    "managerBypass": "Manager bypassed MAC restrictions"
  },
  "status": "SUCCESS",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Example: Permission Grant
```json
{
  "userId": "cmijyidgg000d6t9anwv37miv",
  "action": "PERMISSION_GRANTED",
  "resourceType": "document",
  "resourceId": "cmik2b6tw000d11gvxqwxxoex",
  "ipAddress": "192.168.1.100",
  "details": {
    "username": "admin_user",
    "timestamp": "2024-01-15T10:35:00.000Z",
    "grantedTo": {
      "userId": "cmijyidgg000d6t9anwv37miv",
      "username": "employee_user",
      "email": "employee@example.com"
    },
    "documentTitle": "Project Proposal",
    "permissions": {
      "canRead": true,
      "canWrite": false,
      "canDelete": false,
      "canShare": false
    }
  },
  "status": "SUCCESS",
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

### Example: Failed Login
```json
{
  "userId": null,
  "action": "SECURITY:LOGIN_FAILED",
  "ipAddress": "192.168.1.100",
  "details": {
    "timestamp": "2024-01-15T10:40:00.000Z",
    "reason": "User not found",
    "username": "invalid_user"
  },
  "status": "FAILURE",
  "timestamp": "2024-01-15T10:40:00.000Z"
}
```

---

## 🔍 Viewing Audit Logs

### API Endpoint
- **GET** `/api/audit-logs` - View audit logs with filters
  - Query parameters:
    - `userId` - Filter by user ID
    - `action` - Filter by action type
    - `resourceType` - Filter by resource type
    - `startDate` - Start date filter
    - `endDate` - End date filter
    - `limit` - Number of results (default: 100)
    - `offset` - Pagination offset

### Frontend Page
- **Dashboard** → **Audit Logs** - View all user activities
  - Filter by action type
  - Filter by user
  - Filter by date range
  - View detailed information including username, IP address, and action details

---

## 🔐 Security Features

1. **Encrypted Details** - All sensitive information in the `details` field is encrypted
2. **Immutable Logs** - Audit logs are append-only and cannot be modified
3. **Comprehensive Coverage** - All user activities are logged
4. **Automatic Username Resolution** - Username is automatically included even if only userId is provided
5. **IP Address Tracking** - All activities include IP address for security monitoring
6. **Timestamp Precision** - Both database timestamp and explicit timestamp in details

---

## 📝 Best Practices

1. **Always Include Context** - When logging activities, include relevant context in the `details` field
2. **Use Descriptive Actions** - Use clear, descriptive action names (e.g., "DOCUMENT_CREATED" not "CREATE")
3. **Log Both Success and Failure** - Log both successful operations and failures for complete audit trail
4. **Include IP Address** - Always extract and include IP address from request headers
5. **Use Helper Functions** - Use `logUserActivityFromRequest` for API routes to automatically extract request context

---

## 🎯 Coverage

All major user activities are now logged:
- ✅ Authentication (login, registration, password changes)
- ✅ Document operations (create, read, update, delete)
- ✅ Permission management (grant, modify, revoke)
- ✅ Role management (create, assign, view)
- ✅ Access control (rules, policies)
- ✅ Profile updates
- ✅ Security events

---

## 📚 Related Documentation

- `PERMISSION_LOGS_IMPLEMENTATION.md` - Permission-specific logging details
- `lib/audit/logger.ts` - Audit logging implementation
- `app/api/audit-logs/route.ts` - Audit logs API endpoint
- `app/dashboard/audit-logs/page.tsx` - Audit logs frontend page

---

## ✅ Summary

The system now provides comprehensive user activity logging with:
- **Username** - Automatically included in all logs
- **Timestamp** - Precise timestamp for each activity
- **IP Address** - Source IP address for security tracking
- **Action Details** - Specific action performed with full context
- **Encrypted Storage** - Sensitive details are encrypted
- **Complete Coverage** - All user activities are logged

This provides a complete audit trail for security, compliance, and troubleshooting purposes.

