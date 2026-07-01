import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "AdminGudang", "ManagerProduksi")

    const batches = await prisma.packingBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        packedBy: { select: { name: true } },
        po: { select: { code: true } },
        _count: { select: { items: true } },
      },
    })

    return Response.json(batches)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "AdminGudang", "ManagerProduksi")

    const userId = (session.user as any).id
    const { poId, barcodes, notes } = await req.json()

    if (!barcodes || barcodes.length === 0) {
      return Response.json({ error: "Minimal 1 barcode" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      // Validate all barcodes exist and are in QCFinal stage
      const pieces = await tx.garmentPiece.findMany({
        where: { barcode: { in: barcodes } },
      })

      if (pieces.length !== barcodes.length) {
        const found = new Set(pieces.map((p) => p.barcode))
        const missing = barcodes.filter((b: string) => !found.has(b))
        throw new Error(`Barcode tidak ditemukan: ${missing.join(", ")}`)
      }

      const invalid = pieces.filter((p) => p.currentStage !== "QCFinal" && p.currentStage !== "ButtonHole")
      if (invalid.length > 0) {
        throw new Error(`Barcode berikut belum siap packing: ${invalid.map((p) => p.barcode).join(", ")}`)
      }

      const batchNumber = `PCK-${Date.now()}`
      const batch = await tx.packingBatch.create({
        data: {
          batchNumber,
          poId: poId || null,
          packedById: userId,
          totalPieces: pieces.length,
          notes,
          items: {
            create: pieces.map((p) => ({ barcodeUnitId: p.id })),
          },
        },
      })

      // Update pieces to Packed stage
      for (const p of pieces) {
        await tx.garmentPiece.update({
          where: { id: p.id },
          data: { currentStage: "Packed" },
        })
        await tx.scanLog.create({
          data: { barcodeUnitId: p.id, stage: "Packed", scannedById: userId },
        })
      }

      return batch
    })

    return Response.json(result)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
