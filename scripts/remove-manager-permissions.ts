import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function removeManagerPermissions() {
  try {
    console.log('\n🔧 Removing audit:read and user:read from Manager role...\n')
    
    // Get Manager role
    const managerRole = await prisma.role.findUnique({
      where: { name: 'Manager' },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    })
    
    if (!managerRole) {
      console.log('❌ Manager role not found')
      process.exit(1)
    }
    
    // Get permissions to remove
    const auditReadPermission = await prisma.permission.findUnique({
      where: { name: 'audit:read' },
    })
    
    const userReadPermission = await prisma.permission.findUnique({
      where: { name: 'user:read' },
    })
    
    // Remove audit:read
    if (auditReadPermission) {
      const rolePermission = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: auditReadPermission.id,
          },
        },
      })
      
      if (rolePermission) {
        await prisma.rolePermission.delete({
          where: {
            roleId_permissionId: {
              roleId: managerRole.id,
              permissionId: auditReadPermission.id,
            },
          },
        })
        console.log('✅ Removed audit:read permission from Manager')
      } else {
        console.log('ℹ️  Manager does not have audit:read permission')
      }
    }
    
    // Remove user:read
    if (userReadPermission) {
      const rolePermission = await prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: managerRole.id,
            permissionId: userReadPermission.id,
          },
        },
      })
      
      if (rolePermission) {
        await prisma.rolePermission.delete({
          where: {
            roleId_permissionId: {
              roleId: managerRole.id,
              permissionId: userReadPermission.id,
            },
          },
        })
        console.log('✅ Removed user:read permission from Manager')
      } else {
        console.log('ℹ️  Manager does not have user:read permission')
      }
    }
    
    console.log('\n✅ Manager role updated!')
    console.log('\n💡 Users with Manager role need to LOGOUT and LOGIN again for changes to take effect!')
    console.log('\n📋 Manager can now only:')
    console.log('  - Create documents')
    console.log('  - Read documents')
    console.log('  - Edit documents')
    console.log('  - View roles (read-only)')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

removeManagerPermissions()

