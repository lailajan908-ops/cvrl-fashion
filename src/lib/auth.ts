import { NextAuthOptions, DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email/Nama", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          // Cek apakah login dengan email atau nama
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email },
                { name: credentials.email }
              ]
            },
          })

          // Cek status PENDING
          if (user && user.status === "PENDING") {
            throw new Error("Akun belum diaktifkan oleh Owner. Silakan tunggu persetujuan.")
          }

          if (!user || !user.isActive) return null

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            roles: user.roles,
          }
        } catch (err) {
          // Return null untuk PENDING, tapi bisa throw error khusus
          if (err instanceof Error && err.message.includes("belum diaktifkan")) {
            return null // NextAuth akan lempar error "CredentialsSignin"
          }
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export function getBaseUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return process.env.NEXTAUTH_URL || "http://localhost:3000"
}
