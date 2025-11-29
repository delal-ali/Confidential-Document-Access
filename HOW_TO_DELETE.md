# How Administrators Can Delete Items

## 🗑️ Delete Functionality Overview

Administrators can now delete items directly from the UI without needing Prisma Studio. All deletions are logged in the audit trail for security and compliance.

---

## 📄 Delete Documents

### Method 1: From Dashboard
1. Go to **Dashboard** (main page)
2. Find the document you want to delete
3. Click the **"Delete"** button (red button on the right)
4. Confirm deletion in the popup
5. Document is deleted ✅

### Method 2: From Document View Page
1. Click on a document to view it
2. Scroll to the bottom
3. Click **"Delete Document"** button (red button)
4. Confirm deletion
5. You'll be redirected to dashboard

### Who Can Delete:
- **Administrators:** Can delete any document
- **Document Owners:** Can delete their own documents (if they have delete permission)

### What Happens:
- Document is permanently deleted
- All permissions are removed
- Action is logged in audit trail
- User sees confirmation message

---

## 👥 Delete Users

### Steps:
1. Go to **Dashboard → Users**
2. Find the user in the table
3. Click **"Delete"** button in the "Actions" column (red text)
4. Confirm deletion in popup
5. User is deleted ✅

### Restrictions:
- **Cannot delete yourself** - System prevents self-deletion
- **Only Administrators** can delete users
- All user data is permanently removed

### What Gets Deleted:
- User account
- User roles (cascade)
- User sessions
- User permissions
- All related data

### What Happens:
- User is permanently deleted
- Action is logged in audit trail
- Shows confirmation with username

---

## 🎭 Delete Roles

### Steps:
1. Go to **Dashboard → Roles**
2. Find the role you want to delete
3. Click **"Delete"** button (red button on the right)
4. Confirm deletion
5. Role is deleted ✅

### Restrictions:
- **Cannot delete default roles:**
  - Administrator
  - Manager
  - Employee
- **Cannot delete if role is assigned to users:**
  - System will show error: "Cannot delete role. It is assigned to X user(s)."
  - You must remove role assignments first

### What Happens:
- Role is permanently deleted
- All role permissions are removed
- Action is logged in audit trail

---

## 🔐 Delete Access Rules

### Steps:
1. Go to **Dashboard → Access Rules**
2. Find the rule in the table
3. Click **"Delete"** button in the "Actions" column (red text)
4. Confirm deletion
5. Rule is deleted ✅

### Who Can Delete:
- **Only Administrators**

### What Happens:
- Access rule is permanently deleted
- Rule no longer affects document access
- Action is logged in audit trail

---

## 🛡️ Security Features

### All Deletions Are:
1. **Logged:** Every deletion is recorded in audit logs
2. **Confirmed:** Popup confirmation prevents accidental deletion
3. **Restricted:** Only authorized users can delete
4. **Tracked:** IP address and user ID are logged

### Audit Log Information:
- Who deleted (user ID)
- What was deleted (resource type and ID)
- When it was deleted (timestamp)
- From where (IP address)
- Details (resource name, etc.)

---

## ⚠️ Important Notes

### Before Deleting:

1. **Documents:**
   - Make sure you have a backup if needed
   - Check if document is important
   - Consider if others need it

2. **Users:**
   - Cannot delete yourself
   - User data is permanently removed
   - Consider deactivating instead (if feature exists)

3. **Roles:**
   - Cannot delete default roles
   - Must remove role assignments first
   - Check if role is in use

4. **Access Rules:**
   - Rule is immediately removed
   - May affect document access immediately
   - Check if rule is critical

---

## 🔄 What Happens After Deletion

### Documents:
- Document removed from database
- All permissions removed
- No longer appears in lists
- Cannot be recovered (unless backup exists)

### Users:
- User account removed
- All user data removed
- User cannot login
- All user's documents remain (owned by deleted user)

### Roles:
- Role removed from database
- Role permissions removed
- Users with this role lose the role
- Cannot be recovered

### Access Rules:
- Rule removed from database
- No longer enforced
- Document access may change
- Cannot be recovered

---

## 📋 Quick Reference

| Item | Location | Button | Who Can Delete |
|------|----------|--------|----------------|
| **Document** | Dashboard or Document View | "Delete" | Admin, Owner |
| **User** | Users Page | "Delete" | Admin only |
| **Role** | Roles Page | "Delete" | Admin only |
| **Access Rule** | Access Rules Page | "Delete" | Admin only |

---

## 🎯 Example Workflows

### Example 1: Delete a Document
```
1. Login as Administrator
2. Go to Dashboard
3. Find document "Old Report"
4. Click "Delete" button
5. Confirm: "Are you sure you want to delete document 'Old Report'?"
6. Click OK
7. ✅ Document deleted
8. ✅ Logged in audit trail
```

### Example 2: Delete a User
```
1. Login as Administrator
2. Go to Dashboard → Users
3. Find user "john_doe"
4. Click "Delete" in Actions column
5. Confirm: "Are you sure you want to delete user 'john_doe'?"
6. Click OK
7. ✅ User deleted
8. ✅ Logged in audit trail
```

### Example 3: Delete a Role
```
1. Login as Administrator
2. Go to Dashboard → Roles
3. Find role "Temporary Role"
4. Click "Delete" button
5. Confirm deletion
6. ✅ Role deleted (if not assigned to users)
7. ✅ Logged in audit trail
```

---

## 🚨 Error Messages

### "Cannot delete role. It is assigned to X user(s)."
- **Solution:** Remove role assignments first, then delete role

### "You cannot delete your own account"
- **Solution:** Have another admin delete your account, or use Prisma Studio

### "Only administrators can delete [item]"
- **Solution:** Login as Administrator

### "Document not found"
- **Solution:** Document may already be deleted

---

## 💡 Best Practices

1. **Always confirm** before deleting
2. **Check dependencies** (e.g., roles assigned to users)
3. **Backup important data** before deletion
4. **Review audit logs** after deletion
5. **Use with caution** - deletions are permanent
6. **Document deletions** for compliance

---

## 🔍 Verify Deletions

### Check Audit Logs:
1. Go to **Dashboard → Audit Logs**
2. Filter by action: `DOCUMENT_DELETED`, `USER_DELETED`, `ROLE_DELETED`, `ACCESS_RULE_DELETED`
3. See who deleted what and when

### Example Audit Log Entry:
```
Action: DOCUMENT_DELETED
User: admin_user
Resource: document-123
Timestamp: 2024-01-15 14:30:00
Details: { title: "Old Report", deletedBy: "admin_user" }
```

---

## ✅ Summary

**Administrators can now delete:**
- ✅ Documents (from dashboard or document page)
- ✅ Users (from users page)
- ✅ Roles (from roles page)
- ✅ Access Rules (from access rules page)

**All without using Prisma Studio!**

**Everything is:**
- ✅ Logged in audit trail
- ✅ Confirmed with popup
- ✅ Restricted to authorized users
- ✅ Tracked with IP and user ID

---

No more need to use Prisma Studio for deletions! Everything can be done through the UI. 🎉

