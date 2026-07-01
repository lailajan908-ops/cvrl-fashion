import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"

export async function requireApiAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new ApiAuthError("Unauthorized", 401)
  }
  return session
}

export async function requireApiRole(...roles: string[]) {
  const session = await requireApiAuth()
  const role = (session.user as any).role
  if (!roles.includes(role)) {
    throw new ApiAuthError("Forbidden: You do not have permission to access this resource", 403)
  }
  return session
}

export class ApiAuthError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function handleApiAuthError(err: unknown) {
  if (err instanceof ApiAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  return NextResponse.json({ error: "Internal server error" }, { status: 500 })
}
