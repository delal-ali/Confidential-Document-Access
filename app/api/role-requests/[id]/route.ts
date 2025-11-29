import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { assignRoleToUser } from '@/lib/access-control/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const reviewRequestSchema = z.object({
  action: z.enum(['APPROVE', 'DENY', 'CANCEL']),
  reviewNotes: z.string().optional(),
})

// GET - View a specific role request
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
    
    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            department: true,
          },
        },
        requestedRole: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })
    
    if (!roleRequest) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      )
    }
    
    // Users can only view their own requests, admins can view all
    if (!isAdmin && roleRequest.userId !== payload.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json({
      request: roleRequest,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch role request', message: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Review/Approve/Deny/Cancel a role request
export async function PATCH(
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
    
    const body = await request.json()
    const data = reviewRequestSchema.parse(body)
    
    // Get the role request
    const roleRequest = await prisma.roleRequest.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        requestedRole: true,
      },
    })
    
    if (!roleRequest) {
      return NextResponse.json(
        { error: 'Role request not found' },
        { status: 404 }
      )
    }
    
    // Handle CANCEL action (user can cancel their own pending requests)
    if (data.action === 'CANCEL') {
      if (roleRequest.userId !== payload.userId) {
        return NextResponse.json(
          { error: 'Only the requester can cancel their own request' },
          { status: 403 }
        )
      }
      
      if (roleRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Only pending requests can be cancelled' },
          { status: 400 }
        )
      }
      
      const updated = await prisma.roleRequest.update({
        where: { id: params.id },
        data: {
          status: 'CANCELLED',
          reviewedBy: payload.userId,
          reviewedAt: new Date(),
          reviewNotes: data.reviewNotes || 'Cancelled by requester',
        },
      })
      
      await createAuditLog({
        userId: payload.userId,
        action: 'ROLE_REQUEST_CANCELLED',
        resourceType: 'role',
        resourceId: roleRequest.requestedRoleId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        details: {
          requestedRole: roleRequest.requestedRole.name,
          requestId: params.id,
        },
      })
      
      return NextResponse.json({
        message: 'Role request cancelled successfully',
        request: updated,
      })
    }
    
    // APPROVE and DENY actions require admin permissions
    const hasPermission = await checkRolePermission(payload.userId, 'role', 'assign')
    if (!hasPermission) {
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_DENIED',
        resourceType: 'role',
        details: {
          action: 'review_role_request',
        },
      })
      
      return NextResponse.json(
        { error: 'Insufficient permissions. Only administrators can approve or deny role requests.' },
        { status: 403 }
      )
    }
    
    if (roleRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending requests can be reviewed' },
        { status: 400 }
      )
    }
    
    let updatedRequest
    
    if (data.action === 'APPROVE') {
      // Assign the role to the user
      await assignRoleToUser(
        roleRequest.userId,
        roleRequest.requestedRoleId,
        payload.userId
      )
      
      // Update the request status
      updatedRequest = await prisma.roleRequest.update({
        where: { id: params.id },
        data: {
          status: 'APPROVED',
          reviewedBy: payload.userId,
          reviewedAt: new Date(),
          reviewNotes: data.reviewNotes,
        },
      })
      
      await createAuditLog({
        userId: payload.userId,
        action: 'ROLE_REQUEST_APPROVED',
        resourceType: 'role',
        resourceId: roleRequest.requestedRoleId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        details: {
          requestedBy: roleRequest.user.username,
          requestedRole: roleRequest.requestedRole.name,
          reviewNotes: data.reviewNotes,
        },
      })
    } else if (data.action === 'DENY') {
      // Update the request status
      updatedRequest = await prisma.roleRequest.update({
        where: { id: params.id },
        data: {
          status: 'DENIED',
          reviewedBy: payload.userId,
          reviewedAt: new Date(),
          reviewNotes: data.reviewNotes,
        },
      })
      
      await createAuditLog({
        userId: payload.userId,
        action: 'ROLE_REQUEST_DENIED',
        resourceType: 'role',
        resourceId: roleRequest.requestedRoleId,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        details: {
          requestedBy: roleRequest.user.username,
          requestedRole: roleRequest.requestedRole.name,
          reviewNotes: data.reviewNotes,
        },
      })
    }
    
    return NextResponse.json({
      message: `Role request ${data.action.toLowerCase()}d successfully`,
      request: updatedRequest,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to review role request', message: error.message },
      { status: 500 }
    )
  }
}

