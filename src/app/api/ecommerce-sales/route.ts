import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    const { searchParams } = new URL(req.url)
    const platform = searchParams.get("platform")
    const status = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: any = {}
    if (platform) where.platform = platform
    if (status) where.status = status
    if (from) where.orderDate = { ...where.orderDate, gte: new Date(from) }
    if (to) where.orderDate = { ...where.orderDate, lte: new Date(to + "T23:59:59.999Z") }

    const sales = await prisma.ecommerceSale.findMany({
      where,
      orderBy: { orderDate: "desc" },
      take: 100,
      include: {
        _count: { select: { payments: true } },
        payments: {
          select: { id: true, amount: true, status: true, paymentMethod: true, paymentDate: true },
        },
      },
    })

    return Response.json(sales)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    const { platform, orderId, orderDate, customerName, totalAmount, shippingCost, platformFee, netAmount, status, notes } = await req.json()

    if (!platform || !orderId || !orderDate || totalAmount === undefined) {
      return Response.json({ error: "Platform, Order ID, tanggal, dan total wajib diisi" }, { status: 400 })
    }

    const existing = await prisma.ecommerceSale.findUnique({
      where: { platform_orderId: { platform, orderId } },
    })
    if (existing) {
      return Response.json({ error: "Order ID sudah ada untuk platform ini" }, { status: 409 })
    }

    const sale = await prisma.ecommerceSale.create({
      data: {
        platform,
        orderId,
        orderDate: new Date(orderDate),
        customerName: customerName || null,
        totalAmount,
        shippingCost: shippingCost || 0,
        platformFee: platformFee || 0,
        netAmount: netAmount ?? (totalAmount - (shippingCost || 0) - (platformFee || 0)),
        status: status || "Processing",
        notes: notes || null,
      },
      include: {
        _count: { select: { payments: true } },
        payments: {
          select: { id: true, amount: true, status: true, paymentMethod: true, paymentDate: true },
        },
      },
    })

    return Response.json(sale)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
