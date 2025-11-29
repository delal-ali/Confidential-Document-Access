# Administrator Quick Reference

## 🎯 What Administrators Can Do

### ✅ CREATE/INSERT Operations

1. **Create Documents**
   - **Where:** Dashboard → "New Document" button
   - **What:** Any document with any security level

2. **Create Roles**
   - **Where:** API: `POST /api/roles` OR Dashboard → Roles (coming soon)
   - **What:** Custom roles with specific permissions

3. **Assign Roles to Users**
   - **Where:** Dashboard → Users → Select user & role → Assign
   - **What:** Assign any role to any user

4. **Create Access Rules**
   - **Where:** Via API or Database
   - **What:** Time, location, device-based rules

### 🗑️ DELETE Operations

1. **Delete Documents**
   - **Where:** API: `DELETE /api/documents/[id]` (UI coming soon)
   - **What:** Any document

2. **Delete Users**
   - **Where:** Prisma Studio (`npm run db:studio`) → User table
   - **What:** User accounts

3. **Delete Roles**
   - **Where:** Via API or Prisma Studio
   - **What:** Custom roles (not default roles)

4. **Revoke Permissions**
   - **Where:** Document → Manage Permissions (revoke button needed)
   - **What:** Document permissions, role assignments

### 📊 VIEW Operations

1. **View All Users**
   - **Where:** Dashboard → "Users"
   - **Shows:** All users, their roles, security levels

2. **View Audit Logs**
   - **Where:** Dashboard → "Audit Logs"
   - **Shows:** All system activities, security events

3. **View All Documents**
   - **Where:** Dashboard (main page)
   - **Shows:** All accessible documents

4. **View Roles**
   - **Where:** Dashboard → "Roles" (new page)
   - **Shows:** All roles and their permissions

### ⚙️ MODIFY Operations

1. **Modify User Clearance**
   - **Where:** `npm run update-clearance` script
   - **What:** Security labels and clearance levels

2. **Modify Role Permissions**
   - **Where:** Via API or Prisma Studio
   - **What:** Add/remove permissions from roles

---

## 📍 Navigation Guide

### Main Dashboard
- **URL:** `/dashboard`
- **Shows:** All your documents
- **Actions:** Create new document

### Users Management
- **URL:** `/dashboard/users`
- **Shows:** All users in system
- **Actions:** Assign roles to users

### Audit Logs
- **URL:** `/dashboard/audit-logs`
- **Shows:** All system activities
- **Actions:** Filter and search logs

### Roles Management
- **URL:** `/dashboard/roles`
- **Shows:** All roles and permissions
- **Actions:** View role details

### Create Document
- **URL:** `/dashboard/documents/new`
- **Shows:** Document creation form
- **Actions:** Create new document

### View Document
- **URL:** `/dashboard/documents/[id]`
- **Shows:** Document details
- **Actions:** View, manage permissions

---

## 🛠️ Administrator Tools

### Command Line
```bash
npm run assign-admin      # Assign admin role
npm run assign-role       # Assign any role
npm run update-clearance # Update security clearance
npm run verify-permissions <user> # Check user permissions
npm run db:studio        # Open database GUI
```

### Prisma Studio
- **Access:** `npm run db:studio`
- **Use for:** Direct database access, delete operations, advanced management

---

## 📝 Summary

**Administrators can:**
- ✅ Create documents, roles, assign roles
- ✅ View users, audit logs, roles, documents
- ✅ Modify user clearances, role permissions
- ✅ Delete documents, users, roles (via API/Studio)
- ✅ Manage all system settings

**Where to do it:**
- **UI:** Dashboard, Users page, Audit Logs page, Roles page
- **API:** For advanced operations
- **Prisma Studio:** For direct database access

See `ADMINISTRATOR_GUIDE.md` for complete details.

