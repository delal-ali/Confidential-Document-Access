# Comprehensive Testing Guide

This guide will help you test all features of the Confidential Document Access & User Management System.

## Prerequisites

1. Make sure the server is running: `npm run dev`
2. Have at least 2-3 user accounts ready for testing
3. Open the application at `http://localhost:3000`

---

## Part 1: Authentication & User Management Testing

### Test 1.1: User Registration
1. Go to `http://localhost:3000`
2. Click "Register" tab
3. Fill in the form:
   - Username: `testuser1`
   - Email: `test1@example.com`
   - Password: `TestPass123!` (must meet requirements)
   - First Name, Last Name (optional)
4. Click "Register"
5. **Expected Result**: Success message, redirected to login

**What to verify:**
- ✅ Password validation works (try weak passwords)
- ✅ Email format validation
- ✅ Username uniqueness check

### Test 1.2: Login & Session Management
1. Login with your credentials
2. **Expected Result**: Redirected to dashboard, token stored
3. Check browser localStorage for `token` and `refreshToken`
4. Refresh the page - should stay logged in

### Test 1.3: Password Policies
Try registering with weak passwords:
- `short` → Should fail (too short)
- `nouppercase123!` → Should fail (no uppercase)
- `NOLOWERCASE123!` → Should fail (no lowercase)
- `NoNumbers!` → Should fail (no numbers)
- `NoSpecial123` → Should fail (no special char)
- `ValidPass123!` → Should succeed

### Test 1.4: Account Lockout
1. Try logging in with wrong password 5 times
2. **Expected Result**: Account locked for 30 minutes
3. Try logging in again → Should show lockout message

### Test 1.5: Password Change
1. Login to your account
2. Go to profile/settings (or use API)
3. Change password
4. **Expected Result**: Password changed, need to login again

---

## Part 2: Mandatory Access Control (MAC) Testing

### Test 2.1: Security Label Hierarchy
**Setup:**
1. Create 3 users with different security labels:
   - User A: `PUBLIC` (level 0)
   - User B: `INTERNAL` (level 1) 
   - User C: `CONFIDENTIAL` (level 2)

**To update user clearance, run:**
```bash
npm run update-clearance
```
(Modify the script to update specific users)

**Test Steps:**
1. User C creates a document with `CONFIDENTIAL` label
2. User B tries to access → **Should be DENIED** (insufficient clearance)
3. User A tries to access → **Should be DENIED**
4. User C accesses → **Should be ALLOWED**

### Test 2.2: Classification Levels
1. Create document with:
   - Security Label: `INTERNAL`
   - Classification: `CONFIDENTIAL`
2. User with `INTERNAL` label tries to access
3. **Expected Result**: DENIED (classification level too high)

### Test 2.3: MAC Enforcement
1. As admin, create documents with different labels:
   - `PUBLIC`
   - `INTERNAL`
   - `CONFIDENTIAL`
   - `TOP_SECRET`
2. Test access with users at different clearance levels
3. **Expected Result**: Users can only access documents at or below their clearance

---

## Part 3: Discretionary Access Control (DAC) Testing

### Test 3.1: Document Ownership
1. User A creates a document
2. **Expected Result**: User A is the owner
3. User A can view, edit, delete the document

### Test 3.2: Grant Permissions
1. User A creates a document
2. User A goes to "Manage Permissions" for that document
3. Grant User B:
   - `canRead: true`
   - `canWrite: false`
   - `canDelete: false`
   - `canShare: true`
4. **Expected Result**: Permission granted, logged in audit

### Test 3.3: Permission Enforcement
1. User B tries to read the document → **Should be ALLOWED**
2. User B tries to edit the document → **Should be DENIED**
3. User B tries to delete the document → **Should be DENIED**
4. User B tries to share the document → **Should be ALLOWED**

### Test 3.4: Revoke Permissions
1. User A revokes User B's read permission
2. User B tries to access → **Should be DENIED**

### Test 3.5: Permission Expiration
1. Grant permission with expiration date (via API)
2. After expiration, user tries to access → **Should be DENIED**

---

## Part 4: Role-Based Access Control (RBAC) Testing

### Test 4.1: Role Assignment
**Setup roles:**
- Administrator: Full access
- Manager: Create/read documents, view roles
- Employee: Read documents only

**Test Steps:**
1. Assign "Manager" role to User A
2. User A tries to create document → **Should be ALLOWED**
3. User A tries to view roles → **Should be ALLOWED**
4. User A tries to create role → **Should be DENIED** (only admin)

### Test 4.2: Role Permissions
1. Assign "Employee" role to User B
2. User B tries to create document → **Should be DENIED**
3. User B tries to read document → **Should be ALLOWED**

