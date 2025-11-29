import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword } from '@/lib/auth/password'
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt'
import { checkAccountLocked, recordFailedLoginAttempt, resetFailedLoginAttempts } from '@/lib/auth/account-lockout'
import { verifyOTP } from '@/lib/auth/mfa'
import { createAuditLog, logSecurityEvent } from '@/lib/audit/logger'
type AuditStatus = 'SUCCESS' | 'FAILURE' | 'WARNING'
import { z } from 'zod'

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
  otp: z.string().optional(), // For MFA
})

export async function POST(request: NextRequest) {
  try {
    const body = await loginSchema.parse(await request.json())
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: body.username },
          { email: body.username },
        ],
      },
    })
    
    if (!user) {
      await logSecurityEvent('LOGIN_FAILED', {
        ipAddress,
        userAgent,
        details: {
          reason: 'User not found',
          username: body.username,
        },
        status: 'FAILURE',
      })
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Check if account is locked
    const lockStatus = await checkAccountLocked(user.id)
    if (lockStatus.locked) {
      await logSecurityEvent('LOGIN_BLOCKED', {
        userId: user.id,
        ipAddress,
        userAgent,
        details: {
          reason: 'Account locked',
          lockoutUntil: lockStatus.lockoutUntil,
        },
        status: 'FAILURE',
      })
      
      return NextResponse.json(
        { 
          error: 'Account is locked',
          lockoutUntil: lockStatus.lockoutUntil,
        },
        { status: 403 }
      )
    }
    
    // Verify password
    const passwordValid = await verifyPassword(body.password, user.passwordHash)
    
    if (!passwordValid) {
      const lockoutInfo = await recordFailedLoginAttempt(user.id)
      
      await logSecurityEvent('LOGIN_FAILED', {
        userId: user.id,
        ipAddress,
        userAgent,
        details: {
          reason: 'Invalid password',
          remainingAttempts: lockoutInfo.remainingAttempts,
        },
        status: 'FAILURE',
      })
      
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          remainingAttempts: lockoutInfo.remainingAttempts,
          locked: lockoutInfo.locked,
        },
        { status: 401 }
      )
    }
    
    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!body.otp) {
        return NextResponse.json(
          { error: 'MFA required', mfaRequired: true },
          { status: 200 } // 200 because we need to prompt for OTP
        )
      }
      
      // Verify OTP
      if (!user.mfaSecret) {
        await logSecurityEvent('MFA_VERIFICATION_FAILED', {
          userId: user.id,
          ipAddress,
          userAgent,
          details: { reason: 'MFA secret not found' },
          status: 'FAILURE',
        })
        return NextResponse.json(
          { error: 'MFA not properly configured' },
          { status: 400 }
        )
      }
      
      const otpValid = verifyOTP(user.mfaSecret, body.otp)
      if (!otpValid) {
        await logSecurityEvent('MFA_VERIFICATION_FAILED', {
          userId: user.id,
          ipAddress,
          userAgent,
          details: { reason: 'Invalid OTP code' },
          status: 'FAILURE',
        })
        return NextResponse.json(
          { error: 'Invalid OTP code' },
          { status: 401 }
        )
      }
      
      // OTP verified successfully
      await createAuditLog({
        userId: user.id,
        action: 'MFA_VERIFICATION_SUCCESS',
        ipAddress,
        userAgent,
        status: 'SUCCESS',
      })
    }
    
    // Reset failed login attempts
    await resetFailedLoginAttempts(user.id)
    
    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })
    
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    })
    
    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    await prisma.session.create({
      data: {
        userId: user.id,
        token: accessToken,
        refreshToken,
        ipAddress,
        userAgent,
        expiresAt,
      },
    })
    
    // Log successful login
    await createAuditLog({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      status: 'SUCCESS',
    })
    
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mfaEnabled: user.mfaEnabled,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Login failed', message: error.message },
      { status: 500 }
    )
  }
}

