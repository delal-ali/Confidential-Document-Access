import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function assignAdmin() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
    })

    if (users.length === 0) {
      console.log('❌ No users found. Please register a user first at http://localhost:3000')
      process.exit(1)
    }

    console.log('\n📋 Available users:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email}) - ID: ${user.id}`)
    })

    // Get Administrator role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Administrator' },
    })

    if (!adminRole) {
      console.log('❌ Administrator role not found. Please run: npm run db:seed')
      process.exit(1)
    }

    // Get the first user (or you can modify this to select a specific user)
    const targetUser = users[0]
    
    // Check if user already has admin role
    const existingRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: targetUser.id,
          roleId: adminRole.id,
        },
      },
    })

    if (existingRole) {
      console.log(`\n✅ User "${targetUser.username}" already has Administrator role!`)
      process.exit(0)
    }

    // Assign admin role
    await prisma.userRole.create({
      data: {
        userId: targetUser.id,
        roleId: adminRole.id,
        assignedBy: targetUser.id, // Self-assigned
        isActive: true,
      },
    })

    console.log(`\n✅ Successfully assigned Administrator role to: ${targetUser.username} (${targetUser.email})`)
    console.log('\n🎉 You can now login and access all features!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

assignAdmin()

