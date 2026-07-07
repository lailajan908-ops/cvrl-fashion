import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const reports = await prisma.cuttingReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        po: { select: { code: true } },
        cutBy: { select: { name: true } },
        details: { include: { bahan: { select: { kode: true, nama: true, satuan: true } } } },
      },
    })

    return Response.json(reports)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const userId = (session.user as any).id
  const body = await req.json()
  const { poId, reportDate, panelLength, panelCount, photoPath, details } = body

  if (!poId || !details || details.length === 0) {
    return Response.json({ error: "PO dan minimal 1 detail wajib diisi" }, { status: 400 })
  }

  if (!photoPath) {
    return Response.json({ error: "Foto laporan potong wajib diupload" }, { status: 400 })
  }

  // Use a transaction to ensure atomicity
  const report = await prisma.$transaction(async (tx) => {
    // Create the report
    const cuttingReport = await tx.cuttingReport.create({
      data: {
        poId,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        panelLength: panelLength || null,
        panelCount: panelCount || null,
        photoPath,
        cutById: userId,
        totalMaterialUsed: 0,
        totalResultQty: 0,
      },
    })

    let totalMaterial = 0
    let totalResult = 0
    const allBarcodes: { barcode: string; poId: string; produkId: string; size: string; color: string; cuttingDate: Date; cuttingReportId: string }[] = []

    // Get PO info for barcode generation
    const po = await tx.productionOrder.findUnique({
      where: { id: poId },
      include: { items: { include: { variasi: { include: { produk: true } } } } },
    })
    if (!po) throw new Error("PO not found")

    // Validate stock availability
    for (const d of details) {
      const bahan = await tx.bahan.findUnique({ where: { id: d.bahanId } })
      if (!bahan || bahan.stok < d.amountUsed) {
        throw new Error(`Stok ${bahan?.nama || d.bahanId} tidak mencukupi (tersedia: ${bahan?.stok ?? 0}, dibutuhkan: ${d.amountUsed})`)
      }
    }

    for (const d of details) {
      const resultQty = d.cuttingCount * d.perPieceMultiplier
      const finalResultQty = d.resultQtyOverride || resultQty
      totalMaterial += d.amountUsed
      totalResult += finalResultQty

      // Create detail
      await tx.cuttingReportDetail.create({
        data: {
          cuttingReportId: cuttingReport.id,
          bahanId: d.bahanId,
          size: d.size,
          warna: d.warna,
          unitUsedMode: d.unitUsedMode,
          amountUsed: d.amountUsed,
          cuttingCount: d.cuttingCount,
          perPieceMultiplier: d.perPieceMultiplier,
          resultQty: d.resultQtyOverride || resultQty,
        },
      })

      // Deduct stock from Bahan
      await tx.bahan.update({
        where: { id: d.bahanId },
        data: { stok: { decrement: d.amountUsed } },
      })

      // Find the produkId for this size
      const poItem = po.items.find(
        (item) => item.variasi.size === d.size && item.variasi.warna === d.warna
      )
      if (!poItem) continue

      const baseBarcode = `${po.code}-${poItem.variasi.produk.kode}-${d.size}-${d.warna}`

      // Check existing barcodes for this PO to continue sequence
      const existingCount = await tx.garmentPiece.count({
        where: { poId, produkId: poItem.variasi.produk.id, size: d.size, color: d.warna },
      })

      for (let seq = 1; seq <= finalResultQty; seq++) {
        const seqNum = existingCount + seq
        const barcode = `${baseBarcode}-${String(seqNum).padStart(3, "0")}`
        allBarcodes.push({
          barcode,
          poId: po.id,
          produkId: poItem.variasi.produk.id,
          size: d.size,
          color: d.warna,
          cuttingDate: reportDate ? new Date(reportDate) : new Date(),
          cuttingReportId: cuttingReport.id,
        })
      }
    }

    // Bulk create barcode units
    if (allBarcodes.length > 0) {
      await tx.garmentPiece.createMany({ data: allBarcodes })

      // Create scan logs for Cut stage
      const createdPieces = await tx.garmentPiece.findMany({
        where: { cuttingReportId: cuttingReport.id },
      })

      await tx.scanLog.createMany({
        data: createdPieces.map((p) => ({
          barcodeUnitId: p.id,
          stage: "Cut",
          scannedById: userId,
          scannedAt: reportDate ? new Date(reportDate) : new Date(),
        })),
      })
    }

    // Update totals on report
    await tx.cuttingReport.update({
      where: { id: cuttingReport.id },
      data: { totalMaterialUsed: totalMaterial, totalResultQty: totalResult },
    })

    return await tx.cuttingReport.findUnique({
      where: { id: cuttingReport.id },
      include: {
        po: { select: { code: true } },
        cutBy: { select: { name: true } },
        details: { include: { bahan: { select: { kode: true, nama: true, satuan: true } } } },
      },
    })
  })

  return Response.json(report)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
