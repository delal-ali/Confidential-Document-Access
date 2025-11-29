# How to Use Access Rules (RuBAC & ABAC)

## 🎯 Overview

Access Rules allow you to create conditional restrictions on document access based on:
- **Time** (RuBAC): Business hours, specific days
- **Location** (RuBAC): IP addresses, physical locations
- **Device** (RuBAC): Desktop, mobile, tablet restrictions
- **Attributes** (ABAC): Complex policies based on user/resource characteristics

---

## 📍 Where to Create Rules

**Location:** Dashboard → "Access Rules" (Administrator only)

**URL:** `/dashboard/access-rules`

---

## 🕐 Creating Time-Based Rules (RuBAC)

### Example: Business Hours Only

1. Go to Dashboard → Access Rules
2. Click "Create New Rule"
3. Fill in:
   - **Name:** "Business Hours Only"
   - **Rule Type:** Time-Based (RuBAC)
   - **Start Time:** 09:00
   - **End Time:** 17:00
   - **Allowed Days:** MON,TUE,WED,THU,FRI
   - **Target Type:** document
   - **Target ID:** (leave empty for all documents, or enter specific document ID)
   - **Priority:** 10

4. Click "Create Rule"

**Result:** Documents can only be accessed Monday-Friday, 9 AM - 5 PM

### Example: Weekend Access Only

- **Start Time:** 00:00
- **End Time:** 23:59
- **Allowed Days:** SAT,SUN

**Result:** Document can only be accessed on weekends

---

## 📍 Creating Location-Based Rules (RuBAC)

### Example: Office IPs Only

1. Click "Create New Rule"
2. Fill in:
   - **Name:** "Office Access Only"
   - **Rule Type:** Location-Based (RuBAC)
   - **Allowed Locations:** `192.168.1.100,192.168.1.101,192.168.1.102`
   - **Target Type:** document
   - **Target ID:** (specific document ID or leave empty)

3. Click "Create Rule"

**Result:** Document can only be accessed from office IP addresses

**Note:** You can also use location names like "Office,Headquarters"

---

## 📱 Creating Device-Based Rules (RuBAC)

### Example: Desktop Only (No Mobile)

1. Click "Create New Rule"
2. Fill in:
   - **Name:** "Desktop Only"
   - **Rule Type:** Device-Based (RuBAC)
   - **Allowed Devices:** `desktop,laptop`
   - **Target Type:** document
   - **Target ID:** (specific document ID)

3. Click "Create Rule"

**Result:** Document cannot be accessed from mobile devices

**Device Types:**
- `desktop` - Desktop computers
- `laptop` - Laptop computers
- `mobile` - Mobile phones
- `tablet` - Tablets

---

## 🎯 Creating Attribute-Based Rules (ABAC)

### Example: HR Managers in Payroll Department

1. Click "Create New Rule"
2. Fill in:
   - **Name:** "HR Managers Only"
   - **Rule Type:** Attribute-Based (ABAC)
   - **Attribute Conditions:** (JSON format)
   ```json
   [
     {
       "attribute": "user.role",
       "operator": "contains",
       "value": "HR Manager"
     },
     {
       "attribute": "user.department",
       "operator": "equals",
       "value": "Payroll"
     },
     {
       "attribute": "resource.classification",
       "operator": "equals",
       "value": "Confidential"
     }
   ]
   ```
   - **Target Type:** document
   - **Target ID:** (specific document ID)

3. Click "Create Rule"

**Result:** Only HR Managers in Payroll Department can access Confidential documents

### Available Attributes

**User Attributes:**
- `user.role` - User's role (e.g., "Manager", "Employee")
- `user.department` - User's department (e.g., "Payroll", "IT")
- `user.location` - User's location
- `user.employmentStatus` - ACTIVE, INACTIVE, etc.
- `user.securityLabel` - Security clearance level
- `user.clearanceLevel` - Numeric clearance (0-3)

**Resource Attributes:**
- `resource.classification` - Document classification
- `resource.securityLabel` - Document security label
- `resource.ownerId` - Document owner ID
- `resource.department` - Document department (if set)

**Context Attributes:**
- `context.timestamp` - Current time
- `context.ipAddress` - User's IP address
- `context.deviceType` - Device type (desktop, mobile, etc.)
- `context.location` - Access location

### Available Operators

- `equals` - Exact match
- `contains` - Contains substring
- `greaterThan` - Numeric comparison
- `lessThan` - Numeric comparison
- `in` - Value in array

