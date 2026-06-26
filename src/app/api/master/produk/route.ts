import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { kode, nama, variasi, deskripsi, fotoUrl, namaFoto } = body

  if (!kode || !nama) {
    return Response.json({ error: "Kode dan nama wajib diisi" }, { status: 400 })
  }

  if (!variasi || variasi.length === 0) {
    return Response.json({ error: "Minimal 1 variasi" }, { status: 400 })
  }

  const existing = await prisma.produk.findUnique({ where: { kode } })
  if (existing) {
    return Response.json({ error: "Kode produk sudah ada" }, { status: 400 })
  }

  // Check for duplicate size+warna within request
  const seen = new Set<string>()
  for (const v of variasi) {
    const key = `${v.size}-${v.warna}`
    if (seen.has(key)) {
      return Response.json({ error: `Duplikat variasi: ${v.size}/${v.warna}` }, { status: 400 })
    }
    seen.add(key)
  }

  try {
    const produk = await prisma.produk.create({
      data: {
        kode,
        nama,
        deskripsi,
        fotoUrl,
        namaFoto,
        variasi: {
          create: variasi.map((v: any) => ({
            size: v.size,
            warna: v.warna,
            sku: v.sku || `${kode}-${v.size}-${v.warna}`.toUpperCase(),
            fotoPath: v.fotoPath || null,
            fotoUrl: v.fotoUrl || null,
            namaFoto: v.namaFoto || null,
          })),
        },
      },
      include: { variasi: true },
    })
    return Response.json(produk)
  } catch (e: any) {
    const msg = e.code === "P2002"
      ? `SKU sudah ada: ${e.meta?.target?.join?.(', ') || 'duplikat'}. Variasi size+warna harus unik per produk.`
      : "Gagal menyimpan produk"
    return Response.json({ error: msg }, { status: 400 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, kode, nama, variasi, deskripsi, fotoUrl, namaFoto } = body

  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  const existing = await prisma.produk.findFirst({ where: { kode, NOT: { id } } })
  if (existing) {
    return Response.json({ error: "Kode produk sudah digunakan" }, { status: 400 })
  }

  const seen = new Set<string>()
  for (const v of variasi) {
    const key = `${v.size}-${v.warna}`
    if (seen.has(key)) {
      return Response.json({ error: `Duplikat variasi: ${v.size}/${v.warna}` }, { status: 400 })
    }
    seen.add(key)
  }

  try {
    await prisma.produkVariasi.deleteMany({ where: { produkId: id } })

    const produk = await prisma.produk.update({
      where: { id },
      data: {
        kode,
        nama,
        deskripsi,
        fotoUrl,
        namaFoto,
        variasi: {
          create: variasi.map((v: any) => ({
            size: v.size,
            warna: v.warna,
            sku: v.sku || `${kode}-${v.size}-${v.warna}`.toUpperCase(),
            fotoPath: v.fotoPath || null,
            fotoUrl: v.fotoUrl || null,
            namaFoto: v.namaFoto || null,
          })),
        },
      },
      include: { variasi: true },
    })

    return Response.json(produk)
  } catch (e: any) {
    const msg = e.code === "P2002"
      ? `SKU sudah ada: ${e.meta?.target?.join?.(', ') || 'duplikat'}. Variasi size+warna harus unik per produk.`
      : "Gagal menyimpan produk"
    return Response.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  await prisma.produk.delete({ where: { id } })
  return Response.json({ success: true })
}
