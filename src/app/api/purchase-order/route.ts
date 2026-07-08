import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const status = req.nextUrl.searchParams.get("status")
    const where: any = {}
    if (status) where.status = status

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        items: { include: { bahan: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(orders)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { supplier, notes, items } = body

    if (!supplier) {
      return Response.json({ error: "Nama supplier/toko wajib diisi" }, { status: 400 })
    }
    if (!items || items.length === 0) {
      return Response.json({ error: "Minimal satu item diperlukan" }, { status: 400 })
    }

    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")
    const userId = (session.user as any).id

    const count = await prisma.purchaseOrder.count()
    const code = `PO-${String(count + 1).padStart(3, "0")}`

    const order = await prisma.purchaseOrder.create({
      data: {
        code,
        supplier,
        notes,
        status: "Draft",
        createdById: userId,
        items: {
          create: items.map((item: any) => ({
            bahanId: item.bahanId,
            warna: item.warna,
            rollOrdered: item.rollOrdered || 0,
          })),
        },
      },
      include: {
        items: { include: { bahan: true } },
        createdBy: { select: { name: true } },
      },
    })

    return Response.json(order)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { id, supplier, notes, items } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: "Order not found" }, { status: 404 })
    if (existing.status !== "Draft") {
      return Response.json({ error: "Hanya order berstatus Draft yang bisa diedit" }, { status: 400 })
    }

    await prisma.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } })

    const order = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        supplier,
        notes,
        items: {
          create: items.map((item: any) => ({
            bahanId: item.bahanId,
            warna: item.warna,
            rollOrdered: item.rollOrdered || 0,
          })),
        },
      },
      include: {
        items: { include: { bahan: true } },
        createdBy: { select: { name: true } },
      },
    })

    return Response.json(order)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: "Order not found" }, { status: 404 })
    if (existing.status !== "Draft") {
      return Response.json({ error: "Hanya order berstatus Draft yang bisa dihapus" }, { status: 400 })
    }

    await prisma.purchaseOrder.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
