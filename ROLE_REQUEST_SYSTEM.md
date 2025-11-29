# Role Change Request and Approval System

## ✅ Implementation Complete

The system now supports dynamic role changes through a request and approval workflow.

---

## 📋 Overview

Users can request role changes, and administrators can approve or deny these requests. This provides a controlled, auditable way to manage role assignments.

---

## 🔄 Workflow

### 1. User Submits Request
- User navigates to "Role Requests" page
- Selects desired role
- Optionally provides reason
- Submits request (status: PENDING)

### 2. Administrator Reviews
- Administrator views all pending requests
- Reviews request details (user, requested role, reason)
- Approves or denies with optional notes

### 3. Request Processing
- **APPROVED**: Role is automatically assigned to user
- **DENIED**: Request is marked as denied with review notes
- **CANCELLED**: User can cancel their own pending requests

---

## 🗄️ Database Model

### RoleRequest Model
```prisma
model RoleRequest {
  id            String     @id @default(cuid())
  userId        String
  user          User       @relation("RequestedBy")
  requestedRoleId String
  requestedRole Role       @relation
  reason        String?    // Optional reason
  status        String     @default("PENDING") // PENDING, APPROVED, DENIED, CANCELLED
  reviewedBy    String?    // Admin who reviewed
  reviewer      User?      @relation("ReviewedBy")
  reviewNotes   String?    // Admin's review notes
  createdAt     DateTime   @default(now())
  reviewedAt    DateTime?
  updatedAt     DateTime   @updatedAt
}
```

---

## 🔌 API Endpoints

### GET `/api/role-requests`
**Description**: View role change requests

**Access**:
- **Users**: See only their own requests
- **Administrators**: See all requests

**Query Parameters**:
- `status` (optional): Filter by status (PENDING, APPROVED, DENIED, CANCELLED)

**Response**:
```json
{
  "requests": [
    {
      "id": "request_id",
      "user": {
        "id": "user_id",
        "username": "john_doe",
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe"
      },
      "requestedRole": {
        "id": "role_id",
        "name": "Manager",
        "description": "Department manager"
      },
      "reason": "Need to manage team documents",
      "status": "PENDING",
      "reviewer": null,
      "reviewNotes": null,
      "createdAt": "2024-01-01T00:00:00Z",
      "reviewedAt": null
    }
  ]
}
```

---

### POST `/api/role-requests`
**Description**: Create a new role change request

**Access**: All authenticated users

**Request Body**:
```json
{
  "requestedRoleId": "role_id",
  "reason": "Optional reason for the request"
}
```

**Validation**:
- Prevents duplicate pending requests for same role
- Prevents requesting a role the user already has
- Verifies role exists

**Response**:
```json
{
  "message": "Role change request submitted successfully",
  "request": { ... }
}
```

---

### GET `/api/role-requests/[id]`
**Description**: View a specific role request

**Access**:
- **Users**: Can view their own requests
- **Administrators**: Can view any request

**Response**:
```json
{
  "request": { ... }
}
```

---

### PATCH `/api/role-requests/[id]`
**Description**: Review/Approve/Deny/Cancel a role request

**Access**:
- **CANCEL**: User can cancel their own pending requests
- **APPROVE/DENY**: Administrators only

**Request Body**:
```json
{
  "action": "APPROVE" | "DENY" | "CANCEL",
  "reviewNotes": "Optional review notes"
}
```

**Actions**:
- **APPROVE**: Assigns role to user, updates request status
- **DENY**: Updates request status with review notes
- **CANCEL**: User cancels their own pending request

**Response**:
```json
{
  "message": "Role request approved successfully",
  "request": { ... }
}
```

---

## 🖥️ Frontend Pages

### `/dashboard/role-requests`
**Description**: Role change requests management page

**Features**:
- **For Users**:
  - Submit new role change requests
  - View their own request history
  - Cancel pending requests
  - See request status and review notes

