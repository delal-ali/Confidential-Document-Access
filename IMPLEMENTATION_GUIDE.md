# Implementation Guide - Access Control Mechanisms

This document explains how each access control mechanism is implemented in the system.

## 1. Mandatory Access Control (MAC)

### Implementation Location
- **Backend**: `lib/access-control/mac.ts`
- **Database**: User and Document models have `securityLabel` and `classification` fields
- **API**: Document access endpoints check MAC before allowing access

### How It Works

1. **Security Labels**: Users and documents are assigned security labels:
   - `PUBLIC` (Level 0)
   - `INTERNAL` (Level 1)
   - `CONFIDENTIAL` (Level 2)
   - `TOP_SECRET` (Level 3)

2. **Clearance Levels**: Users have a numeric clearance level (0-3)

3. **Access Check**: 
   ```typescript
   checkMACAccess(userLabel, userLevel, resourceLabel, resourceClassification)
   ```
   - User's label level must be >= resource label level
   - User's clearance level must be >= resource classification level

### Example Usage

```typescript
// In document access API
const macAllowed = checkMACAccess(
  user.securityLabel,      // User's label
  user.clearanceLevel,     // User's level
  document.securityLabel,  // Document's label
  document.classification  // Document's classification
)

if (!macAllowed) {
  return { error: 'Insufficient security clearance' }
}
```

### Configuration
- Only system administrators can modify security labels
- Labels are enforced at the system level, not user discretion

---

## 2. Discretionary Access Control (DAC)

### Implementation Location
- **Backend**: `lib/access-control/dac.ts`
- **Database**: `DocumentPermission` model stores user-document permissions
- **API**: `/api/documents/[id]/permissions`

### How It Works

1. **Document Ownership**: Each document has an owner (creator)
2. **Permission Granting**: Owners can grant permissions to other users:
   - `canRead`
   - `canWrite`
   - `canDelete`
   - `canShare`

3. **Permission Check**:
   ```typescript
   checkDocumentPermission(documentId, userId, 'read')
   ```

### Example Usage

```typescript
// Grant permission
await grantDocumentPermission(
  documentId,
  targetUserId,
  {
    canRead: true,
    canWrite: false,
    canDelete: false,
    canShare: true,
  },
  ownerUserId
)

// Check permission
const canRead = await checkDocumentPermission(documentId, userId, 'read')
```

### Features
- Permission expiration dates
- Permission audit trail (who granted, when)
- Only owners can grant/revoke permissions

---

## 3. Role-Based Access Control (RBAC)

### Implementation Location
- **Backend**: `lib/access-control/rbac.ts`
- **Database**: `Role`, `Permission`, `RolePermission`, `UserRole` models
- **API**: `/api/roles`

### How It Works

1. **Roles**: Predefined roles (Administrator, Manager, Employee)
2. **Permissions**: Granular permissions (document:read, document:create, etc.)
3. **Role-Permission Mapping**: Each role has associated permissions
4. **User-Role Assignment**: Users are assigned roles

### Example Usage

```typescript
// Assign role to user
await assignRoleToUser(userId, roleId, assignedByUserId)

// Check if user has permission through roles
const hasPermission = await checkRolePermission(
  userId,
  'document',
  'create'
)

// Get all user roles
const roles = await getUserRoles(userId)
```

### Role Hierarchy
- **Administrator**: Full access to all resources
- **Manager**: Can create/read documents, view roles
- **Employee**: Can only read documents

### Dynamic Role Changes
- Roles can be assigned/removed dynamically
- Role assignments can have expiration dates
- Audit trail for all role changes

---

## 4. Rule-Based Access Control (RuBAC)

### Implementation Location
- **Backend**: `lib/access-control/ruac.ts`
- **Database**: `AccessRule` model
- **API**: Access rules are checked during document access

### How It Works

1. **Rule Types**:
   - **TIME**: Access allowed only during specific hours/days
   - **LOCATION**: Access allowed only from specific IPs/locations
   - **DEVICE**: Access allowed only from specific device types
   - **ATTRIBUTE**: Attribute-based conditions (handled by ABAC)

2. **Rule Evaluation**:
   ```typescript
   evaluateAccessRule(ruleId, context)
   ```

### Example Usage

