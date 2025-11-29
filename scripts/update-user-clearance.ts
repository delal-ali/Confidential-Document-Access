import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateClearance() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        securityLabel: true,
        clearanceLevel: true,
      },
    })

    if (users.length === 0) {
      console.log('❌ No users found.')
      process.exit(1)
    }

    console.log('\n📋 Current user security settings:')
    users.forEach((user) => {
      console.log(`${user.username}: Label=${user.securityLabel}, Level=${user.clearanceLevel}`)
    })

    // Update first user to have CONFIDENTIAL clearance
    const targetUser = users[0]
    
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        securityLabel: 'CONFIDENTIAL',
        clearanceLevel: 2, // 0=Public, 1=Internal, 2=Confidential, 3=TopSecret
      },
    })

    console.log(`\n✅ Updated ${targetUser.username} to CONFIDENTIAL security label with clearance level 2`)
    console.log('🎉 You can now create CONFIDENTIAL documents!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

updateClearance()

