import { prisma } from '@/lib/db'

export interface DocumentPermission {
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canShare: boolean
}

/**
 * DAC: Grant permission to user for a document
 */
export async function grantDocumentPermission(
  documentId: string,
  userId: string,
  permissions: DocumentPermission,
  grantedBy: string
): Promise<void> {
  await prisma.documentPermission.upsert({
    where: {
      documentId_userId: {
        documentId,
        userId,
      },
    },
    create: {
      documentId,
      userId,
      ...permissions,
      grantedBy,
    },
    update: {
      ...permissions,
      grantedBy,
      grantedAt: new Date(),
    },
  })
}

/**
 * DAC: Revoke permission from user for a document
 */
export async function revokeDocumentPermission(
  documentId: string,
  userId: string
): Promise<void> {
  await prisma.documentPermission.update({
    where: {
      documentId_userId: {
        documentId,
        userId,
      },
    },
    data: {
      isActive: false,
    },
  })
}

/**
 * DAC: Check if user has permission for a document
 */
export async function checkDocumentPermission(
  documentId: string,
  userId: string,
  action: 'read' | 'write' | 'delete' | 'share'
): Promise<boolean> {
  const permission = await prisma.documentPermission.findUnique({
    where: {
      documentId_userId: {
        documentId,
        userId,
      },
    },
  })
  
  if (!permission || !permission.isActive) {
    return false
  }
  
  // Check if permission has expired
  if (permission.expiresAt && new Date() > permission.expiresAt) {
    return false
  }
  
  switch (action) {
    case 'read':
      return permission.canRead
    case 'write':
      return permission.canWrite
    case 'delete':
      return permission.canDelete
    case 'share':
      return permission.canShare
    default:
      return false
  }
}

/**
 * DAC: Check if user is owner of document
 */
export async function isDocumentOwner(
  documentId: string,
  userId: string
): Promise<boolean> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  })
  
  return document?.ownerId === userId
}

/**
 * DAC: Get all permissions for a document
 */
export async function getDocumentPermissions(documentId: string) {
  return prisma.documentPermission.findMany({
    where: {
      documentId,
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  })
}

