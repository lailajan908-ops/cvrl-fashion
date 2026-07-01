import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    // Get all produk with variasi for pre-fill
  const produkList = await prisma.produk.findMany({
    include: {
      variasi: true,
      garmentPieces: {
        where: { currentStage: { not: "Sold" } },
        select: { size: true, color: true },
      },
    },
    orderBy: { kode: "asc" },
  })

  // Count available stock per variasi
  const stockMap = new Map<string, number>()
  for (const p of produkList) {
    for (const g of p.garmentPieces) {
      const key = `${p.kode}-${g.size}-${g.color}`
      stockMap.set(key, (stockMap.get(key) || 0) + 1)
    }
  }

  const rows: any[] = []
  for (const p of produkList) {
    for (const v of p.variasi) {
      const sku = v.sku
      const stock = stockMap.get(`${p.kode}-${v.size}-${v.warna}`) || 0
      rows.push({
        Platform: "",
        "Kode Produk": p.kode,
        "Nama Produk": p.nama,
        Size: v.size,
        Warna: v.warna,
        SKU: sku,
        Harga: "",
        Stok: stock,
        Deskripsi: p.deskripsi || "",
        "Berat (gram)": "",
        Kategori: "",
      })
    }
  }

  // If no products, add a blank row with headers
  if (rows.length === 0) {
    rows.push({
      Platform: "",
      "Kode Produk": "",
      "Nama Produk": "",
      Size: "",
      Warna: "",
      SKU: "",
      Harga: "",
      Stok: "",
      Deskripsi: "",
      "Berat (gram)": "",
      Kategori: "",
    })
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws["!cols"] = [
    { wch: 12 }, { wch: 14 }, { wch: 24 }, { wch: 8 },
    { wch: 12 }, { wch: 18 }, { wch: 10 }, { wch: 8 },
    { wch: 40 }, { wch: 10 }, { wch: 16 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Marketplace Upload")

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="marketplace-upload.xlsx"`,
    },
  })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
