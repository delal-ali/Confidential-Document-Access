# Administrator Guide - Complete Reference

This guide explains everything an Administrator can do and where to do it in the system.

## 👑 Administrator Capabilities

### Full System Access
Administrators have complete control over the system and can perform all operations.

---

## 📍 Where Administrators Can Create/Insert

### 1. Create Documents
**Location:** Dashboard → "New Document" button (top right)

**Steps:**
1. Login as Administrator
2. Click "New Document" button
3. Fill in:
   - Title
   - Content
   - Security Label (PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET)
   - Classification (PUBLIC, INTERNAL, CONFIDENTIAL)
4. Click "Create Document"

**What you can create:**
- Documents with any security level
- Documents for any department
- System documentation
- Policy documents

---

### 2. Create Roles
**Location:** Dashboard → Roles (needs to be created) OR via API

**Currently:** Role creation is available via API only. UI page can be added.

**API Endpoint:**
```
POST /api/roles
Authorization: Bearer <token>
{
  "name": "New Role",
  "description": "Role description",
  "permissionIds": ["permission-id-1", "permission-id-2"]
}
```

**What you can create:**
- Custom roles with specific permissions
- Department-specific roles
- Project-specific roles

---

### 3. Assign Roles to Users
**Location:** Dashboard → "Users" → Select user and role → "Assign Role"

**Steps:**
1. Go to Dashboard
2. Click "Users" in navigation
3. Select a user from dropdown
4. Select a role from dropdown
5. Click "Assign Role"

**What you can assign:**
- Administrator role
- Manager role
- Employee role
- Any custom roles

---

### 4. Create Access Rules (RuBAC)
**Location:** Via API or Database (Prisma Studio)

**Currently:** Access rules are created via API or directly in database.

**What you can create:**
- Time-based rules (business hours only)
- Location-based rules (specific IPs)
- Device-based rules
- Attribute-based policies (ABAC)

---

## 🗑️ Where Administrators Can Delete

### 1. Delete Documents
**Location:** Document view page (needs delete button)

**Currently:** Delete functionality needs to be added to the UI.

**API Endpoint:**
```
DELETE /api/documents/[id]
Authorization: Bearer <token>
```

**What you can delete:**
- Any document (regardless of owner)
- Documents with any security level
- System documents

---

### 2. Delete Users
**Location:** Dashboard → Users (needs delete button)

**Currently:** User deletion needs to be added to the UI.

**What you can delete:**
- User accounts
- User data (with proper audit logging)

---

### 3. Delete Roles
**Location:** Via API or Database

**Currently:** Role deletion is available via API or Prisma Studio.

**API Endpoint:**
```
DELETE /api/roles/[id]
Authorization: Bearer <token>
```

**What you can delete:**
- Custom roles (not default roles)
- Unused roles

---

### 4. Revoke Permissions
**Location:** Document → "Manage Permissions" → Revoke

**Steps:**
1. Go to a document
2. Click "Manage Permissions"
3. Find the user's permission
4. Revoke it (UI needs to be added)

**What you can revoke:**
- Document permissions (DAC)
- User role assignments
- Access rules

---

## 📊 Where Administrators Can View

### 1. View All Users
**Location:** Dashboard → "Users"

**What you can see:**
- All registered users
- User details (username, email, department)
- Security labels and clearance levels
- User roles

**Actions available:**
- Assign roles to users
- View user information

---

### 2. View Audit Logs
**Location:** Dashboard → "Audit Logs"

**What you can see:**
- All user activities
- System events
- Security alerts
- Access attempts (successful and denied)
- Permission changes
- Role assignments

**Features:**
- Filter by action, user, resource type
- Filter by date range
- View detailed logs

---

### 3. View All Documents
**Location:** Dashboard (main page)

**What you can see:**
- All documents (based on your security clearance)
- Documents you own
- Documents you have permission to access
- Document metadata (security label, classification, owner)

---

### 4. View Roles
**Location:** Via API `/api/roles` (UI page can be added)

**What you can see:**
- All roles in the system
- Role permissions
- Users assigned to each role

---

## ⚙️ Where Administrators Can Modify/Edit

### 1. Modify User Security Clearance
**Location:** Via script or Prisma Studio

**Command:**
```bash
npm run update-clearance
```

**What you can modify:**
- User security labels (PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET)
- User clearance levels (0-3)

---

### 2. Modify Role Permissions
**Location:** Via API or Database

**What you can modify:**
- Add permissions to roles
- Remove permissions from roles
- Change role descriptions

---

### 3. Edit Documents
**Location:** Document view page (edit functionality needs to be added)

**What you can edit:**
- Document content
- Document title
- Security labels (with proper authorization)
- Classifications

