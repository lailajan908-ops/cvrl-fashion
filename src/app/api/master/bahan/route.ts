import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { nama, kategori, satuan, stok, hargaBeli, warnaList } = body

    if (!nama) {
      return Response.json({ error: "Nama bahan wajib diisi" }, { status: 400 })
    }

    const count = await prisma.bahan.count()
    const kode = `BH-${String(count + 1).padStart(3, "0")}`

    const warnaArr: string[] = warnaList || []
    const bahan = await prisma.bahan.create({
      data: {
        kode, nama,
        satuan: satuan || "Meter",
        warna: warnaArr[0] || "",
        warnaList: JSON.stringify(warnaArr),
        kategori: kategori || "Kain",
        stok: 0,
        hargaBeli: 0,
        stokMinimum: 0,
      },
    })

    return Response.json(bahan)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { id, nama, kategori, satuan, stok, hargaBeli, warnaList } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const warnaArr: string[] = warnaList || []
    const bahan = await prisma.bahan.update({
      where: { id },
      data: {
        nama,
        kategori: kategori || "Kain",
        satuan: satuan || "Meter",
        warna: warnaArr[0] || "",
        warnaList: JSON.stringify(warnaArr),
      },
    })

    return Response.json(bahan)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    await prisma.bahan.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
