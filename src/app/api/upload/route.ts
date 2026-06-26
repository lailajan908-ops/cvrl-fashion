import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return Response.json({ error: "No file" }, { status: 400 })

  const ext = file.name?.split(".").pop() || "jpg"
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const dir = join(process.cwd(), "public", "uploads")
  const buffer = Buffer.from(await file.arrayBuffer())

  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, name), buffer)

  return Response.json({ url: `/uploads/${name}` })
}
