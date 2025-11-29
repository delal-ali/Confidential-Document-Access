import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { getAuditLogs } from '@/lib/audit/logger'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    // Check permission (only admins can view logs)
    const hasPermission = await checkRolePermission(payload.userId, 'audit', 'read')
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only administrators can view audit logs.' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    const action = searchParams.get('action') || undefined
    const resourceType = searchParams.get('resourceType') || undefined
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    const logs = await getAuditLogs({
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      limit,
      offset,
    })
    
    return NextResponse.json({
      logs,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', message: error.message },
      { status: 500 }
    )
  }
}

