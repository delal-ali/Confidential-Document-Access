import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { assignRoleToUser } from '@/lib/access-control/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const assignRoleSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
})

export async function POST(request: NextRequest) {
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
    
    // Check permission (only admins can assign roles)
    const hasPermission = await checkRolePermission(payload.userId, 'role', 'assign')
    if (!hasPermission) {
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_DENIED',
        resourceType: 'role',
        details: {
          action: 'assign',
        },
      })
      
      return NextResponse.json(
        { error: 'Insufficient permissions. Only administrators can assign roles.' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const { userId, roleId } = assignRoleSchema.parse(body)
    
    // Verify user and role exist
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })
    
    const role = await prisma.role.findUnique({
      where: { id: roleId },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }
    
    // Assign role
    await assignRoleToUser(userId, roleId, payload.userId)
    
    await createAuditLog({
      userId: payload.userId,
      action: 'ROLE_ASSIGNED',
      resourceType: 'role',
      resourceId: roleId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        assignedTo: userId,
        roleName: role.name,
      },
    })
    
    return NextResponse.json({
      message: `Role "${role.name}" assigned to user "${user.username}" successfully`,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to assign role', message: error.message },
      { status: 500 }
    )
  }
}