- **For Administrators**:
  - View all role change requests
  - See user information for each request
  - Approve or deny requests
  - Add review notes when denying

**UI Elements**:
- Request form (users only)
- Requests table with status indicators
- Approve/Deny buttons (admins only)
- Cancel button (users for their own pending requests)

---

## 📊 Request Statuses

### PENDING
- Request has been submitted
- Waiting for administrator review
- User can cancel
- Administrator can approve or deny

### APPROVED
- Request has been approved
- Role has been assigned to user
- Shows reviewer and review date
- Cannot be modified

### DENIED
- Request has been denied
- Role was not assigned
- Shows reviewer, review notes, and review date
- Cannot be modified

### CANCELLED
- Request was cancelled by user
- Shows cancellation date
- Cannot be modified

---

## 🔐 Security Features

1. **Access Control**:
   - Users can only view their own requests
   - Administrators can view all requests
   - Only administrators can approve/deny

2. **Validation**:
   - Prevents duplicate requests
   - Prevents requesting existing roles
   - Verifies role exists

3. **Audit Logging**:
   - All request actions are logged
   - Tracks who created, approved, denied, or cancelled
   - Includes IP addresses and timestamps

---

## 📝 Audit Log Actions

### ROLE_REQUEST_CREATED
**When**: User submits a role change request

**Details**:
- User ID
- Requested role
- Reason (if provided)

### ROLE_REQUEST_APPROVED
**When**: Administrator approves a request

**Details**:
- Requester username
- Requested role
- Review notes
- Reviewer ID

### ROLE_REQUEST_DENIED
**When**: Administrator denies a request

**Details**:
- Requester username
- Requested role
- Review notes
- Reviewer ID

### ROLE_REQUEST_CANCELLED
**When**: User cancels their own request

**Details**:
- Requested role
- Request ID

---

## 🎯 Usage Examples

### User Submitting Request
1. Navigate to Dashboard → "Role Requests"
2. Click "Request Role Change"
3. Select desired role from dropdown
4. Optionally enter reason
5. Click "Submit Request"
6. Request appears in table with PENDING status

### Administrator Approving Request
1. Navigate to Dashboard → "Role Requests"
2. View pending requests in table
3. Click "Approve" button next to request
4. Confirm approval
5. Role is automatically assigned to user
6. Request status changes to APPROVED

### Administrator Denying Request
1. Navigate to Dashboard → "Role Requests"
2. View pending requests in table
3. Click "Deny" button next to request
4. Enter review notes (optional)
5. Confirm denial
6. Request status changes to DENIED with notes

### User Cancelling Request
1. Navigate to Dashboard → "Role Requests"
2. Find pending request in table
3. Click "Cancel" button
4. Confirm cancellation
5. Request status changes to CANCELLED

---

## ✅ Benefits

1. **Controlled Access**: Role changes require approval
2. **Audit Trail**: All requests and decisions are logged
3. **Transparency**: Users can see request status and review notes
4. **Flexibility**: Users can request role changes as needed
5. **Security**: Prevents unauthorized role assignments

---

## 🔄 Integration with Existing System

- **Role Assignment**: Uses existing `assignRoleToUser` function
- **Audit Logging**: Integrates with existing audit log system
- **Access Control**: Uses existing RBAC permission checks
- **User Management**: Works with existing user and role models

---

## 📚 Related Documentation

- **Role Definitions**: See `ROLE_DEFINITIONS.md`
- **Role Permissions**: See `ROLE_PERMISSIONS.md`
- **Audit Logging**: See `PERMISSION_LOGS_IMPLEMENTATION.md`

---

## 🎉 Summary

✅ **Dynamic role changes through request and approval workflow**

The system now supports:
- ✅ User-initiated role change requests
- ✅ Administrator approval/denial workflow
- ✅ Automatic role assignment on approval
- ✅ Complete audit trail
- ✅ User-friendly interface for both users and administrators

