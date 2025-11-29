import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { createRole } from '@/lib/access-control/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissionIds: z.array(z.string()),
})

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
    
    // Check if user has admin role (allow admins to view all roles)
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
    const isManager = userRoles.some(ur => ur.role.name === 'Manager')
    
    // Log role viewing activity
    await createAuditLog({
      userId: payload.userId,
      action: 'ROLES_VIEWED',
      resourceType: 'role',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      details: {
        viewType: isAdmin || isManager ? 'full' : 'basic',
      },
    })
    
    // All authenticated users can view roles (needed for role change requests)
    // But only admins and managers see full permission details
    if (isAdmin || isManager) {
      // Admins and Managers see full role details with permissions
      const roles = await prisma.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
      
      return NextResponse.json({
        roles,
      })
    } else {
      // Other users see basic role info (for role change requests)
      const roles = await prisma.role.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      
      return NextResponse.json({
        roles,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch roles', message: error.message },
      { status: 500 }
    )
  }
}

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
    
    // Check permission (only admins can create roles)
    const hasPermission = await checkRolePermission(payload.userId, 'role', 'create')
    if (!hasPermission) {
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_DENIED',
        resourceType: 'role',
        details: {
          action: 'create',
        },
      })
      
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const data = createRoleSchema.parse(body)
    
    const role = await createRole(data.name, data.description || '', data.permissionIds)
    
    await createAuditLog({
      userId: payload.userId,
      action: 'ROLE_CREATED',
      resourceType: 'role',
      resourceId: role.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        roleName: role.name,
      },
    })
    
    return NextResponse.json({
      role,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create role', message: error.message },
      { status: 500 }
    )
  }
}

