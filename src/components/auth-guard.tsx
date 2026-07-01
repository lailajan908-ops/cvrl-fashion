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
  const userRole = (session.user as any).role
  const userRoles: string[] = (session.user as any).roles || []
  
  // Owner bisa akses semua
  if (userRole === "Owner") return session
  
  // Cek apakah user punya salah satu role yang diperlukan
  const hasRole = roles.includes(userRole) || roles.some(r => userRoles.includes(r))
  if (!hasRole) redirect("/unauthorized")
  return session
}
