import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit/logger'
import { sendPasswordResetEmail } from '@/lib/utils/email'
import crypto from 'crypto'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    // Always return success message (security best practice - don't reveal if email exists)
    if (!user) {
      // Log attempt for non-existent email
      await createAuditLog({
        action: 'PASSWORD_RESET_REQUESTED',
        resourceType: 'user',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        details: {
          email,
          status: 'user_not_found',
        },
      })
      
      return NextResponse.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      })
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    // Update user with reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      },
    })
    
    // Log password reset request
    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resourceType: 'user',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        email: user.email,
        status: 'token_generated',
      },
    })
    
    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, resetToken)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Still return success to not reveal if email exists
    }
    
    // In development, also log the link
    if (process.env.NODE_ENV === 'development') {
      const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      console.log('Password reset link (dev only):', resetLink)
    }
    
    return NextResponse.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // In development, also return link for testing
      ...(process.env.NODE_ENV === 'development' && {
        resetLink: `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`,
      }),
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request', message: error.message },
      { status: 500 }
    )
  }
}

