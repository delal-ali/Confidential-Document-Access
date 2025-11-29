'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AccessRule {
  id: string
  name: string
  description: string | null
  ruleType: string
  allowedStartTime: string | null
  allowedEndTime: string | null
  allowedDays: string | null
  allowedLocations: string | null
  allowedDevices: string | null
  attributeConditions: string | null
  targetType: string
  targetId: string | null
  isActive: boolean
  priority: number
}

export default function AccessRulesPage() {
  const router = useRouter()
  const [rules, setRules] = useState<AccessRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<string[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [ruleType, setRuleType] = useState<'TIME' | 'LOCATION' | 'DEVICE' | 'ATTRIBUTE'>('TIME')
  const [abacConditions, setAbacConditions] = useState({
    userRole: '',
    userDepartment: '',
    userLocation: '',
    employmentStatus: '',
    resourceDepartment: '',
    resourceClassification: '',
  })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetType: 'document',
    targetId: '',
    priority: 0,
    // Time-based
    allowedStartTime: '09:00',
    allowedEndTime: '17:00',
    allowedDays: 'MON,TUE,WED,THU,FRI',
    // Location-based
    allowedLocations: '',
    // Device-based
    allowedDevices: '',
    // Attribute-based
    attributeConditions: JSON.stringify([
      {
        attribute: 'user.role',
        operator: 'contains',
        value: 'Manager',
      },
    ]),
  })

  useEffect(() => {
    fetchUserRoles()
    fetchRules()
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

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/access-rules', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setRules(data.rules || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch rules:', errorData)
        // Don't show error for employees - they should be able to view now
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      
      const payload: any = {
        name: formData.name,
        description: formData.description,
        ruleType,
        targetType: formData.targetType,
        targetId: formData.targetId || null,
        priority: formData.priority,
        isActive: true,
      }

      if (ruleType === 'TIME') {
        payload.allowedStartTime = formData.allowedStartTime
        payload.allowedEndTime = formData.allowedEndTime
        payload.allowedDays = formData.allowedDays
      } else if (ruleType === 'LOCATION') {
        payload.allowedLocations = formData.allowedLocations
      } else if (ruleType === 'DEVICE') {
        payload.allowedDevices = formData.allowedDevices
      } else if (ruleType === 'ATTRIBUTE') {
        // Build conditions from form inputs
        const conditions: any[] = []
        
        if (abacConditions.userRole) {
          conditions.push({
            attribute: 'user.role',
            operator: 'in',
            value: [abacConditions.userRole],
          })
        }
        
        if (abacConditions.userDepartment) {
          conditions.push({
            attribute: 'user.department',
            operator: 'equals',
            value: abacConditions.userDepartment,
          })
        }
        
        if (abacConditions.userLocation) {
          conditions.push({
            attribute: 'user.location',
            operator: 'equals',
            value: abacConditions.userLocation,
          })
        }
        
        if (abacConditions.employmentStatus) {
          conditions.push({
            attribute: 'user.employmentStatus',
            operator: 'equals',
            value: abacConditions.employmentStatus,
          })
        }
        
        if (abacConditions.resourceDepartment) {
          conditions.push({
            attribute: 'resource.department',
            operator: 'equals',
            value: abacConditions.resourceDepartment,
          })
        }
        
        if (abacConditions.resourceClassification) {
          conditions.push({
            attribute: 'resource.classification',
            operator: 'equals',
            value: abacConditions.resourceClassification,
          })
        }
        
        // Use form JSON if conditions array is empty (advanced mode)
        if (conditions.length > 0) {
          payload.attributeConditions = JSON.stringify(conditions)
        } else {
          payload.attributeConditions = formData.attributeConditions
        }
      }

      const response = await fetch('/api/access-rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        alert('Access rule created successfully!')
        setShowCreateForm(false)
        setAbacConditions({
          userRole: '',
          userDepartment: '',
          userLocation: '',
          employmentStatus: '',
          resourceDepartment: '',
          resourceClassification: '',
        })
        setAbacConditions({
          userRole: '',
          userDepartment: '',
          userLocation: '',
          employmentStatus: '',
          resourceDepartment: '',
          resourceClassification: '',
        })
        setFormData({
          name: '',
          description: '',
          targetType: 'document',
          targetId: '',
          priority: 0,
          allowedStartTime: '09:00',
          allowedEndTime: '17:00',
          allowedDays: 'MON,TUE,WED,THU,FRI',
          allowedLocations: '',
          allowedDevices: '',
          attributeConditions: JSON.stringify([{
            attribute: 'user.role',
            operator: 'contains',
            value: 'Manager',
          }]),
        })
        fetchRules()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create rule')
      }
    } catch (error) {
      alert('Failed to create rule')
    }
  }

  const handleDeleteRule = async (ruleId: string, ruleName: string) => {
    if (!confirm(`Are you sure you want to delete rule "${ruleName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingRuleId(ruleId)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/access-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete rule')
      }

      alert(`Rule "${ruleName}" deleted successfully`)
      fetchRules()
    } catch (err: any) {
      alert(err.message || 'Failed to delete rule')
    } finally {
      setDeletingRuleId(null)
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
          <h1 className="text-3xl font-bold text-gray-800">Access Rules Management</h1>
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {showCreateForm ? 'Cancel' : 'Create New Rule'}
            </button>
          )}
        </div>

        {!isAdmin && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded mb-4">
            <p className="text-sm">
              <strong>Read-Only View:</strong> You can view all access rules but cannot create, modify, or delete them. Only Administrators can manage access rules.
            </p>
          </div>
        )}

        {showCreateForm && isAdmin && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Create Access Rule</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Business Hours Only"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={2}
                  placeholder="Rule description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Type *
                  </label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="TIME">Time-Based (RuBAC)</option>
                    <option value="LOCATION">Location-Based (RuBAC)</option>
                    <option value="DEVICE">Device-Based (RuBAC)</option>
                    <option value="ATTRIBUTE">Attribute-Based (ABAC)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority (Higher = Evaluated First)
                  </label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Type
                  </label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="document">Document</option>
                    <option value="role">Role</option>
                    <option value="permission">Permission</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target ID (Optional - leave empty for global rule)
                  </label>
                  <input
                    type="text"
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Document ID or leave empty"
                  />
                </div>
              </div>

              {/* Time-Based Rules */}
              {ruleType === 'TIME' && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold text-gray-800">Time Restrictions</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time (HH:mm)
                      </label>
                      <input
                        type="time"
                        value={formData.allowedStartTime}
                        onChange={(e) => setFormData({ ...formData, allowedStartTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time (HH:mm)
                      </label>
                      <input
                        type="time"
                        value={formData.allowedEndTime}
                        onChange={(e) => setFormData({ ...formData, allowedEndTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allowed Days
                      </label>
                      <input
                        type="text"
                        value={formData.allowedDays}
                        onChange={(e) => setFormData({ ...formData, allowedDays: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="MON,TUE,WED,THU,FRI"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Comma-separated: MON,TUE,WED,THU,FRI,SAT,SUN
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Location-Based Rules */}
              {ruleType === 'LOCATION' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Location Restrictions</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed IP Addresses or Locations
                  </label>
                  <input
                    type="text"
                    value={formData.allowedLocations}
                    onChange={(e) => setFormData({ ...formData, allowedLocations: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="192.168.1.100,192.168.1.101 or Office,Home"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated IP addresses or location names
                  </p>
                </div>
              )}

              {/* Device-Based Rules */}
              {ruleType === 'DEVICE' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Device Restrictions</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Device Types
                  </label>
                  <input
                    type="text"
                    value={formData.allowedDevices}
                    onChange={(e) => setFormData({ ...formData, allowedDevices: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="desktop,laptop"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated: desktop, laptop, mobile, tablet
                  </p>
                </div>
              )}

              {/* Attribute-Based Rules (ABAC) */}
              {ruleType === 'ATTRIBUTE' && (
                <div className="border-t pt-4 space-y-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Attribute-Based Conditions (ABAC)</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create fine-grained access control based on user attributes (role, department, location, employment status) and resource attributes.
                  </p>
                  
                  {/* User-Friendly Policy Builder */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Role
                      </label>
                      <select
                        value={abacConditions.userRole || ''}
                        onChange={(e) => setAbacConditions({ ...abacConditions, userRole: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Any Role</option>
                        <option value="Administrator">Administrator</option>
                        <option value="Manager">Manager</option>
                        <option value="Employee">Employee</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Department
                      </label>
                      <input
                        type="text"
                        value={abacConditions.userDepartment || ''}
                        onChange={(e) => setAbacConditions({ ...abacConditions, userDepartment: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Payroll, IT, HR, Finance"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Example: "Payroll" - Only users in Payroll department can access
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Location (Optional)
                      </label>
                      <input
                        type="text"
                        value={abacConditions.userLocation || ''}
                        onChange={(e) => setAbacConditions({ ...abacConditions, userLocation: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., New York, London, Remote"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Employment Status
                      </label>
                      <select
                        value={abacConditions.employmentStatus || ''}
                        onChange={(e) => setAbacConditions({ ...abacConditions, employmentStatus: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Any Status</option>
                        <option value="ACTIVE">Active Only</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="TERMINATED">Terminated</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resource Department (Optional)
                      </label>
                      <input
                        type="text"
                        value={abacConditions.resourceDepartment || ''}
                        onChange={(e) => setAbacConditions({ ...abacConditions, resourceDepartment: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="e.g., Payroll - Only documents in Payroll department"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Match documents by department (set when creating document)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Resource Classification
                      </label>
                      <select
                        value={abacConditions.resourceClassification || ''}
                        onChange={(e) => setAbacConditions({ ...abacConditions, resourceClassification: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Any Classification</option>
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="INTERNAL">INTERNAL</option>
                        <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                      </select>
                    </div>
                  </div>

                  {/* Advanced JSON Editor (Optional) */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      Advanced: Edit JSON directly
                    </summary>
                    <div className="mt-2">
                      <textarea
                        value={formData.attributeConditions}
                        onChange={(e) => setFormData({ ...formData, attributeConditions: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                        rows={8}
                        placeholder='[{"attribute":"user.role","operator":"contains","value":"Manager"},{"attribute":"user.department","operator":"equals","value":"Payroll"}]'
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        JSON array of conditions. Operators: equals, contains, greaterThan, lessThan, in
                      </p>
                    </div>
                  </details>

                  {/* Example Policies */}
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs text-blue-800 font-semibold mb-2">Quick Examples:</p>
                    <div className="space-y-2 text-xs text-blue-700">
                      <button
                        type="button"
                        onClick={() => {
                          setAbacConditions({
                            userRole: 'Employee',
                            userDepartment: 'Payroll',
                            resourceDepartment: '',
                            resourceClassification: '',
                            userLocation: '',
                            employmentStatus: 'ACTIVE'
                          })
                        }}
                        className="block w-full text-left hover:underline"
                      >
                        📊 Payroll Employees Only - Allow only employees in Payroll department
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAbacConditions({
                            userRole: 'Manager',
                            userDepartment: 'IT',
                            resourceDepartment: '',
                            resourceClassification: 'CONFIDENTIAL',
                            userLocation: '',
                            employmentStatus: 'ACTIVE'
                          })
                        }}
                        className="block w-full text-left hover:underline"
                      >
                        🔒 IT Managers - Allow IT Managers to access Confidential documents
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAbacConditions({
                            userRole: 'Employee',
                            userDepartment: 'HR',
                            resourceDepartment: 'HR',
                            resourceClassification: '',
                            userLocation: '',
                            employmentStatus: 'ACTIVE'
                          })
                        }}
                        className="block w-full text-left hover:underline"
                      >
                        👥 HR Department - Allow HR employees to access HR department documents
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Rule
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-4 text-center text-gray-500">
                    No access rules created yet
                  </td>
                </tr>
              ) : (
                rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                      {rule.description && (
                        <div className="text-sm text-gray-500">{rule.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {rule.ruleType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.targetType}
                      {rule.targetId && (
                        <div className="text-xs text-gray-400">{rule.targetId.substring(0, 8)}...</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {rule.priority}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rule.isActive ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {rule.ruleType === 'TIME' && (
                        <div>
                          <div>{rule.allowedStartTime} - {rule.allowedEndTime}</div>
                          <div className="text-xs">{rule.allowedDays}</div>
                        </div>
                      )}
                      {rule.ruleType === 'LOCATION' && (
                        <div className="text-xs">{rule.allowedLocations}</div>
                      )}
                      {rule.ruleType === 'DEVICE' && (
                        <div className="text-xs">{rule.allowedDevices}</div>
                      )}
                      {rule.ruleType === 'ATTRIBUTE' && (
                        <div className="text-xs max-w-xs truncate">
                          {rule.attributeConditions ? 'Attribute conditions set' : '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          disabled={deletingRuleId === rule.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deletingRuleId === rule.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                      {!isAdmin && (
                        <span className="text-gray-400 text-sm">View only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">About Access Rules</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Time-Based (RuBAC):</strong> Restrict access to specific hours/days</li>
            <li>• <strong>Location-Based (RuBAC):</strong> Restrict access from specific IPs/locations</li>
            <li>• <strong>Device-Based (RuBAC):</strong> Restrict access from specific device types</li>
            <li>• <strong>Attribute-Based (ABAC):</strong> Complex policies based on user/resource attributes</li>
            <li>• Rules are evaluated in priority order (higher priority first)</li>
            <li>• First deny rule wins - if any rule denies, access is denied</li>
            {!isAdmin && (
              <li className="mt-2 text-blue-900 font-semibold">• You are viewing access rules in read-only mode. Only Administrators can create or delete rules.</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}

