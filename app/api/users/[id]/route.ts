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
        resourceType: 'user',
        resourceId: params.id,
        details: {
          action: 'delete',
        },
      })
      
      return NextResponse.json(
        { error: 'Only administrators can delete users' },
        { status: 403 }
      )
    }
    
    // Prevent self-deletion
    if (payload.userId === params.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      )
    }
    
    // Get user before deletion for audit
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        email: true,
      },
    })
    
    if (!userToDelete) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Delete user (cascade will delete related records)
    await prisma.user.delete({
      where: { id: params.id },
    })
    
    await createAuditLog({
      userId: payload.userId,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: params.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        deletedUser: userToDelete.username,
        deletedUserEmail: userToDelete.email,
      },
    })
    
    return NextResponse.json({
      message: `User "${userToDelete.username}" deleted successfully`,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete user', message: error.message },
      { status: 500 }
    )
  }
}

