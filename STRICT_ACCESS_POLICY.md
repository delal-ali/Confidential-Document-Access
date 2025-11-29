# Strict Access Policy Enforcement

## ✅ Implementation Complete

The system now enforces **strict access policies** where access to information is determined by the **system**, not user discretion. Mandatory Access Control (MAC) is the primary and mandatory check that must pass before any other access controls are evaluated.

---

## 🔒 Policy Overview

### Core Principle
**Access is determined by system policies, not user discretion.**

1. **MAC (Mandatory Access Control)** - **MANDATORY FIRST CHECK**
   - System-determined based on security labels and clearance levels
   - Cannot be bypassed by user permissions
   - Must pass before any other access checks

2. **DAC (Discretionary Access Control)** - **SECONDARY CHECK**
   - Only evaluated if MAC passes
   - Permissions granted by administrators
   - Cannot override MAC restrictions

3. **RBAC (Role-Based Access Control)** - **SYSTEM-DEFINED**
   - Roles and permissions defined by system administrators
   - Enforced alongside MAC

4. **RuBAC (Rule-Based Access Control)** - **SYSTEM RULES**
   - Time, location, and device-based rules
   - System-defined policies

5. **ABAC (Attribute-Based Access Control)** - **SYSTEM POLICIES**
   - Attribute-based policies defined by administrators
   - Fine-grained system control

---

## 🛡️ Access Control Flow

### Document Access Flow

```
1. User requests access to document
   ↓
2. [MANDATORY] MAC Check
   - Check user's security label vs document's security label
   - Check user's clearance level vs document's classification
   - If MAC fails → ACCESS DENIED (system policy)
   ↓
3. [IF MAC PASSES] DAC Check
   - Check if user is document owner
   - Check if user has explicit permission (granted by administrator)
   - If DAC fails → ACCESS DENIED (no permission)
   ↓
4. [IF MAC + DAC PASS] RuBAC Check
   - Check time-based rules
   - Check location-based rules
   - Check device-based rules
   - If RuBAC fails → ACCESS DENIED (rule violation)
   ↓
5. [IF MAC + DAC + RuBAC PASS] ABAC Check
   - Check attribute-based policies
   - Evaluate user attributes (role, department, location, employment status)
   - Evaluate resource attributes (department, classification)
   - If ABAC fails → ACCESS DENIED (policy violation)
   ↓
6. [ALL CHECKS PASS] Access Granted
```

### Key Points

1. **MAC is ALWAYS checked first** - No exceptions (except administrators)
2. **DAC cannot bypass MAC** - Even if user has permission, MAC must pass
3. **System policies take precedence** - User discretion is eliminated
4. **Administrators bypass all checks** - System administrator privilege

---

## 📋 Implementation Details

### Document Access (`app/api/documents/[id]/route.ts`)

**Before (User Discretion):**
- DAC permissions could bypass MAC checks
- Employees with explicit permission could access documents without MAC clearance
- User-granted permissions overrode system policies

**After (System-Determined):**
- MAC is checked FIRST and is MANDATORY
- DAC permissions only work if MAC allows
- System policies cannot be overridden by user permissions
- Clear error messages indicate system policy enforcement

**Code Flow:**
```typescript
// Step 1: MANDATORY MAC Check (system-determined)
if (!isAdmin) {
  const macAllowed = checkMACAccess(...)
  if (!macAllowed) {
    return { error: 'Insufficient security clearance (system policy)' }
  }
}

// Step 2: DAC Check (only if MAC passed)
if (!isOwner && !hasPermission) {
  return { error: 'No permission (MAC passed but permission required)' }
}

// Step 3: RuBAC Check
// Step 4: ABAC Check
```

### Document Listing (`app/api/documents/route.ts`)

**Before:**
- Documents with explicit permission bypassed MAC checks
- User discretion allowed access without system clearance

**After:**
- All documents filtered by MAC FIRST
- Only documents passing MAC are considered for DAC checks
- System-determined access policies enforced

**Code Flow:**
```typescript
const accessibleDocuments = documents.filter(doc => {
  // Step 1: MANDATORY MAC check
  const macAllowed = checkMACAccess(...)
  if (!macAllowed) {
    return false // System policy denies access
  }
  
  // Step 2: DAC check (only if MAC passed)
  // Check ownership/permissions
  return true
})
```

---

## 🔐 Security Benefits

1. **System-Determined Access**
   - Access decisions made by system policies, not user discretion
   - Prevents privilege escalation through permission grants
   - Ensures consistent security enforcement