```typescript
// Create time-based rule
await prisma.accessRule.create({
  data: {
    name: 'Business Hours Only',
    ruleType: 'TIME',
    allowedStartTime: '09:00',
    allowedEndTime: '17:00',
    allowedDays: 'MON,TUE,WED,THU,FRI',
    targetType: 'document',
    targetId: documentId,
  },
})

// Check rules during access
const context = {
  userId: user.id,
  timestamp: new Date(),
  ipAddress: request.ip,
  deviceType: 'desktop',
}
const allowed = await checkAccessRules('document', documentId, context)
```

### Rule Priority
- Rules have priority levels (higher = evaluated first)
- First deny rule wins (if any rule denies, access is denied)

---

## 5. Attribute-Based Access Control (ABAC)

### Implementation Location
- **Backend**: `lib/access-control/abac.ts`
- **Database**: `AccessRule` with `ruleType: 'ATTRIBUTE'` or `'COMPOSITE'`
- **API**: Integrated into document access checks

### How It Works

1. **Attributes**: 
   - User attributes: role, department, location, employment status
   - Resource attributes: classification, security label, owner
   - Context attributes: time, IP address, device type

2. **Policy Conditions**:
   ```json
   [
     {
       "attribute": "user.department",
       "operator": "equals",
       "value": "Payroll"
     },
     {
       "attribute": "user.role",
       "operator": "contains",
       "value": "Manager"
     }
   ]
   ```

3. **Evaluation**: Conditions are evaluated with AND/OR logic

### Example Usage

```typescript
// Create ABAC policy
await prisma.accessRule.create({
  data: {
    name: 'HR Managers Only',
    ruleType: 'ATTRIBUTE',
    attributeConditions: JSON.stringify([
      {
        attribute: 'user.role',
        operator: 'contains',
        value: 'HR Manager',
      },
      {
        attribute: 'user.department',
        operator: 'equals',
        value: 'Payroll',
      },
      {
        attribute: 'resource.classification',
        operator: 'equals',
        value: 'Confidential',
      },
    ]),
    targetType: 'document',
    targetId: documentId,
  },
})

// Check ABAC access
const allowed = await checkABACAccess(
  userId,
  'document',
  documentId,
  'read',
  context
)
```

### Operators
- `equals`: Exact match
- `contains`: Substring match
- `greaterThan`: Numeric comparison
- `lessThan`: Numeric comparison
- `in`: Value in array

---

## Access Control Flow

When a user attempts to access a document, all access control mechanisms are checked in order:

1. **MAC Check**: User has sufficient security clearance
2. **DAC Check**: User is owner or has explicit permission
3. **RBAC Check**: User's roles have required permissions
4. **RuBAC Check**: Time/location/device rules are satisfied
5. **ABAC Check**: Attribute-based policies are satisfied

**All checks must pass** for access to be granted. If any check fails, access is denied and logged.

---

## Audit Trail

All access control decisions are logged:

```typescript
await createAuditLog({
  userId: user.id,
  action: 'DOCUMENT_ACCESS_DENIED',
  resourceType: 'document',
  resourceId: documentId,
  details: {
    reason: 'MAC access denied',
    userLabel: user.securityLabel,
    documentLabel: document.securityLabel,
  },
})
```

---

## Best Practices

1. **MAC**: Use for mandatory security classifications
2. **DAC**: Use for user-controlled sharing
3. **RBAC**: Use for organizational roles
4. **RuBAC**: Use for time/location restrictions
5. **ABAC**: Use for complex, multi-attribute policies

6. **Combine Mechanisms**: Use multiple mechanisms together for defense in depth
7. **Regular Audits**: Review access logs regularly
8. **Least Privilege**: Grant minimum necessary permissions
9. **Regular Reviews**: Periodically review and update access rules

---

## Testing Access Control

### Test MAC
```typescript
// User with INTERNAL label tries to access CONFIDENTIAL document
// Expected: Denied
```

### Test DAC
```typescript
// User A creates document
// User B tries to access without permission
// Expected: Denied
// User A grants permission to User B
// User B tries again
// Expected: Allowed
```

### Test RBAC
```typescript
// Assign "Manager" role to user
// User tries to create document
// Expected: Allowed (if Manager role has create permission)
```

### Test RuBAC
```typescript
// Create rule: Access only 9 AM - 5 PM
// Try accessing at 8 PM
// Expected: Denied
```

### Test ABAC
```typescript
// Create policy: "Manager in Finance Department"
// User is Manager in IT Department
// Expected: Denied
// User is Manager in Finance Department
// Expected: Allowed
```

