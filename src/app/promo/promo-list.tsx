"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, Search, X, Percent, DollarSign, Tag, Clock, Store } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Variasi = { id: string; size: string; warna: string; sku: string; hargaProduksi: number; produk: { id: string; kode: string; nama: string } }
type PromoItem = { id: string; produkVariasiId: string; variasi: Variasi }
type Promo = {
  id: string; nama: string; jenis: string; nilai: number
  tglMulai: string | Date; tglSelesai: string | Date
  status: string; marketplace: string
  createdAt: string | Date
  items: PromoItem[]
}

type ProdukOption = { id: string; kode: string; nama: string; variasi: Variasi[] }

export function PromoList({ data }: { data: Promo[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Promo | null>(null)
  const [step, setStep] = useState(1)
  const [produkList, setProdukList] = useState<ProdukOption[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Form fields
  const [nama, setNama] = useState("")
  const [jenis, setJenis] = useState("persen")
  const [nilai, setNilai] = useState("")
  const [tglMulai, setTglMulai] = useState("")
  const [tglSelesai, setTglSelesai] = useState("")
  const [marketplace, setMarketplace] = useState("All")
  const [status, setStatus] = useState("Draft")
  const [targetType, setTargetType] = useState("sku")
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([])
  const [expandedProduk, setExpandedProduk] = useState<string[]>([])

  // Fetch produk list
  useEffect(() => {
    fetch("/api/master/produk")
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setProdukList(d) : setProdukList([]))
      .catch(() => setProdukList([]))
  }, [open])

  function resetForm() {
    setNama(""); setJenis("persen"); setNilai(""); setTglMulai(""); setTglSelesai("")
    setMarketplace("All"); setStatus("Draft"); setTargetType("sku")
    setSelectedSkuIds([]); setEditing(null); setStep(1); setExpandedProduk([])
  }

  function openEdit(item: Promo) {
    setEditing(item)
    setNama(item.nama); setJenis(item.jenis); setNilai(String(item.nilai))
    setTglMulai((typeof item.tglMulai === "string" ? item.tglMulai : item.tglMulai?.toISOString().split("T")[0]) || "")
    setTglSelesai((typeof item.tglSelesai === "string" ? item.tglSelesai : item.tglSelesai?.toISOString().split("T")[0]) || "")
    setMarketplace(item.marketplace); setStatus(item.status)
    setSelectedSkuIds(item.items.map(i => i.produkVariasiId))
    setOpen(true); setStep(2)
  }

  function toggleSku(id: string) {
    setSelectedSkuIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function toggleExpandProduk(id: string) {
    setExpandedProduk(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const filteredProduk = produkList.filter(p =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.kode.toLowerCase().includes(searchTerm.toLowerCase())
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama) { toast.error("Nama promo wajib diisi"); return }
    if (!nilai || Number(nilai) <= 0) { toast.error("Nilai promo wajib diisi"); return }
    if (!tglMulai || !tglSelesai) { toast.error("Tanggal mulai dan selesai wajib diisi"); return }

    if (editing) {
      const res = await fetch("/api/promo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id, nama, jenis, nilai: Number(nilai),
          tglMulai, tglSelesai, status, marketplace
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Gagal update")
        return
      }
      toast.success("Promo diperbarui")
    } else {
      if (selectedSkuIds.length === 0) { toast.error("Pilih minimal 1 SKU"); return }

      const res = await fetch("/api/promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama, jenis, nilai: Number(nilai),
          tglMulai, tglSelesai, status, marketplace,
          targetType, targetIds: selectedSkuIds,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Gagal simpan", { description: err.details?.join("\n") })
        return
      }
      toast.success("Promo berhasil dibuat")
    }

    resetForm(); setOpen(false); router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus promo ini?")) return
    const res = await fetch(`/api/promo?id=${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Gagal hapus"); return }
    toast.success("Promo dihapus")
    router.refresh()
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      Active: "bg-green-500/10 text-green-400 border-green-500/30",
      Draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      Completed: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      Cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
    }
    return map[status] || "bg-zinc-500/10 text-zinc-400"
  }

  function getPromoHarga(variasi: Variasi): number | null {
    if (!editing && !jenis) return null
    const j = editing ? editing.jenis : jenis
    const n = editing ? editing.nilai : Number(nilai)
    if (!n) return null
    const hargaJual = 50000 // default
    if (j === "persen") return Math.round(hargaJual - (hargaJual * n / 100))
    return Math.round(hargaJual - n)
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle>Daftar Promo</CardTitle>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Buat Promo</Button>} />
            <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Promo" : "Buat Promo Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {!editing && (
                  <div className="flex gap-2 items-center">
                    {[1, 2].map(s => (
                      <div key={s} className={`flex-1 py-2 text-center text-sm rounded-lg ${step === s ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-zinc-800 text-zinc-500"}`}>
                        {s === 1 ? "1. Data Promo" : "2. Target SKU"}
                      </div>
                    ))}
                  </div>
                )}

                <div className={editing ? "block" : step === 1 ? "block" : "hidden"}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Promo</Label>
                      <Input value={nama} onChange={e => setNama(e.target.value)} placeholder="Contoh: Promo Lebaran" />
                    </div>
                    <div className="space-y-2">
                      <Label>Marketplace</Label>
                      <Select value={marketplace} onValueChange={(v) => v && setMarketplace(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">Semua Marketplace</SelectItem>
                          <SelectItem value="Shopee">Shopee</SelectItem>
                          <SelectItem value="Lazada">Lazada</SelectItem>
                          <SelectItem value="Akulaku">Akulaku</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Jenis Promo</Label>
                      <Select value={jenis} onValueChange={(v) => v && setJenis(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persen">Diskon %</SelectItem>
                          <SelectItem value="nominal">Potongan Nominal (Rp)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{jenis === "persen" ? "Diskon (%)" : "Potongan (Rp)"}</Label>
                      <Input type="number" value={nilai} onChange={e => setNilai(e.target.value)} placeholder={jenis === "persen" ? "20" : "25000"} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Mulai</Label>
                      <Input type="date" value={tglMulai} onChange={e => setTglMulai(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Selesai</Label>
                      <Input type="date" value={tglSelesai} onChange={e => setTglSelesai(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => v && setStatus(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Active">Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {!editing && (
                    <Button type="button" className="mt-4 w-full" onClick={() => setStep(2)}>
                      Lanjut ke Target SKU &rarr;
                    </Button>
                  )}
                </div>

                {!editing && step === 2 && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {["sku", "produk", "warna", "size"].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTargetType(t)}
                          className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                            targetType === t
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {t === "sku" ? "Per SKU" : t === "produk" ? "Per Produk" : t === "warna" ? "Per Warna" : "Per Size"}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                      <Input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Cari produk..."
                        className="pl-9"
                      />
                    </div>

                    {targetType === "sku" && (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {filteredProduk.map(p => (
                          <div key={p.id} className="border border-zinc-800 rounded-lg overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleExpandProduk(p.id)}
                              className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 text-left"
                            >
                              <div>
                                <span className="text-xs text-zinc-500">{p.kode}</span>
                                <span className="ml-2 text-sm text-white">{p.nama}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {p.variasi.length} varian
                              </Badge>
                            </button>
                            {expandedProduk.includes(p.id) && (
                              <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
                                {p.variasi.map(v => {
                                  const selected = selectedSkuIds.includes(v.id)
                                  return (
                                    <label
                                      key={v.id}
                                      className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-zinc-800/30"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => toggleSku(v.id)}
                                        className="rounded border-zinc-600"
                                      />
                                      <span className="text-xs text-zinc-400 font-mono">{v.sku}</span>
                                      <Badge variant="secondary" className="text-xs">{v.size}/{v.warna}</Badge>
                                    </label>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        ))}
                        <div className="text-xs text-zinc-500 mt-2">
                          {selectedSkuIds.length} SKU dipilih
                        </div>
                      </div>
                    )}

                    {targetType === "warna" && (
                      <div className="space-y-2">
                        <Label>Pilih Warna (pisahkan dengan koma)</Label>
                        <Input placeholder="MAROON, ARMY, NAVY" onChange={e => {
                          // will be handled on submit
                        }} />
                      </div>
                    )}

                    {targetType === "size" && (
                      <div className="space-y-2">
                        <Label>Pilih Size (pisahkan dengan koma)</Label>
                        <Input placeholder="XXL, XXXL" />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        &larr; Kembali
                      </Button>
                      <Button type="submit" className="flex-1">
                        Simpan Promo
                      </Button>
                    </div>
                  </div>
                )}

                {editing && (
                  <Button type="submit" className="w-full">Simpan</Button>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Target SKU</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-zinc-500 py-8">
                      Belum ada promo. Klik "Buat Promo" untuk mulai.
                    </TableCell>
                  </TableRow>
                )}
                {data.map(promo => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-medium text-white">{promo.nama}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {promo.jenis === "persen" ? "%" : "Rp"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {promo.jenis === "persen" ? `${promo.nilai}%` : `Rp${promo.nilai.toLocaleString()}`}
                    </TableCell>
                    <TableCell className="text-xs text-zinc-400">
                      {(typeof promo.tglMulai === "string" ? promo.tglMulai : promo.tglMulai?.toISOString().split("T")[0])} - {(typeof promo.tglSelesai === "string" ? promo.tglSelesai : promo.tglSelesai?.toISOString().split("T")[0])}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{promo.marketplace}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-zinc-400">{promo.items.length} SKU</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBadge(promo.status)}`}>
                        {promo.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(promo)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(promo.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
