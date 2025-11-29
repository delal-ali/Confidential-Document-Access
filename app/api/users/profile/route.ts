import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const updateProfileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  department: z.string().optional(),
  location: z.string().optional(),
})

export async function PUT(request: NextRequest) {
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
    const data = updateProfileSchema.parse(body)

    // Update user profile
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        location: data.location,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        department: true,
        location: true,
      },
    })

    // Log profile update
    await createAuditLog({
      userId: user.id,
      action: 'PROFILE_UPDATED',
      resourceType: 'user',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        updatedFields: Object.keys(data),
      },
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile', message: error.message },
      { status: 500 }
    )
  }
}


