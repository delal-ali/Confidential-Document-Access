import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/encryption'

export type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING'

export interface AuditLogData {
  userId?: string
  action: string
  resourceType?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  location?: string
  deviceType?: string
  details?: Record<string, any>
  status?: AuditStatus
  errorMessage?: string
}

/**
 * Create an audit log entry with automatic username inclusion
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Fetch username if userId is provided (for comprehensive logging)
    let username: string | undefined
    if (data.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: data.userId },
          select: { username: true },
        })
        username = user?.username
      } catch (userError) {
        // If user lookup fails, continue without username
        console.warn('Failed to fetch username for audit log:', userError)
      }
    }
    
    // Enhance details with username and timestamp
    const enhancedDetails = {
      ...(data.details || {}),
      ...(username && { username }), // Include username in details
      timestamp: new Date().toISOString(), // Explicit timestamp in details
    }
    
    // Encrypt sensitive details
    const encryptedDetails = encrypt(JSON.stringify(enhancedDetails))
    
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        location: data.location,
        deviceType: data.deviceType,
        details: encryptedDetails,
        status: data.status || 'SUCCESS',
        errorMessage: data.errorMessage,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Log user activity with comprehensive details
 * Automatically includes username, timestamp, IP address, and action
 */
export async function logUserActivity(
  userId: string,
  action: string,
  context: {
    resourceType?: string
    resourceId?: string
    ipAddress?: string
    userAgent?: string
    location?: string
    deviceType?: string
    details?: Record<string, any>
  }
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    ...context,
    status: 'SUCCESS',
  })
}

/**
 * Enhanced user activity logger that automatically extracts request context
 * Use this in API routes for comprehensive activity logging
 */
export async function logUserActivityFromRequest(
  userId: string,
  action: string,
  request: Request,
  additionalDetails?: Record<string, any>
): Promise<void> {
  const ipAddress = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    undefined
  const userAgent = request.headers.get('user-agent') || undefined
  
  await createAuditLog({
    userId,
    action,
    ipAddress,
    userAgent,
    details: {
      ...additionalDetails,
      requestMethod: request.method,
      requestUrl: request.url,
    },
    status: 'SUCCESS',
  })
}

/**
 * Log system event
 */
export async function logSystemEvent(
  event: string,
  details?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    action: `SYSTEM:${event}`,
    details,
    status: 'SUCCESS',
  })
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  event: string,
  context: {
    userId?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, any>
    status?: AuditStatus
    errorMessage?: string
  }
): Promise<void> {
  await createAuditLog({
    userId: context.userId,
    action: `SECURITY:${event}`,
    ...context,
    status: context.status || 'WARNING',
  })
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters: {
  userId?: string
  action?: string
  resourceType?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const where: any = {}
  
  if (filters.userId) {
    where.userId = filters.userId
  }
  
  if (filters.action) {
    where.action = { contains: filters.action }
  }
  
  if (filters.resourceType) {
    where.resourceType = filters.resourceType
  }
  
  if (filters.startDate || filters.endDate) {
    where.timestamp = {}
    if (filters.startDate) {
      where.timestamp.gte = filters.startDate
    }
    if (filters.endDate) {
      where.timestamp.lte = filters.endDate
    }
  }
  
  return prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
    take: filters.limit || 100,
    skip: filters.offset || 0,
  })
}

