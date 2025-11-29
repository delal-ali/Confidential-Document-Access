import { TOTP } from 'otpauth'
import QRCode from 'qrcode'

export interface MFASecret {
  secret: string
  uri: string
  qrCode: string
}

export function generateMFASecret(userEmail: string, issuer: string = 'Document Access System'): MFASecret {
  const totp = new TOTP({
    issuer,
    label: userEmail,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })
  
  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
    qrCode: '', // Will be generated asynchronously
  }
}

export async function generateQRCode(uri: string): Promise<string> {
  try {
    return await QRCode.toDataURL(uri)
  } catch (error) {
    throw new Error('Failed to generate QR code')
  }
}

export function verifyOTP(secret: string, token: string): boolean {
  try {
    const totp = new TOTP({
      secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    })
    
    const delta = totp.validate({ token, window: 1 })
    return delta !== null
  } catch (error) {
    return false
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

