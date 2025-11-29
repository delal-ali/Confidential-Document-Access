import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixManagerPermissions() {
  try {
    console.log('\n🔧 Fixing Manager role permissions...\n')
    
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
      console.log('❌ Manager role not found. Run: npm run db:seed')
      process.exit(1)
    }
    
    console.log(`✅ Found Manager role`)
    console.log(`\n📋 Current permissions:`)
    managerRole.permissions.forEach(rp => {
      console.log(`  - ${rp.permission.name}`)
    })
    
    // Get document:create permission
    const createPermission = await prisma.permission.findUnique({
      where: { name: 'document:create' },
    })
    
    if (!createPermission) {
      console.log('❌ document:create permission not found. Run: npm run db:seed')
      process.exit(1)
    }
    
    // Check if Manager already has this permission
    const hasPermission = managerRole.permissions.some(
      rp => rp.permissionId === createPermission.id
    )
    
    if (hasPermission) {
      console.log(`\n✅ Manager role already has document:create permission`)
      console.log(`\n💡 If user still can't create documents:`)
      console.log(`   1. Make sure the user has Manager role assigned`)
      console.log(`   2. User must LOGOUT and LOGIN again after role assignment`)
      console.log(`   3. Check if role is active (isActive: true)`)
    } else {
      // Add the permission
      await prisma.rolePermission.create({
        data: {
          roleId: managerRole.id,
          permissionId: createPermission.id,
        },
      })
      console.log(`\n✅ Added document:create permission to Manager role`)
    }
    
    // List all users with Manager role
    console.log(`\n👥 Users with Manager role:`)
    const managerUsers = await prisma.userRole.findMany({
      where: {
        roleId: managerRole.id,
        isActive: true,
      },
      include: {
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    })
    
    if (managerUsers.length === 0) {
      console.log('  ⚠️  No users have Manager role assigned')
      console.log(`\n💡 Assign Manager role using:`)
      console.log(`   - Web UI: Dashboard → Users → Assign Role`)
      console.log(`   - Command: npm run assign-role`)
    } else {
      managerUsers.forEach(ur => {
        console.log(`  - ${ur.user.username} (${ur.user.email})`)
      })
      console.log(`\n💡 These users need to LOGOUT and LOGIN again for permissions to take effect!`)
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

fixManagerPermissions()

