import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
}