### Test 4.3: Dynamic Role Changes
1. User A has "Employee" role
2. Assign "Manager" role to User A
3. User A should now have manager permissions
4. Remove "Manager" role
5. User A should lose manager permissions

### Test 4.4: Role Expiration
1. Assign role with expiration date
2. After expiration, user should lose role permissions

---

## Part 5: Rule-Based Access Control (RuBAC) Testing

### Test 5.1: Time-Based Rules
**Create a rule via API or database:**
```typescript
// Only allow access 9 AM - 5 PM, Monday-Friday
{
  ruleType: 'TIME',
  allowedStartTime: '09:00',
  allowedEndTime: '17:00',
  allowedDays: 'MON,TUE,WED,THU,FRI',
  targetType: 'document',
  targetId: documentId
}
```

**Test Steps:**
1. Try accessing document during business hours → **Should be ALLOWED**
2. Try accessing document at 8 PM → **Should be DENIED**
3. Try accessing on weekend → **Should be DENIED**

### Test 5.2: Location-Based Rules
**Create rule:**
```typescript
{
  ruleType: 'LOCATION',
  allowedLocations: '192.168.1.100,192.168.1.101',
  targetType: 'document',
  targetId: documentId
}
```

**Test Steps:**
1. Access from allowed IP → **Should be ALLOWED**
2. Access from different IP → **Should be DENIED**

### Test 5.3: Device-Based Rules
**Create rule:**
```typescript
{
  ruleType: 'DEVICE',
  allowedDevices: 'desktop,laptop',
  targetType: 'document',
  targetId: documentId
}
```

**Test Steps:**
1. Access from desktop → **Should be ALLOWED**
2. Access from mobile → **Should be DENIED**

---

## Part 6: Attribute-Based Access Control (ABAC) Testing

### Test 6.1: Attribute-Based Policies
**Create policy:**
```typescript
{
  ruleType: 'ATTRIBUTE',
  attributeConditions: JSON.stringify([
    {
      attribute: 'user.department',
      operator: 'equals',
      value: 'Payroll'
    },
    {
      attribute: 'user.role',
      operator: 'contains',
      value: 'Manager'
    },
    {
      attribute: 'resource.classification',
      operator: 'equals',
      value: 'Confidential'
    }
  ]),
  targetType: 'document',
  targetId: documentId
}
```

**Test Steps:**
1. User in Payroll department with Manager role → **Should be ALLOWED**
2. User in IT department → **Should be DENIED**
3. User in Payroll but not Manager → **Should be DENIED**

### Test 6.2: Complex Attribute Conditions
Test with multiple attributes:
- Department + Role + Time
- Location + Device + Classification
- Employment Status + Security Label

---

## Part 7: Multi-Factor Authentication (MFA) Testing

### Test 7.1: Setup MFA
1. Login to your account
2. Go to MFA settings (or use API: `POST /api/auth/mfa/setup`)
3. **Expected Result**: QR code displayed
4. Scan with authenticator app (Google Authenticator, Authy)

### Test 7.2: Verify MFA
1. Enter OTP from authenticator app
2. **Expected Result**: MFA enabled

### Test 7.3: Login with MFA
1. Logout
2. Login with username/password
3. **Expected Result**: Prompted for OTP
4. Enter correct OTP → **Should login successfully**
5. Enter wrong OTP → **Should be denied**

---

## Part 8: Audit Logging Testing

### Test 8.1: User Activity Logging
1. Perform various actions:
   - Login
   - Create document
   - Access document
   - Grant permission
   - Change password
2. Go to "Audit Logs" page
3. **Expected Result**: All actions logged with:
   - Timestamp
   - User information
   - Action type
   - IP address
   - Status (SUCCESS/FAILURE)

### Test 8.2: System Event Logging
1. Check audit logs for system events
2. **Expected Result**: System startup, configuration changes logged

### Test 8.3: Security Alerts
1. Try brute force login (5+ failed attempts)
2. Check audit logs
3. **Expected Result**: Security alert generated for brute force attempt

### Test 8.4: Log Filtering
1. Use filters on audit logs page:
   - Filter by action: `LOGIN_SUCCESS`
   - Filter by resource type: `document`
   - Filter by date range
2. **Expected Result**: Logs filtered correctly

---

## Part 9: Combined Access Control Testing

### Test 9.1: Multiple Controls Working Together
**Scenario:** User tries to access CONFIDENTIAL document

1. **MAC Check**: User has CONFIDENTIAL clearance → ✅ PASS
2. **DAC Check**: User has read permission → ✅ PASS
3. **RBAC Check**: User's role allows document read → ✅ PASS
4. **RuBAC Check**: Access during business hours → ✅ PASS
5. **ABAC Check**: User in correct department → ✅ PASS
6. **Expected Result**: Access granted (all checks passed)

