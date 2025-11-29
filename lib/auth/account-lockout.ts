import { prisma } from '@/lib/db'

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION_MINUTES = 30

export async function recordFailedLoginAttempt(userId: string): Promise<{
  locked: boolean
  remainingAttempts: number
  lockoutUntil?: Date
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })
  
  if (!user) {
    throw new Error('User not found')
  }
  
  const failedAttempts = user.failedLoginAttempts + 1
  const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS
  
  const lockoutUntil = shouldLock
    ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000)
    : null
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: failedAttempts,
      accountLocked: shouldLock,
      accountLockedUntil: lockoutUntil,
    },
  })
  
  return {
    locked: shouldLock,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - failedAttempts),
    lockoutUntil: lockoutUntil || undefined,
  }
}

export async function resetFailedLoginAttempts(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginAttempts: 0,
      accountLocked: false,
      accountLockedUntil: null,
      lastLogin: new Date(),
    },
  })
}

export async function checkAccountLocked(userId: string): Promise<{
  locked: boolean
  lockoutUntil?: Date
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      accountLocked: true,
      accountLockedUntil: true,
    },
  })
  
  if (!user) {
    return { locked: true }
  }
  
  // Check if lockout has expired
  if (user.accountLocked && user.accountLockedUntil) {
    if (new Date() > user.accountLockedUntil) {
      // Lockout expired, unlock account
      await prisma.user.update({
        where: { id: userId },
        data: {
          accountLocked: false,
          accountLockedUntil: null,
          failedLoginAttempts: 0,
        },
      })
      return { locked: false }
    }
    return { locked: true, lockoutUntil: user.accountLockedUntil }
  }
  
  return { locked: user.accountLocked || false }
}

