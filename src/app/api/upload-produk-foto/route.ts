import { NextRequest } from "next/server"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")
    const formData = await req.formData()
    const foto = formData.get("foto") as File
    const produkId = formData.get("produkId") as string
    const size = formData.get("size") as string
    const warna = formData.get("warna") as string

    if (!foto || !produkId || !size || !warna) {
      return Response.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    if (!foto.type.includes("image/")) {
      return Response.json({ error: "File harus berupa gambar" }, { status: 400 })
    }

    if (foto.size > 5 * 1024 * 1024) {
      return Response.json({ error: "File foto tidak boleh lebih dari 5MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await foto.arrayBuffer())
    const base64 = buffer.toString("base64")
    const fotoUrl = `data:${foto.type || "image/jpeg"};base64,${base64}`

    return Response.json({
      success: true,
      fotoUrl,
      filename: foto.name
    })
  } catch (error) {
    return handleApiAuthError(error)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")
    const filename = req.nextUrl.searchParams.get("filename")
    if (!filename) return Response.json({ error: "Nama file diperlukan" }, { status: 400 })
    return Response.json({ success: true })
  } catch (error) {
    return handleApiAuthError(error)
  }
}

export async function GET(req: NextRequest) {
  try {
    await requireApiRole("Owner", "ManagerProduksi", "AdminGudang")
    const filename = req.nextUrl.searchParams.get("filename")
    if (!filename) return new Response("Not Found", { status: 404 })
    return new Response("Not Found", { status: 404 })
  } catch (error) {
    return handleApiAuthError(error)
  }
}
