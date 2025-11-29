import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Restoring all users and roles...\n')

  // Get roles
  const adminRole = await prisma.role.findUnique({
    where: { name: 'Administrator' },
  })
  const managerRole = await prisma.role.findUnique({
    where: { name: 'Manager' },
  })
  const employeeRole = await prisma.role.findUnique({
    where: { name: 'Employee' },
  })

  if (!adminRole || !managerRole || !employeeRole) {
    console.error('❌ Roles not found! Run: npm run db:seed')
    process.exit(1)
  }

  // Create/Update Admin User
  const adminPassword = await bcrypt.hash('Admin123!@#', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      securityLabel: 'TOP_SECRET',
      clearanceLevel: 3,
    },
    create: {
      email: 'admin@example.com',
      username: 'admin',
      passwordHash: adminPassword,
      emailVerified: true,
      securityLabel: 'TOP_SECRET',
      clearanceLevel: 3,
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT',
      employmentStatus: 'ACTIVE',
    },
  })

  // Assign Administrator role to admin
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
      isActive: true,
    },
  })

  console.log('✅ Admin user created/updated:')
  console.log('   Email: admin@example.com')
  console.log('   Password: Admin123!@#')
  console.log('   Role: Administrator')
  console.log('   Security: TOP_SECRET (Level 3)\n')

  // Create/Update Manager User
  const managerPassword = await bcrypt.hash('Manager123!@#', 10)
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {
      securityLabel: 'CONFIDENTIAL',
      clearanceLevel: 2,
    },
    create: {
      email: 'manager@example.com',
      username: 'manager',
      passwordHash: managerPassword,
      emailVerified: true,
      securityLabel: 'CONFIDENTIAL',
      clearanceLevel: 2,
      firstName: 'Department',
      lastName: 'Manager',
      department: 'Operations',
      employmentStatus: 'ACTIVE',
    },
  })

  // Assign Manager role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: manager.id,
        roleId: managerRole.id,
      },
    },
    update: {},
    create: {
      userId: manager.id,
      roleId: managerRole.id,
      isActive: true,
    },
  })

  console.log('✅ Manager user created/updated:')
  console.log('   Email: manager@example.com')
  console.log('   Password: Manager123!@#')
  console.log('   Role: Manager')
  console.log('   Security: CONFIDENTIAL (Level 2)\n')

  // Create/Update Employee User
  const employeePassword = await bcrypt.hash('Employee123!@#', 10)
  const employee = await prisma.user.upsert({
    where: { email: 'employee@example.com' },
    update: {
      securityLabel: 'PUBLIC',
      clearanceLevel: 0,
    },
    create: {
      email: 'employee@example.com',
      username: 'employee',
      passwordHash: employeePassword,
      emailVerified: true,
      securityLabel: 'PUBLIC',
      clearanceLevel: 0,
      firstName: 'Regular',
      lastName: 'Employee',
      department: 'General',
      employmentStatus: 'ACTIVE',
    },
  })

  // Assign Employee role
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: employee.id,
        roleId: employeeRole.id,
      },
    },
    update: {},
    create: {
      userId: employee.id,
      roleId: employeeRole.id,
      isActive: true,
    },
  })

  console.log('✅ Employee user created/updated:')
  console.log('   Email: employee@example.com')
  console.log('   Password: Employee123!@#')
  console.log('   Role: Employee')
  console.log('   Security: PUBLIC (Level 0)\n')

  console.log('🎉 All users restored successfully!\n')
  console.log('📋 Login Credentials:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('👑 Administrator:')
  console.log('   Email: admin@example.com')
  console.log('   Password: Admin123!@#')
  console.log('')
  console.log('👔 Manager:')
  console.log('   Email: manager@example.com')
  console.log('   Password: Manager123!@#')
  console.log('')
  console.log('👤 Employee:')
  console.log('   Email: employee@example.com')
  console.log('   Password: Employee123!@#')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


