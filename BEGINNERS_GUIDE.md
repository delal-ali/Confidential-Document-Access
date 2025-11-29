# Beginner's Guide - Understanding the System

## 🎯 What Is This System?

**Simple Answer:** A secure system that controls who can see which documents, with multiple security checks.

**Like:** A high-security building where:
- You need a badge to enter (authentication)
- Your badge shows your clearance level (MAC)
- Your job title determines what you can do (RBAC)
- You can only enter during business hours (RuBAC)
- Managers can give you special access (DAC)
- The system checks multiple things before letting you in (ABAC)

---

## 🔑 The Main Concepts

### 1. Users Have Roles
- **Administrator:** Boss - can do everything
- **Manager:** Supervisor - can create documents, manage team
- **Employee:** Worker - can only read documents shared with them

### 2. Documents Have Security Levels
- **PUBLIC:** Anyone can see
- **INTERNAL:** Only employees
- **CONFIDENTIAL:** Only managers and above
- **TOP_SECRET:** Only highest clearance

### 3. Access Control = Multiple Checks
When you try to access a document, the system asks:
1. Are you logged in? (Authentication)
2. Is your clearance high enough? (MAC)
3. Do you have permission? (DAC)
4. Does your role allow it? (RBAC)
5. Is it the right time/location? (RuBAC)
6. Do your attributes match? (ABAC)

**If ALL say YES → You can access**
**If ANY says NO → Access denied**

---

## 📖 Simple Examples

### Example 1: Employee Wants to Read a Document

**What happens:**
1. Employee logs in ✅
2. Employee clicks on document
3. System checks:
   - ✅ Is employee logged in? YES
   - ✅ Does employee have high enough clearance? YES (if document is INTERNAL or below)
   - ✅ Did manager give permission? YES (if manager granted it)
   - ✅ Can employees read documents? YES
   - ✅ Is it business hours? YES (if rule exists)
   - ✅ All attributes match? YES
4. **Result:** Document shown ✅

### Example 2: Employee Tries to Access Confidential Document

**What happens:**
1. Employee logs in ✅
2. Employee clicks on document
3. System checks:
   - ✅ Is employee logged in? YES
   - ❌ Does employee have high enough clearance? NO (Employee has INTERNAL, document is CONFIDENTIAL)
4. **Result:** Access denied ❌
5. **Message:** "Insufficient security clearance"

### Example 3: Manager Creates Document

**What happens:**
1. Manager logs in ✅
2. Manager clicks "New Document"
3. System checks:
   - ✅ Is manager logged in? YES
   - ✅ Can managers create documents? YES (Manager role has permission)
4. **Result:** Document created ✅
5. Manager is now the **owner** of the document

### Example 4: Manager Shares Document with Employee

**What happens:**
1. Manager (owner) goes to document
2. Manager clicks "Manage Permissions"
3. Manager selects employee
4. Manager grants "read" permission
5. **Result:** Employee can now read the document ✅
6. This is **DAC (Discretionary Access Control)** - owner controls access

---

## 🎭 The Five Security Mechanisms Explained Simply

### 1. MAC (Mandatory Access Control)
**Simple:** "Your security badge level must match or exceed the document's level"

**Example:**
- You have INTERNAL badge
- Document needs CONFIDENTIAL badge
- **Result:** You can't access it (your badge level is too low)

