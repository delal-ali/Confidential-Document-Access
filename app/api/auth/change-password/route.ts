import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/auth/password'
import { verifyToken } from '@/lib/auth/jwt'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
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
    const { currentPassword, newPassword } = changePasswordSchema.parse(body)
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Verify current password
    const passwordValid = await verifyPassword(currentPassword, user.passwordHash)
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      )
    }
    
    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'New password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }
    
    // Hash new password
    const newPasswordHash = await hashPassword(newPassword)
    
    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        lastPasswordChange: new Date(),
      },
    })
    
    await createAuditLog({
      userId: user.id,
      action: 'PASSWORD_CHANGED',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })
    
    return NextResponse.json({
      message: 'Password changed successfully',
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Password change failed', message: error.message },
      { status: 500 }
    )
  }
}

