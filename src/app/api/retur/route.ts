import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "AdminQC")

    const returns = await prisma.customerReturn.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        barcodeUnit: {
          select: { barcode: true, size: true, color: true, currentStage: true, sewerName: true, produk: { select: { kode: true, nama: true } }, po: { select: { code: true } } },
        },
        returnedBy: { select: { name: true } },
      },
    })

    return Response.json(returns)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "AdminQC")

    const userId = (session.user as any).id
  const { barcode, returnDate, reason, condition, notes } = await req.json()

  if (!barcode || !reason || !condition) {
    return Response.json({ error: "Barcode, alasan, dan kondisi wajib diisi" }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const piece = await tx.garmentPiece.findUnique({ where: { barcode } })
    if (!piece) throw new Error("Barcode tidak ditemukan")

    const retur = await tx.customerReturn.create({
      data: {
        barcodeUnitId: piece.id,
        returnDate: returnDate ? new Date(returnDate) : new Date(),
        reason,
        condition,
        returnedById: userId,
        notes,
      },
    })

    await tx.garmentPiece.update({
      where: { id: piece.id },
      data: { currentStage: "Returned" },
    })

    await tx.scanLog.create({
      data: { barcodeUnitId: piece.id, stage: "Returned", scannedById: userId, notes: `Retur: ${reason}` },
    })

    return retur
  })

  return Response.json(result)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
