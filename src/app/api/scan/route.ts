import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

const STAGE_ORDER = ["Cut", "SentToSewing", "ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed", "Sold", "Returned"]

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminGudang", "AdminQC")

    const userId = (session.user as any).id
    const { barcode, stage, notes } = await req.json()

    if (!barcode || !stage) {
      return Response.json({ error: "Barcode dan stage wajib diisi" }, { status: 400 })
    }

    if (!STAGE_ORDER.includes(stage)) {
      return Response.json({ error: `Stage tidak valid. Harus salah satu: ${STAGE_ORDER.join(", ")}` }, { status: 400 })
    }

    // Find the garment piece
    const piece = await prisma.garmentPiece.findUnique({
      where: { barcode },
      include: { scanLogs: { orderBy: { scannedAt: "desc" }, take: 1 } },
    })

    if (!piece) {
      return Response.json({ error: "Barcode tidak ditemukan" }, { status: 404 })
    }

    // Validate stage order
    const lastScan = piece.scanLogs[0]
    if (lastScan) {
      const lastIdx = STAGE_ORDER.indexOf(lastScan.stage)
      const currentIdx = STAGE_ORDER.indexOf(stage)

      if (currentIdx <= lastIdx) {
        return Response.json({
          error: `Tidak bisa scan stage "${stage}" setelah "${lastScan.stage}". Stage harus berurutan.`,
        }, { status: 400 })
      }

      // Must be exactly the next stage
      if (currentIdx !== lastIdx + 1) {
        return Response.json({
          error: `Stage "${stage}" tidak valid. Stage selanjutnya setelah "${lastScan.stage}" adalah "${STAGE_ORDER[lastIdx + 1]}".`,
        }, { status: 400 })
      }
    } else {
      // First scan must be "Cut"
      if (stage !== "Cut") {
        return Response.json({ error: "Scan pertama harus stage 'Cut'" }, { status: 400 })
      }
    }

    // Create scan log (INSERT ONLY)
    const scanLog = await prisma.scanLog.create({
      data: {
        barcodeUnitId: piece.id,
        stage,
        scannedById: userId,
        notes,
      },
    })

    // Update currentStage on GarmentPiece
    await prisma.garmentPiece.update({
      where: { id: piece.id },
      data: { currentStage: stage },
    })

    return Response.json(scanLog)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

// GET: Get scan history for a barcode
export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang", "AdminQC")

    const barcode = req.nextUrl.searchParams.get("barcode")
    if (!barcode) return Response.json({ error: "Barcode required" }, { status: 400 })

    const logs = await prisma.scanLog.findMany({
      where: { barcodeUnit: { barcode } },
      orderBy: { scannedAt: "asc" },
      include: { scannedBy: { select: { name: true } } },
    })

    return Response.json(logs)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
