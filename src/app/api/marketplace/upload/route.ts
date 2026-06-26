import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import * as XLSX from "xlsx"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const userId = (session.user as any).id

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return Response.json({ error: "File tidak ditemukan" }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const wb = XLSX.read(bytes, { type: "buffer" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws)

    if (rows.length === 0) {
      return Response.json({ error: "File kosong" }, { status: 400 })
    }

    const results = { success: 0, skipped: 0, errors: [] as string[] }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const platform = row["Platform"]?.toString().trim()
      const kodeProduk = row["Kode Produk"]?.toString().trim()
      const namaProduk = row["Nama Produk"]?.toString().trim()
      const size = row["Size"]?.toString().trim()
      const warna = row["Warna"]?.toString().trim()
      const sku = row["SKU"]?.toString().trim()
      const harga = parseFloat(row["Harga"]) || 0
      const deskripsi = row["Deskripsi"]?.toString().trim()
      const berat = parseFloat(row["Berat (gram)"]) || 0
      const kategori = row["Kategori"]?.toString().trim()

      if (!platform || !kodeProduk) {
        results.skipped++
        continue
      }

      const validPlatforms = ["Shopee", "Lazada", "Tokopedia", "TiktokShop"]
      if (!validPlatforms.includes(platform)) {
        results.errors.push(`Baris ${i + 2}: Platform "${platform}" tidak valid`)
        continue
      }

      if (!harga || harga <= 0) {
        results.errors.push(`Baris ${i + 2}: Harga tidak valid`)
        continue
      }

      const orderId = `${platform}-${kodeProduk}-${size || ""}-${warna || ""}-${Date.now()}-${i}`

      try {
        await prisma.ecommerceSale.create({
          data: {
            platform,
            orderId,
            orderDate: new Date(),
            customerName: null,
            totalAmount: harga,
            shippingCost: 0,
            platformFee: 0,
            netAmount: harga,
            status: "Processing",
            notes: `Dari upload Excel. Produk: ${kodeProduk}, ${size || ""} ${warna || ""}. ${deskripsi || ""}`.trim(),
          },
        })
        results.success++
      } catch (err: any) {
        results.errors.push(`Baris ${i + 2}: ${err.message}`)
      }
    }

    return Response.json({
      message: `Upload selesai: ${results.success} berhasil, ${results.skipped} dilewati, ${results.errors.length} error`,
      results,
    })
  } catch (err: any) {
    return Response.json({ error: `Gagal memproses file: ${err.message}` }, { status: 500 })
  }
}
