import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiAuth, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiAuth()

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
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiAuth()

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
  } catch (err) {
    return handleApiAuthError(err)
  }
}
