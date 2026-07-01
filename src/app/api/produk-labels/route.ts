import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang", "AdminPenjualan")

    const produkId = req.nextUrl.searchParams.get("produkId")
    if (!produkId) return Response.json({ error: "produkId required" }, { status: 400 })

    const labels = await prisma.produkLabel.findMany({
      where: { produkId },
      include: { label: true }
    })
    return Response.json(labels)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi")

    const body = await req.json()
    const { produkId, labelId, warna, size, sku } = body

    if (!produkId || !labelId) {
      return Response.json({ error: "produkId dan labelId wajib" }, { status: 400 })
    }

    const existing = await prisma.produkLabel.findFirst({
      where: { produkId, labelId, warna: warna || null, size: size || null, sku: sku || null }
    })
    if (existing) {
      return Response.json({ error: "Label sudah ditambahkan" }, { status: 400 })
    }

    const produkLabel = await prisma.produkLabel.create({
      data: {
        produkId,
        labelId,
        warna: warna || null,
        size: size || null,
        sku: sku || null,
      },
      include: { label: true }
    })

    return Response.json(produkLabel)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi")

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    await prisma.produkLabel.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
