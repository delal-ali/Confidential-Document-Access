import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'

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
    
    // Check if user has admin role (allow admins to view all users)
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
      // Check permission for non-admins (only admins can view users)
      const hasPermission = await checkRolePermission(payload.userId, 'user', 'read')
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions. Only administrators can view users.' },
          { status: 403 }
        )
      }
    }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        securityLabel: true,
        clearanceLevel: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({
      users,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error.message },
      { status: 500 }
    )
  }
}

