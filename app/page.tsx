'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

export default function Home() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: 'Employee', // Default role
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [captchaQuestion, setCaptchaQuestion] = useState('')
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  
  // Generate CAPTCHA on mount and when switching to registration
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const operators = ['+', '-', '*']
    const operator = operators[Math.floor(Math.random() * operators.length)]
    setCaptchaQuestion(`What is ${num1} ${operator} ${num2}?`)
    return { num1, operator, num2 }
  }
  
  React.useEffect(() => {
    if (!isLogin) {
      generateCaptcha()
    }
  }, [isLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        console.log('Attempting login...', { username: formData.username })
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            password: formData.password,
          }),
        })

        console.log('Login response status:', response.status)
        const data = await response.json()
        console.log('Login response data:', data)

        if (!response.ok) {
          const errorMsg = data.error || data.message || 'Login failed'
          console.error('Login error:', errorMsg, data)
          throw new Error(errorMsg)
        }

        if (data.mfaRequired) {
          // Handle MFA - store credentials temporarily for MFA verification
          sessionStorage.setItem('mfa_username', formData.username)
          sessionStorage.setItem('mfa_password', formData.password)
          router.push('/mfa')
          return
        }

        if (!data.accessToken) {
          throw new Error('No access token received')
        }

        localStorage.setItem('token', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken || '')
        console.log('Login successful, redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match')
        }

        // Calculate CAPTCHA answer
        const match = captchaQuestion.match(/What is (\d+) ([+\-*]) (\d+)\?/)
        let calculatedAnswer: number | undefined
        if (match) {
          const num1 = parseInt(match[1])
          const operator = match[2]
          const num2 = parseInt(match[3])
          switch (operator) {
            case '+':
              calculatedAnswer = num1 + num2
              break
            case '-':
              calculatedAnswer = num1 - num2
              break
            case '*':
              calculatedAnswer = num1 * num2
              break
          }
        }
        
        console.log('Attempting registration...', { username: formData.username, email: formData.email, role: formData.role })
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            captchaQuestion: captchaQuestion,
            captchaAnswer: calculatedAnswer,
          }),
        })

        console.log('Registration response status:', response.status)
        const data = await response.json()
        console.log('Registration response data:', data)

        if (!response.ok) {
          let errorMsg = data.error || data.message || 'Registration failed'
          console.error('Registration error:', errorMsg, data)
          
          // Show detailed password errors
          if (data.details && Array.isArray(data.details)) {
            const passwordErrors = data.details.map((d: any) => d.message || d).join('\n• ')
            errorMsg = `${errorMsg}\n\nPassword requirements:\n• ${passwordErrors}`
          } else if (data.details) {
            errorMsg = `${errorMsg}: ${JSON.stringify(data.details)}`
          }
          
          throw new Error(errorMsg)
        }

        alert('Registration successful! Please check your email for verification.')
        setIsLogin(true)
        // Clear form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
          role: 'Employee',
        })
        setCaptchaAnswer('')
        generateCaptcha()
      }
    } catch (err: any) {
      console.error('Submit error:', err)
      const errorMessage = err.message || 'An error occurred. Please check the browser console for details.'
      setError(errorMessage)
      alert(`Error: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
          Document Access System
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Secure document management
        </p>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              !isLogin
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="block mb-2">Error:</strong>
            <div className="whitespace-pre-line text-sm">{error}</div>
            <small className="text-xs mt-2 block text-red-600">
              💡 Tip: Check browser console (F12) for more details
            </small>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="First name"
                    autoComplete="given-name"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Last name"
                    autoComplete="family-name"
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              disabled={loading}
            />
            {!isLogin && (
              <div className="text-xs text-gray-500 mt-1 space-y-1">
                <p className="font-semibold">Password must have:</p>
                <ul className="list-disc list-inside ml-2 space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter (A-Z)</li>
                  <li>One lowercase letter (a-z)</li>
                  <li>One number (0-9)</li>
                  <li>One special character (!@#$%^&*)</li>
                </ul>
                <p className="mt-1 text-blue-600 font-medium">Example: <code className="bg-blue-50 px-1 rounded">Test123!@#</code></p>
              </div>
            )}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Your Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="Employee">Employee</option>
                  <option value="Manager">Manager</option>
                  <option value="Administrator">Administrator</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose your role. Administrators have full system access.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Verification (CAPTCHA)
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-blue-600 bg-white px-4 py-2 rounded border">
                    {captchaQuestion}
                  </span>
                  <input
                    type="number"
                    required
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Answer"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      generateCaptcha()
                      setCaptchaAnswer('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                    disabled={loading}
                  >
                    Refresh
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Please solve the math problem to verify you're human
                </p>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
          
          {isLogin && (
            <div className="text-center mt-4">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

