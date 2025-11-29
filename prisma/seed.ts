import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'document:create' },
      update: {},
      create: {
        name: 'document:create',
        description: 'Create documents',
        resource: 'document',
        action: 'create',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'document:read' },
      update: {},
      create: {
        name: 'document:read',
        description: 'Read documents',
        resource: 'document',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'document:write' },
      update: {},
      create: {
        name: 'document:write',
        description: 'Edit documents',
        resource: 'document',
        action: 'write',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'document:delete' },
      update: {},
      create: {
        name: 'document:delete',
        description: 'Delete documents',
        resource: 'document',
        action: 'delete',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'role:create' },
      update: {},
      create: {
        name: 'role:create',
        description: 'Create roles',
        resource: 'role',
        action: 'create',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'role:read' },
      update: {},
      create: {
        name: 'role:read',
        description: 'View roles',
        resource: 'role',
        action: 'read',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'role:assign' },
      update: {},
      create: {
        name: 'role:assign',
        description: 'Assign roles to users',
        resource: 'role',
        action: 'assign',
      },
    }),
    prisma.permission.upsert({
      where: { name: 'audit:read' },
      update: {},
      create: {
        name: 'audit:read',
        description: 'View audit logs',
        resource: 'audit',
        action: 'read',
      },
    }),
  ])

  console.log('Created permissions:', permissions.length)

  // Create default roles with detailed descriptions based on job responsibilities and hierarchy
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {
      description: 'Level 1: System Administrator - Full system control, security management, user/role management, permission management, audit oversight, and system configuration. Responsible for maintaining system security and managing all access controls.',
    },
    create: {
      name: 'Administrator',
      description: 'Level 1: System Administrator - Full system control, security management, user/role management, permission management, audit oversight, and system configuration. Responsible for maintaining system security and managing all access controls.',
      permissions: {
        create: permissions.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  })

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {
      description: 'Level 2: Department Manager - Team and document management. Can create documents with any security level, manage team documents, delete own documents and employee-created documents. Cannot manage permissions (Administrator-only) or view audit logs.',
    },
    create: {
      name: 'Manager',
      description: 'Level 2: Department Manager - Team and document management. Can create documents with any security level, manage team documents, delete own documents and employee-created documents. Cannot manage permissions (Administrator-only) or view audit logs.',
      permissions: {
        create: [
          { permissionId: permissions.find(p => p.name === 'document:create')!.id },
          { permissionId: permissions.find(p => p.name === 'document:read')!.id },
          { permissionId: permissions.find(p => p.name === 'document:write')!.id },
          { permissionId: permissions.find(p => p.name === 'role:read')!.id },
        ],
      },
    },
  })

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {
      description: 'Level 3: Employee - Document access and collaboration. Can read PUBLIC documents and documents with explicit permission granted by Administrator. Cannot create, delete, or manage permissions. Basic read-only access for regular staff members.',
    },
    create: {
      name: 'Employee',
      description: 'Level 3: Employee - Document access and collaboration. Can read PUBLIC documents and documents with explicit permission granted by Administrator. Cannot create, delete, or manage permissions. Basic read-only access for regular staff members.',
      permissions: {
        create: [
          { permissionId: permissions.find(p => p.name === 'document:read')!.id },
        ],
      },
    },
  })

  console.log('Created roles: Administrator, Manager, Employee')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

