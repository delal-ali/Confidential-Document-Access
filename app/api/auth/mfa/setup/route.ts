import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { generateMFASecret, generateQRCode } from '@/lib/auth/mfa'
import { createAuditLog } from '@/lib/audit/logger'

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
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Generate MFA secret
    const mfaSecret = generateMFASecret(user.email)
    const qrCode = await generateQRCode(mfaSecret.uri)
    
    // Store secret (but don't enable MFA yet - user needs to verify first)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mfaSecret: mfaSecret.secret,
        // mfaEnabled: false - will be enabled after verification
      },
    })
    
    await createAuditLog({
      userId: user.id,
      action: 'MFA_SETUP_INITIATED',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })
    
    return NextResponse.json({
      secret: mfaSecret.secret,
      uri: mfaSecret.uri,
      qrCode,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'MFA setup failed', message: error.message },
      { status: 500 }
    )
  }
}

