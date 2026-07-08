import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { nama, kategori, satuan, stok, hargaBeli } = body

    if (!nama) {
      return Response.json({ error: "Nama bahan wajib diisi" }, { status: 400 })
    }

    const count = await prisma.bahan.count()
    const kode = `BH-${String(count + 1).padStart(3, "0")}`

    const bahan = await prisma.bahan.create({
      data: { kode, nama, satuan: satuan || "Meter", warna: "", kategori: kategori || "Bahan Baku", stok: stok ?? 0, hargaBeli: hargaBeli ?? 0, stokMinimum: 0 },
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
    const { id, nama, kategori, satuan, stok, hargaBeli } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const bahan = await prisma.bahan.update({
      where: { id },
      data: { nama, kategori: kategori || "Bahan Baku", satuan: satuan || "Meter", stok: stok ?? 0, hargaBeli: hargaBeli ?? 0 },
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
