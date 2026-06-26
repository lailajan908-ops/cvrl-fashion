import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const periode = searchParams.get("periode")
  const userId = searchParams.get("userId")

  const where: any = {}
  if (periode) where.periode = periode
  if (userId) where.userId = userId

  const payrolls = await prisma.payroll.findMany({
    where,
    orderBy: [{ periode: "desc" }, { user: { name: "asc" } }],
    include: { user: { select: { name: true, role: true, payrollType: true, dailyRate: true, monthlySalary: true, pieceRate: true } } },
  })

  return Response.json(payrolls)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { userId, periode } = await req.json()
  if (!userId || !periode) return Response.json({ error: "User ID dan periode wajib" }, { status: 400 })

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error("User tidak ditemukan")

    // Parse periode (format: YYYY-MM)
    const [year, month] = periode.split("-").map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    // Count attendance days
    const attendances = await tx.attendance.findMany({
      where: {
        userId,
        tanggal: { gte: startDate, lte: endDate },
        isPresent: true,
      },
    })

    const totalDays = attendances.length

    let basePay = 0
    let totalPieces = attendances.length

    if (user.payrollType === "HarianTetap") {
      basePay = user.dailyRate * totalDays
    } else if (user.payrollType === "BulananTetap") {
      basePay = user.monthlySalary
    } else if (user.payrollType === "HarianBorongan") {
      // Count pieces they sewed in this period
      const pieces = await tx.garmentPiece.count({
        where: {
          sewerName: user.name,
          currentStage: { in: ["ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed", "Sold"] },
          cuttingDate: { gte: startDate, lte: endDate },
        },
      })
      totalPieces = pieces
      basePay = user.pieceRate * pieces
    }

    // Upsert payroll
    const payroll = await tx.payroll.upsert({
      where: { userId_periode: { userId, periode } },
      update: { totalDays, totalPieces, basePay },
      create: { userId, periode, totalDays, totalPieces, basePay },
    })

    return payroll
  })

  return Response.json(result)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id, action, bonus, deductions } = await req.json()
  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  if (action === "pay") {
    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        bonus: bonus || 0,
        deductions: deductions || 0,
        netPay: { increment: 0 },
        status: "Paid",
        paidAt: new Date(),
      },
    })

    // Recalculate netPay
    const netPay = payroll.basePay + (bonus || 0) - (deductions || 0)
    await prisma.payroll.update({ where: { id }, data: { netPay } })

    return Response.json({ ...payroll, netPay })
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
}
