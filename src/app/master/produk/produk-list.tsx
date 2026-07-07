"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Upload, X, Sparkles, Search, Check, ImageIcon, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Tags } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AIQuickEntry } from "@/components/ai-quick-entry"
import { SIZE_CODE, CODE_SIZE, generateVariantSKU } from "@/lib/sku-generator"

// ---------- Types ----------
type PromoLabel = { id: string; nama: string; icon: string | null; color: string | null; otomatis: boolean; order: number }
type ProdukLabel = { id: string; labelId: string; warna: string | null; size: string | null; sku: string | null; label: PromoLabel }
type Variasi = { id: string; size: string; warna: string; sku: string; barcode: string | null; price: number; hargaDiskon: number | null; hargaProduksi: number; stock: number; isActive: boolean }
type ProdukImage = { id?: string; url: string; warna?: string | null; isPrimary: boolean; order: number }
type Produk = {
  id: string; kode: string; nama: string; deskripsi: string | null
  kategoriId?: string | null; weight?: number
  variasi: Variasi[]; images?: ProdukImage[]
  kategori?: { id: string; nama: string } | null
  labels?: ProdukLabel[]
}

type WarnaFoto = { warna: string; photos: { url: string; isPrimary: boolean }[] }
type SizeRow = {
  size: string; sku: string; barcode: string
  price: string; hargaDiskon: string; stock: string; isActive: boolean
  hargaModal: string
}

const WARNA_UMUM = ["HITAM", "PUTIH", "NAVY", "ARMY", "MAROON", "COKSU", "TOSKA", "MINT", "SAGE", "ABU", "KUNIT", "PINK", "UNGU", "MERAH", "HIJAU", "BIRU", "COKLAT", "KREM", "CORAL", "SALEM", "BROKEN WHITE", "CHARCOAL", "IVORY", "BEIGE", "BURGUNDY", "OLIVE", "TEAL", "ROSE", "LAVENDER", "PEACH", "DARK GREEN", "LIME", "PLUM", "GOLD", "SILVER", "BRONZE", "COPPER", "RUST", "TERRA", "MAUVE", "BLUSH", "CHAMPAGNE"]
const SIZE_LIST = ["S", "M", "L", "XL", "XXL", "XXXL", "4XL", "5XL"]

