// @ts-nocheck
// Login Page
// Migrated from app/login/page.tsx

import { useState, useEffect } from 'react'
import { Box, Text, VStack, Button, Input, Heading, HStack } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, useAuth } from '@/lib/auth'
import { isLocalDatabase } from '@/lib/firebase'

export default function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) {
      return
    }

    if (user || isLocalDatabase) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const validateForm = (): boolean => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return false
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleEmailSubmit = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    setError('')
    
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password)
      } else {
        await signInWithEmail(email, password)
      }
    } catch (err: any) {
      const errorMap: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/invalid-credential': 'Invalid email or password',
      }
      setError(errorMap[err.code] || err.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      await signInWithGoogle()
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign in failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      await signInWithApple()
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Apple sign in failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || (user && !error) || isLocalDatabase) {
    return (
      <Box className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <VStack space="md" className="items-center">
          <Box className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          <Text className="text-sm text-gray-400">Checking your session...</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <VStack space="lg" className="w-full max-w-md">
        {/* Logo / Header */}
        <VStack space="sm" className="items-center">
          <Heading size="2xl" className="font-bold text-white">Open Scoreboard</Heading>
          <Text className="text-gray-400">
            {mode === 'signin' ? 'Sign in to manage your scores' : 'Create your account'}
          </Text>
        </VStack>

        {/* Error Message */}
        {error && (
          <Box className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg">
            <Text className="text-red-400 text-sm text-center">{error}</Text>
          </Box>
        )}

        {/* OAuth Buttons */}
        <VStack space="md">
          {/* Google */}
          <Button
            variant="outline"
            action="primary"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="border-gray-600 hover:bg-gray-800"
          >
            <HStack space="sm" className="items-center">
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <Text className="text-white font-medium">Continue with Google</Text>
            </HStack>
          </Button>

          {/* Apple */}
          <Button
            variant="outline"
            action="primary"
            onClick={handleAppleLogin}
            disabled={isLoading}
            className="border-gray-600 hover:bg-gray-800"
          >
            <HStack space="sm" className="items-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <Text className="text-white font-medium">Continue with Apple</Text>
            </HStack>
          </Button>
        </VStack>

        {/* Divider */}
        <HStack space="md" className="items-center">
          <Box className="flex-1 h-px bg-gray-700" />
          <Text className="text-gray-500 text-sm">or</Text>
          <Box className="flex-1 h-px bg-gray-700" />
        </HStack>

        {/* Email/Password Form */}
        <VStack space="md">
          {mode === 'signup' && (
            <VStack space="sm">
              <Text className="text-sm font-medium text-gray-300">Display Name</Text>
              <Input
                type="text"
                placeholder="Your name"
                value={displayName}
                onChangeText={setDisplayName}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </VStack>
          )}

          <VStack space="sm">
            <Text className="text-sm font-medium text-gray-300">Email</Text>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </VStack>

          <VStack space="sm">
            <Text className="text-sm font-medium text-gray-300">Password</Text>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
            />
          </VStack>

          {mode === 'signup' && (
            <VStack space="sm">
              <Text className="text-sm font-medium text-gray-300">Confirm Password</Text>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500"
              />
            </VStack>
          )}

          <Button
            variant="solid"
            action="primary"
            onClick={handleEmailSubmit}
            disabled={isLoading}
            className="mt-2 bg-blue-600 hover:bg-blue-700"
          >
            <Text className="text-white font-medium">
              {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
          </Button>
        </VStack>

        {/* Toggle Sign In / Sign Up */}
        <Text className="text-center text-sm text-gray-400">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <Text
            className="text-blue-400 cursor-pointer hover:text-blue-300"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin')
              setError('')
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </Text>
        </Text>

        {/* Forgot Password Link */}
        {mode === 'signin' && (
          <Text className="text-center text-sm text-gray-500 hover:text-gray-400 cursor-pointer">
            Forgot your password?
          </Text>
        )}
      </VStack>
    </Box>
  )
}