2. **Mandatory Clearance Checks**
   - Security labels and clearance levels cannot be bypassed
   - Prevents unauthorized access to sensitive information
   - Enforces need-to-know principle

3. **Centralized Control**
   - Only system administrators can grant permissions
   - Permissions must align with system policies
   - Audit trail for all access decisions

4. **Defense in Depth**
   - Multiple layers of access control
   - Each layer must pass for access to be granted
   - System policies enforced at every level

---

## 📊 Access Decision Matrix

| User Clearance | Document Label | MAC Result | Has Permission | Final Access |
|---------------|----------------|------------|----------------|--------------|
| PUBLIC (0)    | PUBLIC (0)     | ✅ PASS    | ✅ Yes         | ✅ GRANTED   |
| PUBLIC (0)    | PUBLIC (0)     | ✅ PASS    | ❌ No          | ❌ DENIED    |
| PUBLIC (0)    | CONFIDENTIAL (2) | ❌ FAIL | ✅ Yes         | ❌ DENIED (MAC failed) |
| CONFIDENTIAL (2) | CONFIDENTIAL (2) | ✅ PASS | ✅ Yes         | ✅ GRANTED   |
| CONFIDENTIAL (2) | CONFIDENTIAL (2) | ✅ PASS | ❌ No          | ❌ DENIED (No permission) |
| INTERNAL (1)  | TOP_SECRET (3) | ❌ FAIL | ✅ Yes         | ❌ DENIED (MAC failed) |

**Key:** Even if a user has explicit permission (DAC), if MAC fails, access is denied.

---

## 🎯 Examples

### Example 1: Employee with Permission but Insufficient Clearance

**Scenario:**
- Employee has `PUBLIC` clearance (Level 0)
- Document is `CONFIDENTIAL` (Level 2)
- Administrator granted employee read permission

**Result:**
- ❌ **ACCESS DENIED**
- **Reason:** MAC check fails - insufficient security clearance
- **Message:** "Access denied: Insufficient security clearance. Access is determined by system policies based on your security clearance level, not user discretion."

**Explanation:** Even though the employee has explicit permission (DAC), the system-determined MAC policy denies access because the user's clearance level is insufficient.

### Example 2: Employee with Sufficient Clearance but No Permission

**Scenario:**
- Employee has `CONFIDENTIAL` clearance (Level 2)
- Document is `CONFIDENTIAL` (Level 2)
- No explicit permission granted

**Result:**
- ❌ **ACCESS DENIED**
- **Reason:** MAC passed, but DAC check fails - no permission
- **Message:** "Access denied: Employees can only access PUBLIC documents or documents they have been granted permission for. MAC clearance passed, but no permission granted."

**Explanation:** The employee has sufficient clearance (MAC passes), but they need explicit permission (DAC) to access non-PUBLIC documents.

### Example 3: Employee with Sufficient Clearance and Permission

**Scenario:**
- Employee has `CONFIDENTIAL` clearance (Level 2)
- Document is `CONFIDENTIAL` (Level 2)
- Administrator granted employee read permission

**Result:**
- ✅ **ACCESS GRANTED**
- **Reason:** MAC passed AND DAC passed
- **Flow:** MAC → DAC → RuBAC → ABAC (all checks pass)

**Explanation:** Both system-determined MAC policy and administrator-granted permission allow access.

---

## 🔍 Error Messages

### MAC Failure
```
Access denied: Insufficient security clearance. 
Access is determined by system policies based on your security clearance level, not user discretion.

System Policy: MAC (Mandatory Access Control) enforcement
Required Clearance: CONFIDENTIAL / CONFIDENTIAL
Your Clearance: PUBLIC / Level 0
```

### DAC Failure (MAC Passed)
```
Access denied: Employees can only access PUBLIC documents or documents they have been granted permission for. 
MAC clearance passed, but no permission granted.

System Policy: MAC + DAC enforcement
```

---

## ✅ Summary

The system now enforces **strict access policies** where:

1. ✅ **MAC is mandatory** - Always checked first
2. ✅ **System-determined access** - Policies cannot be overridden
3. ✅ **DAC is secondary** - Only works if MAC allows
4. ✅ **No user discretion** - Access determined by system, not users
5. ✅ **Clear error messages** - Users understand system policy enforcement
6. ✅ **Comprehensive audit logging** - All access decisions logged with reasons

**Access to information is now determined by the system, not user discretion.**

