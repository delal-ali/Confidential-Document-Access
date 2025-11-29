import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyPermissions() {
  try {
    const username = process.argv[2] || 'hana'
    
    console.log(`\n🔍 Checking permissions for user: ${username}\n`)
    
    // Find user
    const user = await prisma.user.findFirst({
      where: {
        username: username,
      },
      include: {
        roles: {
          where: {
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
        },
      },
    })
    
    if (!user) {
      console.log(`❌ User "${username}" not found`)
      process.exit(1)
    }
    
    console.log(`✅ User found: ${user.username} (${user.email})`)
    console.log(`\n📋 Assigned Roles:`)
    
    if (user.roles.length === 0) {
      console.log('  ⚠️  No roles assigned!')
    } else {
      for (const userRole of user.roles) {
        console.log(`  - ${userRole.role.name} (Active: ${userRole.isActive})`)
        console.log(`    Permissions:`)
        
        for (const rolePermission of userRole.role.permissions) {
          const perm = rolePermission.permission
          console.log(`      • ${perm.name} (${perm.resource}:${perm.action})`)
        }
      }
    }
    
    // Check specific permission
    console.log(`\n🔐 Checking document:create permission:`)
    let hasCreatePermission = false
    
    for (const userRole of user.roles) {
      for (const rolePermission of userRole.role.permissions) {
        const perm = rolePermission.permission
        if (perm.resource === 'document' && perm.action === 'create') {
          hasCreatePermission = true
          console.log(`  ✅ Found in role: ${userRole.role.name}`)
        }
      }
    }
    
    if (!hasCreatePermission) {
      console.log(`  ❌ User does NOT have document:create permission`)
      console.log(`\n💡 Solution: Make sure the user has the Manager role assigned`)
    } else {
      console.log(`  ✅ User HAS document:create permission`)
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifyPermissions()

