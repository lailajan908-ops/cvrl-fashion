import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
}
