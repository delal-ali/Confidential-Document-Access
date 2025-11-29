'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AuditLog {
  id: string
  action: string
  resourceType: string | null
  resourceId: string | null
  ipAddress: string | null
  userAgent: string | null
  status: string
  timestamp: string
  user: {
    id: string
    username: string
    email: string
  } | null
}

export default function AuditLogs() {
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
  })

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const params = new URLSearchParams()
      if (filters.action) params.append('action', filters.action)
      if (filters.resourceType) params.append('resourceType', filters.resourceType)

      const response = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value })
  }

  const applyFilters = () => {
    setLoading(true)
    fetchLogs()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading audit logs...</div>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Audit Logs</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          
          {/* Quick filter buttons for permission-related activities */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Filters - Permission Activities:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilters({ action: 'PERMISSION_GRANTED', resourceType: 'document' })
                  setTimeout(applyFilters, 100)
                }}
                className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
              >
                Permission Granted
              </button>
              <button
                onClick={() => {
                  setFilters({ action: 'PERMISSION_MODIFIED', resourceType: 'document' })
                  setTimeout(applyFilters, 100)
                }}
                className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
              >
                Permission Modified
              </button>
              <button
                onClick={() => {
                  setFilters({ action: 'PERMISSION_REVOKED', resourceType: 'document' })
                  setTimeout(applyFilters, 100)
                }}
                className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
              >
                Permission Revoked
              </button>
              <button
                onClick={() => {
                  setFilters({ action: 'DOCUMENT_ACCESSED', resourceType: 'document' })
                  setTimeout(applyFilters, 100)
                }}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200"
              >
                Document Access
              </button>
              <button
                onClick={() => {
                  setFilters({ action: '', resourceType: '' })
                  setTimeout(applyFilters, 100)
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action
              </label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                placeholder="e.g., PERMISSION_GRANTED, DOCUMENT_ACCESSED"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resource Type
              </label>
              <input
                type="text"
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                placeholder="e.g., document, user, role"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <button
            onClick={applyFilters}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.user ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.user.username}
                            </div>
                            <div className="text-sm text-gray-500">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">System</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`text-sm font-medium ${
                            log.action.includes('PERMISSION') 
                              ? log.action === 'PERMISSION_GRANTED' 
                                ? 'text-green-700' 
                                : log.action === 'PERMISSION_REVOKED'
                                  ? 'text-red-700'
                                  : 'text-yellow-700'
                              : log.action === 'DOCUMENT_ACCESSED'
                                ? 'text-blue-700'
                                : 'text-gray-900'
                          }`}>
                            {log.action}
                          </span>
                          {log.action.includes('PERMISSION') && (
                            <div className="text-xs text-gray-500 mt-1">
                              Permission activity
                            </div>
                          )}
                          {log.action === 'DOCUMENT_ACCESSED' && (
                            <div className="text-xs text-gray-500 mt-1">
                              Shared resource access
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.resourceType ? (
                          <div>
                            <div>{log.resourceType}</div>
                            {log.resourceId && (
                              <div className="text-xs text-gray-400">{log.resourceId.substring(0, 8)}...</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {log.status === 'SUCCESS' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            SUCCESS
                          </span>
                        ) : log.status === 'FAILURE' ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            FAILURE
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            WARNING
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About Audit Logging</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• All user activities are logged with timestamps, IP addresses, and user information</li>
            <li>• System events are also logged for security monitoring</li>
            <li>• Logs are encrypted to protect sensitive information</li>
            <li>• Security alerts are generated for suspicious activities</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

