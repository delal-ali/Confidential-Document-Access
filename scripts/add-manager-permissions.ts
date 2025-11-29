import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addManagerPermissions() {
  try {
    console.log('\n🔧 Adding additional permissions to Manager role...\n')
    
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
    
    // Get permissions to add
    const auditReadPermission = await prisma.permission.findUnique({
      where: { name: 'audit:read' },
    })
    
    const userReadPermission = await prisma.permission.findUnique({
      where: { name: 'user:read' },
    })
    
    // Create user:read permission if it doesn't exist
    let userRead = userReadPermission
    if (!userRead) {
      userRead = await prisma.permission.create({
        data: {
          name: 'user:read',
          description: 'View users',
          resource: 'user',
          action: 'read',
        },
      })
      console.log('✅ Created user:read permission')
    }
    
    // Check and add audit:read
    if (auditReadPermission) {
      const hasAuditRead = managerRole.permissions.some(
        rp => rp.permissionId === auditReadPermission.id
      )
      
      if (!hasAuditRead) {
        await prisma.rolePermission.create({
          data: {
            roleId: managerRole.id,
            permissionId: auditReadPermission.id,
          },
        })
        console.log('✅ Added audit:read permission to Manager')
      } else {
        console.log('ℹ️  Manager already has audit:read permission')
      }
    }
    
    // Check and add user:read
    const hasUserRead = managerRole.permissions.some(
      rp => rp.permissionId === userRead.id
    )
    
    if (!hasUserRead) {
      await prisma.rolePermission.create({
        data: {
          roleId: managerRole.id,
          permissionId: userRead.id,
        },
      })
      console.log('✅ Added user:read permission to Manager')
    } else {
      console.log('ℹ️  Manager already has user:read permission')
    }
    
    console.log('\n✅ Manager role updated!')
    console.log('\n💡 Users with Manager role need to LOGOUT and LOGIN again for changes to take effect!')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addManagerPermissions()

