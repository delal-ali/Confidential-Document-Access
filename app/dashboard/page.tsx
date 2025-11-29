'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Document {
  id: string
  title: string
  content?: string | null
  securityLabel: string
  classification: string
  owner: {
    id: string
    username: string
    email: string
  }
  createdAt: string
}

interface DeletePermission {
  canDelete: boolean
  reason: string
  isOwner?: boolean
  ownerIsEmployee?: boolean
  hasDeletePermission?: boolean
}

export default function Dashboard() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [canViewUsers, setCanViewUsers] = useState(false)
  const [canViewAudit, setCanViewAudit] = useState(false)
  const [canCreateDoc, setCanCreateDoc] = useState(false)
  const [canViewRoles, setCanViewRoles] = useState(false)
  const [canViewAccessRules, setCanViewAccessRules] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null)
  const [canDeleteDocs, setCanDeleteDocs] = useState(false)
  const [documentDeletePermissions, setDocumentDeletePermissions] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
      return
    }

    fetchUser()
    fetchDocuments()
  }, [])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        
        // Fetch user roles to check permissions
        const rolesResponse = await fetch('/api/users/roles', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        
        if (rolesResponse.ok) {
          const rolesData = await rolesResponse.json()
          const roleNames = rolesData.roles?.map((r: any) => r.name) || []
          setUserRoles(roleNames)
          
          // Check if user is admin
          const isAdmin = roleNames.includes('Administrator')
          const isManager = roleNames.includes('Manager')
          const isEmployee = roleNames.includes('Employee')
          setCanViewUsers(isAdmin) // Only admins can view users
          setCanViewAudit(isAdmin) // Only admins can view audit logs
          setCanCreateDoc(true) // All authenticated users (Admins, Managers, and Employees) can create docs
          setCanViewRoles(isAdmin || isManager) // Admins and Managers can view roles
          setCanViewAccessRules(true) // All users (including employees) can view access rules (read-only)
          setCanDeleteDocs(!isEmployee && (isAdmin || isManager)) // Employees cannot delete documents
          
          // Debug logging
          console.log('Dashboard - User roles:', roleNames)
          console.log('Dashboard - Can delete docs:', !isEmployee && (isAdmin || isManager))
          console.log('Dashboard - isAdmin:', isAdmin, 'isManager:', isManager, 'isEmployee:', isEmployee)
          console.log('Dashboard - userRoles state:', userRoles)
        }
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const docs = data.documents || []
        setDocuments(docs)
        
        // For managers and admins, show delete buttons
        // Backend will enforce actual permissions
        if (canDeleteDocs && docs.length > 0) {
          // Set all documents as deletable for managers/admins
          // Backend will enforce the actual rules
          const permissions: Record<string, boolean> = {}
          docs.forEach((doc: Document) => {
            permissions[doc.id] = true // Show button, backend will check
          })
          setDocumentDeletePermissions(permissions)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch documents:', errorData)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkDeletePermissions = async (docs: Document[]) => {
    try {
      const token = localStorage.getItem('token')
      const permissions: Record<string, boolean> = {}
      
      // Check permissions for all documents in parallel
      const permissionChecks = docs.map(async (doc) => {
        try {
          const response = await fetch('/api/documents/check-delete-permission', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ documentId: doc.id }),
          })
          
          if (response.ok) {
            const data: DeletePermission = await response.json()
            permissions[doc.id] = data.canDelete
          }
        } catch (error) {
          console.error(`Failed to check permission for document ${doc.id}:`, error)
          permissions[doc.id] = false
        }
      })
      
      await Promise.all(permissionChecks)
      setDocumentDeletePermissions(permissions)
    } catch (error) {
      console.error('Failed to check delete permissions:', error)
    }
  }

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!confirm(`Are you sure you want to delete document "${docTitle}"? This action cannot be undone.`)) {
      return
    }

    setDeletingDocId(docId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete document')
      }

      alert('Document deleted successfully')
      fetchDocuments()
    } catch (err: any) {
      alert(err.message || 'Failed to delete document')
    } finally {
      setDeletingDocId(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">
                Document Access System
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <>
                  <Link
                    href="/dashboard/profile"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {user.username}
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Profile
                  </Link>
                </>
              )}
              {canViewUsers && (
                <Link
                  href="/dashboard/users"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Users
                </Link>
              )}
              {canViewAudit && (
                <Link
                  href="/dashboard/audit-logs"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Audit Logs
                </Link>
              )}
              {canViewRoles && (
                <Link
                  href="/dashboard/roles"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Roles
                </Link>
              )}
              {canViewAccessRules && (
                <Link
                  href="/dashboard/access-rules"
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Access Rules
                </Link>
              )}
              <Link
                href="/dashboard/role-requests"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Role Requests
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
          {canCreateDoc && (
            <Link
              href="/dashboard/documents/new"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
            >
              + Create New Document
            </Link>
          )}
        </div>

        {!canCreateDoc && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              <strong>Note:</strong> You don't have permission to create documents. Contact an administrator to assign you a role with document creation permissions.
            </p>
          </div>
        )}

        {documents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">No documents found</p>
            {canCreateDoc ? (
              <Link
                href="/dashboard/documents/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md hover:shadow-lg"
              >
                + Create Your First Document
              </Link>
            ) : (
              <p className="text-sm text-gray-500">You don't have permission to create documents</p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <Link
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex-1"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        {doc.title}
                      </h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>
                          Security: <span className="font-medium">{doc.securityLabel}</span>
                        </span>
                        <span>
                          Classification: <span className="font-medium">{doc.classification}</span>
                        </span>
                        <span>
                          Owner: <span className="font-medium">{doc.owner.username}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                    {(canDeleteDocs || (!userRoles.includes('Employee') && (userRoles.includes('Manager') || userRoles.includes('Administrator')))) && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteDocument(doc.id, doc.title)
                        }}
                        disabled={deletingDocId === doc.id}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingDocId === doc.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

