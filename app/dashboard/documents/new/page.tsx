'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NewDocument() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    securityLabel: 'PUBLIC',
    classification: 'PUBLIC',
    department: '', // Department for ABAC fine-grained control
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isManager, setIsManager] = useState(false)

  useEffect(() => {
    fetchUserRoles()
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
        setIsAdmin(roleNames.includes('Administrator'))
        setIsManager(roleNames.includes('Manager'))
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      // Log form data for debugging
      console.log('Submitting document:', {
        title: formData.title,
        securityLabel: formData.securityLabel,
        classification: formData.classification,
        isAdmin,
      })

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        // Log error for debugging
        console.error('Document creation failed:', {
          status: response.status,
          error: data.error,
          details: data.details,
          message: data.message,
        })
        
        // Show detailed error message
        let errorMsg = data.error || 'Failed to create document'
        if (data.message) {
          errorMsg += `: ${data.message}`
        }
        if (data.userRole) {
          errorMsg += `\n\nYour current role: ${data.userRole}`
        }
        if (data.requiredRoles) {
          errorMsg += `\nRequired roles: ${data.requiredRoles.join(', ')}`
        }
        if (data.details && Array.isArray(data.details)) {
          errorMsg += `\n\nValidation errors: ${data.details.map((d: any) => `${d.path?.join('.')}: ${d.message}`).join(', ')}`
        }
        throw new Error(errorMsg)
      }
      
      console.log('Document created successfully:', data.document)

      // Redirect to document view or dashboard
      router.push(`/dashboard/documents/${data.document.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Document</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter document title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter document content..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Security Label *
              </label>
              <select
                value={formData.securityLabel}
                onChange={(e) => setFormData({ ...formData, securityLabel: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                <option value="TOP_SECRET">TOP_SECRET</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                MAC: Determines who can access based on clearance level
              </p>
              {(isAdmin || isManager) && (
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  ✓ {isAdmin ? 'Administrator' : 'Manager'}: You can create documents with any security label
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Classification *
              </label>
              <select
                value={formData.classification}
                onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="INTERNAL">INTERNAL</option>
                <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Additional classification level
              </p>
              {(isAdmin || isManager) && (
                <p className="text-xs text-green-600 mt-1 font-semibold">
                  ✓ {isAdmin ? 'Administrator' : 'Manager'}: You can create documents with any classification
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department (Optional - for ABAC fine-grained control)
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Payroll, IT, HR, Finance"
            />
            <p className="text-xs text-gray-500 mt-1">
              ABAC: Assign document to a department for fine-grained access control. Example: "Payroll" department documents can be restricted to Payroll employees only.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Access Control Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>MAC (Mandatory Access Control):</strong> Security label determines access based on user clearance</li>
            <li>• <strong>DAC (Discretionary Access Control):</strong> You (as owner) can grant permissions to other users</li>
            <li>• <strong>RBAC (Role-Based):</strong> Your role determines what actions you can perform</li>
            <li>• <strong>RuBAC (Rule-Based):</strong> Time/location rules may restrict access</li>
            <li>• <strong>ABAC (Attribute-Based):</strong> Policies based on user/resource attributes</li>
            {(isAdmin || isManager) && (
              <li className="mt-2 text-green-700 font-semibold">• <strong>{isAdmin ? 'Administrator' : 'Manager'} Privilege:</strong> You can create documents with any security label and classification, bypassing MAC restrictions</li>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}

