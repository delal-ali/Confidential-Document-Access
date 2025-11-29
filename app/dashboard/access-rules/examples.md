# Access Rules Examples

## Time-Based Rules (RuBAC)

### Example 1: Business Hours Only
```json
{
  "name": "Business Hours Only",
  "ruleType": "TIME",
  "allowedStartTime": "09:00",
  "allowedEndTime": "17:00",
  "allowedDays": "MON,TUE,WED,THU,FRI",
  "targetType": "document",
  "targetId": "document-id-here"
}
```
**Effect:** Document can only be accessed Monday-Friday, 9 AM - 5 PM

### Example 2: Weekends Only
```json
{
  "name": "Weekend Access",
  "ruleType": "TIME",
  "allowedStartTime": "00:00",
  "allowedEndTime": "23:59",
  "allowedDays": "SAT,SUN",
  "targetType": "document"
}
```
**Effect:** Document can only be accessed on weekends

---

## Location-Based Rules (RuBAC)

### Example 1: Office IPs Only
```json
{
  "name": "Office Access Only",
  "ruleType": "LOCATION",
  "allowedLocations": "192.168.1.100,192.168.1.101,192.168.1.102",
  "targetType": "document",
  "targetId": "document-id-here"
}
```
**Effect:** Document can only be accessed from office IP addresses

### Example 2: Specific Locations
```json
{
  "name": "Headquarters Only",
  "ruleType": "LOCATION",
  "allowedLocations": "Office,Headquarters",
  "targetType": "document"
}
```
**Effect:** Document can only be accessed from named locations

---

## Device-Based Rules (RuBAC)

### Example 1: Desktop Only
```json
{
  "name": "Desktop Only",
  "ruleType": "DEVICE",
  "allowedDevices": "desktop,laptop",
  "targetType": "document",
  "targetId": "document-id-here"
}
```
**Effect:** Document cannot be accessed from mobile devices

### Example 2: No Mobile Devices
```json
{
  "name": "No Mobile Access",
  "ruleType": "DEVICE",
  "allowedDevices": "desktop,laptop,tablet",
  "targetType": "document"
}
```
**Effect:** Mobile phones cannot access the document

---

## Attribute-Based Rules (ABAC)

### Example 1: HR Managers in Payroll Department
```json
{
  "name": "HR Managers Only",
  "ruleType": "ATTRIBUTE",
  "attributeConditions": "[{\"attribute\":\"user.role\",\"operator\":\"contains\",\"value\":\"HR Manager\"},{\"attribute\":\"user.department\",\"operator\":\"equals\",\"value\":\"Payroll\"},{\"attribute\":\"resource.classification\",\"operator\":\"equals\",\"value\":\"Confidential\"}]",
  "targetType": "document",
  "targetId": "document-id-here"
}
```
**Effect:** Only HR Managers in Payroll Department can access Confidential documents

### Example 2: Managers During Business Hours
```json
{
  "name": "Managers Business Hours",
  "ruleType": "ATTRIBUTE",
  "attributeConditions": "[{\"attribute\":\"user.role\",\"operator\":\"contains\",\"value\":\"Manager\"},{\"attribute\":\"context.timestamp\",\"operator\":\"greaterThan\",\"value\":\"09:00\"},{\"attribute\":\"context.timestamp\",\"operator\":\"lessThan\",\"value\":\"17:00\"}]",
  "targetType": "document"
}
```
**Effect:** Only Managers can access during business hours (9 AM - 5 PM)

### Example 3: Finance Department Only
```json
{
  "name": "Finance Department",
  "ruleType": "ATTRIBUTE",
  "attributeConditions": "[{\"attribute\":\"user.department\",\"operator\":\"equals\",\"value\":\"Finance\"},{\"attribute\":\"user.employmentStatus\",\"operator\":\"equals\",\"value\":\"ACTIVE\"}]",
  "targetType": "document"
}
```
**Effect:** Only active employees in Finance Department can access

---

## Combined Rules (Multiple Rules)

You can create multiple rules for the same document. They are evaluated in priority order:

**Rule 1 (Priority 10):** Business Hours Only
**Rule 2 (Priority 5):** Office IP Only
**Rule 3 (Priority 0):** Desktop Only

**Evaluation:** All rules must pass for access to be granted.

---

## Priority System

- **Higher priority** rules are evaluated first
- **First deny** rule wins (if any rule denies, access is denied)
- **All rules** must pass for access to be granted

**Example:**
- Priority 10: Time rule (9 AM - 5 PM) → PASS
- Priority 5: Location rule (Office IP) → PASS
- Priority 0: Device rule (Desktop) → PASS
- **Result:** ✅ ACCESS GRANTED

If any rule fails → ❌ ACCESS DENIED

