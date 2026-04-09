// Login Page
// Migrated from app/login/page.tsx

import { useState, useEffect } from 'react'
import { Box, Text, VStack, Button, Input, Heading, HStack } from '@/components/ui'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signInWithGoogleRedirect, signInWithApple, signInWithEmail, signUpWithEmail, useAuth } from '@/lib/auth'
import { isLocalDatabase } from '@/lib/firebase'

const proofPoints = [
  'Live scoring desk',
  'Realtime overlays',
  'Player and team ops',
]

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
    } catch (err) {
      const errorMap: Record<string, string> = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-in-use': 'An account with this email already exists',
        'auth/weak-password': 'Password should be at least 6 characters',
        'auth/invalid-email': 'Invalid email address',
        'auth/too-many-requests': 'Too many attempts. Please try again later',
        'auth/invalid-credential': 'Invalid email or password',
      }
      const authCode = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code || '') : ''
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(errorMap[authCode] || message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      await signInWithGoogle()
    } catch (err) {
      const authCode = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code || '') : ''
      if (authCode === 'auth/popup-blocked' || authCode === 'auth/cancelled-popup-request') {
        try {
          await signInWithGoogleRedirect()
          return
        } catch (redirectErr) {
          setError(redirectErr instanceof Error ? redirectErr.message : 'Google sign in failed')
        }
      } else if (authCode !== 'auth/popup-closed-by-user') {
        setError(err instanceof Error ? err.message : 'Google sign in failed')
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
    } catch (err) {
      const authCode = typeof err === 'object' && err && 'code' in err ? String((err as { code?: unknown }).code || '') : ''
      if (authCode !== 'auth/popup-closed-by-user') {
        setError(err instanceof Error ? err.message : 'Apple sign in failed')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (loading || (user && !error) || isLocalDatabase) {
    return (
      <Box className="premium-grid min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f8fafc_42%,#ffffff_100%)] px-4 py-6">
        <Box className="premium-orb left-[8%] top-[12%] h-36 w-36 bg-blue-300/60" />
        <Box className="premium-orb right-[12%] top-[20%] h-40 w-40 bg-cyan-200/70 premium-delay-2" />
        <Box className="premium-orb bottom-[10%] left-[22%] h-44 w-44 bg-indigo-200/60 premium-delay-3" />
        <VStack space="md" className="relative z-10 min-h-[80vh] items-center justify-center">
          <Box className="h-14 w-14 animate-spin rounded-full border-4 border-blue-500 border-t-transparent shadow-lg shadow-blue-500/20" />
          <Text className="text-sm font-medium tracking-[0.18em] text-slate-500 uppercase">Checking your session</Text>
        </VStack>
      </Box>
    )
  }

  return (
    <Box className="premium-grid relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f8fafc_42%,#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-10">
      <Box className="premium-orb left-[4%] top-[10%] h-36 w-36 bg-blue-300/70" />
      <Box className="premium-orb right-[10%] top-[14%] h-44 w-44 bg-cyan-200/70 premium-delay-2" />
      <Box className="premium-orb bottom-[8%] left-[18%] h-52 w-52 bg-indigo-200/60 premium-delay-3" />
      <Box className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl items-center">
        <Box className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] xl:gap-14">
          <VStack className="premium-fade-up hidden justify-center gap-8 rounded-[2rem] border border-white/60 premium-panel px-8 py-10 lg:flex">
            <VStack className="gap-4">
              <Text className="text-xs font-semibold uppercase tracking-[0.34em] text-blue-700">Open Scoreboard</Text>
              <Heading size="4xl" className="max-w-3xl text-5xl font-black leading-[1.02] text-slate-950 xl:text-6xl">
                Premium control for live matches, tournaments, and broadcast overlays.
              </Heading>
              <Text className="max-w-2xl text-lg leading-8 text-slate-600">
                Run scoring, manage rosters, and push polished overlays from one command center that feels as professional as the events it powers.
              </Text>
            </VStack>

            <HStack className="flex-wrap gap-3">
              {proofPoints.map((item, index) => (
                <Box
                  key={item}
                  className={`premium-card premium-fade-up premium-delay-${Math.min(index + 1, 3)} rounded-full border border-white/70 px-4 py-2`}
                >
                  <Text className="text-sm font-medium text-slate-700">{item}</Text>
                </Box>
              ))}
            </HStack>

            <Box className="grid gap-4 xl:grid-cols-2">
              <Box className="premium-card premium-fade-up premium-delay-1 rounded-[1.75rem] border border-white/70 p-5">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Operations</Text>
                <Text className="text-lg font-semibold text-slate-900">Players, teams, tables, and team matches stay in one workflow.</Text>
              </Box>
              <Box className="premium-card premium-fade-up premium-delay-2 rounded-[1.75rem] border border-white/70 p-5">
                <Text className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Broadcast</Text>
                <Text className="text-lg font-semibold text-slate-900">Realtime overlays stay synced with the same data contract your clients already know.</Text>
              </Box>
            </Box>
          </VStack>

          <Box className="premium-panel premium-fade-up premium-delay-1 relative overflow-hidden rounded-[2rem] border border-white/70 px-5 py-6 sm:px-7 sm:py-8">
            <Box className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_65%)]" />
            <VStack space="lg" className="relative z-10 w-full">
              <VStack space="sm" className="items-center text-center">
                <Box className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-xl shadow-blue-500/25">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
                    <polyline points="17 2 12 7 7 2" />
                  </svg>
                </Box>
                <Heading size="2xl" className="font-black text-slate-950">Welcome back</Heading>
                <Text className="max-w-md text-sm leading-7 text-slate-500">
                  {mode === 'signin'
                    ? 'Enter your account to return to scoring, overlays, and tournament operations.'
                    : 'Create your account to unlock the full event control room.'}
                </Text>
              </VStack>

              {error && (
                <Box className="premium-fade-up rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <Text className="text-sm font-medium text-rose-700">{error}</Text>
                </Box>
              )}

              <VStack space="md">
                <Button
                  variant="outline"
                  action="primary"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="rounded-2xl border-slate-200 bg-white/80 py-3.5 hover:bg-white"
                >
                  <HStack space="sm" className="items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <Text className="font-semibold text-slate-800">Continue with Google</Text>
                  </HStack>
                </Button>

                <Button
                  variant="outline"
                  action="primary"
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="rounded-2xl border-slate-200 bg-slate-950 py-3.5 text-white hover:bg-slate-900"
                >
                  <HStack space="sm" className="items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                    </svg>
                    <Text className="font-semibold text-white">Continue with Apple</Text>
                  </HStack>
                </Button>
              </VStack>

              <HStack space="md" className="items-center">
                <Box className="h-px flex-1 bg-slate-200" />
                <Text className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">or with email</Text>
                <Box className="h-px flex-1 bg-slate-200" />
              </HStack>

              <VStack space="md" className="premium-card rounded-[1.75rem] border border-white/70 px-4 py-5 sm:px-5">
                {mode === 'signup' && (
                  <VStack space="sm">
                    <Text className="text-sm font-semibold text-slate-700">Display name</Text>
                    <Input
                      type="text"
                      placeholder="Your name"
                      value={displayName}
                      onChangeText={setDisplayName}
                      className="rounded-xl border-slate-200 bg-white/90 py-3 text-slate-900 placeholder-slate-400 focus:ring-blue-200"
                    />
                  </VStack>
                )}

                <VStack space="sm">
                  <Text className="text-sm font-semibold text-slate-700">Email</Text>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChangeText={setEmail}
                    className="rounded-xl border-slate-200 bg-white/90 py-3 text-slate-900 placeholder-slate-400 focus:ring-blue-200"
                  />
                </VStack>

                <VStack space="sm">
                  <Text className="text-sm font-semibold text-slate-700">Password</Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    className="rounded-xl border-slate-200 bg-white/90 py-3 text-slate-900 placeholder-slate-400 focus:ring-blue-200"
                  />
                </VStack>

                {mode === 'signup' && (
                  <VStack space="sm">
                    <Text className="text-sm font-semibold text-slate-700">Confirm password</Text>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      className="rounded-xl border-slate-200 bg-white/90 py-3 text-slate-900 placeholder-slate-400 focus:ring-blue-200"
                    />
                  </VStack>
                )}

                <Button
                  variant="solid"
                  action="primary"
                  onClick={handleEmailSubmit}
                  disabled={isLoading}
                  className="mt-2 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 py-3.5 shadow-lg shadow-blue-500/25 hover:from-blue-500 hover:to-cyan-300"
                >
                  <Text className="text-base font-semibold text-white">
                    {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                </Button>
              </VStack>

              <Text as="div" className="text-center text-sm text-slate-500">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <Text
                  as="span"
                  className="cursor-pointer font-semibold text-blue-600 hover:text-blue-500"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin')
                    setError('')
                  }}
                >
                  {mode === 'signin' ? 'Create one' : 'Sign in'}
                </Text>
              </Text>

              {mode === 'signin' && (
                <Text className="text-center text-sm text-slate-400 transition-colors hover:text-slate-600">
                  Forgot your password?
                </Text>
              )}
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
