import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const platform = searchParams.get("platform")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const where: any = {}
  if (status) where.status = status
  if (platform) where.ecommerceSale = { platform }
  if (from) where.paymentDate = { ...where.paymentDate, gte: new Date(from) }
  if (to) where.paymentDate = { ...where.paymentDate, lte: new Date(to + "T23:59:59.999Z") }

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { paymentDate: "desc" },
    take: 100,
    include: {
      ecommerceSale: { select: { platform: true, orderId: true, customerName: true, totalAmount: true } },
      sale: { select: { customerName: true, totalAmount: true, saleDate: true } },
      recordedBy: { select: { name: true } },
    },
  })

  return Response.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const { ecommerceSaleId, saleId, amount, paymentMethod, paymentDate, status, referenceNumber, notes } = await req.json()

  if (!amount || !paymentMethod || !paymentDate) {
    return Response.json({ error: "Jumlah, metode, dan tanggal wajib diisi" }, { status: 400 })
  }

  const payment = await prisma.payment.create({
    data: {
      ecommerceSaleId: ecommerceSaleId || null,
      saleId: saleId || null,
      amount,
      paymentMethod,
      paymentDate: new Date(paymentDate),
      status: status || "Pending",
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      recordedById: userId,
    },
    include: {
      ecommerceSale: { select: { platform: true, orderId: true } },
      sale: { select: { customerName: true, totalAmount: true } },
      recordedBy: { select: { name: true } },
    },
  })

  return Response.json(payment)
}
