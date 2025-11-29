'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Permission {
  id: string
  user: {
    id: string
    username: string
    email: string
  }
  canRead: boolean
  canWrite: boolean
  canDelete: boolean
  canShare: boolean
  grantedAt: string
  expiresAt: string | null
  isActive: boolean
}

export default function DocumentPermissions() {
  const router = useRouter()
  const params = useParams()
  const documentId = params.id as string
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [accessDenied, setAccessDenied] = useState(false)
  const [grantForm, setGrantForm] = useState({
    userId: '',
    canRead: false,
    canWrite: false,
    canDelete: false,
    canShare: false,
  })

  useEffect(() => {
    fetchPermissions()
    fetchUsers()
  }, [documentId])

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch(`/api/documents/${documentId}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPermissions(data.permissions || [])
        setIsAdmin(true)
        setAccessDenied(false)
      } else {
        const errorData = await response.json()
        if (response.status === 403) {
          setAccessDenied(true)
          setIsAdmin(false)
        }
      }
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
      setAccessDenied(true)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleGrantPermission = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/documents/${documentId}/permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(grantForm),
      })

      if (response.ok) {
        setShowGrantForm(false)
        setGrantForm({
          userId: '',
          canRead: false,
          canWrite: false,
          canDelete: false,
          canShare: false,
        })
        fetchPermissions()
        alert('Permission granted successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to grant permission')
      }
    } catch (error) {
      alert('Failed to grant permission')
    }
  }

  const handleRevokePermission = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to revoke permissions for "${username}"?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/documents/${documentId}/permissions?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('Permission revoked successfully')
        fetchPermissions()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to revoke permission')
      }
    } catch (error) {
      alert('Failed to revoke permission')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
              <Link href="/dashboard" className="text-xl font-bold text-gray-800">
                Document Access System
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/dashboard/documents/${documentId}`}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back to Document
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {accessDenied ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="mb-4">
              Only system administrators can manage permissions. This restriction maintains data integrity and confidentiality.
            </p>
            <Link
              href={`/dashboard/documents/${documentId}`}
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Document
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Document Permissions (Admin Only)</h1>
              {isAdmin && (
                <button
                  onClick={() => setShowGrantForm(!showGrantForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showGrantForm ? 'Cancel' : 'Grant Permission'}
                </button>
              )}
            </div>

            {!isAdmin && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4">
                <p className="text-sm">
                  <strong>Note:</strong> Only system administrators can manage permissions. If you need to grant permissions, contact a system administrator.
                </p>
              </div>
            )}

            {showGrantForm && isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Grant Permission to User</h2>
            <form onSubmit={handleGrantPermission} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <select
                  required
                  value={grantForm.userId}
                  onChange={(e) => setGrantForm({ ...grantForm, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={grantForm.canRead}
                    onChange={(e) => setGrantForm({ ...grantForm, canRead: e.target.checked })}
                    className="mr-2"
                  />
                  Can Read
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={grantForm.canWrite}
                    onChange={(e) => setGrantForm({ ...grantForm, canWrite: e.target.checked })}
                    className="mr-2"
                  />
                  Can Write
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={grantForm.canDelete}
                    onChange={(e) => setGrantForm({ ...grantForm, canDelete: e.target.checked })}
                    className="mr-2"
                  />
                  Can Delete
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={grantForm.canShare}
                    onChange={(e) => setGrantForm({ ...grantForm, canShare: e.target.checked })}
                    className="mr-2"
                  />
                  Can Share
                </label>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Grant Permission
              </button>
            </form>
          </div>
            )}

            {isAdmin && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Read
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Write
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Delete
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Granted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No permissions granted yet. Only the owner has access.
                  </td>
                </tr>
              ) : (
                permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {permission.user.username}
                        </div>
                        <div className="text-sm text-gray-500">{permission.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {permission.canRead ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {permission.canWrite ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {permission.canDelete ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {permission.canShare ? (
                        <span className="text-green-600">✓</span>
                      ) : (
                        <span className="text-gray-400">✗</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(permission.grantedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {permission.isActive ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Inactive
                          </span>
                        )}
                        {isAdmin && permission.isActive && (
                          <button
                            onClick={() => handleRevokePermission(permission.user.id, permission.user.username)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
            )}

            {isAdmin && (
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">About Discretionary Access Control (DAC)</h3>
                <p className="text-sm text-blue-800">
                  As a system administrator, you can grant or revoke permissions to other users. This maintains data integrity and confidentiality. 
                  Discretionary Access Control where resource owners control access to their resources.
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

