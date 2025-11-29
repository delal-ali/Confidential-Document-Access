import { prisma } from '@/lib/db'
import { createAuditLog, logSecurityEvent } from './logger'

export interface AlertRule {
  condition: string
  threshold: number
  timeWindow: number // in minutes
  action: string
}

/**
 * Check for suspicious activities and generate alerts
 */
export async function checkAnomalies(): Promise<void> {
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  // Check for multiple failed login attempts
  const failedLogins = await prisma.auditLog.groupBy({
    by: ['userId', 'ipAddress'],
    where: {
      action: { contains: 'LOGIN_FAILED' },
      timestamp: { gte: oneHourAgo },
      status: 'FAILURE',
    },
    _count: true,
  })
  
  for (const group of failedLogins) {
    if (group._count >= 5) {
      await logSecurityEvent('BRUTE_FORCE_ATTEMPT', {
        userId: group.userId || undefined,
        ipAddress: group.ipAddress || undefined,
        details: {
          failedAttempts: group._count,
          timeWindow: '1 hour',
        },
        status: 'WARNING' as any,
      })
    }
  }
  
  // Check for unusual access patterns
  const unusualAccess = await prisma.auditLog.groupBy({
    by: ['userId', 'resourceType'],
    where: {
      action: { contains: 'DOCUMENT_ACCESS' },
      timestamp: { gte: oneHourAgo },
    },
    _count: true,
  })
  
  for (const group of unusualAccess) {
    if (group._count >= 100) {
      await logSecurityEvent('UNUSUAL_ACCESS_PATTERN', {
        userId: group.userId || undefined,
        details: {
          accessCount: group._count,
          resourceType: group.resourceType,
          timeWindow: '1 hour',
        },
        status: 'WARNING' as any,
      })
    }
  }
  
  // Check for privilege escalation attempts
  const privilegeAttempts = await prisma.auditLog.findMany({
    where: {
      action: { contains: 'PERMISSION_DENIED' },
      timestamp: { gte: oneHourAgo },
    },
    distinct: ['userId'],
  })
  
  if (privilegeAttempts.length >= 10) {
    await logSecurityEvent('PRIVILEGE_ESCALATION_ATTEMPT', {
      details: {
        uniqueUsers: privilegeAttempts.length,
        timeWindow: '1 hour',
      },
      status: 'WARNING' as any,
    })
  }
}

/**
 * Get recent security alerts
 */
export async function getSecurityAlerts(limit: number = 50) {
  return prisma.auditLog.findMany({
    where: {
      action: { startsWith: 'SECURITY:' },
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
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
    take: limit,
  })
}

