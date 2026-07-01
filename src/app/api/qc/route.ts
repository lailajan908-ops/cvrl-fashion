import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

const STAGE_ORDER = ["Cut", "SentToSewing", "ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed", "Sold", "Returned"]

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "AdminQC")

    const { searchParams } = new URL(req.url)
  const barcode = searchParams.get("barcode")
  const sewerName = searchParams.get("sewer")

  if (barcode) {
    const records = await prisma.qCRecord.findMany({
      where: { barcodeUnit: { barcode } },
      orderBy: { qcAt: "desc" },
      include: {
        qcBy: { select: { name: true } },
        barcodeUnit: { select: { barcode: true, size: true, color: true, sewerName: true } },
      },
    })
    return Response.json(records)
  }

  // Sewer defect statistics
  if (sewerName) {
    const stats = await prisma.garmentPiece.groupBy({
      by: ["sewerName"],
      where: { sewerName: { not: null } },
      _count: { id: true },
    })

    const piecesWithDefects = await prisma.garmentPiece.findMany({
      where: { sewerName },
      select: {
        id: true,
        qcRecords: {
          where: { result: { not: "Pass" } },
          select: { id: true, result: true },
        },
      },
    })

    const defectCount = piecesWithDefects.reduce((sum, p) => sum + p.qcRecords.length, 0)

    return Response.json({ stats, defectCount })
  }

  // All QC records
  const records = await prisma.qCRecord.findMany({
    orderBy: { qcAt: "desc" },
    take: 100,
    include: {
      qcBy: { select: { name: true } },
      barcodeUnit: { select: { barcode: true, size: true, color: true, sewerName: true, produk: { select: { kode: true } } } },
    },
  })

  return Response.json(records)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "AdminQC")

    const userId = (session.user as any).id
    const { barcode, qcStage, result, defectPhotoPath, notes } = await req.json()

    if (!barcode || !qcStage || !result) {
      return Response.json({ error: "Barcode, stage QC, dan hasil wajib diisi" }, { status: 400 })
    }

    if (!["QC1", "QCFinal"].includes(qcStage)) {
      return Response.json({ error: "Stage QC harus QC1 atau QCFinal" }, { status: 400 })
    }

    if (!["Pass", "Jahitan Rusak", "Bahan Rusak", "Ukuran Salah", "Kotor", "Lainnya"].includes(result)) {
      return Response.json({ error: "Hasil tidak valid" }, { status: 400 })
    }

    const piece = await prisma.garmentPiece.findUnique({
      where: { barcode },
      include: { scanLogs: { orderBy: { scannedAt: "desc" }, take: 1 } },
    })

    if (!piece) {
      return Response.json({ error: "Barcode tidak ditemukan" }, { status: 404 })
    }

    const qcRecord = await prisma.qCRecord.create({
      data: {
        barcodeUnitId: piece.id,
        qcStage,
        result,
        defectPhotoPath,
        qcById: userId,
        notes,
      },
      include: {
        qcBy: { select: { name: true } },
        barcodeUnit: { select: { barcode: true, size: true, color: true, sewerName: true } },
      },
    })

    return Response.json(qcRecord)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

// GET sewer defect summary
export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner", "AdminQC")

  const body = await req.json()

  if (body.action === "defect-summary") {
    const allPieces = await prisma.garmentPiece.findMany({
      where: { sewerName: { not: null } },
      select: {
        id: true,
        sewerName: true,
        _count: { select: { qcRecords: { where: { result: { not: "Pass" } } } } },
      },
    })

    const sewerMap = new Map<string, { name: string; totalPieces: number; defectCount: number }>()

    for (const p of allPieces) {
      if (!p.sewerName) continue
      if (!sewerMap.has(p.sewerName)) {
        sewerMap.set(p.sewerName, { name: p.sewerName, totalPieces: 0, defectCount: 0 })
      }
      const entry = sewerMap.get(p.sewerName)!
      entry.totalPieces++
      entry.defectCount += p._count.qcRecords
    }

    return Response.json(Array.from(sewerMap.values()).map((e) => ({
      ...e,
      defectRate: e.totalPieces > 0 ? ((e.defectCount / e.totalPieces) * 100).toFixed(1) : "0.0",
    })))
  }

  return Response.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