**Who controls it:** System administrators (users can't change their own level)

---

### 2. DAC (Discretionary Access Control)
**Simple:** "Document owner decides who can access"

**Example:**
- You create a document → You're the owner
- You can give permission to your colleague
- Your colleague can now access it
- You can revoke permission anytime

**Who controls it:** Document owners

---

### 3. RBAC (Role-Based Access Control)
**Simple:** "Your job title determines what you can do"

**Example:**
- Manager role → Can create documents ✅
- Employee role → Cannot create documents ❌

**Who controls it:** System administrators (assign roles)

---

### 4. RuBAC (Rule-Based Access Control)
**Simple:** "Rules restrict access based on conditions"

**Example:**
- Rule: "Only access during 9 AM - 5 PM"
- You try to access at 8 PM
- **Result:** Access denied (outside allowed time)

**Who controls it:** System administrators (create rules)

---

### 5. ABAC (Attribute-Based Access Control)
**Simple:** "System checks multiple characteristics before allowing access"

**Example:**
- Policy: "Only HR Managers in Payroll Department"
- You're a Manager in IT Department
- **Result:** Access denied (wrong department)

**Who controls it:** System administrators (create policies)

---

## 🔐 Authentication Explained

### Login Process
1. You enter username and password
2. System checks if password is correct
3. If correct → You get a "token" (like a temporary badge)
4. Token is used for all requests
5. Token expires after some time (security)

### Password Security
- **Hashed:** Passwords are encrypted (even admins can't see them)
- **Strong:** Must have uppercase, lowercase, number, special character
- **Lockout:** After 5 wrong attempts, account locked for 30 minutes

### Multi-Factor Authentication (MFA)
- Extra security layer
- After password, you enter code from phone app
- Makes account much more secure

---

## 📋 What Each Role Can Do

### Administrator
**Can:**
- Create documents
- View all users
- Assign roles
- View audit logs
- Create roles
- Delete anything
- Everything!

**Cannot:**
- Nothing - full access

---

### Manager
**Can:**
- Create documents
- Read documents
- Edit documents (they own)
- Grant permissions to others
- View roles (read-only)

**Cannot:**
- Assign roles to users
- View audit logs
- View all users
- Delete documents they don't own

---

### Employee
**Can:**
- Read documents (if given permission)
- View own profile

**Cannot:**
- Create documents
- Edit documents
- Delete documents
- Grant permissions
- View audit logs
- View other users

---

## 🔄 How Documents Work

### Creating a Document
1. Click "New Document"
2. Enter title and content
3. Choose security level (PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET)
4. Click "Create"
5. **You become the owner**

### Viewing Documents
1. Documents appear on dashboard
2. Click a document to view it
3. System checks all 5 access controls
4. If all pass → Document shown
5. If any fail → Access denied

### Sharing Documents (DAC)
1. Go to your document
2. Click "Manage Permissions"
3. Select a user
4. Choose permissions (read, write, delete, share)
5. Click "Grant Permission"
6. User can now access (if other checks pass)

---

## 📊 Audit Logs Explained

**What are they?** A record of everything that happens.

**What gets logged:**
- Every login (success or failure)
- Every document access
- Every permission change
- Every role assignment
- Security alerts

**Why important:**
- Detect attacks
- See who did what
- Meet compliance requirements
- Investigate issues

**Who can see:** Only Administrators

---

## 🎯 Real-World Scenario

### Scenario: Company Project Document

**Setup:**
1. Manager creates document "Project Alpha" (CONFIDENTIAL)
2. Manager grants read permission to Employee A
3. Employee B tries to access

**What happens for Employee A:**
1. ✅ Logged in
2. ✅ Has INTERNAL clearance (document is CONFIDENTIAL - might fail)
3. ✅ Has permission from manager (DAC)
4. ✅ Employee role can read (RBAC)
5. ✅ Business hours (RuBAC)
6. ✅ Attributes match (ABAC)
7. **BUT:** MAC fails (INTERNAL < CONFIDENTIAL)
8. **Result:** ❌ ACCESS DENIED (clearance too low)

**What happens for Employee B:**
1. ✅ Logged in
2. ❌ No permission from manager (DAC fails)
3. **Result:** ❌ ACCESS DENIED (no permission)

**Solution:**
- Manager needs to increase Employee A's clearance to CONFIDENTIAL
- Or change document to INTERNAL level

---

## 🛠️ How to Use the System

### Step 1: Register
- Go to registration page
- Enter username, email, password
- Password must be strong
- Click "Register"

### Step 2: Get Role Assigned
- Administrator assigns you a role
- You logout and login again
- Now you have role permissions

### Step 3: Use the System
- **As Manager:** Create documents, share with team
- **As Employee:** Read documents shared with you
- **As Admin:** Manage everything

---

## 🎓 Key Terms Explained

- **Authentication:** Proving who you are (login)
- **Authorization:** What you're allowed to do (permissions)
- **Security Label:** Your clearance level (PUBLIC, INTERNAL, etc.)
- **Classification:** Document's sensitivity level
- **Role:** Your job title (Administrator, Manager, Employee)
- **Permission:** Specific action you can do (read, write, create)
- **Owner:** Person who created the document
- **Audit Log:** Record of all activities
- **Token:** Temporary access credential (JWT)
- **Clearance Level:** Number representing your security level (0-3)

---

## 💡 Remember

1. **Multiple checks happen automatically** - you don't see them
2. **All checks must pass** - if one fails, access is denied
3. **Everything is logged** - for security and compliance
4. **Roles determine permissions** - your job title matters
5. **Owners control sharing** - document creators can grant access
6. **System enforces security** - users can't bypass controls

---

## 🎯 Summary

**This system:**
- Protects confidential documents
- Controls who can access what
- Uses 5 different security mechanisms
- Logs everything for security
- Provides different access levels for different roles

**Think of it as:**
- A secure filing cabinet
- With multiple locks
- Different keys for different people
- A logbook of who accessed what
- Smart rules about when/where access is allowed

**The system does all the checking automatically** - you just try to access a document, and the system decides if you can based on all the security rules!

---

This system ensures that sensitive documents are protected with multiple layers of security! 🔒

