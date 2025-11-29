import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  // In development, log email instead of sending
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_HOST) {
    console.log('📧 Email (Development Mode - not sent):')
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('Body:', options.text || options.html)
    return
  }

  // Check if SMTP is configured
  if (!process.env.SMTP_HOST) {
    console.warn('⚠️ SMTP not configured. Email not sent.')
    console.log('Email would be sent to:', options.to)
    console.log('Subject:', options.subject)
    return
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  // Send email
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  })
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const verificationLink = `${appUrl}/verify-email?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h2>Email Verification</h2>
      <p>Thank you for registering! Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${verificationLink}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
    text: `Verify your email by visiting: ${verificationLink}`,
  })
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const resetLink = `${appUrl}/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html: `
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the link below to reset it:</p>
      <p><a href="${resetLink}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${resetLink}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
    `,
    text: `Reset your password by visiting: ${resetLink}`,
  })
}


