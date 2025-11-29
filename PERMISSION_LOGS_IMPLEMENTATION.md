# Permission Logs Implementation

## ✅ Implementation Complete

The system now maintains comprehensive permission logs showing who granted, modified, or accessed shared resources.

---

## 📋 What is Logged

### 1. Permission Grants (`PERMISSION_GRANTED`)
**When:** A document owner grants permission to a user for the first time.

**Logged Information:**
- Who granted the permission (grantor)
- Who received the permission (grantee - username, email, user ID)
- Document details (title, ID)
- Permissions granted (canRead, canWrite, canDelete, canShare)
- Timestamp
- IP address

**Location:** `app/api/documents/[id]/permissions/route.ts` (POST endpoint)

---

### 2. Permission Modifications (`PERMISSION_MODIFIED`)
**When:** A document owner updates existing permissions for a user.

**Logged Information:**
- Who modified the permission (modifier)
- Who had permissions modified (user - username, email, user ID)
- Document details (title, ID)
- **Previous permissions** (before change)
- **New permissions** (after change)
- Timestamp
- IP address

**Location:** `app/api/documents/[id]/permissions/route.ts` (POST endpoint - detects modification vs new grant)

---

### 3. Permission Revocations (`PERMISSION_REVOKED`)
**When:** A document owner revokes permissions from a user.

**Logged Information:**
- Who revoked the permission (revoker)
- Who had permissions revoked (user - username, email, user ID)
- Document details (title, ID)
- **Previous permissions** (before revocation)
- Timestamp
- IP address

**Location:** `app/api/documents/[id]/permissions/route.ts` (DELETE endpoint)

---

### 4. Shared Resource Access (`DOCUMENT_ACCESSED`)
**When:** A user accesses a document (especially shared resources).

**Logged Information:**
- Who accessed the document (user)
- Document details (title, owner, security label, classification)
- **Access method:**
  - `admin` - Administrator bypass
  - `owner` - Document owner
  - `permission_granted` - Access via granted permission (shared resource)
  - `public_access` - Access via PUBLIC classification
- **isSharedResource** flag (true if accessed via permission, not ownership)
- Timestamp
- IP address
- User agent
- Device type

**Location:** `app/api/documents/[id]/route.ts` (GET endpoint)

---

## 🔍 Viewing Permission Logs

### Audit Logs Page
**Location:** `/dashboard/audit-logs`

**Features:**
- View all permission-related activities
- Quick filter buttons for:
  - **Permission Granted** (green)
  - **Permission Modified** (yellow)
  - **Permission Revoked** (red)
  - **Document Access** (blue)
- Color-coded action types
- Filter by action type and resource type
- Detailed information including:
  - Timestamp
  - User who performed the action
  - Action type
  - Resource details
  - Status (SUCCESS/FAILURE/WARNING)
  - IP address

**Quick Filters:**
- Click "Permission Granted" to see all permission grants
- Click "Permission Modified" to see all permission modifications
- Click "Permission Revoked" to see all permission revocations
- Click "Document Access" to see all document access events (including shared resources)

---

## 🛠️ Managing Permissions

### Grant Permissions
**Location:** Document → "Manage Permissions" → Grant Permission form

**Process:**
1. Select user
2. Choose permissions (Read, Write, Delete, Share)
3. Submit
4. **Automatically logged** as `PERMISSION_GRANTED` or `PERMISSION_MODIFIED`

### Modify Permissions
**Location:** Document → "Manage Permissions" → Update existing permission

**Process:**
1. Grant permission again with different settings
2. System detects it's a modification (not new grant)
3. **Automatically logged** as `PERMISSION_MODIFIED` with before/after details

### Revoke Permissions
**Location:** Document → "Manage Permissions" → "Revoke" button

**Process:**
1. Click "Revoke" button next to active permission
2. Confirm revocation
3. **Automatically logged** as `PERMISSION_REVOKED` with previous permissions

---

## 📊 Log Details Structure

### Permission Grant Log
```json
{
  "action": "PERMISSION_GRANTED",
  "userId": "grantor_id",
  "resourceType": "document",
  "resourceId": "document_id",
  "details": {
    "grantedTo": "grantee_user_id",
    "grantedToUsername": "username",
    "grantedToEmail": "email@example.com",
    "documentTitle": "Document Title",
    "permissions": {
      "canRead": true,
      "canWrite": false,
      "canDelete": false,
      "canShare": false
    }
  }
}
```

### Permission Modification Log
```json
{
  "action": "PERMISSION_MODIFIED",
  "userId": "modifier_id",
  "resourceType": "document",
  "resourceId": "document_id",
  "details": {
    "grantedTo": "user_id",
    "grantedToUsername": "username",
    "grantedToEmail": "email@example.com",
    "documentTitle": "Document Title",
    "previousPermissions": {
      "canRead": true,
      "canWrite": false,
      "canDelete": false,
      "canShare": false
    },
    "newPermissions": {
      "canRead": true,
      "canWrite": true,
      "canDelete": false,
      "canShare": false
    }
  }
}
```

### Permission Revocation Log
```json
{
  "action": "PERMISSION_REVOKED",
  "userId": "revoker_id",
  "resourceType": "document",
  "resourceId": "document_id",
  "details": {
    "revokedFrom": "user_id",
    "revokedFromUsername": "username",
    "revokedFromEmail": "email@example.com",
    "documentTitle": "Document Title",
    "previousPermissions": {
      "canRead": true,
      "canWrite": true,
      "canDelete": false,
      "canShare": false
    }
  }
}
```

### Shared Resource Access Log
```json
{
  "action": "DOCUMENT_ACCESSED",
  "userId": "accessor_id",
  "resourceType": "document",
  "resourceId": "document_id",
  "details": {
    "documentTitle": "Document Title",
    "documentOwner": "owner_username",
    "isOwner": false,
    "isSharedResource": true,
    "accessMethod": "permission_granted",
    "securityLabel": "CONFIDENTIAL",
    "classification": "INTERNAL"
  }
}
```

---

## 🔐 Security Features

1. **Encrypted Details:** All log details are encrypted before storage
2. **IP Tracking:** All actions include IP address for security monitoring
3. **User Tracking:** All actions are linked to the user who performed them
4. **Access Control:** Only Administrators can view audit logs
5. **Comprehensive Coverage:** All permission activities are logged

---

## 📝 API Endpoints

### Grant/Modify Permission
```
POST /api/documents/[id]/permissions
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user_id",
  "canRead": true,
  "canWrite": false,
  "canDelete": false,
  "canShare": false
}
```

### Revoke Permission
```
DELETE /api/documents/[id]/permissions?userId=<user_id>
Authorization: Bearer <token>
```

### View Audit Logs
```
GET /api/audit-logs?action=PERMISSION_GRANTED&resourceType=document
Authorization: Bearer <token>
```

---

## ✅ Summary

The system now maintains complete permission logs that track:
- ✅ Who granted permissions
- ✅ Who modified permissions
- ✅ Who revoked permissions
- ✅ Who accessed shared resources
- ✅ When these actions occurred
- ✅ What permissions were involved
- ✅ IP addresses and device information

All permission-related activities are automatically logged and can be viewed in the Audit Logs page with quick filters for easy access.

