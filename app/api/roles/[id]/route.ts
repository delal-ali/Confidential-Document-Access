import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'
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
        resourceType: 'role',
        resourceId: params.id,
        details: {
          action: 'delete',
        },
      })
      
      return NextResponse.json(
        { error: 'Only administrators can delete roles' },
        { status: 403 }
      )
    }
    
    // Get role before deletion
    const role = await prisma.role.findUnique({
      where: { id: params.id },
    })
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }
    
    // Allow admin to delete any role, but warn about default roles
    const defaultRoles = ['Administrator', 'Manager', 'Employee']
    const isDefaultRole = defaultRoles.includes(role.name)
    
    // Check if role is assigned to any users
    const usersWithRole = await prisma.userRole.findMany({
      where: {
        roleId: params.id,
        isActive: true,
      },
    })
    
    if (usersWithRole.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete role. It is assigned to ${usersWithRole.length} user(s). Please remove role assignments first.`,
          usersCount: usersWithRole.length,
        },
        { status: 400 }
      )
    }
    
    // Warn but allow deletion of default roles (admin can override)
    if (isDefaultRole) {
      // Log warning but proceed with deletion
      await createAuditLog({
        userId: payload.userId,
        action: 'ROLE_DELETE_WARNING',
        resourceType: 'role',
        resourceId: params.id,
        details: {
          roleName: role.name,
          warning: 'Default system role deleted by administrator',
        },
      })
    }
    
    // Check if role is assigned to any users
    const usersWithRole = await prisma.userRole.findMany({
      where: {
        roleId: params.id,
        isActive: true,
      },
    })
    
    if (usersWithRole.length > 0) {
      return NextResponse.json(
        { 
          error: `Cannot delete role. It is assigned to ${usersWithRole.length} user(s). Please remove role assignments first.`,
          usersCount: usersWithRole.length,
        },
        { status: 400 }
      )
    }
    
    // Delete role
    await prisma.role.delete({
      where: { id: params.id },
    })
    
    await createAuditLog({
      userId: payload.userId,
      action: 'ROLE_DELETED',
      resourceType: 'role',
      resourceId: params.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        roleName: role.name,
      },
    })
    
    return NextResponse.json({
      message: `Role "${role.name}" deleted successfully`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete role', message: error.message },
      { status: 500 }
    )
  }
}

