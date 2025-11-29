import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { createAuditLog } from '@/lib/audit/logger'
import { sendVerificationEmail } from '@/lib/utils/email'
import crypto from 'crypto'
import { z } from 'zod'

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  department: z.string().optional(),
  role: z.enum(['Administrator', 'Manager', 'Employee']).optional().default('Employee'),
  captchaAnswer: z.number().optional(), // Simple math CAPTCHA
  captchaQuestion: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)
    
    // Simple CAPTCHA validation (math question)
    if (data.captchaQuestion && data.captchaAnswer !== undefined) {
      // Parse the question (format: "What is 5 + 3?")
      const match = data.captchaQuestion.match(/What is (\d+) ([+\-*]) (\d+)\?/)
      if (match) {
        const num1 = parseInt(match[1])
        const operator = match[2]
        const num2 = parseInt(match[3])
        let correctAnswer: number
        
        switch (operator) {
          case '+':
            correctAnswer = num1 + num2
            break
          case '-':
            correctAnswer = num1 - num2
            break
          case '*':
            correctAnswer = num1 * num2
            break
          default:
            return NextResponse.json(
              { error: 'Invalid CAPTCHA question' },
              { status: 400 }
            )
        }
        
        if (data.captchaAnswer !== correctAnswer) {
          return NextResponse.json(
            { error: 'CAPTCHA verification failed' },
            { status: 400 }
          )
        }
      }
    }
    
    // Validate password strength
    const passwordValidation = validatePasswordStrength(data.password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Password does not meet requirements', details: passwordValidation.errors },
        { status: 400 }
      )
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      )
    }
    
    // Hash password
    const passwordHash = await hashPassword(data.password)
    
    // Generate verification tokens
    const emailToken = crypto.randomBytes(32).toString('hex')
    const phoneToken = data.phone ? crypto.randomBytes(32).toString('hex') : null
    const emailExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    const phoneExpiry = data.phone ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null
    
    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        emailVerificationToken: emailToken,
        emailVerificationExpiry: emailExpiry,
        phoneVerificationToken: phoneToken,
        phoneVerificationExpiry: phoneExpiry,
      },
      select: {
        id: true,
        username: true,
        email: true,
        emailVerified: true,
        phoneVerified: true,
      },
    })
    
    // Assign role to user
    const roleName = data.role || 'Employee'
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    })
    
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
          assignedBy: user.id, // Self-assigned during registration
          isActive: true,
        },
      })
    }
    
    // Log registration
    await createAuditLog({
      userId: user.id,
      action: 'USER_REGISTERED',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
      details: {
        username: user.username,
        email: user.email,
        role: roleName,
      },
    })
    
    // Send verification email
    try {
      await sendVerificationEmail(user.email, emailToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails - user can request resend
    }
    
    return NextResponse.json({
      message: 'User registered successfully. Please verify your email.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed', message: error.message },
      { status: 500 }
    )
  }
}

