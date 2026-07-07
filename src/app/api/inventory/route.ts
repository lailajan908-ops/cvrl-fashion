import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "AdminGudang", "AdminPenjualan")

    const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "overview"

  if (type === "overview") {
    const stages = ["Cut", "SentToSewing", "ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed", "Sold", "Returned"]
    const stageCounts = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.garmentPiece.count({ where: { currentStage: stage } })
        return { stage, count }
      })
    )

    const bahanList = await prisma.bahan.findMany({ orderBy: { kode: "asc" } })

    const poItems = await prisma.pOItem.findMany({
      take: 5,
      orderBy: { po: { createdAt: "desc" } },
      include: {
        po: { select: { code: true } },
        variasi: { include: { produk: { select: { nama: true } } } },
      },
    })

    const topProduksi = poItems.map((item) => ({
      po: item.po.code,
      produk: item.variasi.produk.nama,
      warna: item.variasi.warna,
      size: item.variasi.size,
      stage: "SentToSewing",
      priority: item.targetQty > 100 ? "High" : item.targetQty > 50 ? "Normal" : "Low",
    }))

    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    const sewingStatus = activeUsers.slice(0, 7).map((u) => ({
      name: u.name,
      status: ["Active", "Active", "On Break", "Off", "Active", "Active", "On Break"][Math.floor(Math.random() * 7)],
      lastActivity: `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}`,
      sisa: Math.floor(Math.random() * 50),
    }))

    const topProducts = [
      { name: "Kemeja Denim Pria", sold: 342, price: 89900, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80" },
      { name: "Cardigan Wanita", sold: 287, price: 129000, image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80" },
      { name: "Jaket Bomber", sold: 198, price: 159000, image: "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80" },
      { name: "Kaos Oversize", sold: 512, price: 59900, image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80" },
      { name: "Celana Chino", sold: 165, price: 119000, image: "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=400&q=80" },
    ]

    return Response.json({ stageCounts, bahanStok: bahanList, topProduksi, sewingStatus, topProducts })
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
  } catch (err) {
    return handleApiAuthError(err)
  }
}
