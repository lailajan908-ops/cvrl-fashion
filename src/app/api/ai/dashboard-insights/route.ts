import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiAuth, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiAuth()

    const stages = ["Cut", "SentToSewing", "ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed", "Sold", "Returned"]
    const stageCounts = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.garmentPiece.count({ where: { currentStage: stage } })
        return { stage, count }
      })
    )

    const totalInProduction = stageCounts
      .filter(s => !["Packed", "Sold", "Returned"].includes(s.stage))
      .reduce((a, s) => a + s.count, 0)

    const bahanList = await prisma.bahan.findMany()
    const lowStok = bahanList.filter(b => b.stok <= b.stokMinimum)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const attendToday = await prisma.attendance.count({
      where: { tanggal: today, isPresent: true },
    })

    const recentSales = await prisma.sale.findMany({
      orderBy: { saleDate: "desc" },
      take: 30,
      include: { items: true },
    })

    const totalRevenue = recentSales.reduce((sum, s) => sum + s.totalAmount, 0)
    const avgOrderValue = recentSales.length > 0 ? totalRevenue / recentSales.length : 0

    const totalUsers = await prisma.user.count({ where: { isActive: true } })

    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return Response.json({
        insights: generateLocalInsights(stageCounts, totalInProduction, lowStok, attendToday, totalRevenue, avgOrderValue, totalUsers, bahanList, recentSales),
        alerts: generateLocalAlerts(lowStok, stageCounts, recentSales),
      })
    }

    const prompt = `Analisis data produksi fashion ini dan berikan insight strategis dalam Bahasa Indonesia:

DATA PRODUKSI:
- Total potong: ${stageCounts.find(s => s.stage === "Cut")?.count || 0}
- Dalam penjahitan: ${stageCounts.find(s => s.stage === "SentToSewing")?.count || 0}
- QC1: ${stageCounts.find(s => s.stage === "QC1")?.count || 0}
- QC Final: ${stageCounts.find(s => s.stage === "QCFinal")?.count || 0}
- Packing: ${stageCounts.find(s => s.stage === "Packed")?.count || 0}
- Terjual: ${stageCounts.find(s => s.stage === "Sold")?.count || 0}
- Retur: ${stageCounts.find(s => s.stage === "Returned")?.count || 0}
- Total dalam proses produksi: ${totalInProduction}
- Total pendapatan (30 transaksi terakhir): Rp${totalRevenue.toLocaleString("id-ID")}
- Rata-rata nilai pesanan: Rp${avgOrderValue.toLocaleString("id-ID")}
- Karyawan hadir hari ini: ${attendToday}
- Total karyawan aktif: ${totalUsers}
- Bahan kritis (stok minim): ${lowStok.map(b => `${b.nama} (${b.warna}): ${b.stok} ${b.satuan}`).join(", ")}

Beri 3 insight dalam format JSON:
{
  "insights": [
    { "icon": "trending-up|alert-triangle|users|shopping-cart|package|scissors", "title": "judul insight", "description": "deskripsi detail", "type": "positive|warning|info" }
  ]
}`

    try {
      const OpenAI = (await import("openai")).default
      const openai = new OpenAI({ apiKey })

      const res = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "Kamu adalah AI analis bisnis fashion. Output JSON saja." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      })

      const content = JSON.parse(res.choices[0].message.content || "{}")

      return Response.json({
        insights: content.insights || generateLocalInsights(stageCounts, totalInProduction, lowStok, attendToday, totalRevenue, avgOrderValue, totalUsers, bahanList, recentSales),
        alerts: generateLocalAlerts(lowStok, stageCounts, recentSales),
        metadata: { totalInProduction, totalRevenue, avgOrderValue, attendToday, totalUsers },
      })
    } catch {
      return Response.json({
        insights: generateLocalInsights(stageCounts, totalInProduction, lowStok, attendToday, totalRevenue, avgOrderValue, totalUsers, bahanList, recentSales),
        alerts: generateLocalAlerts(lowStok, stageCounts, recentSales),
        metadata: { totalInProduction, totalRevenue, avgOrderValue, attendToday, totalUsers },
      })
    }
  } catch (err) {
    return handleApiAuthError(err)
  }
}

function generateLocalInsights(stageCounts: any[], totalInProduction: number, lowStok: any[], attendToday: number, totalRevenue: number, avgOrderValue: number, totalUsers: number, bahanList: any[], recentSales: any[]) {
  const insights: any[] = []

  const sold = stageCounts.find((s: any) => s.stage === "Sold")?.count || 0
  if (sold > 0) {
    insights.push({
      icon: "trending-up",
      title: `Produktivitas: ${totalInProduction} unit dalam produksi`,
      description: `Terdapat ${totalInProduction} unit pakaian yang sedang dalam proses produksi. ${sold} unit telah terjual.`,
      type: "positive",
    })
  }

  if (lowStok.length > 0) {
    insights.push({
      icon: "alert-triangle",
      title: `${lowStok.length} bahan perlu restock`,
      description: `${lowStok.slice(0, 3).map((b: any) => `${b.nama} (${b.warna}): ${b.stok} ${b.satuan}`).join(", ")}${lowStok.length > 3 ? `, +${lowStok.length - 3} lainnya` : ""}`,
      type: "warning",
    })
  }

  if (attendToday > 0) {
    insights.push({
      icon: "users",
      title: `${attendToday}/${totalUsers} karyawan hadir`,
      description: `Tingkat kehadiran hari ini ${Math.round((attendToday / totalUsers) * 100)}%. ${attendToday < totalUsers * 0.7 ? "Perlu perhatian karena tingkat kehadiran rendah." : "Produktivitas tim terjaga dengan baik."}`,
      type: attendToday < totalUsers * 0.7 ? "warning" : "positive",
    })
  }

  return insights
}

function generateLocalAlerts(lowStok: any[], stageCounts: any[], recentSales: any[]) {
  const alerts: any[] = []

  if (lowStok.length > 0) {
    lowStok.slice(0, 3).forEach((b: any) => {
      alerts.push({
        type: "high",
        text: `Stok ${b.nama} (${b.warna}) tinggal ${b.stok} ${b.satuan}`,
        action: "Pesan ulang sekarang",
      })
    })
  }

  const inSewing = stageCounts.find((s: any) => s.stage === "SentToSewing")?.count || 0
  const inQC = stageCounts.find((s: any) => s.stage === "QC1")?.count || 0
  if (inSewing > 50) {
    alerts.push({
      type: "medium",
      text: `${inSewing} unit menumpuk di penjahitan — alokasi ulang sumber daya`,
      action: "Review jadwal produksi",
    })
  }
  if (inQC > 30) {
    alerts.push({
      type: "medium",
      text: `${inQC} unit menunggu QC — percepat inspeksi`,
      action: "Lihat antrian QC",
    })
  }

  const returned = stageCounts.find((s: any) => s.stage === "Returned")?.count || 0
  if (returned > 5) {
    alerts.push({
      type: "high",
      text: `${returned} unit diretur — investigasi penyebab`,
      action: "Cek retur",
    })
  }

  return alerts
}
