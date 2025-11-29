'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Document {
  id: string
  title: string
  content: string | null
  securityLabel: string
  classification: string
  owner: {
    id: string
    username: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function DocumentView() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string
  const [document, setDocument] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [canDelete, setCanDelete] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchDocument()
    fetchUserRoles()
    fetchCurrentUser()
  }, [documentId])

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentUserId(data.user?.id || null)
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error)
    }
  }

  const fetchUserRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/users/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const roleNames = data.roles?.map((r: any) => r.name) || []
        setUserRoles(roleNames)
        
        // Employees cannot delete documents
        const isEmployee = roleNames.includes('Employee')
        const isAdminRole = roleNames.includes('Administrator')
        const isManager = roleNames.includes('Manager')
        
        setIsAdmin(isAdminRole)
        
        // Only admins and managers (for their own documents) can delete
        setCanDelete(!isEmployee && (isAdminRole || isManager))
        
        // Debug logging
        console.log('Document view - User roles:', roleNames)
        console.log('Document view - Can delete:', !isEmployee && (isAdminRole || isManager))
        console.log('Document view - isAdmin:', isAdminRole, 'isManager:', isManager, 'isEmployee:', isEmployee)
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error)
    }
  }

  const fetchDocument = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch(`/api/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch document')
      }

      setDocument(data.document)
      
      // Check if current user is the owner (need to fetch current user first)
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      if (userResponse.ok) {
        const userData = await userResponse.json()
        if (userData.user?.id === data.document.owner.id) {
          setIsOwner(true)
          setCurrentUserId(userData.user.id)
        }
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/documents/${documentId}`, {
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
      router.push('/dashboard')
    } catch (err: any) {
      alert(err.message || 'Failed to delete document')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading document...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                  Document Access System
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <h2 className="font-semibold mb-2">Access Denied</h2>
            <p>{error}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                Document Access System
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">{document.title}</h1>
            
            <div className="flex gap-4 text-sm text-gray-600 mb-4">
              <div>
                <span className="font-medium">Security Label:</span>{' '}
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {document.securityLabel}
                </span>
              </div>
              <div>
                <span className="font-medium">Classification:</span>{' '}
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                  {document.classification}
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p><span className="font-medium">Owner:</span> {document.owner.username} ({document.owner.email})</p>
              <p><span className="font-medium">Created:</span> {new Date(document.createdAt).toLocaleString()}</p>
              <p><span className="font-medium">Last Updated:</span> {new Date(document.updatedAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Content</h2>
            <div className="prose max-w-none">
              {document.content ? (
                <p className="whitespace-pre-wrap text-gray-700">{document.content}</p>
              ) : (
                <p className="text-gray-500 italic">No content provided</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t flex gap-4 items-center">
            {/* Only show "Manage Permissions" button to system administrators */}
            {isAdmin ? (
              <Link
                href={`/dashboard/documents/${documentId}/permissions`}
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Permissions (Admin Only)
              </Link>
            ) : (
              <p className="text-sm text-gray-500 italic">
                Only system administrators can manage permissions
              </p>
            )}
            {(canDelete || (!userRoles.includes('Employee') && (userRoles.includes('Manager') || userRoles.includes('Administrator')))) && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting...' : 'Delete Document'}
              </button>
            )}
            {userRoles.includes('Employee') && (
              <p className="text-sm text-gray-500 italic">
                Employees cannot delete documents
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

