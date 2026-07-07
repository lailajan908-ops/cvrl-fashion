import { NextRequest } from "next/server"

const WARNA_LIST = ["HITAM", "PUTIH", "NAVY", "ARMY", "MAROON", "COKSU", "TOSKA", "MINT", "SAGE", "ABU", "KUNIT", "PINK", "UNGU", "MERAH", "HIJAU"]
const SIZE_LIST = ["S", "M", "L", "XL", "XXL", "XXXL"]

export async function POST(req: NextRequest) {
  try {
    const { query, platform } = await req.json()
    if (!query) return Response.json({ error: "Query diperlukan" }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return Response.json({ error: "OpenAI API key not configured" }, { status: 500 })

    const platformName = platform || "Shopee"

    const prompt = `Kamu adalah asisten yang membantu mencari informasi produk dari marketplace ${platformName}.
Berdasarkan query "${query}", berikan informasi produk dalam format JSON:
{
  "name": "Nama produk",
  "description": "Deskripsi produk dalam Bahasa Indonesia, maksimal 200 karakter",
  "category": "Kategori produk (e.g. Baju Koko, Gamis, Kemeja, Celana, dll)",
  "price": 0,
  "colors": ["array warna dalam Bahasa Indonesia, dari daftar yang tersedia"],
  "sizes": ["S", "M", "L", "XL"]
}

Warna yang tersedia: ${WARNA_LIST.join(", ")}
Ukuran yang tersedia: ${SIZE_LIST.join(", ")}

Pilih warna dan ukuran yang paling sesuai dengan produk. Gunakan Bahasa Indonesia.`

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.text()
      return Response.json({ error: `OpenAI API error: ${err}` }, { status: 500 })
    }

    const data = await openaiRes.json()
    const content = JSON.parse(data.choices[0].message.content)

    return Response.json({
      name: content.name || query,
      description: content.description || "",
      category: content.category || "",
      price: content.price || 0,
      colors: Array.isArray(content.colors) ? content.colors.filter((c: string) => WARNA_LIST.includes(c)) : [],
      sizes: Array.isArray(content.sizes) ? content.sizes.filter((s: string) => SIZE_LIST.includes(s)) : ["M", "L", "XL"],
    })
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Gagal mencari produk" }, { status: 500 })
  }
}
