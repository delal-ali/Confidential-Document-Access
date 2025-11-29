# Visual Guide - How the System Works

## 🎬 System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER TRIES TO ACCESS DOCUMENT              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: AUTHENTICATION                                      │
│  ✓ Is user logged in?                                        │
│  ✓ Is token valid?                                           │
│  ❌ If NO → ACCESS DENIED                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (If YES)
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: MAC (Mandatory Access Control)                     │
│  ✓ User clearance level >= Document classification?        │
│  Example: User(INTERNAL) vs Document(CONFIDENTIAL)           │
│  ❌ If NO → ACCESS DENIED                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (If YES)
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: DAC (Discretionary Access Control)                   │
│  ✓ Is user the owner?                                        │
│  OR                                                           │
│  ✓ Does user have explicit permission?                       │
│  ❌ If NO → ACCESS DENIED                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (If YES)
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: RBAC (Role-Based Access Control)                    │
│  ✓ Does user's role have required permission?                │
│  Example: Manager role has "document:read" permission?        │
│  ❌ If NO → ACCESS DENIED                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (If YES)
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: RuBAC (Rule-Based Access Control)                   │
│  ✓ Is it allowed time? (e.g., 9 AM - 5 PM)                   │
│  ✓ Is it allowed location? (e.g., office IP)                 │
│  ✓ Is it allowed device? (e.g., desktop)                     │
│  ❌ If NO → ACCESS DENIED                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (If YES)
┌─────────────────────────────────────────────────────────────┐
│  STEP 6: ABAC (Attribute-Based Access Control)               │
│  ✓ Are all attribute conditions met?                          │
│  Example: Manager + Payroll Dept + Business Hours            │
│  ❌ If NO → ACCESS DENIED                                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼ (If ALL PASS)
┌─────────────────────────────────────────────────────────────┐
│                    ✅ ACCESS GRANTED                          │
│  • Document displayed                                         │
│  • Access logged in audit trail                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND (UI)                          │
│  • Login/Register Pages                                       │
│  • Dashboard                                                  │
│  • Document Management                                        │
│  • User Management (Admin)                                    │
│  • Audit Logs (Admin)                                            │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼ (HTTP Requests)
┌──────────────────────────────────────────────────────────────┐
│                      API LAYER (Backend)                      │
│  • Authentication API                                         │
│  • Documents API                                              │
│  • Users API                                                  │
│  • Roles API                                                  │
│  • Audit Logs API                                             │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                  ACCESS CONTROL LAYER                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                    │
│  │   MAC    │  │   DAC    │  │   RBAC   │                    │
│  └──────────┘  └──────────┘  └──────────┘                    │
│  ┌──────────┐  ┌──────────┐                                  │
│  │  RuBAC   │  │   ABAC   │                                  │
│  └──────────┘  └──────────┘                                  │
└──────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite)                          │
│  • Users                                                       │
│  • Documents                                                   │
│  • Roles & Permissions                                         │
│  • Audit Logs                                                 │
│  • Sessions                                                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔐 Access Control Decision Tree

```
                    User Requests Access
                            │
                            ▼
                    ┌───────────────┐
                    │ Authenticated?│
                    └───────┬───────┘
                            │
                    ┌───────┴───────┐
                    │               │
                   YES              NO
                    │               │
                    │          ┌────▼────┐
                    │          │  DENIED │
                    │          └─────────┘
                    ▼
            ┌───────────────┐
            │ MAC Check     │
            └───────┬───────┘
                    │
            ┌───────┴───────┐
            │               │
          PASS            FAIL
            │               │
            │          ┌────▼────┐
            │          │  DENIED │
            │          └─────────┘
            ▼
    ┌───────────────┐
    │ DAC Check     │
    └───────┬───────┘
            │
    ┌───────┴───────┐
    │               │
  PASS            FAIL
    │               │
    │          ┌────▼────┐
    │          │  DENIED │
    │          └─────────┘
    ▼
┌───────────────┐
│ RBAC Check    │
└───────┬───────┘
        │
┌───────┴───────┐
│               │
PASS          FAIL
│               │
│          ┌────▼────┐
│          │  DENIED │
│          └─────────┘
▼
┌───────────────┐
│ RuBAC Check   │
└───────┬───────┘
        │
┌───────┴───────┐
│               │
PASS          FAIL
│               │
│          ┌────▼────┐
│          │  DENIED │
│          └─────────┘
▼
┌───────────────┐
│ ABAC Check    │
└───────┬───────┘
        │
┌───────┴───────┐
│               │
PASS          FAIL
│               │
│          ┌────▼────┐
│          │  DENIED │
│          └─────────┘
▼
┌───────────────┐
│  ✅ GRANTED   │
└───────────────┘
```

---

## 👥 User Journey Examples

