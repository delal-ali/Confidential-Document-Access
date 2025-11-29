import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const verifySchema = z.object({
  token: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = verifySchema.parse(body)
    
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date(),
        },
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    })
    
    await createAuditLog({
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })
    
    return NextResponse.json({
      message: 'Email verified successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Verification failed', message: error.message },
      { status: 500 }
    )
  }
}

