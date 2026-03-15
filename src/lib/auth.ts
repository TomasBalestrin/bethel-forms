import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios')
        }

        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user || !user.password_hash) {
          throw new Error('Email ou senha incorretos')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) {
          throw new Error('Email ou senha incorretos')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google' && user.email) {
        // Upsert user on Google sign-in
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', user.email)
          .single()

        if (!existingUser) {
          const { data: newUser } = await supabase
            .from('users')
            .insert({
              name: user.name || 'Usuário',
              email: user.email,
              avatar_url: user.image,
              email_verified: new Date().toISOString(),
            })
            .select('id')
            .single()

          if (newUser) {
            user.id = newUser.id
          }
        } else {
          user.id = existingUser.id
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
}
