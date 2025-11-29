import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkDocumentPermission } from '@/lib/access-control/dac'

/**
 * Check if a user can delete a specific document
 * Used by frontend to show/hide delete buttons
 */
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
    
    const body = await request.json()
    const { documentId } = body
    
    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      )
    }
    
    // Get user roles
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
    const isEmployee = userRoles.some(ur => ur.role.name === 'Employee')
    const isManager = userRoles.some(ur => ur.role.name === 'Manager')
    
    // Employees cannot delete
    if (isEmployee) {
      return NextResponse.json({
        canDelete: false,
        reason: 'Employees cannot delete documents',
      })
    }
    
    // Admins can delete any document
    if (isAdmin) {
      return NextResponse.json({
        canDelete: true,
        reason: 'Administrator can delete any document',
      })
    }
    
    // Get document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        ownerId: true,
      },
    })
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Check if manager
    if (isManager) {
      const isOwner = document.ownerId === payload.userId
      
      // Check if owner is employee
      const ownerRoles = await prisma.userRole.findMany({
        where: {
          userId: document.ownerId,
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
      
      const ownerIsEmployee = ownerRoles.some(ur => ur.role.name === 'Employee')
      const hasDeletePermission = await checkDocumentPermission(documentId, payload.userId, 'delete')
      
      const canDelete = isOwner || ownerIsEmployee || hasDeletePermission
      
      return NextResponse.json({
        canDelete,
        reason: canDelete 
          ? (isOwner ? 'Manager owns this document' : ownerIsEmployee ? 'Document created by employee' : 'Has delete permission')
          : 'Manager can only delete own documents or documents created by employees',
        isOwner,
        ownerIsEmployee,
        hasDeletePermission,
      })
    }
    
    // Other roles - check ownership and permission
    const isOwner = document.ownerId === payload.userId
    const hasDeletePermission = await checkDocumentPermission(documentId, payload.userId, 'delete')
    
    return NextResponse.json({
      canDelete: isOwner || hasDeletePermission,
      reason: isOwner ? 'User owns this document' : hasDeletePermission ? 'Has delete permission' : 'No permission',
      isOwner,
      hasDeletePermission,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to check delete permission', message: error.message },
      { status: 500 }
    )
  }
}

