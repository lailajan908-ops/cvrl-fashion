import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { nama } = await req.json()
  if (!nama) return Response.json({ error: "Nama wajib diisi" }, { status: 400 })

  const existing = await prisma.sewingPartner.findUnique({ where: { nama } })
  if (existing) return Response.json({ error: "Nama sudah ada" }, { status: 400 })

  const partner = await prisma.sewingPartner.create({ data: { nama } })
  return Response.json(partner)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id, nama } = await req.json()
  if (!id || !nama) return Response.json({ error: "ID dan nama required" }, { status: 400 })

  const existing = await prisma.sewingPartner.findFirst({ where: { nama, NOT: { id } } })
  if (existing) return Response.json({ error: "Nama sudah digunakan" }, { status: 400 })

  const partner = await prisma.sewingPartner.update({ where: { id }, data: { nama } })
  return Response.json(partner)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  await prisma.sewingPartner.delete({ where: { id } })
  return Response.json({ success: true })
}
