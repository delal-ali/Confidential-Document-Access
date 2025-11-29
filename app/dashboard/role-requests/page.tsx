'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Role {
  id: string
  name: string
  description: string | null
}

interface RoleRequest {
  id: string
  user: {
    id: string
    username: string
    email: string
    firstName: string | null
    lastName: string | null
  }
  requestedRole: Role
  reason: string | null
  status: string
  reviewer: {
    id: string
    username: string
    email: string
  } | null
  reviewNotes: string | null
  createdAt: string
  reviewedAt: string | null
}

export default function RoleRequestsPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<RoleRequest[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    requestedRoleId: '',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchRequests()
    fetchRoles()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/users/roles', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const roleNames = data.roles?.map((r: any) => r.name) || []
        setIsAdmin(roleNames.includes('Administrator'))
      }
    } catch (error) {
      console.error('Failed to check admin status:', error)
    }
  }

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/role-requests', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch role requests:', error)
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
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.requestedRoleId) {
      alert('Please select a role')
      return
    }
    
    setSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }
      
      const response = await fetch('/api/role-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          requestedRoleId: formData.requestedRoleId,
          reason: formData.reason || undefined,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        alert('Role change request submitted successfully!')
        setShowForm(false)
        setFormData({ requestedRoleId: '', reason: '' })
        fetchRequests()
      } else {
        console.error('Error response:', data)
        alert(data.error || data.message || 'Failed to submit request')
      }
    } catch (error: any) {
      console.error('Error submitting request:', error)
      alert(`Failed to submit request: ${error.message || 'Unknown error'}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (requestId: string) => {
    if (!confirm('Are you sure you want to cancel this request?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/role-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'CANCEL',
        }),
      })

      if (response.ok) {
        alert('Request cancelled successfully')
        fetchRequests()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel request')
      }
    } catch (error) {
      alert('Failed to cancel request')
    }
  }

  const handleReview = async (requestId: string, action: 'APPROVE' | 'DENY', reviewNotes?: string) => {
    const actionText = action === 'APPROVE' ? 'approve' : 'deny'
    if (!confirm(`Are you sure you want to ${actionText} this role change request?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/role-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          reviewNotes: reviewNotes || undefined,
        }),
      })

      if (response.ok) {
        alert(`Request ${actionText}d successfully`)
        fetchRequests()
      } else {
        const data = await response.json()
        alert(data.error || `Failed to ${actionText} request`)
      }
    } catch (error) {
      alert(`Failed to ${actionText} request`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'DENIED':
        return 'bg-red-100 text-red-800'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
          <h1 className="text-3xl font-bold text-gray-800">Role Change Requests</h1>
          {!isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : 'Request Role Change'}
            </button>
          )}
        </div>

        {!isAdmin && showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Request Role Change</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requested Role
                </label>
                <select
                  required
                  value={formData.requestedRoleId}
                  onChange={(e) => setFormData({ ...formData, requestedRoleId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description || 'No description'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Explain why you need this role..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ requestedRoleId: '', reason: '' })
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      User
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Requested Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Requested
                  </th>
                  {isAdmin && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reviewed By
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="px-6 py-4 text-center text-gray-500">
                      No role change requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((request) => (
                    <tr key={request.id}>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.user.username}
                          </div>
                          <div className="text-sm text-gray-500">{request.user.email}</div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {request.requestedRole.name}
                        </div>
                        {request.requestedRole.description && (
                          <div className="text-sm text-gray-500">
                            {request.requestedRole.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {request.reason || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {request.reviewer ? request.reviewer.username : '-'}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {request.status === 'PENDING' && (
                          <div className="flex gap-2">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => handleReview(request.id, 'APPROVE')}
                                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const notes = prompt('Enter review notes (optional):')
                                    if (notes !== null) {
                                      handleReview(request.id, 'DENY', notes)
                                    }
                                  }}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                                >
                                  Deny
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleCancel(request.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                        {request.status !== 'PENDING' && request.reviewNotes && (
                          <div className="text-xs text-gray-500">
                            Notes: {request.reviewNotes}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}

