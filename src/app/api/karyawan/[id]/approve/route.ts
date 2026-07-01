import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireApiRole("Owner")

    const body = await req.json()
    const { roles } = body

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json({ error: "Minimal 1 role wajib dipilih" }, { status: 400 })
    }

    if (roles.length > 4) {
      return NextResponse.json({ error: "Maksimal 4 role" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: "ACTIVE",
        isActive: true,
        roles,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (err) {
    return handleApiAuthError(err)
  }
}