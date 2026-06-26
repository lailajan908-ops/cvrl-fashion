import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// POST: Generate barcodes for a PO's items after cutting
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { poId, cuttingDate } = await req.json()
  if (!poId) return Response.json({ error: "PO ID required" }, { status: 400 })

  const po = await prisma.productionOrder.findUnique({
    where: { id: poId },
    include: { items: { include: { variasi: { include: { produk: true } } } } },
  })

  if (!po) return Response.json({ error: "PO not found" }, { status: 404 })

  // Check if barcodes already generated
  const existing = await prisma.garmentPiece.count({ where: { poId } })
  if (existing > 0) return Response.json({ error: "Barcode sudah pernah digenerate untuk PO ini" }, { status: 400 })

  const barcodes: { barcode: string; poId: string; produkId: string; size: string; color: string; cuttingDate: Date | null }[] = []

  for (const item of po.items) {
    const totalQty = item.targetQty
    for (let seq = 1; seq <= totalQty; seq++) {
      const barcode = `${po.code}-${item.variasi.produk.kode}-${item.variasi.size}-${item.variasi.warna}-${String(seq).padStart(3, "0")}`
      barcodes.push({
        barcode,
        poId: po.id,
        produkId: item.variasi.produk.id,
        size: item.variasi.size,
        color: item.variasi.warna,
        cuttingDate: cuttingDate ? new Date(cuttingDate) : null,
      })
    }
  }

  // Bulk create
  await prisma.garmentPiece.createMany({ data: barcodes })

  return Response.json({ count: barcodes.length, message: `${barcodes.length} barcode generated` })
}

// GET: Look up barcode info
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const barcode = req.nextUrl.searchParams.get("barcode")
  if (!barcode) return Response.json({ error: "Barcode required" }, { status: 400 })

  const piece = await prisma.garmentPiece.findUnique({
    where: { barcode },
    include: {
      po: true,
      produk: { select: { kode: true, nama: true } },
      scanLogs: { orderBy: { scannedAt: "asc" }, include: { scannedBy: { select: { name: true } } } },
      qcRecords: { include: { qcBy: { select: { name: true } } } },
    },
  })

  if (!piece) return Response.json({ error: "Barcode not found" }, { status: 404 })

  return Response.json(piece)
}
