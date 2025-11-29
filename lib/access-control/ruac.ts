import { prisma } from '@/lib/db'

export type RuleType = 'TIME' | 'LOCATION' | 'DEVICE' | 'ATTRIBUTE' | 'COMPOSITE'

export interface AccessContext {
  userId: string
  timestamp: Date
  ipAddress?: string
  location?: string
  deviceType?: string
  userAgent?: string
}

/**
 * RuBAC: Check time-based access rule
 */
function checkTimeRule(
  allowedStartTime: string | null,
  allowedEndTime: string | null,
  allowedDays: string | null,
  currentTime: Date
): boolean {
  if (!allowedStartTime || !allowedEndTime) {
    return true // No time restriction
  }
  
  // Check day of week
  if (allowedDays) {
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
    const currentDay = dayNames[currentTime.getDay()]
    const allowedDaysList = allowedDays.split(',').map(d => d.trim().toUpperCase())
    
    if (!allowedDaysList.includes(currentDay)) {
      return false
    }
  }
  
  // Check time range
  const [startHour, startMin] = allowedStartTime.split(':').map(Number)
  const [endHour, endMin] = allowedEndTime.split(':').map(Number)
  
  const currentHour = currentTime.getHours()
  const currentMin = currentTime.getMinutes()
  const currentMinutes = currentHour * 60 + currentMin
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  // Handle overnight ranges (e.g., 22:00 to 06:00)
  if (startMinutes > endMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes
  }
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes
}

/**
 * RuBAC: Check location-based access rule
 */
function checkLocationRule(
  allowedLocations: string | null,
  userLocation?: string,
  userIpAddress?: string
): boolean {
  if (!allowedLocations) {
    return true // No location restriction
  }
  
  const allowedList = allowedLocations.split(',').map(l => l.trim().toLowerCase())
  
  if (userLocation && allowedList.includes(userLocation.toLowerCase())) {
    return true
  }
  
  if (userIpAddress) {
    // Check if IP matches any allowed location/IP
    return allowedList.some(loc => {
      // Simple IP matching (can be enhanced with CIDR)
      return userIpAddress.includes(loc) || loc.includes(userIpAddress)
    })
  }
  
  return false
}

/**
 * RuBAC: Check device-based access rule
 */
function checkDeviceRule(
  allowedDevices: string | null,
  userDeviceType?: string
): boolean {
  if (!allowedDevices) {
    return true // No device restriction
  }
  
  if (!userDeviceType) {
    return false
  }
  
  const allowedList = allowedDevices.split(',').map(d => d.trim().toLowerCase())
  return allowedList.includes(userDeviceType.toLowerCase())
}

/**
 * RuBAC: Evaluate access rule
 */
export async function evaluateAccessRule(
  ruleId: string,
  context: AccessContext
): Promise<boolean> {
  const rule = await prisma.accessRule.findUnique({
    where: { id: ruleId },
  })
  
  if (!rule || !rule.isActive) {
    return false
  }
  
  switch (rule.ruleType) {
    case 'TIME':
      return checkTimeRule(
        rule.allowedStartTime,
        rule.allowedEndTime,
        rule.allowedDays,
        context.timestamp
      )
    
    case 'LOCATION':
      return checkLocationRule(
        rule.allowedLocations,
        context.location,
        context.ipAddress
      )
    
    case 'DEVICE':
      return checkDeviceRule(
        rule.allowedDevices,
        context.deviceType
      )
    
    case 'ATTRIBUTE':
    case 'COMPOSITE':
      // Will be handled by ABAC
      return true
    
    default:
      return false
  }
}

/**
 * RuBAC: Check all rules for a resource
 */
export async function checkAccessRules(
  targetType: string,
  targetId: string,
  context: AccessContext
): Promise<boolean> {
  const rules = await prisma.accessRule.findMany({
    where: {
      targetType,
      targetId,
      isActive: true,
    },
    orderBy: {
      priority: 'desc', // Higher priority first
    },
  })
  
  // If no rules, allow access (default allow)
  if (rules.length === 0) {
    return true
  }
  
  // Evaluate rules in priority order
  // First deny rule wins
  for (const rule of rules) {
    const allowed = await evaluateAccessRule(rule.id, context)
    if (!allowed) {
      return false // Deny access
    }
  }
  
  return true // All rules passed
}

