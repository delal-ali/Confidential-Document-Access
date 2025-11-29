# Fine-Grained Access Control with ABAC

## ✅ Implementation Complete

The system now supports fine-grained access control using attributes such as user role, department, location, and employment status.

---

## 🎯 Overview

Attribute-Based Access Control (ABAC) allows you to create policies based on user and resource attributes, enabling fine-grained control like:

- **"Employees in the Payroll Department"** can access salary data
- **"Employees in IT"** cannot access Payroll documents
- **"Managers in HR"** can access HR documents
- **"Active employees in Finance"** can access financial documents

---

## 📋 Supported Attributes

### User Attributes
- **`user.role`** - User's role (Administrator, Manager, Employee)
- **`user.department`** - User's department (e.g., "Payroll", "IT", "HR", "Finance")
- **`user.location`** - User's location (e.g., "New York", "London", "Remote")
- **`user.employmentStatus`** - ACTIVE, INACTIVE, SUSPENDED, TERMINATED
- **`user.securityLabel`** - Security clearance (PUBLIC, INTERNAL, CONFIDENTIAL, TOP_SECRET)
- **`user.clearanceLevel`** - Numeric clearance level (0-3)

### Resource Attributes
- **`resource.department`** - Document's department (set when creating document)
- **`resource.classification`** - Document classification (PUBLIC, INTERNAL, CONFIDENTIAL)
- **`resource.securityLabel`** - Document security label
- **`resource.ownerId`** - Document owner ID

### Context Attributes
- **`context.timestamp`** - Current time
- **`context.ipAddress`** - User's IP address
- **`context.deviceType`** - Device type (desktop, mobile, tablet, laptop)

---

## 🔧 How to Create ABAC Policies

### Method 1: User-Friendly Form (Recommended)

1. Navigate to **Dashboard → Access Rules**
2. Click **"Create New Rule"**
3. Select **"Attribute-Based (ABAC)"** as Rule Type
4. Fill in the form fields:
   - **User Role**: Select role (Administrator, Manager, Employee)
   - **User Department**: Enter department name (e.g., "Payroll")
   - **User Location**: Enter location (optional)
   - **Employment Status**: Select status (optional)
   - **Resource Department**: Match documents by department (optional)
   - **Resource Classification**: Select classification (optional)
5. Click **"Create Rule"**

### Method 2: Advanced JSON Editor

For complex policies, use the JSON editor:
1. Click **"Advanced: Edit JSON directly"**
2. Enter JSON conditions:
```json
[
  {
    "attribute": "user.department",
    "operator": "equals",
    "value": "Payroll"
  },
  {
    "attribute": "user.role",
    "operator": "in",
    "value": ["Employee", "Manager"]
  },
  {
    "attribute": "resource.department",
    "operator": "equals",
    "value": "Payroll"
  }
]
```

---

## 📊 Example Policies

### Example 1: Payroll Employees Only
**Policy**: "Employees in the Payroll Department can access Payroll documents"

**Conditions**:
- User Department: `Payroll`
- User Role: `Employee`
- Resource Department: `Payroll`

**Result**: Only employees in Payroll department can access Payroll department documents.

---

### Example 2: IT Cannot Access Payroll
**Policy**: "IT employees cannot access Payroll documents"

**Implementation**: Create a rule that denies access when:
- User Department: `IT`
- Resource Department: `Payroll`

**Note**: This requires a deny rule (higher priority) or explicit exclusion logic.

---

### Example 3: HR Managers Only
**Policy**: "Only Managers in HR department can access HR Confidential documents"

**Conditions**:
- User Role: `Manager`
- User Department: `HR`
- Resource Department: `HR`
- Resource Classification: `CONFIDENTIAL`

**Result**: Only HR Managers can access HR Confidential documents.

---

### Example 4: Active Employees in Finance
**Policy**: "Only active employees in Finance can access financial documents"

**Conditions**:
- User Department: `Finance`
- User Role: `Employee`
- Employment Status: `ACTIVE`
- Resource Department: `Finance`

**Result**: Only active Finance employees can access Finance documents.

---

## 🏗️ Implementation Details

### Database Schema

**Document Model** - Added `department` field:
```prisma
model Document {
  // ... other fields
  department String? // Department for ABAC fine-grained control
}
```

**AccessRule Model** - Uses `attributeConditions` JSON field:
```prisma
model AccessRule {
  attributeConditions String? // JSON array of PolicyCondition
  ruleType String // 'ATTRIBUTE' or 'COMPOSITE'
}
```

### Policy Condition Structure

```typescript
interface PolicyCondition {
  attribute: string  // e.g., "user.department"
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in'
  value: string | number | string[]
}
```

### Evaluation Logic

1. **Get User Attributes**: Fetch user's role, department, location, employment status
2. **Get Resource Attributes**: Fetch document's department, classification, security label
3. **Get Context**: Current time, IP address, device type
4. **Evaluate Conditions**: Check each condition against attributes
5. **Apply Logic**: AND/OR logic between conditions
6. **Return Result**: Allow or deny access

---

## 🔍 How It Works

### Document Access Flow