---

## 🔐 Security Management

### 1. Manage Access Rules
**Location:** Via API or Database

**What you can manage:**
- Time-based access rules
- Location-based rules
- Device restrictions
- Attribute-based policies

---

### 2. View Security Alerts
**Location:** Audit Logs → Filter by "SECURITY:"

**What you can see:**
- Brute force attempts
- Unusual access patterns
- Privilege escalation attempts
- Failed authentication attempts

---

### 3. Manage Backups
**Location:** Via API or script

**Command:**
```bash
# Backup functionality is in lib/backup/backup.ts
```

**What you can do:**
- Create full backups
- Create incremental backups
- Restore from backups
- View backup history

---

## 📋 Complete Administrator Checklist

### Daily Tasks
- [ ] Review audit logs for suspicious activities
- [ ] Check security alerts
- [ ] Monitor user activities
- [ ] Review access denials

### Weekly Tasks
- [ ] Review user roles and permissions
- [ ] Check document access patterns
- [ ] Review and update access rules
- [ ] Create system backups

### User Management
- [ ] Assign roles to new users
- [ ] Update user security clearances
- [ ] Remove inactive users
- [ ] Manage user permissions

### System Management
- [ ] Create new roles as needed
- [ ] Modify role permissions
- [ ] Create access rules
- [ ] Manage system backups

---

## 🎯 Quick Access Guide

| Action | Location | Method |
|--------|----------|--------|
| **Create Document** | Dashboard → New Document | UI Button |
| **View Users** | Dashboard → Users | UI Link |
| **Assign Role** | Dashboard → Users → Assign Role | UI Form |
| **View Audit Logs** | Dashboard → Audit Logs | UI Link |
| **Create Role** | API: POST /api/roles | API/Code |
| **Delete Document** | API: DELETE /api/documents/[id] | API/Code |
| **Delete User** | Prisma Studio or API | Database/API |
| **Update Clearance** | npm run update-clearance | Script |
| **View Roles** | API: GET /api/roles | API/Code |
| **Manage Backups** | lib/backup/backup.ts | Code |

---

## 🛠️ Administrator Tools

### Command Line Tools

```bash
# Assign admin role to user
npm run assign-admin

# Assign any role to user
npm run assign-role

# Update user security clearance
npm run update-clearance

# Verify user permissions
npm run verify-permissions <username>

# Fix manager permissions
npm run fix-manager

# Database management
npm run db:studio  # Open Prisma Studio
npm run db:seed    # Seed database
```

### Prisma Studio
**Access:** `npm run db:studio`

**What you can do:**
- View all database tables
- Edit user data directly
- Modify roles and permissions
- View relationships
- Delete records

---

## 📝 Important Notes

1. **All actions are logged** - Every administrator action is recorded in audit logs
2. **Security clearance matters** - Even admins are subject to MAC (Mandatory Access Control)
3. **Role changes require logout** - Users must logout/login for role changes to take effect
4. **Backup before deletion** - Always backup before deleting important data
5. **Audit trail** - All deletions and modifications are logged

---

## 🚨 Security Best Practices

1. **Use admin account only for administration** - Don't use for regular document work
2. **Review audit logs regularly** - Check for suspicious activities
3. **Follow principle of least privilege** - Assign minimum necessary permissions
4. **Regular backups** - Schedule automatic backups
5. **Monitor security alerts** - Respond to alerts promptly
6. **Document changes** - Keep records of system modifications

---

## ❓ Common Administrator Tasks

### Task: Add a new user and assign Manager role
1. User registers at `/register`
2. Go to Dashboard → Users
3. Select the new user
4. Select "Manager" role
5. Click "Assign Role"
6. User logs out and logs back in

### Task: View all activities for a specific user
1. Go to Dashboard → Audit Logs
2. Filter by user ID or username
3. Review all logged activities

### Task: Create a custom role
1. Use API: `POST /api/roles`
2. Or use Prisma Studio to create role and permissions
3. Assign role to users via Dashboard → Users

### Task: Delete a user account
1. Open Prisma Studio: `npm run db:studio`
2. Go to User table
3. Find and delete the user
4. (Or create API endpoint for this)

---

## 🔄 Current Limitations

Some features need UI implementation:
- ❌ Delete documents (API exists, UI needed)
- ❌ Delete users (needs implementation)
- ❌ Edit documents (needs implementation)
- ❌ Create roles (API exists, UI needed)
- ❌ Delete roles (needs implementation)
- ❌ Revoke permissions (needs UI button)

These can be done via:
- API endpoints
- Prisma Studio
- Command line scripts

---

This guide covers all current administrator capabilities. For features that need UI implementation, use the API endpoints or Prisma Studio.

