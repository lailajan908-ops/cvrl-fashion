"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Download, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"

export function MarketplaceUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)

  async function handleDownload() {
    try {
      const res = await fetch("/api/marketplace/template")
      if (!res.ok) { toast.error("Gagal download template"); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = "marketplace-upload.xlsx"
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Template terdownload")
    } catch {
      toast.error("Gagal download template")
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) { toast.error("Pilih file dulu"); return }

    setUploading(true)
    setResult(null)

    const fd = new FormData()
    fd.append("file", file)

    try {
      const res = await fetch("/api/marketplace/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Upload gagal")
      } else {
        setResult(data.results)
        toast.success(data.message)
      }
    } catch {
      toast.error("Upload gagal")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Download Template */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Download Template</CardTitle>
                <CardDescription>
                  Template Excel berisi data produk yang sudah ada. Isi kolom Platform, Harga, dan lainnya untuk marketplace.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed">
              <FileSpreadsheet className="h-10 w-10 text-green-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">marketplace-upload.xlsx</p>
                <p className="text-xs text-muted-foreground">
                  Kolom: Platform, Kode Produk, Nama Produk, Size, Warna, SKU, Harga, Stok, Deskripsi, Berat (gram), Kategori
                </p>
              </div>
              <Button onClick={handleDownload} variant="default" className="shrink-0">
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File Excel</CardTitle>
            <CardDescription>
              Upload file yang sudah diisi untuk membuat penjualan e-commerce baru.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5">
                <Upload className="h-8 w-8 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-500 file:text-white hover:file:bg-amber-600 cursor-pointer"
                  />
                </div>
                <Button type="submit" disabled={uploading} className="shrink-0">
                  {uploading ? "Uploading..." : <><Upload className="mr-2 h-4 w-4" /> Upload</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className={result.errors?.length > 0 ? "text-yellow-500" : "text-green-500"}>
                {result.errors?.length > 0 ? (
                  <><AlertCircle className="inline h-5 w-5 mr-2" />Upload Selesai dengan Peringatan</>
                ) : (
                  <><CheckCircle2 className="inline h-5 w-5 mr-2" />Upload Berhasil</>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">{result.success} berhasil</span>
                <span className="text-muted-foreground">{result.skipped} dilewati</span>
                {result.errors?.length > 0 && (
                  <span className="text-yellow-600 font-medium">{result.errors.length} error</span>
                )}
              </div>
              {result.errors?.length > 0 && (
                <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((err: string, i: number) => (
                    <p key={i} className="text-xs text-red-500 flex items-start gap-1">
                      <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" /> {err}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Info Panel */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Petunjuk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Download template untuk mendapatkan data produk terbaru.</span>
            </div>
            <div className="flex gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Isi kolom <strong>Platform</strong> (Shopee/Lazada/Tokopedia/TiktokShop) dan <strong>Harga</strong> minimal.</span>
            </div>
            <div className="flex gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Upload file yang sudah diisi. Setiap baris akan dibuat sebagai penjualan e-commerce baru.</span>
            </div>
            <div className="flex gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              <span>Cek hasil upload di menu <strong>Payment Tracking &gt; E-commerce Sales</strong>.</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kolom Wajib</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              { col: "Platform", req: true, desc: "Shopee, Lazada, Tokopedia, atau TiktokShop" },
              { col: "Harga", req: true, desc: "Harga jual (angka)" },
              { col: "Kode Produk", req: false, desc: "Referensi internal" },
              { col: "SKU", req: false, desc: "SKU produk" },
            ].map((c) => (
              <div key={c.col} className="flex items-start gap-2">
                <span className="font-mono text-xs font-medium min-w-28">{c.col}</span>
                {c.req && <span className="text-red-400 text-xs">*</span>}
                <span className="text-xs text-muted-foreground">{c.desc}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
