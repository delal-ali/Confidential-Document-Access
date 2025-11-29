import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkMACAccess } from '@/lib/access-control/mac'
import { checkDocumentPermission, isDocumentOwner } from '@/lib/access-control/dac'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { checkAccessRules } from '@/lib/access-control/ruac'
import { checkABACAccess } from '@/lib/access-control/abac'
import { createAuditLog } from '@/lib/audit/logger'
import { z } from 'zod'

const createDocumentSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
  securityLabel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'TOP_SECRET']).default('PUBLIC'),
  classification: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL']).default('PUBLIC'),
  department: z.string().optional(), // Department for ABAC fine-grained control
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
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Get user roles to check if employee
    const userRoles = await prisma.userRole.findMany({
      where: {
        userId: user.id,
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
    
    console.log('🔍 User roles for document listing:', {
      userId: user.id,
      username: user.username,
      userRolesCount: userRoles.length,
      userRoles: userRoles.map(ur => ({ roleName: ur.role.name, isActive: ur.isActive })),
    })
    
    const isAdmin = userRoles.some(ur => ur.role.name === 'Administrator')
    const isManager = userRoles.some(ur => ur.role.name === 'Manager')
    const isEmployee = userRoles.some(ur => ur.role.name === 'Employee')
    
    // If user has no roles, log a warning but continue (they'll only see their own documents)
    if (userRoles.length === 0) {
      console.warn('⚠️ User has no active roles assigned:', {
        userId: user.id,
        username: user.username,
      })
    }
    
    // Administrators can see ALL documents
    if (isAdmin) {
      const allDocuments = await prisma.document.findMany({
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })
      
      await createAuditLog({
        userId: user.id,
        action: 'DOCUMENTS_LISTED',
        resourceType: 'document',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      })
      
      return NextResponse.json({
        documents: allDocuments,
      })
    }
    
    // For non-admins: Build query conditions
    const whereConditions: any[] = [
      // Documents user owns
      { ownerId: user.id },
      // Documents user has explicit permission for
      {
        permissions: {
          some: {
            userId: user.id,
            isActive: true,
            canRead: true,
          },
        },
      },
    ]
    
    // Managers can see documents created by employees
    if (isManager) {
      try {
        // Get all employee user IDs
        const employeeRole = await prisma.role.findUnique({
          where: { name: 'Employee' },
          include: {
            userRoles: {
              where: {
                isActive: true,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } },
                ],
              },
              select: {
                userId: true,
              },
            },
          },
        })
        
        if (employeeRole && employeeRole.userRoles && employeeRole.userRoles.length > 0) {
          const employeeUserIds = employeeRole.userRoles.map(ur => ur.userId)
          whereConditions.push({
            ownerId: {
              in: employeeUserIds,
            },
          })
        }
      } catch (error) {
        console.error('Error fetching employee role:', error)
        // Continue without employee documents filter if there's an error
      }
    }
    
    // Employees can see:
    // 1. Documents they have explicit permission for (owner-granted)
    // 2. PUBLIC documents (system-granted access - all employees can see PUBLIC)
    
    if (isEmployee) {
      whereConditions.push({
        securityLabel: 'PUBLIC',
        classification: 'PUBLIC',
      })
    }
    
    // Get documents user owns or has permission for (or PUBLIC for employees, or employee documents for managers)
    const documents = await prisma.document.findMany({
      where: {
        OR: whereConditions,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        permissions: {
          where: {
            userId: user.id,
            isActive: true,
          },
          select: {
            canRead: true,
            canWrite: true,
            canDelete: true,
            canShare: true,
          },
        },
      },
    })
    
    // STRICT ACCESS POLICY: MAC is mandatory and must be checked FIRST
    // System-determined access policies take precedence over user discretion
    // DAC permissions only work if MAC clearance allows access
    const accessibleDocuments = documents.filter(doc => {
      try {
        // Ensure user has valid security label and clearance level (default to PUBLIC if missing)
        const userSecurityLabel = (user.securityLabel || 'PUBLIC') as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET'
        const userClearanceLevel = user.clearanceLevel ?? 0
        const docSecurityLabel = (doc.securityLabel || 'PUBLIC') as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'TOP_SECRET'
        const docClassification = (doc.classification || 'PUBLIC') as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL'
        
        // Step 1: MANDATORY MAC check - system-determined access policy
        const macAllowed = checkMACAccess(
          userSecurityLabel,
          userClearanceLevel,
          docSecurityLabel,
          docClassification
        )
        
        // If MAC fails, access is denied regardless of permissions
        if (!macAllowed) {
          return false
        }
        
        // Step 2: After MAC passes, check DAC (permissions) and role-based access
        // Employees can access:
        // 1. PUBLIC documents (system-granted, MAC passed) - ALWAYS allowed
        // 2. Documents they own
        // 3. Documents they have explicit permission for (if MAC allows)
        if (isEmployee) {
          const isPublic = doc.securityLabel === 'PUBLIC' && doc.classification === 'PUBLIC'
          if (isPublic) {
            // PUBLIC documents are always accessible to employees (after MAC passes)
            console.log('✅ Employee accessing PUBLIC document - access granted:', {
              documentId: doc.id,
              documentTitle: doc.title,
              securityLabel: doc.securityLabel,
              classification: doc.classification,
            })
            return true
          }
          
          // For non-PUBLIC documents, check ownership or explicit permission
          const isOwner = doc.ownerId === user.id
          // Permissions array is already filtered to only include this user's permissions
          const hasExplicitPermission = doc.permissions && Array.isArray(doc.permissions) && doc.permissions.length > 0 && 
            doc.permissions.some((p: any) => p && p.canRead === true)
          
          if (isOwner || hasExplicitPermission) {
            console.log('✅ Employee accessing document with permission:', {
              documentId: doc.id,
              isOwner,
              hasExplicitPermission,
            })
            return true
          }
          
          console.log('❌ Employee cannot access document:', {
            documentId: doc.id,
            isPublic,
            isOwner,
            hasExplicitPermission,
            permissionsCount: doc.permissions?.length || 0,
          })
          return false
        }
        
        // For managers and others: MAC passed, check ownership/permissions
        // Documents in the list already passed ownership/permission filters (whereConditions)
        // So if MAC passed, access is granted
        return true
      } catch (error) {
        console.error('Error filtering document:', error, {
          documentId: doc.id,
          documentTitle: doc.title,
        })
        // On error, deny access for safety
        return false
      }
    })
    
    await createAuditLog({
      userId: user.id,
      action: 'DOCUMENTS_LISTED',
      resourceType: 'document',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    })
    
    return NextResponse.json({
      documents: accessibleDocuments,
    })
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch documents', 
        message: error.message || 'Unknown error occurred',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
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
    
    // Check roles - case-insensitive comparison to handle any variations
    const roleNames = userRoles.map(ur => ur.role.name)
    const isAdmin = roleNames.some(name => name.toLowerCase() === 'administrator')
    const isManager = roleNames.some(name => name.toLowerCase() === 'manager')
    const isEmployee = roleNames.some(name => name.toLowerCase() === 'employee')
    
    // Log role detection for debugging
    console.log('🔍 User roles detected:', {
      userId: payload.userId,
      roles: roleNames,
      isAdmin,
      isManager,
      isEmployee,
      rawRoles: userRoles.map(ur => ({ id: ur.role.id, name: ur.role.name, isActive: ur.isActive })),
    })
    
    // All authenticated users (Administrators, Managers, and Employees) can create documents
    // Employees can create documents, but they will be viewable by Managers and Administrators
    console.log('✅ User authorized to create documents:', {
      isAdmin,
      isManager,
      isEmployee,
      roles: roleNames,
    })
    
    const body = await request.json()
    
    // Log for debugging
    console.log('Document creation request:', {
      userId: payload.userId,
      isAdmin,
      isManager,
      securityLabel: body.securityLabel,
      classification: body.classification,
      userRoles: userRoles.map(ur => ur.role.name),
    })
    
    // Validate and parse request data
    let data
    try {
      data = createDocumentSchema.parse(body)
    } catch (validationError: any) {
      console.error('Validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation error', 
            details: validationError.errors,
            message: `Invalid input: ${validationError.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
          },
          { status: 400 }
        )
      }
      throw validationError
    }
    
    // All users (Administrators, Managers, and Employees) can create documents
    // Administrators and Managers can create documents with any security label and classification
    // Employees can create documents with any security label and classification
    // MAC is enforced during document access, not creation
    if (isAdmin) {
      console.log('✅ Admin creating document - bypassing all MAC restrictions')
      console.log('✅ Admin can create document with:', {
        securityLabel: data.securityLabel,
        classification: data.classification,
      })
    } else if (isManager) {
      console.log('✅✅✅ Manager creating document - bypassing all MAC restrictions ✅✅✅')
      console.log('✅ Manager can create document with ANY security label and classification:', {
        securityLabel: data.securityLabel,
        classification: data.classification,
        title: data.title,
      })
      console.log('✅ Manager bypass confirmed - proceeding with document creation')
    } else if (isEmployee) {
      console.log('✅✅✅ Employee creating document ✅✅✅')
      console.log('✅ Employee can create document with any security label and classification:', {
        securityLabel: data.securityLabel,
        classification: data.classification,
        title: data.title,
        userId: payload.userId,
      })
      console.log('✅ Employee document creation confirmed - proceeding with document creation')
    } else {
      // For other roles, allow creation but MAC will be enforced on access
      console.log('User creating document - MAC will be enforced on access')
    }
    
    // Create document - all authenticated users can create documents
    // Employees can create documents, and they will be viewable by Managers and Administrators
    let document
    try {
      // Prepare document data, conditionally including department
      const documentData: any = {
        title: data.title,
        content: data.content,
        fileName: data.fileName,
        filePath: data.filePath,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        securityLabel: data.securityLabel,
        classification: data.classification,
        ownerId: payload.userId,
      }
      
      // Only include department if it's provided and Prisma client supports it
      if (data.department !== undefined && data.department !== null && data.department !== '') {
        documentData.department = data.department
      }
      
      document = await prisma.document.create({
        data: documentData,
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })
      console.log('✅ Document created successfully:', document.id)
    } catch (dbError: any) {
      console.error('❌ Database error creating document:', dbError)
      console.error('❌ Error details:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
      })
      
      // Check if error is about unknown field (Prisma client not regenerated)
      if (dbError.message && dbError.message.includes('Unknown argument')) {
        return NextResponse.json(
          { 
            error: 'Database schema out of sync', 
            message: 'The Prisma client needs to be regenerated. Please restart your development server (stop and run "npm run dev" again).',
            details: dbError.message
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create document in database', 
          message: dbError.message,
          details: 'Check server logs for more information'
        },
        { status: 500 }
      )
    }
    
    await createAuditLog({
      userId: payload.userId,
      action: 'DOCUMENT_CREATED',
      resourceType: 'document',
      resourceId: document.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        title: document.title,
        securityLabel: document.securityLabel,
        classification: document.classification,
        createdByAdmin: isAdmin,
        createdByManager: isManager,
        createdByEmployee: isEmployee,
        adminBypass: isAdmin ? 'Administrator bypassed MAC restrictions' : undefined,
        managerBypass: isManager ? 'Manager bypassed MAC restrictions' : undefined,
        employeeCreated: isEmployee ? 'Employee created document - viewable by Managers and Administrators' : undefined,
      },
    })
    
    return NextResponse.json({
      document,
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error', 
          details: error.errors,
          message: `Invalid input: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        },
        { status: 400 }
      )
    }
    
    // Log the full error for debugging
    console.error('Document creation error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create document', 
        message: error.message || 'Unknown error occurred',
        details: error.stack
      },
      { status: 500 }
    )
  }
}