---

## 🎯 Real-World Examples

### Example 1: Confidential Documents - Business Hours Only

**Rule:**
- Type: TIME
- Hours: 9 AM - 5 PM
- Days: Monday-Friday
- Target: All CONFIDENTIAL documents

**Effect:** Confidential documents can only be accessed during business hours

---

### Example 2: Salary Data - HR Managers Only

**Rule:**
- Type: ATTRIBUTE
- Conditions:
  - User role contains "HR Manager"
  - User department equals "Payroll"
  - Resource classification equals "Confidential"
- Target: Salary documents

**Effect:** Only HR Managers in Payroll can access salary data

---

### Example 3: Office Documents - Office IP Only

**Rule:**
- Type: LOCATION
- Locations: Office IP addresses
- Target: Office documents

**Effect:** Documents can only be accessed from office network

---

### Example 4: No Mobile Access for Sensitive Documents

**Rule:**
- Type: DEVICE
- Allowed Devices: desktop, laptop
- Target: Sensitive documents

**Effect:** Mobile devices cannot access sensitive documents

---

## 🔄 How Rules Work Together

### Multiple Rules for Same Document

If you create multiple rules for the same document:

1. Rules are evaluated in **priority order** (higher priority first)
2. **All rules must pass** for access to be granted
3. **First deny rule wins** - if any rule denies, access is denied

**Example:**
- Rule 1 (Priority 10): Business Hours (9 AM - 5 PM) → ✅ PASS
- Rule 2 (Priority 5): Office IP Only → ✅ PASS
- Rule 3 (Priority 0): Desktop Only → ✅ PASS
- **Result:** ✅ ACCESS GRANTED

If Rule 2 fails (wrong IP) → ❌ ACCESS DENIED

---

## 🧪 Testing Rules

### Test Time Rule
1. Create rule: "Business Hours Only" (9 AM - 5 PM)
2. Try accessing document at 8 PM
3. **Expected:** ❌ Access denied

### Test Location Rule
1. Create rule: "Office IP Only" (192.168.1.100)
2. Access from different IP
3. **Expected:** ❌ Access denied

### Test Device Rule
1. Create rule: "Desktop Only"
2. Access from mobile device
3. **Expected:** ❌ Access denied

### Test ABAC Rule
1. Create rule: "HR Managers in Payroll"
2. Access as Manager in IT Department
3. **Expected:** ❌ Access denied (wrong department)

---

## 📋 Priority System

**Higher Priority = Evaluated First**

- Priority 10: Time rule
- Priority 5: Location rule
- Priority 0: Device rule

**Evaluation Order:**
1. Check Priority 10 rule
2. Check Priority 5 rule
3. Check Priority 0 rule

**All must pass!**

---

## 💡 Best Practices

1. **Start with high priority rules** (time, location)
2. **Use specific document IDs** for document-specific rules
3. **Leave target ID empty** for global rules (apply to all)
4. **Test rules** before applying to production
5. **Document your rules** with clear names and descriptions
6. **Review rules regularly** - remove outdated rules

---

## 🚨 Common Mistakes

1. **Wrong time format** - Use HH:mm (24-hour format)
2. **Wrong day format** - Use MON,TUE,WED (comma-separated, uppercase)
3. **Invalid JSON** - Check JSON syntax for ABAC conditions
4. **Wrong attribute names** - Use exact attribute paths (user.role, not role)
5. **Priority conflicts** - Higher priority rules evaluated first

---

## 📖 Quick Reference

| Rule Type | Use For | Example |
|-----------|---------|---------|
| **TIME** | Business hours, specific days | 9 AM - 5 PM, Mon-Fri |
| **LOCATION** | IP restrictions, office only | Office IPs only |
| **DEVICE** | Device type restrictions | Desktop only, no mobile |
| **ATTRIBUTE** | Complex policies | HR Managers in Payroll |

---

## 🎯 Next Steps

1. **Create your first rule:**
   - Go to Dashboard → Access Rules
   - Click "Create New Rule"
   - Start with a simple time-based rule

2. **Test the rule:**
   - Try accessing document
   - Check if rule is enforced

3. **Create more complex rules:**
   - Combine multiple rule types
   - Create ABAC policies

4. **Monitor in audit logs:**
   - Check audit logs for rule violations
   - See when access is denied due to rules

---

The system now has full support for creating and managing access rules! 🎉

