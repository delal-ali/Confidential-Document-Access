# Document Access Summary

## 📋 Access Rules by Role

### 👑 Administrator
**Document Creation:**
- ✅ Can create documents with **any security label** (PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET)
- ✅ Can create documents with **any classification** (PUBLIC, INTERNAL, CONFIDENTIAL)
- ✅ Bypasses all MAC restrictions when creating

**Document Viewing:**
- ✅ Can see **ALL documents** in the system
- ✅ No restrictions - sees everything
- ✅ Bypasses MAC, DAC, RuBAC, ABAC checks

**Document Management:**
- ✅ Can delete any document
- ✅ Can edit any document
- ✅ Full system access

---

### 👔 Manager
**Document Creation:**
- ✅ Can create documents with **any security label** (PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET)
- ✅ Can create documents with **any classification** (PUBLIC, INTERNAL, CONFIDENTIAL)
- ✅ Bypasses all MAC restrictions when creating

**Document Viewing:**
- ✅ Can see documents they own
- ✅ Can see documents they have permission for
- ✅ Subject to MAC restrictions (must have proper clearance)
- ✅ Subject to RuBAC rules (time, location, device)
- ✅ Subject to ABAC policies

**Document Management:**
- ✅ Can delete documents they own
- ✅ Can delete documents created by employees
- ✅ Can edit documents they own or have permission for
- ✅ Can grant permissions to other users (DAC)

---

### 👤 Employee
**Document Creation:**
- ❌ Cannot create documents

**Document Viewing:**
- ✅ Can see documents they have **explicit permission for** (granted by owner)
- ✅ Can see **PUBLIC documents** (system-granted access - all employees can see PUBLIC)
- ❌ Cannot see non-PUBLIC documents without explicit permission
- ✅ Must be granted permission by document owner (Admin/Manager) for non-PUBLIC documents
- ✅ Subject to MAC restrictions (must have proper clearance for the document)

**Document Management:**
- ❌ Cannot delete documents
- ❌ Cannot edit documents (unless granted write permission)
- ❌ Cannot grant permissions

---

## 🔐 Access Control Flow

### For Employees:
1. **Check access type:**
   - **PUBLIC document** → System-granted access (all employees can see)
   - **Non-PUBLIC document** → Must have explicit permission from owner
2. **MAC check** → Employee clearance must be sufficient
3. **RuBAC check** → Time/location/device rules must pass
4. **ABAC check** → Attribute policies must pass
5. **If all pass** → Employee can access document

### For Managers:
1. **Create document** → Can use any security label
2. **View documents** → Own documents + documents with permission
3. **MAC check** → Must have proper clearance
4. **Delete** → Own documents + employee documents

### For Administrators:
1. **Create document** → Can use any security label
2. **View documents** → ALL documents (no restrictions)
3. **Delete** → Any document

---

## 📝 Key Points

1. **Managers can create any document** - No MAC restrictions during creation
2. **Admins see everything** - Complete visibility
3. **Employees need explicit permission** - No automatic access, must be granted by owner
4. **All access is logged** - Complete audit trail

---

## 🎯 Examples

### Example 1: Manager Creates TOP_SECRET Document
- Manager creates document with TOP_SECRET label
- ✅ Allowed (managers bypass MAC during creation)
- Document is created successfully
- Only users with TOP_SECRET clearance can access it

### Example 2: Employee Views Document
- Manager creates CONFIDENTIAL document
- Manager grants read permission to Employee
- Employee tries to access
- ✅ MAC check: Employee has CONFIDENTIAL clearance? If yes → Access granted
- ❌ If Employee only has INTERNAL clearance → Access denied

### Example 3: Admin Views All Documents
- Admin goes to dashboard
- ✅ Sees ALL documents in system
- No filtering, no restrictions
- Complete visibility

---

This ensures proper access control while giving managers flexibility to create documents with any security level! 🔒

