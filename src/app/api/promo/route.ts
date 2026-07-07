import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang", "AdminPenjualan")
    const promos = await prisma.promo.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variasi: {
              include: { produk: true }
            }
          }
        }
      }
    })
    return Response.json(promos)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { nama, jenis, nilai, tglMulai, tglSelesai, status, marketplace, targetType, targetIds } = body

    if (!nama || !jenis || nilai == null || !tglMulai || !tglSelesai) {
      return Response.json({ error: "Nama, jenis, nilai, tglMulai, tglSelesai wajib diisi" }, { status: 400 })
    }

    if (jenis !== "persen" && jenis !== "nominal") {
      return Response.json({ error: "Jenis promo harus 'persen' atau 'nominal'" }, { status: 400 })
    }

    if (jenis === "persen" && (nilai < 1 || nilai > 100)) {
      return Response.json({ error: "Diskon persen harus 1-100" }, { status: 400 })
    }

    const mulai = new Date(tglMulai)
    const selesai = new Date(tglSelesai)
    if (selesai <= mulai) {
      return Response.json({ error: "Tanggal selesai harus setelah tanggal mulai" }, { status: 400 })
    }

    // Determine which SKUs to include
    let variasiIds: string[] = []

    if (targetType === "sku" && targetIds?.length) {
      variasiIds = targetIds
    } else if (targetType === "produk" && targetIds?.length) {
      const variasis = await prisma.produkVariasi.findMany({
        where: { produkId: { in: targetIds } },
        select: { id: true }
      })
      variasiIds = variasis.map(v => v.id)
    } else if (targetType === "warna" && targetIds?.length) {
      const variasis = await prisma.produkVariasi.findMany({
        where: { warna: { in: targetIds.map((w: string) => w.toUpperCase()) } },
        select: { id: true }
      })
      variasiIds = variasis.map(v => v.id)
    } else if (targetType === "size" && targetIds?.length) {
      const variasis = await prisma.produkVariasi.findMany({
        where: { size: { in: targetIds.map((s: string) => s.toUpperCase()) } },
        select: { id: true }
      })
      variasiIds = variasis.map(v => v.id)
    } else {
      return Response.json({ error: "Pilih target promo (sku/produk/warna/size)" }, { status: 400 })
    }

    if (variasiIds.length === 0) {
      return Response.json({ error: "Tidak ada varian yang cocok dengan target" }, { status: 400 })
    }

    // Validate promo price >= production price
    const variasis = await prisma.produkVariasi.findMany({
      where: { id: { in: variasiIds } },
      include: { produk: true }
    })

    const errors: string[] = []
    for (const v of variasis) {
      const hargaJual = v.price || 0
      let hargaPromo = hargaJual

      if (jenis === "persen") {
        hargaPromo = hargaJual - (hargaJual * nilai / 100)
      } else {
        hargaPromo = hargaJual - nilai
      }

      if (hargaPromo < v.hargaProduksi) {
        errors.push(`${v.produk.nama} - ${v.warna}/${v.size}: harga promo ${hargaPromo} < harga produksi ${v.hargaProduksi}`)
      }
    }

    if (errors.length > 0) {
      return Response.json({
        error: "Promo ditolak - harga di bawah biaya produksi",
        details: errors
      }, { status: 400 })
    }

    // Create promo
    const promo = await prisma.promo.create({
      data: {
        nama,
        jenis,
        nilai,
        tglMulai: mulai,
        tglSelesai: selesai,
        status: status || "Draft",
        marketplace: marketplace || "All",
        items: {
          create: variasiIds.map(id => ({ produkVariasiId: id }))
        }
      },
      include: { items: true }
    })

    return Response.json(promo)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { id, nama, jenis, nilai, tglMulai, tglSelesai, status, marketplace } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.promo.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: "Promo not found" }, { status: 404 })

    const promo = await prisma.promo.update({
      where: { id },
      data: {
        nama: nama || undefined,
        jenis: jenis || undefined,
        nilai: nilai != null ? nilai : undefined,
        tglMulai: tglMulai ? new Date(tglMulai) : undefined,
        tglSelesai: tglSelesai ? new Date(tglSelesai) : undefined,
        status: status || undefined,
        marketplace: marketplace || undefined,
      },
      include: { items: { include: { variasi: { include: { produk: true } } } } }
    })

    return Response.json(promo)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner")

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    await prisma.promo.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
