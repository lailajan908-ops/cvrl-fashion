import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split("/").pop()
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const body = await req.json()
    const { action, buktiUrl } = body

    if (!action || !["submit", "approve", "terima", "cancel", "done"].includes(action)) {
      return Response.json({ error: "Action must be submit, approve, terima, cancel, or done" }, { status: 400 })
    }

    const list = await prisma.shoppingList.findUnique({ where: { id } })
    if (!list) return Response.json({ error: "List not found" }, { status: 404 })

    const authRoles = action === "submit" || action === "terima"
      ? ["Owner", "ManagerProduksi", "AdminGudang"]
      : ["Owner", "ManagerProduksi"]

    const session = await requireApiRole(...authRoles)
    const userId = (session.user as any).id

    let updateData: any = {}

    if (action === "submit") {
      if (list.status !== "Draft") {
        return Response.json({ error: "Hanya list Draft yang bisa dikirim" }, { status: 400 })
      }
      updateData = { status: "PendingApproval" }
    } else if (action === "approve") {
      if (list.status !== "PendingApproval") {
        return Response.json({ error: "Hanya list PendingApproval yang bisa di-approve" }, { status: 400 })
      }
      updateData = {
        status: "Approved",
        approvedById: userId,
        approvedAt: new Date(),
      }
    } else if (action === "terima") {
      if (list.status !== "Approved") {
        return Response.json({ error: "Hanya list Approved yang bisa diterima" }, { status: 400 })
      }
      updateData = {
        status: "Diterima",
        buktiUrl: buktiUrl || null,
        diterimaById: userId,
        diterimaAt: new Date(),
      }
    } else if (action === "cancel") {
      if (!["Draft", "PendingApproval", "Approved"].includes(list.status)) {
        return Response.json({ error: "List tidak bisa dicancel" }, { status: 400 })
      }
      updateData = { status: "Cancelled" }
    } else if (action === "done") {
      if (list.status !== "Diterima") {
        return Response.json({ error: "Hanya list Diterima yang bisa diselesaikan" }, { status: 400 })
      }

      const items = await prisma.shoppingListItem.findMany({
        where: { shoppingListId: id },
        include: { bahan: true },
      })

      for (const item of items) {
        const increment = item.bahan.satuan === "KG" ? item.totalKg : item.totalMeter
        await prisma.bahan.update({
          where: { id: item.bahanId },
          data: { stok: { increment } },
        })
      }

      updateData = { status: "Done" }
    }

    const updated = await prisma.shoppingList.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { bahan: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        diterimaBy: { select: { name: true } },
      },
    })

    return Response.json(updated)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
