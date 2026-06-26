import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (id) {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        soldBy: { select: { name: true } },
        items: {
          include: {
            barcodeUnit: {
              select: { barcode: true, size: true, color: true, produk: { select: { kode: true, nama: true } } },
            },
          },
        },
      },
    })
    return Response.json(sale)
  }

  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      soldBy: { select: { name: true } },
      _count: { select: { items: true } },
    },
  })

  return Response.json(sales)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const { items, customerName, notes } = await req.json()

  if (!items || items.length === 0) {
    return Response.json({ error: "Minimal 1 item" }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    let totalAmount = 0
    const saleItems: { barcodeUnitId: string; price: number }[] = []

    for (const item of items) {
      const piece = await tx.garmentPiece.findUnique({ where: { barcode: item.barcode } })
      if (!piece) throw new Error(`Barcode ${item.barcode} tidak ditemukan`)
      if (piece.currentStage !== "Packed") {
        throw new Error(`Barcode ${item.barcode} belum di-pack (stage: ${piece.currentStage})`)
      }

      saleItems.push({ barcodeUnitId: piece.id, price: item.price || 0 })
      totalAmount += item.price || 0
    }

    const sale = await tx.sale.create({
      data: {
        customerName: customerName || null,
        totalAmount,
        soldById: userId,
        notes,
        items: { create: saleItems },
      },
    })

    // Update pieces to Sold stage
    for (const item of items) {
      const piece = await tx.garmentPiece.findUnique({ where: { barcode: item.barcode } })
      if (piece) {
        await tx.garmentPiece.update({
          where: { id: piece.id },
          data: { currentStage: "Sold" },
        })
        await tx.scanLog.create({
          data: { barcodeUnitId: piece.id, stage: "Sold", scannedById: userId },
        })
      }
    }

    return sale
  })

  return Response.json(result)
}
