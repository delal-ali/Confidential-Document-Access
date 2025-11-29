# Quick Testing Guide - 15 Minutes

## Fast Track Testing (For Quick Demo)

### Step 1: Create Test Users (5 min)

1. **Register User 1** (will be admin):
   - Username: `admin`
   - Email: `admin@test.com`
   - Password: `Admin123!`

2. **Register User 2** (will be manager):
   - Username: `manager`
   - Email: `manager@test.com`
   - Password: `Manager123!`

3. **Register User 3** (will be employee):
   - Username: `employee`
   - Email: `employee@test.com`
   - Password: `Employee123!`

### Step 2: Setup Users (2 min)

Run these commands:

```bash
# Assign admin role to first user
npm run assign-admin

# Update clearance levels (modify script to set different levels)
npm run update-clearance
```

Or manually in Prisma Studio:
```bash
npm run db:studio
```

### Step 3: Test MAC (2 min)

1. Login as `admin`
2. Create document with:
   - Title: "Confidential Report"
   - Security Label: `CONFIDENTIAL`
   - Classification: `CONFIDENTIAL`
3. Logout
4. Login as `employee` (with INTERNAL clearance)
5. Try to access the document
6. **Expected**: ❌ Access Denied (insufficient clearance)

### Step 4: Test DAC (2 min)

1. Login as `admin`
2. Go to the document → "Manage Permissions"
3. Grant `employee` read permission
4. Logout
5. Login as `employee`
6. Try to access the document
7. **Expected**: ✅ Access Granted (has permission)

### Step 5: Test RBAC (2 min)

1. Login as `employee`
2. Try to create a new document
3. **Expected**: ❌ Permission Denied (Employee role can't create)
4. Login as `manager`
5. Try to create a document
6. **Expected**: ✅ Allowed (Manager role can create)

### Step 6: Test Audit Logs (2 min)

1. Login as `admin`
2. Go to "Audit Logs"
3. **Expected**: See all logged activities:
   - Logins
   - Document access attempts
   - Permission grants
   - Access denials

---

## Demo Script (For Presentation)

### Introduction (1 min)
"This system implements 5 access control mechanisms: MAC, DAC, RBAC, RuBAC, and ABAC."

### Demo Flow (10 min)

1. **Show Registration** (1 min)
   - "Users register with password policies enforced"
   - Show password validation

2. **Show MAC** (2 min)
   - "Mandatory Access Control enforces security labels"
   - Show: CONFIDENTIAL doc, INTERNAL user → DENIED
   - "System enforces clearance levels"

3. **Show DAC** (2 min)
   - "Discretionary Access Control allows owners to grant permissions"
   - Show: Grant permission to user
   - Show: User can now access

4. **Show RBAC** (2 min)
   - "Role-Based Access Control assigns permissions by role"
   - Show: Employee can't create, Manager can
   - "Roles determine what actions users can perform"

5. **Show Audit Logs** (2 min)
   - "All activities are logged and encrypted"
   - Show: Various log entries
   - "Security alerts for suspicious activities"

6. **Show Combined Controls** (1 min)
   - "All 5 mechanisms work together"
   - "Access requires all checks to pass"

### Conclusion (1 min)
"System provides defense in depth with multiple security layers."

---

## Key Points to Highlight

✅ **5 Access Control Mechanisms** working together
✅ **Comprehensive Audit Logging** with encryption
✅ **Multi-Factor Authentication** support
✅ **Account Security** (lockout, password policies)
✅ **Fine-grained Permissions** (read, write, delete, share)
✅ **Real-time Enforcement** of all access rules

---

## Testing Checklist for Demo

- [ ] User registration works
- [ ] MAC blocks low-clearance users
- [ ] DAC allows permission granting
- [ ] RBAC enforces role permissions
- [ ] Audit logs show all activities
- [ ] Access denied messages are clear
- [ ] All features work smoothly

---

## Troubleshooting During Demo

**If something doesn't work:**
1. Check user's role assignment
2. Check user's security clearance
3. Check document permissions
4. Check audit logs for errors
5. Refresh page / logout and login again

**Quick fixes:**
- `npm run assign-admin` - Assign admin role
- `npm run update-clearance` - Update security clearance
- Check browser console for errors

Good luck! 🎯

