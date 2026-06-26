import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  const tanggal = searchParams.get("tanggal")

  const where: any = {}
  if (userId) where.userId = userId
  if (tanggal) where.tanggal = { gte: new Date(tanggal), lt: new Date(new Date(tanggal).getTime() + 86400000) }

  const attendances = await prisma.attendance.findMany({
    where,
    orderBy: { tanggal: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  })

  return Response.json(attendances)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, action } = await req.json()
  const targetUserId = userId || (session.user as any).id
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (action === "clockIn") {
    const existing = await prisma.attendance.findUnique({
      where: { userId_tanggal: { userId: targetUserId, tanggal: today } },
    })

    if (existing?.clockIn) {
      return Response.json({ error: "Sudah clock-in hari ini" }, { status: 400 })
    }

    const att = await prisma.attendance.upsert({
      where: { userId_tanggal: { userId: targetUserId, tanggal: today } },
      update: { clockIn: new Date(), isPresent: true },
      create: { userId: targetUserId, tanggal: today, clockIn: new Date(), isPresent: true },
    })

    return Response.json(att)
  }

  if (action === "clockOut") {
    const existing = await prisma.attendance.findUnique({
      where: { userId_tanggal: { userId: targetUserId, tanggal: today } },
    })

    if (!existing?.clockIn) {
      return Response.json({ error: "Belum clock-in" }, { status: 400 })
    }

    const att = await prisma.attendance.update({
      where: { userId_tanggal: { userId: targetUserId, tanggal: today } },
      data: { clockOut: new Date() },
    })

    return Response.json(att)
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}