### Example 1: Employee Reading Shared Document

```
1. Employee logs in
   └─> Gets JWT token

2. Employee clicks on document
   └─> System checks authentication ✅

3. MAC Check
   └─> Employee: INTERNAL, Document: INTERNAL ✅

4. DAC Check
   └─> Manager granted read permission ✅

5. RBAC Check
   └─> Employee role has read permission ✅

6. RuBAC Check
   └─> No time restrictions ✅

7. ABAC Check
   └─> No attribute restrictions ✅

8. Result: Document displayed ✅
   └─> Logged: "Employee accessed document"
```

### Example 2: Manager Creating Document

```
1. Manager logs in ✅

2. Manager clicks "New Document" ✅

3. RBAC Check
   └─> Manager role has "document:create" permission ✅

4. Manager fills form and submits ✅

5. Document created ✅
   └─> Manager is set as owner
   └─> Logged: "Manager created document"

6. Document appears in dashboard ✅
```

### Example 3: Access Denied Scenario

```
1. Employee tries to access CONFIDENTIAL document
   └─> Authentication ✅

2. MAC Check
   └─> Employee: INTERNAL, Document: CONFIDENTIAL
   └─> INTERNAL < CONFIDENTIAL ❌

3. Result: ACCESS DENIED
   └─> Logged: "Access denied - insufficient clearance"
   └─> User sees error message
```

---

## 🗂️ Data Flow

### Creating a Document

```
User Input
    │
    ▼
Frontend Form
    │
    ▼
API: POST /api/documents
    │
    ▼
RBAC Check (can user create?)
    │
    ▼
Create in Database
    │
    ▼
Set User as Owner
    │
    ▼
Log in Audit Trail
    │
    ▼
Return Success
    │
    ▼
Document Appears in Dashboard
```

### Accessing a Document

```
User Clicks Document
    │
    ▼
API: GET /api/documents/[id]
    │
    ▼
┌───┴───┐
│       │
MAC     DAC
Check   Check
│       │
RBAC    RuBAC
Check   Check
│       │
ABAC    │
Check   │
│       │
└───┬───┘
    │
All Pass?
    │
    ▼
Return Document
    │
    ▼
Log Access
```

---

## 📊 Permission Hierarchy

```
Administrator
    │
    ├──> All Permissions
    │    ├──> document:create ✅
    │    ├──> document:read ✅
    │    ├──> document:write ✅
    │    ├──> document:delete ✅
    │    ├──> role:create ✅
    │    ├──> role:assign ✅
    │    ├──> audit:read ✅
    │    └──> user:read ✅
    │
Manager
    │
    ├──> Limited Permissions
    │    ├──> document:create ✅
    │    ├──> document:read ✅
    │    ├──> document:write ✅
    │    ├──> role:read ✅
    │    ├──> document:delete ❌
    │    ├──> role:create ❌
    │    ├──> audit:read ❌
    │    └──> user:read ❌
    │
Employee
    │
    └──> Minimal Permissions
         ├──> document:read ✅
         └──> Everything else ❌
```

---

## 🔄 Complete System Workflow

### Registration → Access Flow

```
1. REGISTRATION
   User fills form
   └─> Password validated
   └─> User created in database
   └─> Email verification sent

2. ROLE ASSIGNMENT (by Admin)
   Admin assigns role
   └─> User-Role relationship created
   └─> User gets role permissions

3. LOGIN
   User enters credentials
   └─> Password verified
   └─> JWT token generated
   └─> Session created

4. DOCUMENT ACCESS
   User requests document
   └─> All 5 access controls checked
   └─> If all pass → Document shown
   └─> If any fail → Access denied
   └─> Everything logged

5. AUDIT REVIEW (by Admin)
   Admin views audit logs
   └─> Sees all activities
   └─> Identifies security issues
```

---

## 🎯 Key Takeaways

1. **Multiple Security Layers**: 5 different access control mechanisms work together
2. **All Must Pass**: Every check must pass for access to be granted
3. **Automatic Enforcement**: System enforces rules automatically
4. **Complete Logging**: Everything is recorded for security
5. **Role-Based**: Permissions come from roles, not individual users
6. **Owner Control**: Document owners can grant permissions (DAC)
7. **System Control**: Security labels enforced by system (MAC)
8. **Flexible Rules**: Time, location, device restrictions (RuBAC)
9. **Smart Policies**: Attribute-based conditions (ABAC)

---

## 💡 Think of It Like...

- **MAC** = Security clearance badge (military/government)
- **DAC** = Sharing a Google Doc (you control who sees it)
- **RBAC** = Job title permissions (Manager can approve, Employee cannot)
- **RuBAC** = Building hours (only open 9-5)
- **ABAC** = Smart security system (checks multiple factors)

**All working together to protect your documents!** 🔒

