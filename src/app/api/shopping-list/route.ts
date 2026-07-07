import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const status = req.nextUrl.searchParams.get("status")
    const where: any = {}
    if (status) where.status = status

    const lists = await prisma.shoppingList.findMany({
      where,
      include: {
        items: {
          include: { bahan: true },
        },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        diterimaBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(lists)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { notes, items } = body

    if (!items || items.length === 0) {
      return Response.json({ error: "Minimal satu item diperlukan" }, { status: 400 })
    }

    const session = await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")
    const userId = (session.user as any).id

    const count = await prisma.shoppingList.count()
    const code = `BL-${String(count + 1).padStart(3, "0")}`

    const list = await prisma.shoppingList.create({
      data: {
        code,
        notes,
        status: "Draft",
        createdById: userId,
        items: {
          create: items.map((item: any) => ({
            bahanId: item.bahanId,
            warna: item.warna,
            rolls: item.rolls || "",
          })),
        },
      },
      include: {
        items: { include: { bahan: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        diterimaBy: { select: { name: true } },
      },
    })

    return Response.json(list)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const body = await req.json()
    const { id, notes, items } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.shoppingList.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: "List not found" }, { status: 404 })
    if (existing.status !== "Draft") {
      return Response.json({ error: "Hanya list berstatus Draft yang bisa diedit" }, { status: 400 })
    }

    await prisma.shoppingListItem.deleteMany({ where: { shoppingListId: id } })

    const list = await prisma.shoppingList.update({
      where: { id },
      data: {
        notes,
        items: {
          create: items.map((item: any) => ({
            bahanId: item.bahanId,
            warna: item.warna,
            rolls: item.rolls || "",
          })),
        },
      },
      include: {
        items: { include: { bahan: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
        diterimaBy: { select: { name: true } },
      },
    })

    return Response.json(list)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")

    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const existing = await prisma.shoppingList.findUnique({ where: { id } })
    if (!existing) return Response.json({ error: "List not found" }, { status: 404 })
    if (existing.status !== "Draft") {
      return Response.json({ error: "Hanya list berstatus Draft yang bisa dihapus" }, { status: 400 })
    }

    await prisma.shoppingList.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