```
User Requests Document
    │
    ▼
1. Authentication Check ✅
    │
    ▼
2. RBAC Check (Role permissions) ✅
    │
    ▼
3. MAC Check (Security clearance) ✅
    │
    ▼
4. DAC Check (Document permissions) ✅
    │
    ▼
5. RuBAC Check (Time/location rules) ✅
    │
    ▼
6. ABAC Check (Attribute-based policies) ✅
    │
    ├─> Get user attributes (role, department, location, status)
    ├─> Get resource attributes (department, classification)
    ├─> Evaluate policy conditions
    └─> Allow or deny based on conditions
    │
    ▼
Access Granted or Denied
```

---

## 🎨 User Interface

### Access Rules Page (`/dashboard/access-rules`)

**For Administrators**:
- Create new ABAC policies using form fields
- View all existing policies
- Edit/delete policies
- Use quick example buttons for common policies

**For All Users**:
- View all access rules (read-only)
- See policy conditions and descriptions

### Document Creation (`/dashboard/documents/new`)

**New Field**: **Department**
- Optional field for assigning document to a department
- Used by ABAC policies to match documents
- Example: Set department to "Payroll" for salary documents

---

## 📝 Quick Examples

### Example: Payroll Salary Data Access

**Step 1**: Create a document with department "Payroll"
- Title: "Monthly Salary Report"
- Department: "Payroll"
- Classification: "CONFIDENTIAL"

**Step 2**: Create ABAC policy
- Name: "Payroll Employees Only"
- User Department: "Payroll"
- User Role: "Employee"
- Resource Department: "Payroll"
- Target: Specific document or all Payroll documents

**Result**: Only employees in Payroll department can access this document.

---

### Example: IT Cannot Access Payroll

**Step 1**: Create a document with department "Payroll"
- Department: "Payroll"

**Step 2**: Create ABAC policy (deny rule)
- Name: "IT Cannot Access Payroll"
- User Department: "IT"
- Resource Department: "Payroll"
- Priority: High (to ensure it's evaluated first)

**Result**: IT employees cannot access Payroll documents.

---

## 🔐 Operators

### Available Operators

1. **`equals`**: Exact match
   - Example: `user.department equals "Payroll"`

2. **`contains`**: Substring match
   - Example: `user.role contains "Manager"`

3. **`in`**: Value in array
   - Example: `user.role in ["Manager", "Administrator"]`

4. **`greaterThan`**: Numeric comparison
   - Example: `user.clearanceLevel greaterThan 1`

5. **`lessThan`**: Numeric comparison
   - Example: `user.clearanceLevel lessThan 3`

---

## 🎯 Use Cases

### 1. Department-Based Access
- **Payroll documents** → Only Payroll employees
- **IT documents** → Only IT employees
- **HR documents** → Only HR employees

### 2. Role + Department Combination
- **Managers in Finance** → Can access Finance documents
- **Employees in Payroll** → Can access Payroll documents
- **Administrators** → Can access all (bypass ABAC)

### 3. Employment Status Filtering
- **Active employees only** → Exclude inactive/suspended users
- **Active managers** → Only active managers can access

### 4. Location-Based Access
- **New York office** → Only users in New York location
- **Remote workers** → Only users with "Remote" location

### 5. Multi-Attribute Policies
- **Active Payroll Managers** → Active + Payroll + Manager role
- **HR Employees in London** → HR + Employee + London location

---

## ⚙️ Integration with Other Access Controls

ABAC works alongside other access control methods:

1. **RBAC**: Role-based permissions (e.g., Employee can read)
2. **MAC**: Security clearance (e.g., CONFIDENTIAL clearance)
3. **DAC**: Document permissions (owner-granted access)
4. **RuBAC**: Time/location rules (e.g., business hours only)
5. **ABAC**: Attribute-based policies (e.g., department-based)

**All checks must pass** for access to be granted.

---

## 📊 Policy Evaluation

### AND Logic (Default)
All conditions must be true:
```
user.department = "Payroll" AND user.role = "Employee" AND resource.department = "Payroll"
```

### OR Logic (Advanced)
Any condition can be true:
```
user.department = "Payroll" OR user.department = "HR"
```

---

## 🚨 Important Notes

1. **Administrators Bypass**: Administrators bypass ABAC checks (can access all documents)

2. **Policy Priority**: Higher priority rules are evaluated first

3. **Deny Rules**: If any ABAC rule denies access, access is denied

4. **No Rules = Allow**: If no ABAC rules exist, access is allowed (other controls still apply)

5. **Department Matching**: Document department must match policy resource department for department-based policies

---

## 📚 Related Documentation

- **Access Control Overview**: See `IMPLEMENTATION_GUIDE.md`
- **Role Definitions**: See `ROLE_DEFINITIONS.md`
- **Access Rules**: See `HOW_TO_USE_ACCESS_RULES.md`

---

## ✅ Summary

✅ **Fine-grained access control using attributes**

The system now supports:
- ✅ Department-based access control
- ✅ Role + department combinations
- ✅ Location-based filtering
- ✅ Employment status filtering
- ✅ User-friendly policy creation UI
- ✅ Advanced JSON editor for complex policies
- ✅ Document department assignment
- ✅ Example policies for common scenarios

**Example**: "Employees in the Payroll Department" can access salary data, but "Employees in IT" cannot.

