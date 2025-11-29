import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth/jwt'
import { checkMACAccess } from '@/lib/access-control/mac'
import { checkDocumentPermission, isDocumentOwner } from '@/lib/access-control/dac'
import { checkRolePermission } from '@/lib/access-control/rbac'
import { checkAccessRules } from '@/lib/access-control/ruac'
import { checkABACAccess } from '@/lib/access-control/abac'
import { createAuditLog } from '@/lib/audit/logger'
import { detectDeviceType } from '@/lib/utils/device-detection'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const document = await prisma.document.findUnique({
      where: { id: params.id },
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
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Check if user is employee or manager
    const isEmployee = userRoles.some(ur => ur.role.name === 'Employee')
    const isManager = userRoles.some(ur => ur.role.name === 'Manager')
    
    // Check DAC access (owner or explicit permission)
    const isOwner = await isDocumentOwner(document.id, user.id)
    const hasPermission = await checkDocumentPermission(document.id, user.id, 'read')
    
    // Log access check details
    console.log('🔍 Document access check:', {
      userId: user.id,
      documentId: document.id,
      documentTitle: document.title,
      securityLabel: document.securityLabel,
      classification: document.classification,
      isAdmin,
      isManager,
      isEmployee,
      isOwner,
      hasPermission,
      ownerId: document.ownerId,
    })
    
    // STRICT ACCESS POLICY: MAC is mandatory and must be checked FIRST
    // System-determined access policies take precedence over user discretion
    // DAC permissions only work if MAC clearance allows access
    
    // Determine if document is PUBLIC (needed for access method logging)
    const isPublicDocument = document.securityLabel === 'PUBLIC' && document.classification === 'PUBLIC'
    
    // Check if document owner is an employee (for managers to access employee documents)
    let ownerIsEmployee = false
    if (isManager && !isOwner && !hasPermission) {
      const ownerRoles = await prisma.userRole.findMany({
        where: {
          userId: document.ownerId,
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
      ownerIsEmployee = ownerRoles.some(ur => ur.role.name === 'Employee')
    }
    
    // Determine access permissions (needed for RuBAC/ABAC bypass logic)
    const canAccessAsEmployee = isEmployee && (isPublicDocument || isOwner || hasPermission)
    const canAccessAsManager = isManager && (isOwner || hasPermission || ownerIsEmployee)
    
    // Administrators bypass all checks - they can access any document
    if (isAdmin) {
      console.log('✅ Admin accessing document - bypassing all checks (system administrator privilege)')
    } else {
      // For all non-admins: MAC is MANDATORY - must pass before any other checks
      console.log('🔍 Enforcing strict MAC policy - system-determined access:', {
        userSecurityLabel: user.securityLabel,
        userClearanceLevel: user.clearanceLevel,
        documentSecurityLabel: document.securityLabel,
        documentClassification: document.classification,
      })
      
      const macAllowed = checkMACAccess(
        user.securityLabel as any,
        user.clearanceLevel,
        document.securityLabel as any,
        document.classification as any
      )
      
      if (!macAllowed) {
        console.log('❌ Access denied - MAC clearance insufficient (strict policy enforcement)')
        await createAuditLog({
          userId: user.id,
          action: 'DOCUMENT_ACCESS_DENIED',
          resourceType: 'document',
          resourceId: document.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          details: {
            reason: 'MAC access denied - insufficient security clearance (system-determined policy)',
            userSecurityLabel: user.securityLabel,
            userClearanceLevel: user.clearanceLevel,
            documentSecurityLabel: document.securityLabel,
            documentClassification: document.classification,
          },
        })
        
        return NextResponse.json(
          { 
            error: 'Access denied: Insufficient security clearance. Access is determined by system policies based on your security clearance level, not user discretion.',
            systemPolicy: 'MAC (Mandatory Access Control) enforcement',
            requiredClearance: `${document.securityLabel} / ${document.classification}`,
            yourClearance: `${user.securityLabel} / Level ${user.clearanceLevel}`,
          },
          { status: 403 }
        )
      }
      
      console.log('✅ MAC check passed - proceeding with additional access checks')
      
      // After MAC passes, check DAC (ownership/permissions) and role-based access
      
      // Check DAC access (only if MAC passed)
      if (isEmployee && !canAccessAsEmployee) {
        console.log('❌ Access denied - Employee DAC check failed (MAC passed but no permission):', {
          isPublicDocument,
          isOwner,
          hasPermission,
          documentSecurityLabel: document.securityLabel,
          documentClassification: document.classification,
        })
        await createAuditLog({
          userId: user.id,
          action: 'DOCUMENT_ACCESS_DENIED',
          resourceType: 'document',
          resourceId: document.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          details: {
            reason: 'Employee can only access PUBLIC documents, documents they own, or documents with explicit permission (MAC passed)',
            macPassed: true,
            isOwner,
            hasPermission,
            isPublicDocument,
            documentSecurityLabel: document.securityLabel,
            documentClassification: document.classification,
          },
        })
        
        return NextResponse.json(
          { 
            error: 'Access denied: Employees can only access PUBLIC documents, documents they own, or documents they have been granted permission for. MAC clearance passed, but no permission granted.',
            systemPolicy: 'MAC + DAC enforcement',
            documentSecurityLabel: document.securityLabel,
            documentClassification: document.classification,
            isPublicDocument,
          },
          { status: 403 }
        )
      }
      
      if (!isEmployee && !isManager && !isOwner && !hasPermission) {
        console.log('❌ Access denied - DAC check failed (MAC passed but no permission):', {
          isOwner,
          hasPermission,
        })
        await createAuditLog({
          userId: user.id,
          action: 'DOCUMENT_ACCESS_DENIED',
          resourceType: 'document',
          resourceId: document.id,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
          details: {
            reason: 'DAC access denied - no permission (MAC passed)',
            macPassed: true,
            isOwner,
            hasPermission,
          },
        })
        
        return NextResponse.json(
          { 
            error: 'Access denied: No permission to access this document. MAC clearance passed, but explicit permission required.',
            systemPolicy: 'MAC + DAC enforcement',
          },
          { status: 403 }
        )
      }
      
      console.log('✅ DAC check passed - access granted (MAC + DAC both passed)')
    }
    
    // MAC check already performed above - strict policy enforcement complete
    
    // Check RuBAC rules (admins and managers with ownership/permission bypass)
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const deviceType = detectDeviceType(userAgent)
    
    const context = {
      userId: user.id,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      deviceType,
      location: ipAddress,
    }
    
    // Managers who own documents or have permission bypass RuBAC (similar to MAC)
    const shouldCheckRuBAC = !isAdmin && !canAccessAsManager
    
    let ruleAllowed = true
    if (shouldCheckRuBAC) {
      console.log('🔍 Checking RuBAC rules:', { documentId: document.id, context })
      ruleAllowed = await checkAccessRules('document', document.id, context)
      console.log('RuBAC check result:', ruleAllowed)
    } else {
      console.log('✅ Bypassing RuBAC check (admin or manager with access)')
    }
    
    if (!ruleAllowed) {
      console.log('❌ Access denied - RuBAC check failed')
      const { userId, ...contextWithoutUserId } = context
      await createAuditLog({
        userId: user.id,
        action: 'DOCUMENT_ACCESS_DENIED',
        resourceType: 'document',
        resourceId: document.id,
        ...contextWithoutUserId,
        details: {
          reason: 'Rule-based access denied',
        },
      })
      
      return NextResponse.json(
        { error: 'Access denied: Rule violation' },
        { status: 403 }
      )
    }
    
    // Check ABAC policies (admins and managers with ownership/permission bypass)
    // Managers who own documents or have permission bypass ABAC (similar to MAC and RuBAC)
    const shouldCheckABAC = !isAdmin && !canAccessAsManager
    
    let abacAllowed = true
    if (shouldCheckABAC) {
      console.log('🔍 Checking ABAC policies:', { userId: user.id, documentId: document.id })
      abacAllowed = await checkABACAccess(
        user.id,
        'document',
        document.id,
        'read',
        context
      )
      console.log('ABAC check result:', abacAllowed)
    } else {
      console.log('✅ Bypassing ABAC check (admin or manager with access)')
    }
    
    if (!abacAllowed) {
      console.log('❌ Access denied - ABAC check failed')
      const { userId, ...contextWithoutUserId } = context
      await createAuditLog({
        userId: user.id,
        action: 'DOCUMENT_ACCESS_DENIED',
        resourceType: 'document',
        resourceId: document.id,
        ...contextWithoutUserId,
        details: {
          reason: 'Attribute-based access denied',
        },
      })
      
      return NextResponse.json(
        { error: 'Access denied: Policy violation' },
        { status: 403 }
      )
    }
    
    // All checks passed - allow access
    // Check if this is a shared resource (user has permission but is not owner)
    // Note: isOwner and hasPermission are already checked above
    const isSharedResource = !isOwner && hasPermission
    
    const { userId: _, ...contextWithoutUserId } = context
    await createAuditLog({
      userId: user.id,
      action: 'DOCUMENT_ACCESSED',
      resourceType: 'document',
      resourceId: document.id,
      ...contextWithoutUserId,
      details: {
        documentTitle: document.title,
        documentOwner: document.owner.username,
        isOwner: isOwner,
        isSharedResource: isSharedResource,
        accessMethod: isAdmin ? 'admin' : isOwner ? 'owner' : hasPermission ? 'permission_granted' : isPublicDocument ? 'public_access' : 'unknown',
        securityLabel: document.securityLabel,
        classification: document.classification,
      },
    })
    
    return NextResponse.json({
      document,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch document', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Check user roles
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
    const isEmployee = userRoles.some(ur => ur.role.name === 'Employee')
    const isManager = userRoles.some(ur => ur.role.name === 'Manager')
    
    // Employees cannot delete documents - block them immediately
    if (isEmployee) {
      await createAuditLog({
        userId: payload.userId,
        action: 'PERMISSION_DENIED',
        resourceType: 'document',
        resourceId: params.id,
        details: {
          action: 'delete',
          reason: 'Employee role cannot delete documents',
        },
      })
      
      return NextResponse.json(
        { error: 'Employees are not allowed to delete documents' },
        { status: 403 }
      )
    }
    
    // Get document to check owner
    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })
    
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }
    
    // Check if document owner is an employee
    const ownerRoles = await prisma.userRole.findMany({
      where: {
        userId: document.ownerId,
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
    
    const ownerIsEmployee = ownerRoles.some(ur => ur.role.name === 'Employee')
    
    // Administrators can delete any document
    if (isAdmin) {
      // Admin can delete - proceed
    } else if (isManager) {
      // Managers can delete:
      // 1. Documents they own (always allowed)
      // 2. Documents created by employees (always allowed)
      // 3. Documents they have explicit delete permission for
      const isOwner = document.ownerId === payload.userId
      const hasDeletePermission = await checkDocumentPermission(params.id, payload.userId, 'delete')
      
      // Allow if: owner OR employee document OR has permission
      const canDelete = isOwner || ownerIsEmployee || hasDeletePermission
      
      if (!canDelete) {
        await createAuditLog({
          userId: payload.userId,
          action: 'PERMISSION_DENIED',
          resourceType: 'document',
          resourceId: params.id,
          details: {
            action: 'delete',
            reason: 'Manager can only delete own documents or documents created by employees',
            documentOwner: document.owner.username,
            ownerIsEmployee,
            isOwner,
            hasDeletePermission,
          },
        })
        
        return NextResponse.json(
          { error: 'Managers can only delete documents they own or documents created by employees' },
          { status: 403 }
        )
      }
      
      // Log successful permission check
      console.log('✅ Manager delete permission granted:', {
        isOwner,
        ownerIsEmployee,
        hasDeletePermission,
        documentOwner: document.owner.username,
      })
    } else {
      // Other roles - check permissions
      const isOwner = await isDocumentOwner(params.id, payload.userId)
      const hasDeletePermission = await checkDocumentPermission(params.id, payload.userId, 'delete')
      
      if (!isOwner || !hasDeletePermission) {
        await createAuditLog({
          userId: payload.userId,
          action: 'PERMISSION_DENIED',
          resourceType: 'document',
          resourceId: params.id,
          details: {
            action: 'delete',
          },
        })
        
        return NextResponse.json(
          { error: 'Only administrators or document owners can delete documents' },
          { status: 403 }
        )
      }
    }
    
    // Document already fetched above, use it for audit
    
    // Delete document
    await prisma.document.delete({
      where: { id: params.id },
    })
    
    await createAuditLog({
      userId: payload.userId,
      action: 'DOCUMENT_DELETED',
      resourceType: 'document',
      resourceId: params.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      details: {
        title: document.title,
        deletedBy: payload.userId,
        deletedByRole: isAdmin ? 'Administrator' : isManager ? 'Manager' : 'Other',
        documentOwner: document.owner.username,
        ownerWasEmployee: ownerIsEmployee,
        deletionReason: isManager && ownerIsEmployee ? 'Manager deleted employee document' : undefined,
      },
    })
    
    return NextResponse.json({
      message: 'Document deleted successfully',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to delete document', message: error.message },
      { status: 500 }
    )
  }
}
