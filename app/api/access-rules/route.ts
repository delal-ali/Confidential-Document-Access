import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  ruleType: z.enum(['TIME', 'LOCATION', 'DEVICE', 'ATTRIBUTE', 'COMPOSITE']),
  allowedStartTime: z.string().optional(),
  allowedEndTime: z.string().optional(),
  allowedDays: z.string().optional(),
  allowedLocations: z.string().optional(),
  allowedDevices: z.string().optional(),
  attributeConditions: z.string().optional(),
  targetType: z.string(),
  targetId: z.string().optional().nullable(),
  priority: z.number().default(0),
  isActive: z.boolean().default(true),
})

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
    
    // Check if user is admin or manager
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: true,
      },
    })
    
    // All authenticated users (including employees) can view access rules (read-only)
    // Only admins can create/modify rules
    
    const rules = await prisma.accessRule.findMany({
      orderBy: {
        priority: 'desc',
      },
    })
    
    await createAuditLog({
      userId: payload.userId,
      action: 'ACCESS_RULES_VIEWED',
      resourceType: 'access_rule',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })
    
    return NextResponse.json({
      rules,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch access rules', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    
    // Check if user is admin
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: true,
      },
    })
    
    const isAdmin = userRoles.some(ur => ur.role.name === 'Administrator')
    
    if (!isAdmin) {
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_DENIED',
        resourceType: 'access_rule',
        details: {
          action: 'create',
        },
      })
      
      return NextResponse.json(
        { error: 'Only administrators can create access rules' },
        { status: 403 }
      )
    }
    
    const body = await request.json()
    const data = createRuleSchema.parse(body)
    
    const rule = await prisma.accessRule.create({
      data: {
        name: data.name,
        description: data.description,
        ruleType: data.ruleType,
        allowedStartTime: data.allowedStartTime || null,
        allowedEndTime: data.allowedEndTime || null,
        allowedDays: data.allowedDays || null,
        allowedLocations: data.allowedLocations || null,
        allowedDevices: data.allowedDevices || null,
        attributeConditions: data.attributeConditions || null,
        targetType: data.targetType,
        targetId: data.targetId,
        priority: data.priority,
        isActive: data.isActive,
      },
    })
    
    await createAuditLog({
      userId: payload.userId,
      action: 'ACCESS_RULE_CREATED',
      resourceType: 'access_rule',
      resourceId: rule.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        ruleName: rule.name,
        ruleType: rule.ruleType,
      },
    })
    
    return NextResponse.json({
      rule,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create access rule', message: error.message },
      { status: 500 }
    )
  }
}

