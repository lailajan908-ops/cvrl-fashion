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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id
  const body = await req.json()
  const { poId, partnerId, barcodes, notes } = body

  if (!partnerId || !barcodes || barcodes.length === 0) {
    return Response.json({ error: "Partner dan minimal 1 barcode wajib diisi" }, { status: 400 })
  }

  const report = await prisma.$transaction(async (tx) => {
    // Find all garment pieces by barcode
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

    // Validate all pieces are in "Cut" stage
    const invalid = pieces.filter((p) => p.currentStage !== "Cut")
    if (invalid.length > 0) {
      throw new Error(`Barcode berikut sudah dikirim: ${invalid.map((p) => p.barcode).join(", ")}`)
    }

    // Create the sewing report
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

    // Update garment pieces: stage → SentToSewing, assign sewerName
    for (const p of pieces) {
      const partner = await tx.sewingPartner.findUnique({ where: { id: partnerId } })
      await tx.garmentPiece.update({
        where: { id: p.id },
        data: {
          currentStage: "SentToSewing",
          sewerName: partner?.nama || null,
        },
      })

      // Create scan log
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
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

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

      // Find the detail record
      const detail = sewingReport.details.find((d) => d.barcodeUnitId === piece.id)
      if (!detail) throw new Error(`Barcode ${barcode} tidak ada di report ini`)

      // Update detail status
      await tx.sewingReportDetail.update({
        where: { id: detail.id },
        data: { status: "Received", receivedAt: new Date() },
      })

      // Update garment piece stage
      await tx.garmentPiece.update({
        where: { id: piece.id },
        data: { currentStage: "ReceivedFromSewing" },
      })

      // Create scan log
      await tx.scanLog.create({
        data: {
          barcodeUnitId: piece.id,
          stage: "ReceivedFromSewing",
          scannedById: userId,
        },
      })
    }

    // Update report status
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
}
