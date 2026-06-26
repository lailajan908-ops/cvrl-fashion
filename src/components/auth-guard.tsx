import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")
  return session
}

export async function requireRole(...roles: string[]) {
  const session = await requireAuth()
  const role = (session.user as any).role
  if (!roles.includes(role)) redirect("/unauthorized")
  return session
}
