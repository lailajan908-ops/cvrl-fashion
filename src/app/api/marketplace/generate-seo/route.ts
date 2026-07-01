import { NextRequest } from "next/server"
import OpenAI from "openai"

export async function POST(req: NextRequest) {
  let product: any
  try {
    const body = await req.json()
    product = body.product
    if (!product?.name) {
      return Response.json({ error: "Nama produk diperlukan" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return Response.json({
        title: product.name,
        description: `Fashion ${product.name} kualitas terbaik. Tersedia dalam berbagai ukuran ${(product.sizes || []).join(", ")} dan warna ${(product.colors || []).join(", ")}. Cocok untuk daily wear.`,
      })
    }

    const openai = new OpenAI({ apiKey })

    const prompt = `Buat 1 SEO title dan 1 deskripsi produk untuk marketplace Shopee Indonesia dalam Bahasa Indonesia.

Produk: ${product.name}
Kode: ${product.code}
Ukuran: ${(product.sizes || []).join(", ")}
Warna: ${(product.colors || []).join(", ")}
Harga mulai: Rp${(product.minPrice || 0).toLocaleString("id-ID")}

Format output JSON:
{
  "title": "SEO title maksimal 60 karakter",
  "description": "Deskripsi lengkap termasuk bahan, ukuran, warna, cara rawat, dan ajakan beli"
}`

    const res = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "Kamu adalah expert SEO marketplace Indonesia. Output JSON saja." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    })

    const content = JSON.parse(res.choices[0].message.content || "{}")

    return Response.json({
      title: content.title || product.name,
      description: content.description || "",
    })
  } catch {
    return Response.json({
      title: product?.name || "Produk",
      description: "Produk berkualitas. Tersedia berbagai ukuran dan warna. Pesan sekarang!",
    })
  }
}
