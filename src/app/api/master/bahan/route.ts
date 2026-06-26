import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { kode, nama, satuan, warna, kategori, stok, hargaBeli, stokMinimum } = body

  if (!kode || !nama || !warna) {
    return Response.json({ error: "Kode, nama, dan warna wajib diisi" }, { status: 400 })
  }

  const existing = await prisma.bahan.findUnique({ where: { kode } })
  if (existing) {
    return Response.json({ error: "Kode bahan sudah ada" }, { status: 400 })
  }

  const bahan = await prisma.bahan.create({
    data: { kode, nama, satuan, warna, kategori: kategori || "Bahan Baku", stok: stok || 0, hargaBeli: hargaBeli || 0, stokMinimum: stokMinimum || 0 },
  })

  return Response.json(bahan)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, kode, nama, satuan, warna, kategori, stok, hargaBeli, stokMinimum } = body

  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  const existing = await prisma.bahan.findFirst({ where: { kode, NOT: { id } } })
  if (existing) {
    return Response.json({ error: "Kode bahan sudah digunakan" }, { status: 400 })
  }

  const bahan = await prisma.bahan.update({
    where: { id },
    data: { kode, nama, satuan, warna, kategori: kategori || "Bahan Baku", stok: stok || 0, hargaBeli: hargaBeli || 0, stokMinimum: stokMinimum || 0 },
  })

  return Response.json(bahan)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  await prisma.bahan.delete({ where: { id } })
  return Response.json({ success: true })
}
