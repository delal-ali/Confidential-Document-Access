import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { getUserRoles } from '@/lib/access-control/rbac'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    const roles = await getUserRoles(payload.userId)
    
    return NextResponse.json({
      roles: roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
      })),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch roles', message: error.message },
      { status: 500 }
    )
  }
}

