import { NextRequest } from "next/server"
import { requireApiAuth, handleApiAuthError } from "@/lib/api-auth"

export async function POST(req: NextRequest) {
  try {
    await requireApiAuth()

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return Response.json({ error: "No file" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type || "image/jpeg"};base64,${base64}`

    return Response.json({ url: dataUrl })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
