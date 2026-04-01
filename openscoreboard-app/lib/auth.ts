// NextAuth configuration for OpenScoreboard
// Uses Firebase as the authentication provider

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { firebaseConfig, isLocalDatabase } from './firebase'

export const authOptions: NextAuthOptions = {
  providers: [
    // Local database mode - skip auth
    ...(isLocalDatabase ? [] : [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      }),
      CredentialsProvider({
        name: 'Email',
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials) {
          // Firebase email/password auth would go here
          // For now, return null to use Firebase Auth directly
          return null
        }
      })
    ])
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).uid = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
}

// Re-export firebaseConfig
export { firebaseConfig, isLocalDatabase }
