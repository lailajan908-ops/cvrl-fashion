import { NextRequest } from "next/server"
import { generateVariantSKU } from "@/lib/sku-generator"

export async function POST(req: NextRequest) {
  try {
    const { products } = await req.json()
    if (!products?.length) {
      return Response.json({ error: "Tidak ada produk" }, { status: 400 })
    }

    const results = products.map((p: any) => {
      const colors = (p.colors || []).filter(Boolean)
      const sizes = (p.sizes || []).filter(Boolean)
      const variants: any[] = []

      for (const color of colors) {
        for (const size of sizes) {
          const price = p.prices?.[size] || p.basePrice || 0
          variants.push({
            sku: generateVariantSKU(p.code, color.toUpperCase().replace(/\s+/g, ""), size.toUpperCase()),
            productName: p.name,
            productCode: p.code,
            color,
            size,
            price,
            stock: 0,
          })
        }
      }

      return {
        productName: p.name,
        productCode: p.code,
        variants,
        totalVariants: variants.length,
      }
    })

    return Response.json({ results })
  } catch {
    return Response.json({ error: "Gagal generate variants" }, { status: 500 })
  }
}
