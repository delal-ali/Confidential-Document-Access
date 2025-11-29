'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Role {
  id: string
  name: string
  description: string | null
  permissions: {
    permission: {
      id: string
      name: string
      resource: string
      action: string
    }
  }[]
}

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
  })
  const [permissions, setPermissions] = useState<any[]>([])
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchUserRoles()
    fetchRoles()
    fetchPermissions()
  }, [])

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
        setIsAdmin(roleNames.includes('Administrator'))
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error)
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to fetch roles'}`)
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token')
      // Fetch all permissions (you may need to create this endpoint)
      // For now, we'll use a hardcoded list
      const allPermissions = [
        { id: '1', name: 'document:create', resource: 'document', action: 'create' },
        { id: '2', name: 'document:read', resource: 'document', action: 'read' },
        { id: '3', name: 'document:write', resource: 'document', action: 'write' },
        { id: '4', name: 'document:delete', resource: 'document', action: 'delete' },
        { id: '5', name: 'role:create', resource: 'role', action: 'create' },
        { id: '6', name: 'role:read', resource: 'role', action: 'read' },
        { id: '7', name: 'role:assign', resource: 'role', action: 'assign' },
        { id: '8', name: 'audit:read', resource: 'audit', action: 'read' },
        { id: '9', name: 'user:read', resource: 'user', action: 'read' },
      ]
      setPermissions(allPermissions)
    } catch (error) {
      console.error('Failed to fetch permissions:', error)
    }
  }

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete role "${roleName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingRoleId(roleId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete role')
      }

      alert(`Role "${roleName}" deleted successfully`)
      fetchRoles()
    } catch (err: any) {
      alert(err.message || 'Failed to delete role')
    } finally {
      setDeletingRoleId(null)
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
                href="/dashboard"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Roles Management</h1>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showCreateForm ? 'Cancel' : 'Create New Role'}
            </button>
          )}
        </div>

        {showCreateForm && isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create New Role</h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              if (!newRole.name.trim()) {
                alert('Please enter a role name')
                return
              }

              try {
                const token = localStorage.getItem('token')
                const response = await fetch('/api/roles', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    name: newRole.name.trim(),
                    description: newRole.description || '',
                    permissionIds: [], // Start with no permissions, can be assigned later
                  }),
                })

                const data = await response.json()

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to create role')
                }

                alert(`Role "${newRole.name}" created successfully!`)
                setNewRole({ name: '', description: '' })
                setShowCreateForm(false)
                fetchRoles()
              } catch (err: any) {
                alert(err.message || 'Failed to create role')
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Auditor, HR Manager"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Role description..."
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Role
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewRole({ name: '', description: '' })
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="grid gap-6">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{role.name}</h3>
                  {role.description && (
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  )}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      const isDefault = ['Administrator', 'Manager', 'Employee'].includes(role.name)
                      if (isDefault) {
                        if (!confirm(`Warning: "${role.name}" is a default system role. Are you sure you want to delete it? This action cannot be undone.`)) {
                          return
                        }
                      }
                      handleDeleteRole(role.id, role.name)
                    }}
                    disabled={deletingRoleId === role.id}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingRoleId === role.id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions:</h4>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.length === 0 ? (
                    <span className="text-sm text-gray-500">No permissions assigned</span>
                  ) : (
                    role.permissions.map((rp) => (
                      <span
                        key={rp.permission.id}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                      >
                        {rp.permission.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About Roles</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Administrator:</strong> Full system access</li>
            <li>• <strong>Manager:</strong> Can create documents, view roles (read-only)</li>
            <li>• <strong>Employee:</strong> Can only read documents</li>
            <li>• Roles determine what actions users can perform (RBAC)</li>
            <li>• Only Administrators can create, modify, and assign roles</li>
            {!isAdmin && (
              <li className="mt-2 text-blue-900 font-semibold">• You are viewing roles in read-only mode</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}

