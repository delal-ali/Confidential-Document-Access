'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  username: string
  email: string
  firstName: string | null
  lastName: string | null
  department: string | null
  securityLabel: string
  clearanceLevel: number
}

interface Role {
  id: string
  name: string
  description: string | null
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch users:', errorData)
        alert(`Error: ${errorData.error || 'Failed to fetch users'}`)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      alert('Failed to fetch users. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token')
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
        console.error('Failed to fetch roles:', errorData)
        alert(`Error: ${errorData.error || 'Failed to fetch roles'}`)
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      alert('Failed to fetch roles. Check console for details.')
    }
  }

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      alert('Please select both a user and a role')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/assign-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser,
          roleId: selectedRole,
        }),
      })

      if (response.ok) {
        alert('Role assigned successfully!')
        setSelectedUser('')
        setSelectedRole('')
        fetchUsers()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to assign role')
      }
    } catch (error) {
      alert('Failed to assign role')
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone and will delete all their data.`)) {
      return
    }

    setDeletingUserId(userId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user')
      }

      alert(`User "${username}" deleted successfully`)
      fetchUsers()
    } catch (err: any) {
      alert(err.message || 'Failed to delete user')
    } finally {
      setDeletingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  // Debug info
  console.log('Users:', users)
  console.log('Roles:', roles)

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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Assign Role to User</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Choose a user...</option>
                {users.length === 0 ? (
                  <option disabled>No users found</option>
                ) : (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </option>
                  ))
                )}
              </select>
              {users.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No users available. Make sure you're logged in as admin.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Choose a role...</option>
                {roles.length === 0 ? (
                  <option disabled>No roles found</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))
                )}
              </select>
              {roles.length === 0 && (
                <p className="text-xs text-red-500 mt-1">No roles available. Run: npm run db:seed</p>
              )}
            </div>
          </div>
          <button
            onClick={handleAssignRole}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Assign Role
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Security Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Clearance Level
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.username}
                    </div>
                    {(user.firstName || user.lastName) && (
                      <div className="text-sm text-gray-500">
                        {user.firstName} {user.lastName}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.department || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.securityLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.clearanceLevel}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={deletingUserId === user.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingUserId === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Note</h3>
          <p className="text-sm text-yellow-800">
            Users are registered without roles. Roles must be assigned by an Administrator after registration.
            This is a security best practice - users cannot assign themselves roles.
          </p>
        </div>
      </main>
    </div>
  )
}

