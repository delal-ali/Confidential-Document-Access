import { prisma } from '@/lib/db'
import { evaluateAccessRule, AccessContext } from './ruac'

export interface UserAttributes {
  userId: string
  role?: string[]
  department?: string
  location?: string
  employmentStatus?: string
  securityLabel?: string
  clearanceLevel?: number
}

export interface ResourceAttributes {
  resourceId: string
  resourceType: string
  classification?: string
  securityLabel?: string
  department?: string
  ownerId?: string
}

export interface PolicyCondition {
  attribute: string
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'in'
  value: string | number | string[]
}

/**
 * ABAC: Evaluate attribute condition
 */
function evaluateCondition(
  condition: PolicyCondition,
  userAttributes: UserAttributes,
  resourceAttributes: ResourceAttributes,
  context: AccessContext
): boolean {
  const { attribute, operator, value } = condition
  
  // Get attribute value from user, resource, or context
  let attributeValue: any
  
  if (attribute.startsWith('user.')) {
    const key = attribute.replace('user.', '') as keyof UserAttributes
    attributeValue = userAttributes[key]
  } else if (attribute.startsWith('resource.')) {
    const key = attribute.replace('resource.', '') as keyof ResourceAttributes
    attributeValue = resourceAttributes[key]
  } else if (attribute.startsWith('context.')) {
    const key = attribute.replace('context.', '') as keyof AccessContext
    attributeValue = context[key as keyof AccessContext]
  } else {
    return false
  }
  
  if (attributeValue === undefined || attributeValue === null) {
    return false
  }
  
  switch (operator) {
    case 'equals':
      return String(attributeValue).toLowerCase() === String(value).toLowerCase()
    
    case 'contains':
      return String(attributeValue).toLowerCase().includes(String(value).toLowerCase())
    
    case 'greaterThan':
      return Number(attributeValue) > Number(value)
    
    case 'lessThan':
      return Number(attributeValue) < Number(value)
    
    case 'in':
      const valueArray = Array.isArray(value) ? value : [value]
      // Handle array attributes (like user.role which is an array)
      if (Array.isArray(attributeValue)) {
        return attributeValue.some(attrVal =>
          valueArray.some(v => String(attrVal).toLowerCase() === String(v).toLowerCase())
        )
      }
      return valueArray.some(v => 
        String(attributeValue).toLowerCase() === String(v).toLowerCase()
      )
    
    default:
      return false
  }
}

/**
 * ABAC: Evaluate policy with multiple conditions
 */
function evaluatePolicy(
  conditions: PolicyCondition[],
  userAttributes: UserAttributes,
  resourceAttributes: ResourceAttributes,
  context: AccessContext,
  logic: 'AND' | 'OR' = 'AND'
): boolean {
  if (conditions.length === 0) {
    return true
  }
  
  const results = conditions.map(condition =>
    evaluateCondition(condition, userAttributes, resourceAttributes, context)
  )
  
  if (logic === 'AND') {
    return results.every(r => r === true)
  } else {
    return results.some(r => r === true)
  }
}

/**
 * ABAC: Check access using attribute-based policies
 */
export async function checkABACAccess(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: string,
  context: AccessContext
): Promise<boolean> {
  // Get user attributes
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        where: {
          isActive: true,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          role: true,
        },
      },
    },
  })
  
  if (!user) {
    return false
  }
  
  const userAttributes: UserAttributes = {
    userId: user.id,
    role: user.roles.map(ur => ur.role.name),
    department: user.department || undefined,
    location: user.location || undefined,
    employmentStatus: user.employmentStatus,
    securityLabel: user.securityLabel,
    clearanceLevel: user.clearanceLevel,
  }
  
  // Get resource attributes
  let resourceAttributes: ResourceAttributes = {
    resourceId,
    resourceType,
  }
  
  if (resourceType === 'document') {
    const document = await prisma.document.findUnique({
      where: { id: resourceId },
    })
    
    if (document) {
      resourceAttributes = {
        ...resourceAttributes,
        classification: document.classification,
        securityLabel: document.securityLabel,
        ownerId: document.ownerId,
        department: document.department || undefined,
      }
    }
  }
  
  // Get attribute-based access rules
  const rules = await prisma.accessRule.findMany({
    where: {
      targetType: resourceType,
      targetId: resourceId,
      ruleType: { in: ['ATTRIBUTE', 'COMPOSITE'] },
      isActive: true,
    },
    orderBy: {
      priority: 'desc',
    },
  })
  
  // If no ABAC rules, allow (other access controls will handle it)
  if (rules.length === 0) {
    return true
  }
  
  // Evaluate each rule
  for (const rule of rules) {
    if (!rule.attributeConditions) {
      continue
    }
    
    try {
      const conditions: PolicyCondition[] = JSON.parse(rule.attributeConditions)
      const logic = (rule as any).logic || 'AND' // Can add logic field to schema
      
      const allowed = evaluatePolicy(
        conditions,
        userAttributes,
        resourceAttributes,
        context,
        logic
      )
      
      if (!allowed) {
        return false // Deny access
      }
    } catch (error) {
      console.error('Error parsing attribute conditions:', error)
      continue
    }
  }
  
  return true // All policies passed
}

/**
 * ABAC: Example policy creation
 * Example: "Only HR Managers in Payroll Department can access salary data during working hours"
 */
export function createExamplePolicy(): PolicyCondition[] {
  return [
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
  ]
}

