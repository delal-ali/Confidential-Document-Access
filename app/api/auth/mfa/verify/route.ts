import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { verifyOTP } from '@/lib/auth/mfa'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const verifySchema = z.object({
  otp: z.string().length(6),
})

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
    const { otp } = verifySchema.parse(body)
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    
    if (!user || !user.mfaSecret) {
      return NextResponse.json(
        { error: 'MFA not set up' },
        { status: 400 }
      )
    }
    
    // Verify OTP
    const isValid = verifyOTP(user.mfaSecret, otp)
    
    if (!isValid) {
      await createAuditLog({
        userId: user.id,
        action: 'MFA_VERIFICATION_FAILED',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      })
      
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }
    
    // Enable MFA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaEnabled: true,
      },
    })
    
    await createAuditLog({
      userId: user.id,
      action: 'MFA_ENABLED',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })
    
    return NextResponse.json({
      message: 'MFA enabled successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'MFA verification failed', message: error.message },
      { status: 500 }
    )
  }
}

