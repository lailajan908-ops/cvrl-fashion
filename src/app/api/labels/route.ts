import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    await requireApiRole("Owner", "ManagerProduksi")
    const labels = await prisma.promoLabel.findMany({ orderBy: { order: "asc" } })
    return Response.json(labels)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner")
    const body = await req.json()
    const { nama, icon, color, otomatis, order } = body
    if (!nama) return Response.json({ error: "Nama label wajib diisi" }, { status: 400 })
    const label = await prisma.promoLabel.create({
      data: { nama, icon: icon || null, color: color || null, otomatis: otomatis || false, order: order || 0 }
    })
    return Response.json(label)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner")
    const body = await req.json()
    const { id, nama, icon, color, otomatis, order } = body
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })
    const label = await prisma.promoLabel.update({
      where: { id },
      data: { nama, icon, color, otomatis, order }
    })
    return Response.json(label)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner")
    const id = req.nextUrl.searchParams.get("id")
    if (!id) return Response.json({ error: "ID required" }, { status: 400 })
    await prisma.promoLabel.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
