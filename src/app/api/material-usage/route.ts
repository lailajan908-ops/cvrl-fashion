import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const usages = await prisma.materialUsage.findMany({
      include: {
        bahan: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(usages)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { modelName, bahanId, warna, rollCount, totalWeight } = body

    if (!modelName) {
      return Response.json({ error: "Nama model baju wajib diisi" }, { status: 400 })
    }
    if (!bahanId) {
      return Response.json({ error: "Pilih bahan" }, { status: 400 })
    }
    if (!totalWeight || totalWeight <= 0) {
      return Response.json({ error: "Total berat/panjang harus diisi" }, { status: 400 })
    }

    const bahan = await prisma.bahan.findUnique({ where: { id: bahanId } })
    if (!bahan) {
      return Response.json({ error: "Bahan tidak ditemukan" }, { status: 404 })
    }
    if (bahan.stok < totalWeight) {
      return Response.json({ error: `Stok ${bahan.nama} tidak mencukupi (tersedia: ${bahan.stok} ${bahan.satuan})` }, { status: 400 })
    }

    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")
    const userId = (session.user as any).id

    const usage = await prisma.materialUsage.create({
      data: {
        modelName,
        bahanId,
        warna,
        rollCount: rollCount || 0,
        totalWeight,
        createdById: userId,
      },
      include: {
        bahan: true,
        createdBy: { select: { name: true } },
      },
    })

    // Kurangi stok bahan
    await prisma.bahan.update({
      where: { id: bahanId },
      data: { stok: { decrement: totalWeight } },
    })

    return Response.json(usage)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
