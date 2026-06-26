import { NextRequest } from "next/server"
import fs from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const foto = formData.get("foto") as File
    const produkId = formData.get("produkId") as string
    const ukuran = formData.get("ukuran") as string
    const warna = formData.get("warna") as string
    
    if (!foto || !produkId || !ukuran || !warna) {
      return Response.json({ error: "Data tidak lengkap" }, { status: 400 })
    }
    
    if (!foto.type.includes("image/")) {
      return Response.json({ error: "File harus berupa gambar" }, { status: 400 })
    }
    
    if (foto.size > 5 * 1024 * 1024) {
      return Response.json({ error: "File foto tidak boleh lebih dari 5MB" }, { status: 400 })
    }
    
    const filename = `${uuidv4()}.${foto.name.split(".").pop()}`
    const uploadDir = path.join(process.cwd(), "public", "produk-foto")
    await fs.mkdir(uploadDir, { recursive: true })
    
    const filePath = path.join(uploadDir, filename)
    const bytes = await foto.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(filePath, buffer)
    
    const fotoUrl = `/produk-foto/${filename}`
    
    return Response.json({ 
      success: true, 
      fotoUrl, 
      filename: foto.name 
    })
  } catch (error) {
    return Response.json({ error: "Gagal mengupload foto" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const filename = url.searchParams.get("filename")
    
    if (!filename) {
      return Response.json({ error: "Nama file diperlukan" }, { status: 400 })
    }
    
    const filePath = path.join(process.cwd(), "public", "produk-foto", filename)
    await fs.access(filePath)
    await fs.unlink(filePath)
    
    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Gagal menghapus foto" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const filename = url.searchParams.get("filename")
    
    if (!filename) {
      return new Response("Not Found", { status: 404 })
    }
    
    const filePath = path.join(process.cwd(), "public", "produk-foto", filename)
    await fs.access(filePath)
    
    const file = await fs.readFile(filePath)
    const ext = filename.split(".").pop()
    
    const headers: HeadersInit = {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": `image/${ext === "jpg" || ext === "jpeg" ? "jpeg" : ext === "png" ? "png" : "webp"}`
    }
    
    return new Response(file, { headers })
  } catch (error) {
    return new Response("Not Found", { status: 404 })
  }
}