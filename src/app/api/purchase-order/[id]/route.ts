import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop()
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const body = await req.json()
    const { action, fakturNo, hargaBeli, items: terimaItems } = body

    if (!action || !["order", "terima", "done", "cancel"].includes(action)) {
      return Response.json({ error: "Action must be order, terima, done, or cancel" }, { status: 400 })
    }

    const order = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!order) return Response.json({ error: "Order not found" }, { status: 404 })

    const authRoles = action === "terima"
      ? ["Owner", "AdminGudang"]
      : ["Owner", "ManagerProduksi", "AdminGudang"]

    const session = await requireApiRole(...authRoles)
    const userId = (session.user as any).id

    let updateData: any = {}

    if (action === "order") {
      if (order.status !== "Draft") {
        return Response.json({ error: "Hanya Draft yang bisa dikirim" }, { status: 400 })
      }
      updateData = { status: "Ordered" }
    } else if (action === "terima") {
      if (order.status !== "Ordered") {
        return Response.json({ error: "Hanya yang sudah di-order yang bisa diterima" }, { status: 400 })
      }

      if (terimaItems?.length) {
        for (const ti of terimaItems) {
          await prisma.purchaseOrderItem.update({
            where: { id: ti.id },
            data: {
              weightsJson: JSON.stringify(ti.weights || []),
              totalWeight: ti.totalWeight ?? 0,
              price: ti.price ?? 0,
            },
          })
        }
      }

      updateData = {
        status: "Received",
        fakturNo: fakturNo || null,
        hargaBeli: hargaBeli ?? order.hargaBeli,
      }
    } else if (action === "done") {
      if (order.status !== "Received") {
        return Response.json({ error: "Hanya yang sudah diterima yang bisa diselesaikan" }, { status: 400 })
      }

      const items = await prisma.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
        include: { bahan: true },
      })

      for (const item of items) {
        if (item.totalWeight > 0) {
          await prisma.bahan.update({
            where: { id: item.bahanId },
            data: {
              stok: { increment: item.totalWeight },
              ...(order.hargaBeli && order.hargaBeli > 0 ? { hargaBeli: order.hargaBeli } : {}),
            },
          })
        }
      }

      updateData = { status: "Done" }
    } else if (action === "cancel") {
      if (!["Draft", "Ordered"].includes(order.status)) {
        return Response.json({ error: "Order tidak bisa dicancel" }, { status: 400 })
      }
      updateData = { status: "Cancelled" }
    }

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { bahan: true } },
        createdBy: { select: { name: true } },
      },
    })

    return Response.json(updated)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
