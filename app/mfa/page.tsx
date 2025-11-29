'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MFAVerificationPage() {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    // Get stored credentials from sessionStorage (set during login)
    const storedUsername = sessionStorage.getItem('mfa_username')
    const storedPassword = sessionStorage.getItem('mfa_password')
    
    if (storedUsername && storedPassword) {
      setUsername(storedUsername)
      setPassword(storedPassword)
    } else {
      // If no stored credentials, redirect to login
      router.push('/')
    }
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code')
      setLoading(false)
      return
    }

    try {
      // Complete login with OTP
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          otp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid OTP code')
      }

      if (!data.accessToken) {
        throw new Error('No access token received')
      }

      // Clear stored credentials
      sessionStorage.removeItem('mfa_username')
      sessionStorage.removeItem('mfa_password')

      // Store tokens and redirect
      localStorage.setItem('token', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken || '')
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Failed to verify OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Multi-Factor Authentication
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify and Login'}
          </button>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('mfa_username')
              sessionStorage.removeItem('mfa_password')
              router.push('/')
            }}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}

