"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, X, Trash2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { ProductPhotoUpload } from "@/components/ProductPhotoUpload"
import { AIQuickEntry } from "@/components/ai-quick-entry"

type Variasi = { id: string; size: string; warna: string; sku: string; fotoPath: string | null; fotoUrl: string | null; namaFoto: string | null }
type Produk = { id: string; kode: string; nama: string; deskripsi: string | null; fotoUrl: string | null; namaFoto: string | null; variasi: Variasi[] }

const sizes = ["M", "L", "XL", "XXL", "XXXL"]

export function ProdukList({ data }: { data: Produk[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editing, setEditing] = useState<Produk | null>(null)
  const [kode, setKode] = useState("")
  const [nama, setNama] = useState("")
  const [variasi, setVariasi] = useState<{ size: string; warna: string; sku: string; foto: File | null; fotoPath: string | null; fotoUrl: string | null; namaFoto: string }[]>([])

  function resetForm() {
    setKode(""); setNama(""); setVariasi([]); setEditing(null)
  }

  function openEdit(item: Produk) {
    setKode(item.kode); setNama(item.nama)
    setVariasi(item.variasi.map(v => ({ size: v.size, warna: v.warna, sku: v.sku, foto: null, fotoPath: v.fotoPath, fotoUrl: v.fotoUrl, namaFoto: v.namaFoto || "" })))
    setEditing(item)
    setOpen(true)
  }

  function addVariasi() {
    setVariasi([...variasi, { size: "L", warna: "", sku: "", foto: null, fotoPath: "", fotoUrl: "", namaFoto: "" }])
  }

  function updateVariasi(idx: number, field: string, value: any) {
    const updated = [...variasi]
    if (field === "foto") {
      const file = value as File
      if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File foto tidak boleh lebih dari 5MB")
          return
        }
        updated[idx] = { ...updated[idx], [field]: file }
        const previewUrl = URL.createObjectURL(file)
        updated[idx].fotoUrl = previewUrl
        if (!updated[idx].namaFoto) {
          updated[idx].namaFoto = file.name
        }
      }
    } else {
      updated[idx] = { ...updated[idx], [field]: value } as any
      if (field === "size" || field === "warna") {
        const v = updated[idx]
        if (!v.sku || editing) {
          v.sku = `${kode}-${v.size}-${v.warna}`.toUpperCase()
        }
      }
    }
    setVariasi(updated)
  }

  function removeVariasi(idx: number) {
    const v = variasi[idx]
    if (v.fotoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(v.fotoUrl)
    }
    setVariasi(variasi.filter((_, i) => i !== idx))
  }

  function removeFoto(idx: number) {
    const v = variasi[idx]
    if (v.fotoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(v.fotoUrl)
    }
    setVariasi(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], foto: null, fotoUrl: null, namaFoto: "" }
      return updated
    })
  }

  function handleFotoUploaded(idx: number, fotoUrl: string, filename: string) {
    const updated = [...variasi]
    updated[idx] = { ...updated[idx], fotoUrl, namaFoto: filename, fotoPath: fotoUrl.split('/').pop() || null }
    setVariasi(updated)
  }

  async function uploadFoto(file: File, produkKode: string, ukuran: string, warna: string): Promise<{ fotoUrl: string; filename: string }> {
    const formData = new FormData()
    formData.append("foto", file)
    formData.append("produkId", produkKode)
    formData.append("size", ukuran)
    formData.append("warna", warna)

    const response = await fetch("/api/upload-produk-foto", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Gagal mengupload foto")
    }

    const data = await response.json()
    return data
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!kode || !nama) { toast.error("Kode dan Nama produk wajib diisi"); return }
    if (variasi.length === 0) { toast.error("Tambahkan minimal 1 variasi"); return }

    // Prepare variations with photos
    const variationsWithPhotos = await Promise.all(
      variasi.map(async (v) => {
        let fotoUrl = v.fotoUrl || v.fotoPath || null
        let fotoPath = v.fotoPath || null
        let namaFoto = v.namaFoto || null

        if (v.foto) {
          try {
            const uploadResult = await uploadFoto(v.foto, kode, v.size, v.warna)
            fotoUrl = uploadResult.fotoUrl
            namaFoto = uploadResult.filename
          } catch (error) {
            toast.error("Gagal mengupload foto: " + v.size + " / " + v.warna)
            return null
          }
        }

        return {
          ...v,
          fotoUrl,
          fotoPath,
          namaFoto,
        }
      })
    )

    // Filter out failed uploads
    const successfulVariations = variationsWithPhotos.filter(v => v !== null)

    const res = await fetch("/api/master/produk", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing?.id,
        kode,
        nama,
        variasi: successfulVariations
      }),
    })

    if (!res.ok) {
      let msg = "Gagal menyimpan"
      try { const err = await res.json(); msg = err.error || msg } catch { msg = await res.text().catch(() => msg) }
      toast.error(msg)
      return
    }

    toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan")
    resetForm()
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini?")) return
    const res = await fetch(`/api/master/produk?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      let msg = "Gagal menghapus"
      try { const err = await res.json(); msg = err.error || msg } catch { msg = await res.text().catch(() => msg) }
      toast.error(msg)
      return
    }
    toast.success("Produk dihapus")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Daftar Produk</CardTitle>
        <div className="flex gap-2">
          <Button onClick={() => setQuickOpen(true)} className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold border-0">
            <Sparkles className="mr-2 h-4 w-4" /> Quick Entry AI
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger render={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Tambah Produk</Button>} />
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kode Produk</Label>
                  <Input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="Contoh: A028" />
                </div>
                <div className="space-y-2">
                  <Label>Nama Produk</Label>
                  <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama produk" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Variasi (Size + Warna)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addVariasi}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Variasi
                  </Button>
                </div>
                {variasi.map((v, i) => (
                  <div key={i} className="flex gap-2 items-end p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <Label className="text-xs">Size</Label>
                      <select
                        className="flex h-9 w-20 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={v.size}
                        onChange={(e) => updateVariasi(i, "size", e.target.value)}
                      >
                        {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Warna</Label>
                      <Input value={v.warna} onChange={(e) => updateVariasi(i, "warna", e.target.value)} placeholder="Warna" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">SKU (otomatis)</Label>
                      <Input value={v.sku} readOnly placeholder="SKU" className="bg-gray-100" />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Foto</Label>
                      <ProductPhotoUpload
                        produkId={kode}
                        ukuran={v.size}
                        warna={v.warna}
                        existingFotoUrl={v.fotoUrl || undefined}
                        onFotoUploaded={(fotoUrl, filename) => handleFotoUploaded(i, fotoUrl, filename)}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeVariasi(i)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">{editing ? "Simpan" : "Tambah"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      </CardHeader>
      {quickOpen && <AIQuickEntry onClose={() => setQuickOpen(false)} />}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Variasi</TableHead>
              <TableHead>Foto</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada data</TableCell></TableRow>
            )}
            {data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.kode}</TableCell>
                <TableCell>{p.nama}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {p.variasi.map((v) => (
                      <Badge key={v.id} variant="secondary" className="text-xs">
                        {v.size}/{v.warna}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    {p.variasi.map((v) => (
                      v.fotoUrl && (
                        <div key={v.id} className="relative group">
                          <img 
                            src={v.fotoUrl} 
                            alt={v.namaFoto || `${p.kode} - ${v.size}/${v.warna}`} 
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => v.fotoUrl && window.open(v.fotoUrl, '_blank')}
                          />
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            onClick={() => console.log('Remove photo:', v.id)}
                          >
                            ×
                          </div>
                          {v.namaFoto && (
                            <div className="text-xs text-gray-500 mt-1 text-center">
                              {v.namaFoto.length > 15 ? v.namaFoto.substring(0, 15) + '...' : v.namaFoto}
                            </div>
                          )}
                        </div>
                      )
                    ))}
                    {p.variasi.filter(v => v.fotoUrl).length === 0 && (
                      <span className="text-xs text-gray-400 italic">Belum ada foto</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(p.id)}>
                      <span className="text-xs">X</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
