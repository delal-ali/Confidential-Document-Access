# Role Permissions Guide

This document explains what each role can and cannot do in the system.

## Role Hierarchy

1. **Administrator** - Full system access
2. **Manager** - Department-level access
3. **Employee** - Basic read-only access

---

## 👑 Administrator

### Full Access - Can Do Everything

#### Document Management
- ✅ **Create** documents (any security level)
- ✅ **Read** all documents (based on security clearance)
- ✅ **Edit/Write** all documents
- ✅ **Delete** documents
- ✅ **Share** documents and grant permissions

#### User Management
- ✅ **View** all users
- ✅ **Assign roles** to users
- ✅ **Modify** user security clearances
- ✅ **Manage** user accounts

#### Role Management
- ✅ **Create** new roles
- ✅ **View** all roles
- ✅ **Modify** role permissions
- ✅ **Assign** roles to users
- ✅ **Delete** roles (if implemented)

#### System Management
- ✅ **View** all audit logs
- ✅ **Manage** access rules (RuBAC)
- ✅ **Create** attribute-based policies (ABAC)
- ✅ **Configure** system settings
- ✅ **Manage** backups

#### Security
- ✅ **Bypass** most access controls (with proper logging)
- ✅ **Override** permission denials (for administrative purposes)
- ✅ **Access** all security levels (if clearance allows)

### Permissions List
- `document:create`
- `document:read`
- `document:write`
- `document:delete`
- `role:create`
- `role:read`
- `role:assign`
- `audit:read`
- All other permissions

---

## 👔 Manager

### Department-Level Access

#### Document Management
- ✅ **Create** documents
- ✅ **Read** documents (based on security clearance)
- ✅ **Edit/Write** documents they own or have permission for
- ❌ **Delete** documents (unless they own them - via DAC)
- ✅ **Share** documents they own (grant permissions via DAC)

#### User Management
- ❌ **View** users (unless given permission)
- ❌ **Assign roles** to users
- ❌ **Modify** user accounts

#### Role Management
- ❌ **Create** roles
- ✅ **View** roles (read-only)
- ❌ **Modify** role permissions
- ❌ **Assign** roles to users

#### System Management
- ❌ **View** audit logs
- ❌ **View** users
- ❌ **Manage** access rules
- ❌ **Configure** system settings

### Permissions List
- `document:create` ✅
- `document:read` ✅
- `document:write` ✅
- `role:read` ✅
- `document:delete` ❌ (via RBAC, but can delete own documents via DAC)
- `role:create` ❌
- `role:assign` ❌
- `audit:read` ❌
- `user:read` ❌

### What Managers Can Do
1. **Create documents** for their department
2. **Read documents** they have access to (MAC + DAC)
3. **Edit documents** they own or have write permission for
4. **Grant permissions** to other users for documents they own (DAC)
5. **View available roles** (but not assign them)

### What Managers Cannot Do
1. ❌ Assign roles to users
2. ❌ View audit logs
3. ❌ View users
4. ❌ Create new roles
5. ❌ Modify system settings
6. ❌ Delete documents they don't own (unless granted permission)

---

## 👤 Employee

### Basic Read-Only Access

#### Document Management
- ❌ **Create** documents
- ✅ **Read** documents (based on security clearance and permissions)
- ❌ **Edit/Write** documents (unless granted permission via DAC)
- ❌ **Delete** documents
- ❌ **Share** documents

#### User Management
- ❌ **View** users
- ❌ **Assign roles**
- ❌ **Modify** user accounts

#### Role Management
- ❌ **Create** roles
- ❌ **View** roles
- ❌ **Modify** roles
- ❌ **Assign** roles

#### System Management
- ❌ **View** audit logs
- ❌ **Manage** access rules
- ❌ **Configure** settings

### Permissions List
- `document:read` ✅
- `document:create` ❌
- `document:write` ❌
- `document:delete` ❌
- All other permissions ❌

