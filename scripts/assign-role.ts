import { PrismaClient } from '@prisma/client'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function assignRole() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (users.length === 0) {
      console.log('❌ No users found. Please register users first at http://localhost:3000')
      process.exit(1)
    }

    // Get all roles
    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    if (roles.length === 0) {
      console.log('❌ No roles found. Please run: npm run db:seed')
      process.exit(1)
    }

    console.log('\n📋 Available Users:')
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username} (${user.email})`)
    })

    console.log('\n📋 Available Roles:')
    roles.forEach((role, index) => {
      console.log(`${index + 1}. ${role.name} - ${role.description}`)
    })

    const userChoice = await question('\nEnter user number to assign role: ')
    const roleChoice = await question('Enter role number to assign: ')

    const userIndex = parseInt(userChoice) - 1
    const roleIndex = parseInt(roleChoice) - 1

    if (userIndex < 0 || userIndex >= users.length) {
      console.log('❌ Invalid user selection')
      process.exit(1)
    }

    if (roleIndex < 0 || roleIndex >= roles.length) {
      console.log('❌ Invalid role selection')
      process.exit(1)
    }

    const selectedUser = users[userIndex]
    const selectedRole = roles[roleIndex]

    // Check if user already has this role
    const existingRole = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: selectedUser.id,
          roleId: selectedRole.id,
        },
      },
    })

    if (existingRole) {
      if (existingRole.isActive) {
        console.log(`\n✅ User "${selectedUser.username}" already has "${selectedRole.name}" role!`)
      } else {
        // Reactivate the role
        await prisma.userRole.update({
          where: {
            userId_roleId: {
              userId: selectedUser.id,
              roleId: selectedRole.id,
            },
          },
          data: {
            isActive: true,
            assignedAt: new Date(),
          },
        })
        console.log(`\n✅ Reactivated "${selectedRole.name}" role for "${selectedUser.username}"`)
      }
      process.exit(0)
    }

    // Assign role
    await prisma.userRole.create({
      data: {
        userId: selectedUser.id,
        roleId: selectedRole.id,
        assignedBy: selectedUser.id, // Self-assigned (you can change this)
        isActive: true,
      },
    })

    console.log(`\n✅ Successfully assigned "${selectedRole.name}" role to: ${selectedUser.username} (${selectedUser.email})`)
    console.log('\n🎉 The user can now use their role permissions!')
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

assignRole()

