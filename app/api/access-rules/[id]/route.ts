import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { createAuditLog } from '@/lib/audit/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check if user is admin
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: true,
      },
    })
    
    const isAdmin = userRoles.some(ur => ur.role.name === 'Administrator')
    
    if (!isAdmin) {
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_DENIED',
        resourceType: 'access_rule',
        resourceId: params.id,
        details: {
          action: 'delete',
        },
      })
      
      return NextResponse.json(
        { error: 'Only administrators can delete access rules' },
        { status: 403 }
      )
    }
    
    // Get rule before deletion
    const rule = await prisma.accessRule.findUnique({
      where: { id: params.id },
    })
    
    if (!rule) {
      return NextResponse.json(
        { error: 'Access rule not found' },
        { status: 404 }
      )
    }
    
    // Delete rule
    await prisma.accessRule.delete({
      where: { id: params.id },
    })
    
    await createAuditLog({
      userId: payload.userId,
      action: 'ACCESS_RULE_DELETED',
      resourceType: 'access_rule',
      resourceId: params.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        ruleName: rule.name,
      },
    })
    
    return NextResponse.json({
      message: `Access rule "${rule.name}" deleted successfully`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete access rule', message: error.message },
      { status: 500 }
    )
  }
}