// ---------- Labels config ----------
const LABEL_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Premium: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  "QC Passed": { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  "Jahitan Rapi": { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  "New Arrival": { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  "Limited Color": { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30" },
  "Stok Terbatas": { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
  "Best Seller": { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
}

// ---------- Component ----------
export function ProdukList({ data }: { data: Produk[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [editing, setEditing] = useState<Produk | null>(null)
  const [loading, setLoading] = useState(false)
  const [kategoriList, setKategoriList] = useState<{ id: string; nama: string }[]>([])
  const [catSearch, setCatSearch] = useState("")
  const [activeWarnaTab, setActiveWarnaTab] = useState<string | null>(null)
  const [promoLabels, setPromoLabels] = useState<PromoLabel[]>([])
  const [expandedColors, setExpandedColors] = useState<Set<string>>(new Set())

  // Basic
  const [kode, setKode] = useState("")
  const [nama, setNama] = useState("")
  const [kategoriId, setKategoriId] = useState("")
  const [berat, setBerat] = useState("")
  const [deskripsi, setDeskripsi] = useState("")

  // Colors with photos
  const [warnaData, setWarnaData] = useState<WarnaFoto[]>([])
  // Sizes per color: Map<warna, SizeRow[]>
  const [sizeData, setSizeData] = useState<Map<string, SizeRow[]>>(new Map())
  // Selected global sizes
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  // Labels assigned to product
  const [assignedLabels, setAssignedLabels] = useState<ProdukLabel[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadContext = useRef<string | null>(null)

  useEffect(() => {
    fetch("/api/kategori").then(r => r.json()).then(d => Array.isArray(d) ? setKategoriList(d) : null).catch(() => {})
    fetch("/api/labels").then(r => r.json()).then(d => Array.isArray(d) ? setPromoLabels(d) : null).catch(() => {})
  }, [])

  const filteredKategori = kategoriList.filter(k =>
    k.nama.toLowerCase().includes(catSearch.toLowerCase())
  )

  function resetForm() {
    setKode(""); setNama(""); setKategoriId(""); setBerat(""); setDeskripsi("")
    setWarnaData([]); setSelectedSizes([]); setSizeData(new Map()); setActiveWarnaTab(null)
    setAssignedLabels([]); setExpandedColors(new Set())
    setEditing(null); setLoading(false); setCatSearch("")
  }

  // --- Color management ---
  function toggleWarna(w: string) {
    setWarnaData(prev => {
      const exists = prev.find(x => x.warna === w)
      if (exists) {
        const next = prev.filter(x => x.warna !== w)
        if (activeWarnaTab === w) setActiveWarnaTab(next[0]?.warna || null)
        setSizeData(prevMap => { const m = new Map(prevMap); m.delete(w); return m })
        return next
      }
      if (activeWarnaTab === null) setActiveWarnaTab(w)
      return [...prev, { warna: w, photos: [] }]
    })
  }

  // --- Size management ---
  function toggleGlobalSize(s: string) {
    setSelectedSizes(prev => {
      if (prev.includes(s)) {
        setSizeData(prevMap => {
          const m = new Map(prevMap)
          for (const [w, rows] of m) {
            m.set(w, rows.filter(r => r.size !== s))
          }
          return m
        })
        return prev.filter(x => x !== s)
      }
      // Add size to all existing colors
      setSizeData(prevMap => {
        const m = new Map(prevMap)
        for (const wd of warnaData) {
          const existing = m.get(wd.warna) || []
          if (!existing.find(r => r.size === s)) {
            existing.push({
              size: s, sku: generateVariantSKU(kode, wd.warna, s),
              barcode: "", price: "", hargaDiskon: "", stock: "0", isActive: true, hargaModal: ""
            })
          }
          m.set(wd.warna, existing)
        }
        return m
      })
      return [...prev, s]
    })
  }

  // Get sizes for a specific color
  function getSizesForColor(warna: string): SizeRow[] {
    return sizeData.get(warna) || []
  }

  function updateSizeRow(warna: string, idx: number, field: string, value: any) {
    setSizeData(prev => {
      const m = new Map(prev)
      const rows = [...(m.get(warna) || [])]
      rows[idx] = { ...rows[idx], [field]: value }
      m.set(warna, rows)
      return m
    })
  }

  // Update SKU for all sizes when kode changes
  useEffect(() => {
    if (!kode) return
    setSizeData(prev => {
      const m = new Map(prev)
      for (const [w, rows] of m) {
        m.set(w, rows.map(r => ({ ...r, sku: generateVariantSKU(kode, w, r.size) })))
      }
      return m
    })
  }, [kode])

  // Automatically add new colors to sizeData
  useEffect(() => {
    setSizeData(prev => {
      const m = new Map(prev)
      for (const wd of warnaData) {
        if (!m.has(wd.warna)) {
          m.set(wd.warna, selectedSizes.map(s => ({
            size: s, sku: generateVariantSKU(kode, wd.warna, s),
            barcode: "", price: "", hargaDiskon: "", stock: "0", isActive: true, hargaModal: ""
          })))
        }
      }
      return m
    })
  }, [warnaData])

  const isColorActive = (w: string) => warnaData.some(x => x.warna === w)
  const activeWarna = warnaData.find(x => x.warna === activeWarnaTab)

  // --- Photo upload per color ---
  async function uploadPhotosForColor(files: FileList | File[], warna: string) {
    const results: { url: string }[] = []
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name} > 5MB`); continue }
      const formData = new FormData()
      formData.append("file", file)
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (res.ok) results.push(await res.json())
        else toast.error(`Gagal upload ${file.name}`)
      } catch { toast.error(`Gagal upload ${file.name}`) }
    }
    if (results.length === 0) return
    setWarnaData(prev => prev.map(wd =>
      wd.warna === warna
        ? { ...wd, photos: [...wd.photos, ...results.map((r, i) => ({ url: r.url, isPrimary: wd.photos.length === 0 && i === 0 }))] }
        : wd
    ))
  }

  function removePhoto(warna: string, idx: number) {
    setWarnaData(prev => prev.map(wd => {
      if (wd.warna !== warna) return wd
      const updated = wd.photos.filter((_, i) => i !== idx).map((p, i) => ({ ...p, isPrimary: i === 0 }))
      return { ...wd, photos: updated }
    }))
  }

  function setPrimaryPhoto(warna: string, idx: number) {
    setWarnaData(prev => prev.map(wd => {
      if (wd.warna !== warna) return wd
      return { ...wd, photos: wd.photos.map((p, i) => ({ ...p, isPrimary: i === idx })) }
    }))
  }

  async function handleColorDrop(e: React.DragEvent, warna: string) {
    e.preventDefault()
    if (e.dataTransfer.files?.length) await uploadPhotosForColor(e.dataTransfer.files, warna)
  }

  // --- Labels ---
  function toggleLabel(labelId: string, scope?: { warna?: string; size?: string; sku?: string }) {
    setAssignedLabels(prev => {
      const existing = prev.find(l =>
        l.labelId === labelId && l.warna === (scope?.warna || null) && l.size === (scope?.size || null) && l.sku === (scope?.sku || null)
      )
      if (existing) return prev.filter(l => l.id !== existing.id)
      const label = promoLabels.find(l => l.id === labelId)
      if (!label) return prev
      return [...prev, {
        id: `new-${Date.now()}`, labelId, label,
        warna: scope?.warna || null,
        size: scope?.size || null,
        sku: scope?.sku || null,
      }]
    })
  }

  function isLabelActive(labelId: string, scope?: { warna?: string; size?: string; sku?: string }): boolean {
    return assignedLabels.some(l =>
      l.labelId === labelId && l.warna === (scope?.warna || null) && l.size === (scope?.size || null) && l.sku === (scope?.sku || null)
    )
  }

  function getActiveLabels(scope?: { warna?: string; size?: string; sku?: string }): ProdukLabel[] {
    return assignedLabels.filter(l => {
      if (scope?.warna && l.warna !== scope.warna) return false
      if (scope?.size && l.size !== scope.size) return false
      if (scope?.sku && l.sku !== scope.sku) return false
      if (!scope) return !l.warna && !l.size && !l.sku // Product-level labels
      return true
    })
  }

  // --- Edit ---
  function openEdit(item: Produk) {
    setEditing(item)
    setKode(item.kode); setNama(item.nama)
    setKategoriId(item.kategoriId || "")
    setBerat(String(item.weight || ""))
    setDeskripsi(item.deskripsi || "")

    // Colors
    const warnaFromVariants = [...new Set(item.variasi.map(v => v.warna))]
    const warnaMap = new Map<string, { url: string; isPrimary: boolean }[]>()
    for (const img of item.images || []) {
      const w = img.warna || "STANDARD"
      if (!warnaMap.has(w)) warnaMap.set(w, [])
      warnaMap.get(w)!.push({ url: img.url, isPrimary: img.isPrimary })
    }
    const wd: WarnaFoto[] = warnaFromVariants.map(w => ({ warna: w, photos: warnaMap.get(w) || [] }))
    setWarnaData(wd)
    setActiveWarnaTab(wd[0]?.warna || null)

    // Sizes
    const sizes = [...new Set(item.variasi.map(v => v.size))]
    setSelectedSizes(sizes)

    // Size data per color
    const sm = new Map<string, SizeRow[]>()
    for (const w of warnaFromVariants) {
      const rows = item.variasi.filter(v => v.warna === w).map(v => ({
        size: v.size, sku: v.sku, barcode: v.barcode || "",
        price: String(v.price || ""), hargaDiskon: String(v.hargaDiskon || ""),
        stock: String(v.stock || ""), isActive: v.isActive ?? true,
        hargaModal: String(v.hargaProduksi || "")
      }))
      sm.set(w, rows)
    }
    setSizeData(sm)

    // Labels
    setAssignedLabels(item.labels || [])

    setOpen(true)
  }

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!kode || !nama) { toast.error("Kode dan nama wajib diisi"); return }

    setLoading(true)

    // Build images with color context
    const images = warnaData.flatMap(wd =>
      wd.photos.map(p => ({ url: p.url, warna: wd.warna, isPrimary: p.isPrimary }))
    )

    // Build variants from sizeData
    const variasi: any[] = []
    for (const [warna, rows] of sizeData) {
      for (const r of rows) {
        variasi.push({
          size: r.size, warna, sku: r.sku,
          barcode: r.barcode || null,
          price: Number(r.price) || 0,
          hargaDiskon: r.hargaDiskon ? Number(r.hargaDiskon) : null,
          hargaProduksi: Number(r.hargaModal) || 0,
          stock: Number(r.stock) || 0,
          isActive: r.isActive,
        })
      }
    }

    // Fallback: if no sizeData but colors and sizes selected
    if (variasi.length === 0 && warnaData.length > 0 && selectedSizes.length > 0) {
      for (const wd of warnaData) {
        for (const size of selectedSizes) {
          variasi.push({
            size, warna: wd.warna, sku: generateVariantSKU(kode, wd.warna, size),
            price: 0, stock: 0, isActive: true, hargaProduksi: 0
          })
        }
      }
    }

    if (variasi.length === 0) {
      variasi.push({ size: "ONESIZE", warna: "STANDARD", sku: kode, price: 0, stock: 0, isActive: true, hargaProduksi: 0 })
    }

    const payload: any = {
      id: editing?.id, kode, nama,
      deskripsi: deskripsi || null,
      kategoriId: kategoriId || null,
      weight: Number(berat) || 0,
      images,
      variasi,
      labels: assignedLabels.map(l => ({
        labelId: l.labelId, warna: l.warna, size: l.size, sku: l.sku
      }))
    }

    try {
      const res = await fetch("/api/master/produk", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Gagal simpan")
        return
      }
      toast.success(editing ? "Produk diperbarui" : "Produk ditambahkan")
      resetForm(); setOpen(false); router.refresh()
    } catch {
      toast.error("Gagal simpan")
    } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini?")) return
    const res = await fetch(`/api/master/produk?id=${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Gagal hapus"); return }
    toast.success("Produk dihapus"); router.refresh()
  }

  function handleDuplicate(item: Produk) {
    resetForm(); setEditing(null)
    // Will be handled by the "Edit" flow then user saves as new
    openEdit(item)
    setKode(item.kode + "-CP"); setNama(item.nama + " (Copy)")
  }

  function toggleColorExpand(warna: string) {
    setExpandedColors(prev => {
      const next = new Set(prev)
      if (next.has(warna)) next.delete(warna); else next.add(warna)
      return next
    })
  }

  const LabelBadge = ({ label, small }: { label: ProdukLabel; small?: boolean }) => {
    const style = LABEL_STYLE[label.label.nama] || { bg: "bg-zinc-800", text: "text-zinc-300", border: "border-zinc-700" }
    return (
      <span className={`inline-flex items-center gap-0.5 rounded-full border ${style.bg} ${style.text} ${style.border} ${small ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}>
        {label.label.icon && <span>{label.label.icon}</span>}
        {label.label.nama}
      </span>
    )
  }

  // ---------- RENDER ----------
  return (
    <div className="space-y-4">
      <div className="card-luxury">
        <div className="p-6 border-b border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gold">Master Produk</h2>
            <p className="text-xs text-zinc-500">R&amp;L – Multi Seller Center</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickOpen(true)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              <Sparkles className="h-4 w-4 mr-1" /> AI Quick Entry
            </Button>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
              <DialogTrigger render={<Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-semibold"><Plus className="mr-1 h-4 w-4" /> Tambah Produk</Button>} />
              <DialogContent className="max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto p-0 bg-zinc-950 border-zinc-800">
                <div className="p-4 border-b border-zinc-800/60 sticky top-0 bg-zinc-950 z-10">
                  <DialogHeader>
                    <DialogTitle className="text-gold">{editing ? "Edit Produk" : "Tambah Produk Baru"}</DialogTitle>
                  </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-6">
                  {/* === INFO DASAR === */}
                  <div className="border border-zinc-800 rounded-lg p-4 space-y-4">
                    <h3 className="text-sm font-medium text-amber-400">Informasi Dasar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-400">Nama Produk <span className="text-red-400">*</span></Label>
                        <Input value={nama} onChange={e => setNama(e.target.value)} placeholder="BAJU KOKO BIN LADEN LENGAN PANJANG" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-400">Kode Produk <span className="text-red-400">*</span></Label>
                        <Input value={kode} onChange={e => setKode(e.target.value)} placeholder="KKO001" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Kategori</Label>
                      <div className="relative mb-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500" />
                        <Input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder="Cari kategori..." className="pl-8 text-sm" />
                      </div>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {filteredKategori.map(k => (
                          <button key={k.id} type="button" onClick={() => { setKategoriId(k.id); setCatSearch("") }}
                            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                              kategoriId === k.id ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                            }`}>
                            {k.nama}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-zinc-400">Berat (gram)</Label>
                        <Input type="number" value={berat} onChange={e => setBerat(e.target.value)} placeholder="250" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Deskripsi Produk</Label>
                      <Textarea value={deskripsi} onChange={e => setDeskripsi(e.target.value)}
                        placeholder="Deskripsikan produk Anda..." className="min-h-[80px]" />
                    </div>
                  </div>

                  {/* === LABEL PROM === */}
                  <div className="border border-zinc-800 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-medium text-amber-400 flex items-center gap-2">
                      <Tags className="h-4 w-4" /> Label PROM
                    </h3>
                    <p className="text-xs text-zinc-500">Label identitas produk. Maks 3 label ditampilkan di thumbnail.</p>
                    <div className="flex flex-wrap gap-2">
                      {promoLabels.map(pl => (
                        <button key={pl.id} type="button" onClick={() => toggleLabel(pl.id)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1 ${
                            isLabelActive(pl.id)
                              ? (LABEL_STYLE[pl.nama]?.bg || "bg-zinc-700") + " " + (LABEL_STYLE[pl.nama]?.text || "text-white") + " " + (LABEL_STYLE[pl.nama]?.border || "border-zinc-600")
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          }`}>
                          {pl.icon && <span>{pl.icon}</span>}
                          {pl.nama}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {getActiveLabels().map(l => (
                        <LabelBadge key={l.id} label={l} />
                      ))}
                      {getActiveLabels().length === 0 && <span className="text-[10px] text-zinc-600 italic">Belum ada label</span>}
                    </div>
                  </div>

                  {/* === WARNA (LEVEL 1 VARIAN) === */}
                  <div className="border border-zinc-800 rounded-lg p-4 space-y-4">
                    <h3 className="text-sm font-medium text-amber-400">Varian Warna</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {WARNA_UMUM.map(w => (
                        <button key={w} type="button" onClick={() => toggleWarna(w)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            isColorActive(w) ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          }`}>
                          {w} {isColorActive(w) && <Check className="inline h-3 w-3 ml-1" />}
                        </button>
                      ))}
                    </div>

                    {warnaData.length > 0 && (
                      <div className="space-y-3 mt-4">
                        <div className="flex flex-wrap gap-1">
                          {warnaData.map(wd => (
                            <button key={wd.warna} type="button" onClick={() => setActiveWarnaTab(wd.warna)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                                activeWarnaTab === wd.warna ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700"
                              }`}>
                              <ImageIcon className="h-3 w-3" />
                              {wd.warna} <span className="text-[10px] text-zinc-600">({wd.photos.length})</span>
                            </button>
                          ))}
                        </div>

                        {activeWarna && (
                          <div className="border border-zinc-800 rounded-lg p-4 space-y-3 bg-zinc-900/50">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-white">Foto <span className="text-amber-400">{activeWarna.warna}</span></h4>
                              {warnaData.filter(w => w.warna !== activeWarna.warna && getSizesForColor(w.warna).some(r => r.hargaModal || r.price)).length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] text-zinc-600 tracking-wider">Salin ukuran dari:</span>
                                  <select
                                    onChange={e => {
                                      const src = e.target.value
                                      if (!src) return
                                      const srcRows = getSizesForColor(src)
                                      if (srcRows.length === 0) return
                                      setSizeData(prev => {
                                        const m = new Map(prev)
                                        const dstRows = m.get(activeWarna.warna) || []
                                        const merged = dstRows.map(dst => {
                                          const match = srcRows.find(s => s.size === dst.size)
                                          return match ? { ...dst, hargaModal: match.hargaModal, price: match.price, hargaDiskon: match.hargaDiskon, barcode: match.barcode, stock: match.stock } : dst
                                        })
                                        m.set(activeWarna.warna, merged)
                                        return m
                                      })
                                      toast.success(`Data ukuran disalin dari ${src}`)
                                    }}
                                    className="text-[10px] bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-amber-500/50"
                                  >
                                    <option value="">— pilih —</option>
                                    {warnaData.filter(w => w.warna !== activeWarna.warna && getSizesForColor(w.warna).some(r => r.hargaModal || r.price)).map(w => (
                                      <option key={w.warna} value={w.warna}>{w.warna}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                            {activeWarna.photos.length > 0 ? (
                              <div className="flex gap-2 flex-wrap">
                                {activeWarna.photos.map((p, i) => (
                                  <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-zinc-700">
                                    <img src={p.url} alt="" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => removePhoto(activeWarna.warna, i)}
                                      className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                      <X className="h-3 w-3" />
                                    </button>
                                    {p.isPrimary
                                      ? <Badge className="absolute bottom-0.5 left-0.5 text-[9px] bg-amber-500 py-0">Utama</Badge>
                                      : <button type="button" onClick={() => setPrimaryPhoto(activeWarna.warna, i)}
                                          className="absolute bottom-0.5 left-0.5 text-[9px] bg-zinc-800/80 text-zinc-400 px-1 rounded py-0 opacity-0 group-hover:opacity-100 transition-opacity hover:text-amber-400">Utamakan</button>
                                    }
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center">
                                <p className="text-xs text-zinc-500">Belum ada foto</p>
                              </div>
                            )}
                            <div onDrop={e => handleColorDrop(e, activeWarna.warna)} onDragOver={e => e.preventDefault()}
                              className="border-2 border-dashed border-zinc-700 rounded-lg p-4 text-center hover:border-amber-500/50 transition-colors cursor-pointer"
                              onClick={() => { uploadContext.current = activeWarna.warna; fileInputRef.current?.click() }}>
                              <Upload className="h-6 w-6 mx-auto text-zinc-500 mb-1" />
                              <p className="text-xs text-zinc-400">Klik atau drag foto ke sini</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* === SIZE (LEVEL 2 VARIAN) === */}
                  <div className="border border-zinc-800 rounded-lg p-4 space-y-4">
                    <h3 className="text-sm font-medium text-amber-400">Varian Ukuran <span className="text-[10px] text-zinc-500 font-normal">(SKU & Barcode)</span></h3>
                    <p className="text-xs text-zinc-500">SKU: <span className="font-mono text-amber-400">{kode || "KODE"}{SIZE_CODE["S"] || "1"}-warna-size</span> (Kode Produk + Kode Ukuran - Warna - Size)</p>
                    <div className="flex flex-wrap gap-1.5">
                      {SIZE_LIST.map(s => (
                        <button key={s} type="button" onClick={() => toggleGlobalSize(s)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                            selectedSizes.includes(s) ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          }`}>
                          {s}
                        </button>
                      ))}
                    </div>

                    {/* Harga per Ukuran — global, berlaku untuk semua warna */}
                    {selectedSizes.length > 0 && warnaData.length > 0 && (
                      <div className="border border-zinc-800 rounded-lg p-3 space-y-2">
                        <p className="text-[10px] text-zinc-500 tracking-wider uppercase">Harga per Ukuran — berlaku untuk semua warna</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSizes.map(size => {
                            const firstColor = warnaData[0]?.warna
                            const firstRows = getSizesForColor(firstColor)
                            const row = firstRows.find(r => r.size === size)
                            return (
                              <div key={size} className="flex items-center gap-1.5 p-2 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                                <span className="text-xs font-semibold text-amber-400 w-6">{size}</span>
                                <div className="relative w-24">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">M</span>
                                  <input type="number" value={row?.hargaModal || ""} placeholder="Modal"
                                    className="w-full h-7 pl-5 pr-1 text-[10px] bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                                    onChange={e => {
                                      const v = e.target.value
                                      setSizeData(prev => {
                                        const m = new Map(prev)
                                        for (const [w, rows] of m) {
                                          m.set(w, rows.map(r => r.size === size ? { ...r, hargaModal: v } : r))
                                        }
                                        return m
                                      })
                                    }} />
                                </div>
                                <div className="relative w-24">
                                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-zinc-600">J</span>
                                  <input type="number" value={row?.price || ""} placeholder="Jual"
                                    className="w-full h-7 pl-5 pr-1 text-[10px] bg-zinc-800 border border-zinc-700 rounded text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50"
                                    onChange={e => {
                                      const v = e.target.value
                                      setSizeData(prev => {
                                        const m = new Map(prev)
                                        for (const [w, rows] of m) {
                                          m.set(w, rows.map(r => r.size === size ? { ...r, price: v } : r))
                                        }
                                        return m
                                      })
                                    }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Size tables per color */}
                    {warnaData.length > 0 && selectedSizes.length > 0 && (
                      <div className="space-y-4 mt-2">
                        {warnaData.map(wd => {
                          const rows = getSizesForColor(wd.warna)
                          if (rows.length === 0) return null
                          const isExpanded = expandedColors.has(wd.warna)
                          const primaryPhoto = wd.photos.find(p => p.isPrimary)?.url || wd.photos[0]?.url
                          const colorLabels = getActiveLabels({ warna: wd.warna })
                          return (
                            <div key={wd.warna} className="border border-zinc-800 rounded-lg overflow-hidden">
                              <button type="button" onClick={() => toggleColorExpand(wd.warna)}
                                className="w-full flex items-center gap-3 p-3 hover:bg-zinc-800/50 transition-colors text-left">
                                {primaryPhoto
                                  ? <img src={primaryPhoto} alt="" className="w-10 h-10 rounded object-cover" />
                                  : <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-zinc-600" /></div>
                                }
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-white">{wd.warna}</p>
                                  <p className="text-[10px] text-zinc-500">{rows.length} ukuran</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {colorLabels.slice(0, 2).map(l => <LabelBadge key={l.id} label={l} small />)}
                                  {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                                </div>
                              </button>

                              {isExpanded && (
                                <div className="border-t border-zinc-800 p-3">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-[10px]">Ukuran</TableHead>
                                        <TableHead className="text-[10px]">Code</TableHead>
                                        <TableHead className="text-[10px]">SKU</TableHead>
                                        <TableHead className="text-[10px]">Barcode</TableHead>
                                        <TableHead className="text-[10px]">Modal</TableHead>
                                        <TableHead className="text-[10px]">Jual</TableHead>
                                        <TableHead className="text-[10px]">Diskon</TableHead>
                                        <TableHead className="text-[10px]">Stok</TableHead>
                                        <TableHead className="text-[10px]">Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {rows.map((r, i) => {
                                        const skuLabels = getActiveLabels({ warna: wd.warna, size: r.size, sku: r.sku })
                                        return (
                                          <TableRow key={i}>
                                            <TableCell className="text-xs font-medium">{r.size}</TableCell>
                                            <TableCell className="text-xs font-mono text-amber-400">{SIZE_CODE[r.size] || r.size}</TableCell>
                                            <TableCell>
                                              <Input value={r.sku} onChange={e => updateSizeRow(wd.warna, i, "sku", e.target.value.toUpperCase())}
                                                className="text-[10px] h-7 w-36 font-mono" />
                                            </TableCell>
                                            <TableCell>
                                              <Input value={r.barcode} onChange={e => updateSizeRow(wd.warna, i, "barcode", e.target.value)}
                                                className="text-[10px] h-7 w-24 font-mono" placeholder="Opsional" />
                                            </TableCell>
                                            <TableCell className="text-[10px] text-zinc-400 font-mono">
                                              {Number(r.hargaModal).toLocaleString() || "—"}
                                            </TableCell>
                                            <TableCell className="text-[10px] text-amber-400 font-mono font-semibold">
                                              {Number(r.price).toLocaleString() || "—"}
                                            </TableCell>
                                            <TableCell>
                                              <Input type="number" value={r.hargaDiskon} onChange={e => updateSizeRow(wd.warna, i, "hargaDiskon", e.target.value)}
                                                className="text-[10px] h-7 w-20" placeholder="0" />
                                            </TableCell>
                                            <TableCell>
                                              <Input type="number" value={r.stock} onChange={e => updateSizeRow(wd.warna, i, "stock", e.target.value)}
                                                className="text-[10px] h-7 w-16" placeholder="0" />
                                            </TableCell>
                                            <TableCell>
                                              <button type="button" onClick={() => updateSizeRow(wd.warna, i, "isActive", !r.isActive)}
                                                className={`text-[10px] flex items-center gap-1 ${r.isActive ? "text-green-400" : "text-zinc-600"}`}>
                                                {r.isActive ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                                              </button>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {selectedSizes.length === 0 && <p className="text-xs text-zinc-600 italic">Pilih ukuran untuk generate varian</p>}
                  </div>

                  {/* SUBMIT */}
                  <div className="flex gap-2 justify-end pt-4 border-t border-zinc-800 sticky bottom-0 bg-zinc-950 pb-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Menyimpan..." : editing ? "Simpan" : "Tambah Produk"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {quickOpen && <AIQuickEntry onClose={() => setQuickOpen(false)} />}

        {/* === PRODUCT LIST === */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Foto</TableHead>
                  <TableHead>PROM</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead>Varian</TableHead>
                  <TableHead className="w-28">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-zinc-500 py-8">Belum ada produk</TableCell></TableRow>
                )}
                {data.map(p => {
                  const colors = [...new Set(p.variasi.map(v => v.warna))]
                  const totalVariants = p.variasi.length
                  const primaryImg = p.images?.find(i => i.isPrimary)?.url || p.images?.[0]?.url
                  const productLabels = (p.labels || []).filter(l => !l.warna && !l.size && !l.sku).slice(0, 3)
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        {primaryImg
                          ? <div className="relative">
                              <img src={primaryImg} alt="" className="w-12 h-12 rounded object-cover" />
                              {productLabels.length > 0 && (
                                <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
                                  {productLabels.map(l => (
                                    <LabelBadge key={l.id} label={l} small />
                                  ))}
                                </div>
                              )}
                            </div>
                          : <div className="w-12 h-12 rounded bg-zinc-800 flex items-center justify-center"><ImageIcon className="h-4 w-4 text-zinc-600" /></div>
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5 max-w-[80px]">
                          {productLabels.map(l => <LabelBadge key={l.id} label={l} small />)}
                          {productLabels.length === 0 && <span className="text-[9px] text-zinc-700">-</span>}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">{p.kode}</TableCell>
                      <TableCell className="text-white font-medium">
                        <span className="truncate max-w-[180px] block">{p.nama}</span>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{p.kategori?.nama || "-"}</Badge></TableCell>
                      <TableCell className="text-[10px] text-zinc-400 max-w-[100px]">
                        <div className="flex flex-wrap gap-0.5">
                          {colors.slice(0, 3).map(c => <span key={c} className="bg-zinc-800 px-1 rounded">{c}</span>)}
                          {colors.length > 3 && <span className="text-zinc-600">+{colors.length - 3}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">{totalVariants}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)} title="Edit">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(p)} title="Duplikat">
                            <CopyIcon className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleDelete(p.id)} title="Hapus">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
        onChange={e => {
          if (uploadContext.current && e.target.files?.length) {
            uploadPhotosForColor(e.target.files, uploadContext.current)
            if (fileInputRef.current) fileInputRef.current.value = ""
          }
        }} />
    </div>
  )
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  )
}