### What Employees Can Do
1. **Read documents** they have access to (if MAC clearance allows AND they have DAC permission)
2. **View** their own profile
3. **Change** their own password

### What Employees Cannot Do
1. ❌ Create documents
2. ❌ Edit documents (unless owner grants permission)
3. ❌ Delete documents
4. ❌ Grant permissions to others
5. ❌ View audit logs
6. ❌ Assign roles
7. ❌ View other users

---

## Access Control Interaction

### Example: Manager Creating Document

1. **RBAC Check**: ✅ Manager role has `document:create` permission
2. **MAC Check**: ✅ Manager's security clearance allows the document level
3. **Result**: ✅ Document created successfully

### Example: Employee Trying to Create Document

1. **RBAC Check**: ❌ Employee role does NOT have `document:create` permission
2. **Result**: ❌ Access denied - "Insufficient permissions"

### Example: Manager Granting Permission (DAC)

1. Manager owns a document
2. Manager can grant read/write permissions to other users
3. This is **DAC (Discretionary Access Control)** - owner controls access

### Example: Employee Reading Document

1. **MAC Check**: ✅ Employee's clearance level allows access
2. **DAC Check**: ✅ Employee has read permission (granted by owner)
3. **RBAC Check**: ✅ Employee role has `document:read` permission
4. **Result**: ✅ Access granted

---

## Permission Matrix

| Action | Administrator | Manager | Employee |
|--------|--------------|---------|----------|
| Create Document | ✅ | ✅ | ❌ |
| Read Document | ✅ | ✅ | ✅* |
| Edit Document | ✅ | ✅* | ❌* |
| Delete Document | ✅ | ✅* | ❌ |
| Grant Permissions | ✅ | ✅* | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ |
| Assign Roles | ✅ | ❌ | ❌ |
| Create Roles | ✅ | ❌ | ❌ |
| View Users | ✅ | ❌ | ❌ |
| View Roles | ✅ | ✅ | ❌ |

* = Only for documents they own or have explicit permission for (DAC)

---

## Security Clearance Levels

All roles are also subject to **MAC (Mandatory Access Control)**:

- **PUBLIC** (Level 0) - Can access PUBLIC documents
- **INTERNAL** (Level 1) - Can access PUBLIC and INTERNAL documents
- **CONFIDENTIAL** (Level 2) - Can access PUBLIC, INTERNAL, and CONFIDENTIAL documents
- **TOP_SECRET** (Level 3) - Can access all documents

**Example:**
- Manager with INTERNAL clearance can create INTERNAL documents
- Manager with INTERNAL clearance CANNOT access CONFIDENTIAL documents
- Administrator with CONFIDENTIAL clearance can access CONFIDENTIAL documents

---

## Best Practices

### For Administrators
- Use Administrator role only for system management
- Don't use admin account for regular document work
- Regularly review audit logs
- Assign appropriate roles to users

### For Managers
- Create documents for your department
- Grant permissions only to trusted users
- Use appropriate security labels for documents
- Review document permissions regularly

### For Employees
- Request access from document owners
- Follow security policies
- Report suspicious activities
- Don't share credentials

---

## Quick Reference

### Administrator
- **Can**: Everything
- **Cannot**: Nothing (full access)

### Manager
- **Can**: Create/read/edit documents, grant permissions, view roles
- **Cannot**: Assign roles, view audit logs, create roles, view all users

### Employee
- **Can**: Read documents (with permission), view own profile
- **Cannot**: Create/edit/delete documents, assign roles, view audit logs

---

## Need to Change Permissions?

If you need to modify what a role can do:

1. **As Administrator**, go to Roles management
2. **Edit** the role permissions
3. **Users** with that role need to logout/login for changes to take effect

---

## Questions?

- Check audit logs to see what actions were attempted
- Verify user's role assignment
- Check user's security clearance level
- Verify document permissions (DAC)

