import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiAuth, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiAuth()

    const { searchParams } = new URL(req.url)
    const after = searchParams.get("after")

    const where: any = {}
    if (after) where.createdAt = { gt: new Date(after) }

    const messages = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    })

    return Response.json(messages)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiAuth()

    const userId = (session.user as any).id
    const { message } = await req.json()

    if (!message?.trim()) {
      return Response.json({ error: "Pesan tidak boleh kosong" }, { status: 400 })
    }

    const msg = await prisma.chatMessage.create({
      data: { senderId: userId, message: message.trim() },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    })

    return Response.json(msg)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
