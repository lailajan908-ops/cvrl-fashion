import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET() {
  try {
    const kategori = await prisma.kategori.findMany({
      orderBy: { nama: "asc" }
    })
    return Response.json(kategori)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")
    const { nama, parentId } = await req.json()
    if (!nama) return Response.json({ error: "Nama wajib diisi" }, { status: 400 })
    const kategori = await prisma.kategori.create({
      data: { nama: nama, parentId: parentId || null }
    })
    return Response.json(kategori)
  } catch (err) {
    return handleApiAuthError(err)
  }
}
