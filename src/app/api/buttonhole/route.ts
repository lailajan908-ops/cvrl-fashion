import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminQC")

    const records = await prisma.buttonholeRecord.findMany({
      orderBy: { doneAt: "desc" },
      take: 100,
      include: {
        barcodeUnit: {
          select: { barcode: true, size: true, color: true, currentStage: true, produk: { select: { kode: true, nama: true } } },
        },
        doneBy: { select: { name: true } },
      },
    })

    return Response.json(records)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminQC")

    const userId = (session.user as any).id
    const { barcode, notes } = await req.json()

    if (!barcode) {
      return Response.json({ error: "Barcode wajib diisi" }, { status: 400 })
    }

    // Use scan API to advance stage, then record buttonhole
    const piece = await prisma.garmentPiece.findUnique({
      where: { barcode },
      include: { scanLogs: { orderBy: { scannedAt: "desc" }, take: 1 } },
    })

    if (!piece) {
      return Response.json({ error: "Barcode tidak ditemukan" }, { status: 404 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create buttonhole record
      const record = await tx.buttonholeRecord.create({
        data: { barcodeUnitId: piece.id, doneById: userId, notes },
      })

      // Update stage to ButtonHole
      await tx.garmentPiece.update({
        where: { id: piece.id },
        data: { currentStage: "ButtonHole" },
      })

      // Create scan log
      await tx.scanLog.create({
        data: { barcodeUnitId: piece.id, stage: "ButtonHole", scannedById: userId, notes },
      })

      return record
    })

    return Response.json(result)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
