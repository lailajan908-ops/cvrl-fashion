import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"
import { generateVariantSKU } from "@/lib/sku-generator"

const produkInclude = {
  variasi: { orderBy: [{ warna: "asc" }, { size: "asc" }] as any },
  images: { orderBy: { order: "asc" } },
  kategori: true,
  labels: { include: { label: true } },
} as const

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang", "AdminPenjualan")

    const id = req.nextUrl.searchParams.get("id")
    if (id) {
      const produk = await prisma.produk.findUnique({
        where: { id },
        include: produkInclude
      })
      return Response.json(produk)
    }

    const produkList = await prisma.produk.findMany({
      orderBy: { createdAt: "desc" },
      include: produkInclude
    })
    return Response.json(produkList)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { kode, nama, deskripsi, kategoriId, weight, variasi, images, labels } = body

    if (!kode || !nama) {
      return Response.json({ error: "Kode dan nama wajib diisi" }, { status: 400 })
    }

    const existing = await prisma.produk.findUnique({ where: { kode } })
    if (existing) {
      return Response.json({ error: "Kode produk sudah ada" }, { status: 400 })
    }

    const warnaList = [...new Set<string>((variasi || []).map((v: any) => v.warna))]
    for (const w of warnaList) {
      const hasFoto = (images || []).some((img: any) => img.warna === w)
      if (!hasFoto) {
        return Response.json({ error: `Warna ${w} belum memiliki foto` }, { status: 400 })
      }
    }

    const produk = await prisma.produk.create({
      data: {
        kode, nama,
        deskripsi: deskripsi || null,
        kategoriId: kategoriId || null,
        weight: weight || 0,
        variasi: variasi?.length ? {
          create: variasi.map((v: any) => ({
            size: v.size, warna: v.warna,
            sku: v.sku || generateVariantSKU(kode, v.warna, v.size),
            barcode: v.barcode || null,
            price: v.price || 0,
            hargaDiskon: v.hargaDiskon || null,
            stock: v.stock || 0,
            isActive: v.isActive ?? true,
          }))
        } : undefined,
        images: images?.length ? {
          create: images.map((img: any, i: number) => ({
            url: img.url,
            warna: img.warna || null,
            isPrimary: img.isPrimary || i === 0,
            order: i
          }))
        } : undefined,
        labels: labels?.length ? {
          create: labels.map((l: any) => ({
            labelId: l.labelId,
            warna: l.warna || null,
            size: l.size || null,
            sku: l.sku || null,
          }))
        } : undefined,
      },
      include: produkInclude
    })

    // Auto-assign "New Arrival" label
    const newArrivalLabel = await prisma.promoLabel.findUnique({ where: { nama: "New Arrival" } })
    if (newArrivalLabel) {
      await prisma.produkLabel.create({
        data: { produkId: produk.id, labelId: newArrivalLabel.id }
      }).catch(() => {})
    }

    return Response.json(produk)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { id, kode, nama, deskripsi, kategoriId, weight, variasi, images, labels } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const warnaList = [...new Set<string>((variasi || []).map((v: any) => v.warna))]
    for (const w of warnaList) {
      const hasFoto = (images || []).some((img: any) => img.warna === w)
      if (!hasFoto) {
        return Response.json({ error: `Warna ${w} belum memiliki foto` }, { status: 400 })
      }
    }

    await prisma.produkVariasi.deleteMany({ where: { produkId: id } })
    await prisma.produkImage.deleteMany({ where: { produkId: id } })

    const produk = await prisma.produk.update({
      where: { id },
      data: {
        kode, nama,
        deskripsi: deskripsi || null,
        kategoriId: kategoriId || null,
        weight: weight || 0,
        variasi: variasi?.length ? {
          create: variasi.map((v: any) => ({
            size: v.size, warna: v.warna,
            sku: v.sku || generateVariantSKU(kode, v.warna, v.size),
            barcode: v.barcode || null,
            price: v.price || 0,
            hargaDiskon: v.hargaDiskon || null,
            stock: v.stock || 0,
            isActive: v.isActive ?? true,
          }))
        } : undefined,
        images: images?.length ? {
          create: images.map((img: any, i: number) => ({
            url: img.url,
            warna: img.warna || null,
            isPrimary: img.isPrimary || i === 0,
            order: i
          }))
        } : undefined,
      },
      include: produkInclude
    })

    // Update labels if provided
    if (labels) {
      await prisma.produkLabel.deleteMany({ where: { produkId: id } })
      if (labels.length > 0) {
        await prisma.produkLabel.createMany({
          data: labels.map((l: any) => ({
            produkId: id,
            labelId: l.labelId,
            warna: l.warna || null,
            size: l.size || null,
            sku: l.sku || null,
          }))
        })
      }
    }

    return Response.json(produk)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner")
    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })
    await prisma.produk.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