### Test 9.2: Access Denied Scenarios
Test various denial scenarios:
- MAC: Insufficient clearance → DENIED
- DAC: No permission → DENIED
- RBAC: Role doesn't have permission → DENIED
- RuBAC: Outside allowed time → DENIED
- ABAC: Attributes don't match → DENIED

---

## Part 10: Document Management Testing

### Test 10.1: Create Document
1. Create document with different security labels
2. **Expected Result**: Document created, owner set correctly

### Test 10.2: List Documents
1. View documents list
2. **Expected Result**: Only shows documents user can access (filtered by MAC)

### Test 10.3: View Document
1. Click on document
2. **Expected Result**: Full access control check performed, document displayed if allowed

### Test 10.4: Document Permissions
1. View permissions for a document
2. Grant/revoke permissions
3. **Expected Result**: Permissions updated, audit logged

---

## Part 11: Role Management Testing

### Test 11.1: Create Role
1. As Administrator, create new role
2. Assign permissions to role
3. **Expected Result**: Role created with specified permissions

### Test 11.2: Assign Role to User
1. Assign role to user
2. **Expected Result**: User gains role permissions

### Test 11.3: Role Audit Trail
1. Check audit logs after role assignment
2. **Expected Result**: Role assignment logged with who assigned it

---

## Testing Checklist

### Authentication ✅
- [ ] User registration
- [ ] Email validation
- [ ] Password strength validation
- [ ] Login/logout
- [ ] Session management
- [ ] Account lockout (5 failed attempts)
- [ ] Password change
- [ ] MFA setup and verification

### Access Control ✅
- [ ] MAC: Security label enforcement
- [ ] MAC: Clearance level checks
- [ ] DAC: Document ownership
- [ ] DAC: Permission granting
- [ ] DAC: Permission enforcement
- [ ] DAC: Permission revocation
- [ ] RBAC: Role assignment
- [ ] RBAC: Role permissions
- [ ] RBAC: Dynamic role changes
- [ ] RuBAC: Time-based rules
- [ ] RuBAC: Location-based rules
- [ ] RuBAC: Device-based rules
- [ ] ABAC: Attribute-based policies
- [ ] Combined access control checks

### Audit & Logging ✅
- [ ] User activity logging
- [ ] System event logging
- [ ] Security alerts
- [ ] Log filtering
- [ ] Log encryption

### Document Management ✅
- [ ] Create document
- [ ] List documents
- [ ] View document
- [ ] Manage permissions
- [ ] Access control enforcement

---

## Quick Test Script

### 1. Create Test Users
```bash
# Register 3 users through the UI:
# - admin (Administrator role)
# - manager (Manager role)  
# - employee (Employee role)
```

### 2. Set Security Clearances
```bash
# Update the update-clearance.ts script to set different clearances:
# - admin: TOP_SECRET (level 3)
# - manager: CONFIDENTIAL (level 2)
# - employee: INTERNAL (level 1)
```

### 3. Test Scenarios
1. **MAC Test**: Manager creates CONFIDENTIAL doc, employee tries to access → DENIED
2. **DAC Test**: Manager grants read permission to employee → ALLOWED
3. **RBAC Test**: Employee tries to create doc → DENIED (no permission)
4. **Combined Test**: All controls working together

---

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| MAC: Low clearance accessing high-level doc | ❌ DENIED |
| DAC: Owner granting permission | ✅ ALLOWED |
| DAC: Non-owner without permission | ❌ DENIED |
| RBAC: Role without permission | ❌ DENIED |
| RuBAC: Access outside allowed time | ❌ DENIED |
| ABAC: Attributes don't match | ❌ DENIED |
| All checks pass | ✅ ALLOWED |
| Audit logging | ✅ All actions logged |
| MFA setup | ✅ QR code generated |
| Account lockout | ✅ Locked after 5 attempts |

---

## Tips for Testing

1. **Use Browser DevTools**: Check Network tab to see API responses
2. **Check Audit Logs**: Verify all actions are logged
3. **Test Edge Cases**: Try unusual scenarios
4. **Multiple Users**: Use different browsers/incognito for different users
5. **Check Console**: Look for errors in browser console
6. **Database Inspection**: Use `npm run db:studio` to inspect data

---

## Common Issues & Solutions

### Issue: "Insufficient security clearance"
**Solution**: Update user's security label using `npm run update-clearance`

### Issue: "Permission denied"
**Solution**: Check user's role and assigned permissions

### Issue: "Access denied: Rule violation"
**Solution**: Check time/location/device rules for the document

### Issue: Token expired
**Solution**: Logout and login again

---

## Next Steps After Testing

1. Document any bugs found
2. Test edge cases
3. Performance testing with multiple users
4. Security testing (try to bypass controls)
5. Prepare demonstration for your project presentation

Good luck with your testing! 🚀

