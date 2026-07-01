import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminQC")

    const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (id) {
    const report = await prisma.sewingReport.findUnique({
      where: { id },
      include: {
        partner: { select: { nama: true } },
        sentBy: { select: { name: true } },
        receivedBy: { select: { name: true } },
        po: { select: { code: true } },
        details: {
          include: {
            barcodeUnit: {
              select: { barcode: true, size: true, color: true, currentStage: true, produk: { select: { kode: true, nama: true } } },
            },
          },
        },
      },
    })
    return Response.json(report)
  }

  const reports = await prisma.sewingReport.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      partner: { select: { nama: true } },
      sentBy: { select: { name: true } },
      receivedBy: { select: { name: true } },
      po: { select: { code: true } },
      _count: { select: { details: true } },
    },
  })

  return Response.json(reports)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminQC")

    const userId = (session.user as any).id
    const body = await req.json()
    const { poId, partnerId, barcodes, notes } = body

    if (!partnerId || !barcodes || barcodes.length === 0) {
      return Response.json({ error: "Partner dan minimal 1 barcode wajib diisi" }, { status: 400 })
    }

    const report = await prisma.$transaction(async (tx) => {
      const pieces = await tx.garmentPiece.findMany({
        where: { barcode: { in: barcodes } },
      })

      if (pieces.length === 0) {
        throw new Error("Tidak ada barcode yang ditemukan")
      }

      if (pieces.length !== barcodes.length) {
        const found = new Set(pieces.map((p) => p.barcode))
        const missing = barcodes.filter((b: string) => !found.has(b))
        throw new Error(`Barcode tidak ditemukan: ${missing.join(", ")}`)
      }

      const invalid = pieces.filter((p) => p.currentStage !== "Cut")
      if (invalid.length > 0) {
        throw new Error(`Barcode berikut sudah dikirim: ${invalid.map((p) => p.barcode).join(", ")}`)
      }

      const sewingReport = await tx.sewingReport.create({
        data: {
          poId: poId || null,
          partnerId,
          sentById: userId,
          notes,
          details: {
            create: pieces.map((p) => ({
              barcodeUnitId: p.id,
            })),
          },
        },
      })

      for (const p of pieces) {
        const partner = await tx.sewingPartner.findUnique({ where: { id: partnerId } })
        await tx.garmentPiece.update({
          where: { id: p.id },
          data: {
            currentStage: "SentToSewing",
            sewerName: partner?.nama || null,
          },
        })

        await tx.scanLog.create({
          data: {
            barcodeUnitId: p.id,
            stage: "SentToSewing",
            scannedById: userId,
          },
        })
      }

      return sewingReport
    })

    return Response.json(report)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminQC")

    const userId = (session.user as any).id
    const body = await req.json()
    const { reportId, barcodes } = body

    if (!reportId || !barcodes || barcodes.length === 0) {
      return Response.json({ error: "Report ID dan barcode wajib diisi" }, { status: 400 })
    }

    const report = await prisma.$transaction(async (tx) => {
      const sewingReport = await tx.sewingReport.findUnique({
        where: { id: reportId },
        include: { details: { include: { barcodeUnit: true } } },
      })

      if (!sewingReport) throw new Error("Report tidak ditemukan")

      for (const barcode of barcodes) {
        const piece = await tx.garmentPiece.findUnique({ where: { barcode } })
        if (!piece) throw new Error(`Barcode ${barcode} tidak ditemukan`)
        if (piece.currentStage !== "SentToSewing") {
          throw new Error(`Barcode ${barcode} tidak dalam status dikirim`)
        }

        const detail = sewingReport.details.find((d) => d.barcodeUnitId === piece.id)
        if (!detail) throw new Error(`Barcode ${barcode} tidak ada di report ini`)

        await tx.sewingReportDetail.update({
          where: { id: detail.id },
          data: { status: "Received", receivedAt: new Date() },
        })

        await tx.garmentPiece.update({
          where: { id: piece.id },
          data: { currentStage: "ReceivedFromSewing" },
        })

        await tx.scanLog.create({
          data: {
            barcodeUnitId: piece.id,
            stage: "ReceivedFromSewing",
            scannedById: userId,
          },
        })
      }

      const totalDetails = sewingReport.details.length
      const receivedDetails = await tx.sewingReportDetail.count({
        where: { sewingReportId: reportId, status: "Received" },
      })

      let newStatus = "PartialReceived"
      if (receivedDetails === totalDetails) newStatus = "Received"

      await tx.sewingReport.update({
        where: { id: reportId },
        data: {
          status: newStatus,
          receivedById: newStatus === "Received" ? userId : null,
          receivedAt: newStatus === "Received" ? new Date() : null,
        },
      })

      return await tx.sewingReport.findUnique({
        where: { id: reportId },
        include: {
          partner: { select: { nama: true } },
          sentBy: { select: { name: true } },
          receivedBy: { select: { name: true } },
          po: { select: { code: true } },
          details: {
            include: {
              barcodeUnit: {
                select: { barcode: true, size: true, color: true, currentStage: true },
              },
            },
          },
        },
      })
    })

    return Response.json(report)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
