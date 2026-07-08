"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const WARNA_OPTIONS = [
  "HITAM", "PUTIH", "NAVY", "MAROON", "ABU-ABU", "CREAM", "COKLAT",
  "HIJAU", "MERAH", "KUNING", "PINK", "UNGU", "BIRU", "ORANGE",
  "SILVER", "EMAS", "MILO", "ARMY", "BURGUNDY", "TOSCA",
]

type Bahan = {
  id: string
  kode: string
  nama: string
  satuan: string
  kategori: string
  warnaList: string
  stok: number
  hargaBeli: number
}

const initialForm = { nama: "", satuan: "Meter", kategori: "Kain", stok: 0, hargaBeli: 0, warnaList: [] as string[] }

export function BahanList({ data }: { data: Bahan[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bahan | null>(null)
  const [form, setForm] = useState(initialForm)

  function resetForm() {
    setForm(initialForm)
    setEditing(null)
  }

  function openEdit(item: Bahan) {
    let parsedWarna: string[] = []
    try { parsedWarna = JSON.parse(item.warnaList || "[]") } catch {}
    setForm({
      nama: item.nama,
      satuan: item.satuan,
      kategori: item.kategori,
      stok: item.stok,
      hargaBeli: item.hargaBeli,
      warnaList: parsedWarna,
    })
    setEditing(item)
    setOpen(true)
  }

  function toggleWarna(w: string) {
    setForm((prev) => ({
      ...prev,
      warnaList: prev.warnaList.includes(w)
        ? prev.warnaList.filter((c) => c !== w)
        : [...prev.warnaList, w],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.nama) {
      toast.error("Nama bahan harus diisi")
      return
    }

    const res = await fetch("/api/master/bahan", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: editing?.id }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal menyimpan")
      return
    }

    toast.success(editing ? "Bahan diperbarui" : "Bahan ditambahkan")
    resetForm()
    setOpen(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus bahan ini?")) return

    const res = await fetch(`/api/master/bahan?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal menghapus")
      return
    }

    toast.success("Bahan dihapus")
    router.refresh()
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle>Daftar Bahan</CardTitle>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Tambah Bahan</Button>} />
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Bahan" : "Tambah Bahan Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Bahan / Barang</Label>
                  <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Contoh: Baby Terry, Poly Micro" />
                </div>
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={form.kategori} onValueChange={(v) => setForm({ ...form, kategori: v || "Kain" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kain">Kain</SelectItem>
                      <SelectItem value="Aksesoris">Aksesoris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Satuan Utama</Label>
                  <Select value={form.satuan} onValueChange={(v) => setForm({ ...form, satuan: v || "Meter" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">Kilo (Kg)</SelectItem>
                      <SelectItem value="Meter">Meter (M)</SelectItem>
                      <SelectItem value="Pcs">Pcs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Variasi Warna (Multi-Select)</Label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-2 rounded-lg border border-zinc-800 bg-zinc-900/50">
                    {WARNA_OPTIONS.map((w) => {
                      const selected = form.warnaList.includes(w)
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => toggleWarna(w)}
                          className={`text-[10px] px-2 py-1 rounded border transition-all ${
                            selected
                              ? "bg-amber-500/20 border-amber-700 text-amber-400"
                              : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                          }`}
                        >
                          {w}
                        </button>
                      )
                    })}
                  </div>
                  {form.warnaList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {form.warnaList.map((w) => (
                        <span key={w} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                          {w}
                          <button type="button" onClick={() => toggleWarna(w)} className="hover:text-amber-200">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Stok Awal</Label>
                    <Input type="number" step="0.01" value={form.stok} onChange={(e) => setForm({ ...form, stok: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Harga Beli</Label>
                    <Input type="number" step="100" value={form.hargaBeli} onChange={(e) => setForm({ ...form, hargaBeli: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <Button type="submit" className="w-full">{editing ? "Simpan" : "Tambah"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Bahan</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Warna</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada data</TableCell>
                </TableRow>
              )}
              {data.map((b) => {
                let warnaArr: string[] = []
                try { warnaArr = JSON.parse(b.warnaList || "[]") } catch {}
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.nama}</TableCell>
                    <TableCell><span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{b.kategori}</span></TableCell>
                    <TableCell>{b.satuan}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {warnaArr.length === 0 && <span className="text-xs text-zinc-600">-</span>}
                        {warnaArr.map((w) => (
                          <span key={w} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{w}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{b.stok}</TableCell>
                    <TableCell>Rp {b.hargaBeli.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(b)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(b.id)}>
                          <span className="text-xs">X</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </>
  )
}
