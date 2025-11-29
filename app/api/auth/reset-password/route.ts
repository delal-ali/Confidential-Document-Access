import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, newPassword } = resetPasswordSchema.parse(body)
    
    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date(),
        },
      },
    })
    
    if (!user) {
      await createAuditLog({
        action: 'PASSWORD_RESET_FAILED',
        resourceType: 'user',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        details: {
          reason: 'Invalid or expired token',
        },
      })
      
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }
    
    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)
    
    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        lastPasswordChange: new Date(),
        // Reset failed login attempts on password reset
        failedLoginAttempts: 0,
        accountLocked: false,
        accountLockedUntil: null,
      },
    })
    
    // Log successful password reset
    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_RESET_SUCCESS',
      resourceType: 'user',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        email: user.email,
      },
    })
    
    return NextResponse.json({
      message: 'Password reset successfully. You can now login with your new password.',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password', message: error.message },
      { status: 500 }
    )
  }
}

