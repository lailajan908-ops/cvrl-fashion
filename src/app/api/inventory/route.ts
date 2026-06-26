import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "overview"

  if (type === "overview") {
    // Count pieces per stage
    const stages = ["Cut", "SentToSewing", "ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed", "Sold", "Returned"]
    const stageCounts = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.garmentPiece.count({ where: { currentStage: stage } })
        return { stage, count }
      })
    )

    // Bahan stock summary
    const bahanList = await prisma.bahan.findMany({
      orderBy: { kode: "asc" },
    })

    return Response.json({ stageCounts, bahanStok: bahanList })
  }

  if (type === "bahan") {
    const bahanList = await prisma.bahan.findMany({
      orderBy: { kode: "asc" },
      include: {
        _count: { select: { cuttingDetails: true } },
      },
    })
    return Response.json(bahanList)
  }

  // Finished goods (Packed or later)
  const finished = await prisma.garmentPiece.findMany({
    where: { currentStage: { in: ["Packed", "Sold"] } },
    orderBy: { id: "desc" },
    take: 100,
    include: {
      po: { select: { code: true } },
      produk: { select: { kode: true, nama: true } },
      scanLogs: { where: { stage: "Packed" }, take: 1, orderBy: { scannedAt: "desc" } },
    },
  })

  return Response.json(finished)
}
