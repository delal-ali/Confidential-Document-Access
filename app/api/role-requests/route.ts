import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const createRequestSchema = z.object({
  requestedRoleId: z.string().min(1, 'Role ID is required'),
  reason: z.string().optional().nullable().or(z.literal('')),
})

// GET - View role requests (users see their own, admins see all)
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
    
    // Admins see all requests, users see only their own
    const where = isAdmin ? {} : { userId: payload.userId }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    if (status) {
      where.status = status
    }
    
    const requests = await prisma.roleRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    })
    
    return NextResponse.json({
      requests,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch role requests', message: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new role change request
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
    console.log('Received role request body:', body)
    
    // Normalize reason field (empty string to null)
    if (body.reason === '') {
      body.reason = null
    }
    
    const data = createRequestSchema.parse(body)
    console.log('Parsed role request data:', data)
    
    // Verify role exists
    const role = await prisma.role.findUnique({
      where: { id: data.requestedRoleId },
    })
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      )
    }
    
    // Check if user already has this role
    const existingRole = await prisma.userRole.findFirst({
      where: {
        userId: payload.userId,
        roleId: data.requestedRoleId,
        isActive: true,
      },
    })
    
    if (existingRole) {
      return NextResponse.json(
        { error: 'You already have this role' },
        { status: 400 }
      )
    }
    
    // Check if there's already a pending request for this role
    const pendingRequest = await prisma.roleRequest.findFirst({
      where: {
        userId: payload.userId,
        requestedRoleId: data.requestedRoleId,
        status: 'PENDING',
      },
    })
    
    if (pendingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this role' },
        { status: 400 }
      )
    }
    
    // Create the request
    console.log('Creating role request:', {
      userId: payload.userId,
      requestedRoleId: data.requestedRoleId,
      reason: data.reason,
    })
    
    // Check if roleRequest model exists (for better error message)
    if (!('roleRequest' in prisma)) {
      console.error('Prisma client does not have roleRequest model')
      return NextResponse.json(
        { 
          error: 'Database model error: RoleRequest model is not available in Prisma client. Please stop your development server, run "npx prisma generate", then restart the server.',
          message: 'Prisma client needs to be regenerated'
        },
        { status: 500 }
      )
    }
    
    const roleRequest = await prisma.roleRequest.create({
      data: {
        userId: payload.userId,
        requestedRoleId: data.requestedRoleId,
        reason: data.reason || null,
        status: 'PENDING',
      },
      include: {
        requestedRole: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })
    
    console.log('Role request created successfully:', roleRequest.id)
    
    await createAuditLog({
      userId: payload.userId,
      action: 'ROLE_REQUEST_CREATED',
      resourceType: 'role',
      resourceId: data.requestedRoleId,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        requestedRole: role.name,
        reason: data.reason,
      },
    })
    
    return NextResponse.json({
      message: 'Role change request submitted successfully',
      request: roleRequest,
    })
  } catch (error: any) {
    console.error('Error creating role request:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      )
    }
    
    // Handle Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A request for this role already exists' },
        { status: 400 }
      )
    }
    
    // Check for Prisma model errors
    const errorMessage = error.message || 'Unknown error occurred'
    if (errorMessage.includes('roleRequest') || errorMessage.includes('Unknown arg') || errorMessage.includes('does not exist')) {
      return NextResponse.json(
        { 
          error: 'Database model error: RoleRequest model is not available. Please restart your development server (stop and run "npm run dev" again) to regenerate Prisma client.',
          message: errorMessage
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create role request', 
        message: errorMessage,
        errorCode: error.code,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

