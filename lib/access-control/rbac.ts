import { prisma } from '@/lib/db'

/**
 * RBAC: Assign role to user
 */
export async function assignRoleToUser(
  userId: string,
  roleId: string,
  assignedBy: string,
  expiresAt?: Date
): Promise<void> {
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    create: {
      userId,
      roleId,
      assignedBy,
      expiresAt,
      isActive: true,
    },
    update: {
      assignedBy,
      assignedAt: new Date(),
      expiresAt,
      isActive: true,
    },
  })
}

/**
 * RBAC: Remove role from user
 */
export async function removeRoleFromUser(
  userId: string,
  roleId: string
): Promise<void> {
  await prisma.userRole.update({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    data: {
      isActive: false,
    },
  })
}

/**
 * RBAC: Get all roles for a user
 */
export async function getUserRoles(userId: string) {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })
  
  return userRoles.map(ur => ur.role)
}

/**
 * RBAC: Check if user has permission through roles
 */
export async function checkRolePermission(
  userId: string,
  resource: string,
  action: string
): Promise<boolean> {
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  })
  
  for (const userRole of userRoles) {
    for (const rolePermission of userRole.role.permissions) {
      const permission = rolePermission.permission
      if (
        permission.resource === resource &&
        permission.action === action
      ) {
        return true
      }
    }
  }
  
  return false
}

/**
 * RBAC: Get all permissions for a user (from all roles)
 */
export async function getUserPermissions(userId: string) {
  const roles = await getUserRoles(userId)
  const permissions = new Set<string>()
  
  for (const role of roles) {
    for (const rolePermission of role.permissions) {
      const key = `${rolePermission.permission.resource}:${rolePermission.permission.action}`
      permissions.add(key)
    }
  }
  
  return Array.from(permissions).map(key => {
    const [resource, action] = key.split(':')
    return { resource, action }
  })
}

/**
 * RBAC: Create a new role
 */
export async function createRole(
  name: string,
  description: string,
  permissionIds: string[]
) {
  return prisma.role.create({
    data: {
      name,
      description,
      permissions: {
        create: permissionIds.map(permissionId => ({
          permissionId,
        })),
      },
    },
    include: {
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  })
}

