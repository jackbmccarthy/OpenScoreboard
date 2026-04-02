'use client'

import { Box, Text, VStack, Button, Input, Heading } from '@/components/ui'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleEmailLogin = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/')
      }
    } catch (e) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { callbackUrl: '/' })
    } catch (e) {
      setError('Google sign in failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box className="min-h-screen bg-white flex items-center justify-center p-4">
      <VStack space="lg" className="w-full max-w-md">
        <VStack space="sm" className="items-center">
          <Heading size="2xl" className="font-bold">Open Scoreboard</Heading>
          <Text className="text-gray-500">Sign in to manage your scores</Text>
        </VStack>

        <VStack space="md">
          {error && (
            <Box className="bg-red-50 p-3 rounded">
              <Text className="text-red-600 text-sm">{error}</Text>
            </Box>
          )}

          <VStack space="sm">
            <Text className="text-sm font-medium">Email</Text>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
            />
          </VStack>

          <VStack space="sm">
            <Text className="text-sm font-medium">Password</Text>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
          </VStack>

          <Button
            variant="solid"
            action="primary"
            onPress={handleEmailLogin}
            disabled={isLoading}
            className="mt-2"
          >
            <Text className="text-white">{isLoading ? 'Signing in...' : 'Sign In'}</Text>
          </Button>
        </VStack>

        <Box className="flex-row items-center my-2">
          <Box className="flex-1 h-px bg-gray-300" />
          <Text className="px-4 text-gray-500 text-sm">or</Text>
          <Box className="flex-1 h-px bg-gray-300" />
        </Box>

        <Button
          variant="outline"
          action="primary"
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <Text>Continue with Google</Text>
        </Button>

        <Text className="text-center text-sm text-gray-500 mt-4">
          Don&apos;t have an account?{' '}
          <Text className="text-blue-600">Sign up</Text>
        </Text>
      </VStack>
    </Box>
  )
}
