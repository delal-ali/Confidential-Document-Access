import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { isDocumentOwner } from '@/lib/access-control/dac'
import { grantDocumentPermission, getDocumentPermissions } from '@/lib/access-control/dac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const grantPermissionSchema = z.object({
  userId: z.string(),
  canRead: z.boolean().default(false),
  canWrite: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  canShare: z.boolean().default(false),
  expiresAt: z.string().optional(), // ISO date string
})

export async function GET(
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
    
    // Check if user is administrator (only admins can view permissions)
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
        resourceType: 'document',
        resourceId: params.id,
        details: {
          reason: 'Not system administrator',
          action: 'view_permissions',
        },
      })
      
      return NextResponse.json(
        { error: 'Only system administrators can view permissions' },
        { status: 403 }
      )
    }
    
    const permissions = await getDocumentPermissions(params.id)
    
    return NextResponse.json({
      permissions,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch permissions', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
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
    
    // Check if user is administrator (only admins can grant/modify permissions)
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
        resourceType: 'document',
        resourceId: params.id,
        details: {
          reason: 'Not system administrator',
          action: 'grant_permission',
        },
      })
      
      return NextResponse.json(
        { error: 'Only system administrators can grant or modify permissions' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const data = grantPermissionSchema.parse(body)
    
    // Check if permission already exists (to detect modification vs new grant)
    const existingPermission = await prisma.documentPermission.findUnique({
      where: {
        documentId_userId: {
          documentId: params.id,
          userId: data.userId,
        },
      },
    })
    
    const isModification = existingPermission && existingPermission.isActive
    
    // Get document and user info for logging
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: { title: true, ownerId: true },
    })
    
    const grantedToUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { username: true, email: true },
    })
    
    await grantDocumentPermission(
      params.id,
      data.userId,
      {
        canRead: data.canRead,
        canWrite: data.canWrite,
        canDelete: data.canDelete,
        canShare: data.canShare,
      },
      payload.userId
    )
    
    // Log permission grant or modification
    if (isModification) {
      // Log permission modification
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_MODIFIED',
        resourceType: 'document',
        resourceId: params.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        details: {
          grantedTo: data.userId,
          grantedToUsername: grantedToUser?.username,
          grantedToEmail: grantedToUser?.email,
          documentTitle: document?.title,
          previousPermissions: {
            canRead: existingPermission.canRead,
            canWrite: existingPermission.canWrite,
            canDelete: existingPermission.canDelete,
            canShare: existingPermission.canShare,
          },
          newPermissions: {
            canRead: data.canRead,
            canWrite: data.canWrite,
            canDelete: data.canDelete,
            canShare: data.canShare,
          },
        },
      })
    } else {
      // Log new permission grant
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_GRANTED',
        resourceType: 'document',
        resourceId: params.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        details: {
          grantedTo: data.userId,
          grantedToUsername: grantedToUser?.username,
          grantedToEmail: grantedToUser?.email,
          documentTitle: document?.title,
          permissions: {
            canRead: data.canRead,
            canWrite: data.canWrite,
            canDelete: data.canDelete,
            canShare: data.canShare,
          },
        },
      })
    }
    
    return NextResponse.json({
      message: 'Permission granted successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to grant permission', message: error.message },
      { status: 500 }
    )
  }
}

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
    
    // Check if user is administrator (only admins can revoke permissions)
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
        resourceType: 'document',
        resourceId: params.id,
        details: {
          reason: 'Not system administrator',
          action: 'revoke_permission',
        },
      })
      
      return NextResponse.json(
        { error: 'Only system administrators can revoke permissions' },
        { status: 403 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }
    
    // Get permission and user info before revoking
    const permission = await prisma.documentPermission.findUnique({
      where: {
        documentId_userId: {
          documentId: params.id,
          userId: userId,
        },
      },
    })
    
    if (!permission) {
      return NextResponse.json(
        { error: 'Permission not found' },
        { status: 404 }
      )
    }
    
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      select: { title: true },
    })
    
    const revokedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, email: true },
    })
    
    // Revoke permission
    await revokeDocumentPermission(params.id, userId)
    
    // Log permission revocation
    await createAuditLog({
      userId: payload.userId,
      action: 'PERMISSION_REVOKED',
      resourceType: 'document',
      resourceId: params.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        revokedFrom: userId,
        revokedFromUsername: revokedUser?.username,
        revokedFromEmail: revokedUser?.email,
        documentTitle: document?.title,
        previousPermissions: {
          canRead: permission.canRead,
          canWrite: permission.canWrite,
          canDelete: permission.canDelete,
          canShare: permission.canShare,
        },
      },
    })
    
    return NextResponse.json({
      message: 'Permission revoked successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to revoke permission', message: error.message },
      { status: 500 }
    )
  }
}

