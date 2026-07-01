import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "ManagerProduksi")

    const poList = await prisma.productionOrder.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            variasi: { include: { produk: true } },
          },
        },
        approvedBy: { select: { name: true, email: true } },
      },
    })

    return Response.json(poList)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi")

    const body = await req.json()
    const { items, bahanEstimasi, notes } = body

    if (!items || items.length === 0) {
      return Response.json({ error: "Minimal 1 item PO" }, { status: 400 })
    }

    // Generate PO code
    const count = await prisma.productionOrder.count()
    const code = `PO-${String(count + 1).padStart(4, "0")}`

    const po = await prisma.productionOrder.create({
      data: {
        code,
        notes,
        items: {
          create: items.map((item: any) => ({
            produkVariasiId: item.produkVariasiId,
            targetQty: item.targetQty,
            estimasiBiaya: item.estimasiBiaya || null,
            estimasiHargaMasuk: item.estimasiHargaMasuk || null,
          })),
        },
        bahanEstimasi: bahanEstimasi?.length
          ? {
              create: bahanEstimasi.map((be: any) => ({
                bahanId: be.bahanId,
                estimatedAmount: be.estimatedAmount,
              })),
            }
          : undefined,
      },
      include: {
        items: { include: { variasi: { include: { produk: true } } } },
        approvedBy: { select: { name: true, email: true } },
      },
    })

    return Response.json(po)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi")

    const body = await req.json()
    const { id, status, notes } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const data: any = {}
    if (status) data.status = status
    if (notes !== undefined) data.notes = notes

    const po = await prisma.productionOrder.update({
      where: { id },
      data,
      include: {
        items: { include: { variasi: { include: { produk: true } } } },
        approvedBy: { select: { name: true, email: true } },
      },
    })

    return Response.json(po)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi")

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    await prisma.productionOrder.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
