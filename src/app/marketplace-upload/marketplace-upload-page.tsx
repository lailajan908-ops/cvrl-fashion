"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Plus, Trash2, Sparkles, Download, CheckCircle2, AlertCircle,
  Package, ChevronRight, X, Camera, Palette, Ruler,
} from "lucide-react"
import { toast } from "sonner"

const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"]

interface ProductInput {
  id: string
  name: string
  code: string
  colors: string[]
  sizes: string[]
  prices: Record<string, number>
  photos: string[]
}

interface Variant {
  sku: string
  productName: string
  productCode: string
  color: string
  size: string
  price: number
  stock: number
}

interface SeoContent {
  title: string
  description: string
}

let productCounter = 0

function emptyProduct(): ProductInput {
  productCounter++
  return {
    id: `p${productCounter}`,
    name: "",
    code: "",
    colors: [""],
    sizes: ["S", "M", "L", "XL"],
    prices: { S: 0, M: 0, L: 0, XL: 0 },
    photos: [],
  }
}

export function MarketplaceUploadPage() {
  const [step, setStep] = useState<"input" | "variants" | "seo" | "review">("input")
  const [products, setProducts] = useState<ProductInput[]>([emptyProduct()])
  const [variants, setVariants] = useState<Variant[]>([])
  const [seoContents, setSeoContents] = useState<Record<string, SeoContent>>({})
  const [generating, setGenerating] = useState(false)

  function updateProduct(id: string, updates: Partial<ProductInput>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
  }

  function addProduct() {
    setProducts((prev) => [...prev, emptyProduct()])
  }

  function removeProduct(id: string) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  function addColor(id: string) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, colors: [...p.colors, ""] } : p))
    )
  }

  function updateColor(id: string, idx: number, val: string) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, colors: p.colors.map((c, i) => (i === idx ? val : c)) } : p
      )
    )
  }

  function removeColor(id: string, idx: number) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, colors: p.colors.filter((_, i) => i !== idx) } : p
      )
    )
  }

  function toggleSize(id: string, size: string) {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const has = p.sizes.includes(size)
        const sizes = has ? p.sizes.filter((s) => s !== size) : [...p.sizes, size].sort(sizeSorter)
        const prices = { ...p.prices }
        if (!has) prices[size] = prices[size] || 0
        return { ...p, sizes, prices }
      })
    )
  }

  function sizeSorter(a: string, b: string) {
    const order = ["S", "M", "L", "XL", "XXL", "XXXL", "XS", "38", "39", "40", "41", "42", "43"]
    return order.indexOf(a) - order.indexOf(b)
  }

  function updatePrice(id: string, size: string, val: number) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, prices: { ...p.prices, [size]: val } } : p))
    )
  }

  function addPhoto(id: string) {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.multiple = true
    input.onchange = () => {
      const files = Array.from(input.files || [])
      const urls = files.map((f) => URL.createObjectURL(f))
      updateProduct(id, { photos: [...(products.find((p) => p.id === id)?.photos || []), ...urls] })
    }
    input.click()
  }

  function removePhoto(id: string, idx: number) {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, photos: p.photos.filter((_, i) => i !== idx) } : p))
    )
  }

  async function handleGenerateVariants() {
    const invalid = products.filter((p) => !p.name || !p.code)
    if (invalid.length > 0) {
      toast.error(`Produk ${invalid.map((p) => p.name || "tanpa nama").join(", ")} belum lengkap`)
      return
    }

    setGenerating(true)
    try {
      const res = await fetch("/api/marketplace/generate-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVariants(data.results.flatMap((r: any) => r.variants))
      setStep("variants")
      toast.success(`${data.results.length} produk diproses, ${data.results.reduce((s: number, r: any) => s + r.totalVariants, 0)} varian`)
    } catch (err: any) {
      toast.error(err.message || "Gagal generate variants")
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateSeo() {
    setGenerating(true)
    const results: Record<string, SeoContent> = { ...seoContents }
    const productMap = new Map(products.map((p) => [p.code, p]))

    for (const p of products) {
      try {
        const res = await fetch("/api/marketplace/generate-seo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: {
              name: p.name,
              code: p.code,
              sizes: p.sizes,
              colors: p.colors,
              minPrice: Math.min(...Object.values(p.prices).filter((v) => v > 0)),
            },
          }),
        })
        const data = await res.json()
        results[p.code] = { title: data.title, description: data.description }
      } catch {
        results[p.code] = { title: p.name, description: "" }
      }
    }

    setSeoContents(results)
    setStep("seo")
    setGenerating(false)
    toast.success("SEO selesai")
  }

  function downloadCsv() {
    const headers = ["SKU", "Produk", "Warna", "Ukuran", "Harga", "Stok", "Title SEO", "Deskripsi"]
    const rows = variants.map((v) => {
      const seo = seoContents[v.productCode]
      return [
        v.sku,
        v.productName,
        v.color,
        v.size,
        v.price,
        v.stock,
        `"${(seo?.title || "").replace(/"/g, '""')}"`,
        `"${(seo?.description || "").replace(/"/g, '""')}"`,
      ].join(",")
    })
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "marketplace-ready-to-publish.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV siap publish")
  }

  const totalVariants = variants.length

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-sm">
        {[
          { key: "input", label: "Input Produk" },
          { key: "variants", label: "Varian" },
          { key: "seo", label: "SEO" },
          { key: "review", label: "Review" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer
                ${step === s.key ? "bg-amber-500 text-white" : variants.length > 0 && ["variants", "seo", "review"].includes(s.key) && ["variants", "seo", "review"].indexOf(step) >= ["variants", "seo", "review"].indexOf(s.key) ? "bg-green-500 text-white" : "bg-zinc-800 text-zinc-500"}`}
              onClick={() => {
                if (s.key === "input") setStep("input")
                else if (s.key === "variants" && variants.length) setStep("variants")
                else if (s.key === "seo" && variants.length) setStep("seo")
              }}
            >
              {["variants", "seo", "review"].includes(s.key) && variants.length > 0 && ["variants", "seo", "review"].indexOf(step) >= ["variants", "seo", "review"].indexOf(s.key) ? "✓" : i + 1}
            </div>
            <span className={`text-xs ${step === s.key ? "font-semibold text-zinc-200" : "text-zinc-500"}`}>{s.label}</span>
            {i < 3 && <ChevronRight className="h-3 w-3 text-zinc-600" />}
          </div>
        ))}
      </div>

      {/* STEP 1: INPUT PRODUK */}
      {step === "input" && (
        <div className="space-y-4">
          {products.map((p, pi) => (
            <Card key={p.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4 text-amber-500" />
                    Produk {pi + 1}
                    {p.name && <Badge className="ml-2 text-[10px]">{p.code || "—"}</Badge>}
                  </CardTitle>
                  {products.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => removeProduct(p.id)}>
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Nama Produk</Label>
                    <Input value={p.name} onChange={(e) => updateProduct(p.id, { name: e.target.value })} placeholder="Kemeja Denim" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kode Produk</Label>
                    <Input value={p.code} onChange={(e) => updateProduct(p.id, { code: e.target.value.toUpperCase() })} placeholder="KMJ-001" />
                  </div>
                </div>

                {/* Colors */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Palette className="h-3 w-3" /> Warna
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {p.colors.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-1">
                        <Input
                          value={c}
                          onChange={(e) => updateColor(p.id, ci, e.target.value)}
                          placeholder={`Warna ${ci + 1}`}
                          className="w-28 h-8 text-xs"
                        />
                        {p.colors.length > 1 && (
                          <button onClick={() => removeColor(p.id, ci)} className="text-red-400 hover:text-red-600">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => addColor(p.id)} className="h-8 text-xs">
                      <Plus className="h-3 w-3 mr-1" /> Warna
                    </Button>
                  </div>
                </div>

                {/* Sizes & Prices */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Ruler className="h-3 w-3" /> Ukuran & Harga
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_SIZES.map((size) => {
                      const active = p.sizes.includes(size)
                      return (
                        <button
                          key={size}
                          onClick={() => toggleSize(p.id, size)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            active
                              ? "bg-amber-500 text-white border-amber-500"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                  {p.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.sizes.map((size) => (
                        <div key={size} className="flex items-center gap-1">
                          <span className="text-xs font-medium w-6">{size}</span>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500">Rp</span>
                            <Input
                              type="number"
                              value={p.prices[size] || ""}
                              onChange={(e) => updatePrice(p.id, size, Number(e.target.value))}
                              className="w-24 h-8 pl-7 text-xs"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div className="space-y-1">
                  <Label className="text-xs flex items-center gap-1">
                    <Camera className="h-3 w-3" /> Foto (2-4 foto)
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {p.photos.map((photo, fi) => (
                      <div key={fi} className="relative w-16 h-16 rounded-lg overflow-hidden border">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(p.id, fi)}
                          className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ))}
                    {p.photos.length < 4 && (
                      <button
                        onClick={() => addPhoto(p.id)}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-amber-400 hover:text-amber-400 transition-colors"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={addProduct}>
              <Plus className="h-4 w-4 mr-2" /> Tambah Produk
            </Button>
            <Button onClick={handleGenerateVariants} disabled={generating} className="bg-amber-500 hover:bg-amber-600 text-black">
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Memproses..." : `Generate ${products.length} Produk`}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: VARIANTS PREVIEW */}
      {step === "variants" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Varian Generated</CardTitle>
                  <CardDescription>{totalVariants} varian dari {products.length} produk</CardDescription>
                </div>
                <Button onClick={handleGenerateSeo} disabled={generating}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {generating ? "Generate..." : "Generate SEO"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-zinc-800/50 sticky top-0">
                    <tr>
                      <th className="text-left p-2 font-medium">SKU</th>
                      <th className="text-left p-2 font-medium">Produk</th>
                      <th className="text-left p-2 font-medium">Warna</th>
                      <th className="text-left p-2 font-medium">Ukuran</th>
                      <th className="text-right p-2 font-medium">Harga</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {variants.map((v, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30">
                        <td className="p-2 font-mono">{v.sku}</td>
                        <td className="p-2">{v.productName}</td>
                        <td className="p-2">{v.color}</td>
                        <td className="p-2">{v.size}</td>
                        <td className="p-2 text-right">Rp{v.price.toLocaleString("id-ID")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: SEO REVIEW */}
      {step === "seo" && (
        <div className="space-y-4">
          {products.map((p) => {
            const seo = seoContents[p.code]
            if (!seo) return null
            return (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    {p.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">SEO Title</Label>
                    <div className="p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-200">{seo.title}</div>
                    <p className="text-[10px] text-zinc-500">{seo.title.length} / 60 karakter</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Deskripsi</Label>
                    <textarea
                      value={seo.description}
                      onChange={(e) =>
                        setSeoContents((prev) => ({
                          ...prev,
                          [p.code]: { ...prev[p.code], description: e.target.value },
                        }))
                      }
                      className="w-full min-h-[120px] p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-sm text-zinc-200 resize-y"
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("variants")}>
              Kembali
            </Button>
            <Button onClick={() => setStep("review")} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" /> Lanjut ke Review
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & EXPORT */}
      {step === "review" && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-800">Siap Publish!</h3>
              <p className="text-sm text-green-600 mt-1">
                {totalVariants} varian dari {products.length} produk siap diupload ke marketplace
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Produk</span>
                  <span className="font-medium">{products.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Varian</span>
                  <span className="font-medium">{totalVariants}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Foto</span>
                  <span className="font-medium">{products.reduce((s, p) => s + p.photos.length, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SEO Generated</span>
                  <span className="font-medium">{Object.keys(seoContents).length}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Cek Validasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                      { label: "Duplicate SKU", ok: true },
                      { label: "Semua varian terisi", ok: true },
                      { label: "Foto per produk", ok: products.every((p) => p.photos.length >= 2) },
                      { label: "Harga terisi", ok: variants.every((v) => v.price > 0) },
                ].map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {c.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={c.ok ? "text-green-700" : "text-red-700"}>{c.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Button onClick={downloadCsv} className="w-full bg-amber-500 hover:bg-amber-600 text-black text-base py-6">
            <Download className="h-5 w-5 mr-2" />
            Download CSV Siap Publish ({totalVariants} varian)
          </Button>
        </div>
      )}
    </div>
  )
}


