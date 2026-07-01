import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function PATCH(req: NextRequest) {
  try {
    await requireApiRole("Owner")

    const { id, role, isActive } = await req.json()

    if (!id) {
      return Response.json({ error: "ID required" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (role !== undefined) data.role = role
    if (isActive !== undefined) data.isActive = isActive

    if (Object.keys(data).length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    })

    return Response.json(user)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
