'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function MFASetupPage() {
  const router = useRouter()
  const [step, setStep] = useState<'setup' | 'verify'>('setup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [secret, setSecret] = useState('')
  const [uri, setUri] = useState('')
  const [otp, setOtp] = useState('')

  const handleSetup = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/auth/mfa/setup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setQrCode(data.qrCode)
        setSecret(data.secret)
        setUri(data.uri)
        setStep('verify')
      } else {
        setError(data.error || 'Failed to setup MFA')
      }
    } catch (error: any) {
      setError('Failed to setup MFA. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ otp }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('MFA enabled successfully!')
        router.push('/dashboard/profile')
      } else {
        setError(data.error || 'Invalid OTP code')
      }
    } catch (error: any) {
      setError('Failed to verify OTP. Please try again.')
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
                href="/dashboard/profile"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Back to Profile
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Setup Multi-Factor Authentication</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'setup' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 1: Generate QR Code</h2>
            <p className="text-gray-600 mb-6">
              Click the button below to generate a QR code. Scan it with an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator.
            </p>
            <button
              onClick={handleSetup}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        )}

        {step === 'verify' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Step 2: Scan QR Code</h2>
            <p className="text-gray-600 mb-4">
              Scan this QR code with your authenticator app:
            </p>
            
            {qrCode && (
              <div className="mb-6 flex justify-center">
                <img src={qrCode} alt="MFA QR Code" className="border border-gray-300 rounded-lg" />
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Or enter this secret key manually:</p>
              <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                <code className="text-sm font-mono break-all">{secret}</code>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 3: Verify Setup</h3>
            <p className="text-gray-600 mb-4">
              Enter the 6-digit code from your authenticator app to verify and enable MFA:
            </p>

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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify and Enable MFA'}
              </button>

              <button
                type="button"
                onClick={() => setStep('setup')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

