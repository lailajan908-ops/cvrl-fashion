"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type PromoLabel = { id: string; nama: string; icon: string | null; color: string | null; otomatis: boolean; order: number }

export function LabelsPage() {
  const router = useRouter()
  const [labels, setLabels] = useState<PromoLabel[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PromoLabel | null>(null)
  const [form, setForm] = useState({ nama: "", icon: "", color: "#22C55E", otomatis: false, order: 0 })

  useEffect(() => {
    fetch("/api/labels").then(r => r.json()).then(setLabels)
  }, [])

  function resetForm() { setForm({ nama: "", icon: "", color: "#22C55E", otomatis: false, order: 0 }); setEditing(null) }

  function openEdit(label: PromoLabel) {
    setForm({ nama: label.nama, icon: label.icon || "", color: label.color || "#22C55E", otomatis: label.otomatis, order: label.order })
    setEditing(label)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama) { toast.error("Nama label wajib diisi"); return }
    const body: any = { ...form, icon: form.icon || null, color: form.color || null }
    if (editing) body.id = editing.id

    const res = await fetch("/api/labels", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) { toast.error("Gagal"); return }
    toast.success(editing ? "Label diperbarui" : "Label ditambahkan")
    resetForm(); setOpen(false)
    fetch("/api/labels").then(r => r.json()).then(setLabels)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus label?")) return
    const res = await fetch(`/api/labels?id=${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Gagal hapus"); return }
    toast.success("Label dihapus")
    fetch("/api/labels").then(r => r.json()).then(setLabels)
  }

  return (
    <div className="card-luxury">
      <div className="p-6 border-b border-zinc-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gold">Daftar Label PROM</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-semibold"><Plus className="mr-2 h-4 w-4" /> Tambah Label</Button>} />
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader><DialogTitle className="text-zinc-100">{editing ? "Edit Label" : "Tambah Label Baru"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Nama Label <span className="text-red-400">*</span></Label>
                <Input value={form.nama} onChange={e => setForm({ ...form, nama: e.target.value })} placeholder="Premium" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Icon (emoji)</Label>
                <Input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} placeholder="⭐" className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Warna</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="w-16 h-9 p-1 bg-zinc-800 border-zinc-700" />
                  <span className="text-xs text-zinc-400">{form.color}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">Urutan</Label>
                <Input type="number" value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="bg-zinc-800 border-zinc-700 text-zinc-100" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="otomatis" checked={form.otomatis}
                  onChange={e => setForm({ ...form, otomatis: e.target.checked })} className="rounded bg-zinc-800 border-zinc-700" />
                <Label htmlFor="otomatis" className="text-xs text-zinc-300">Otomatis dari sistem</Label>
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-semibold">{editing ? "Simpan" : "Tambah"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Icon</TableHead>
                <TableHead className="text-zinc-400">Nama</TableHead>
                <TableHead className="text-zinc-400">Warna</TableHead>
                <TableHead className="text-zinc-400">Otomatis</TableHead>
                <TableHead className="text-zinc-400">Urutan</TableHead>
                <TableHead className="w-28 text-zinc-400">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labels.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-zinc-600 py-8">Belum ada label</TableCell></TableRow>
              )}
              {labels.map(l => (
                <TableRow key={l.id} className="border-zinc-800 hover:bg-zinc-800/30">
                  <TableCell className="text-lg">{l.icon || "-"}</TableCell>
                  <TableCell className="font-medium text-zinc-200">
                    <span className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${l.color}20`, color: l.color || "#e4e4e7", borderColor: `${l.color}40`, borderWidth: 1 }}>
                      {l.nama}
                    </span>
                  </TableCell>
                  <TableCell><span className="text-xs font-mono text-zinc-500">{l.color || "-"}</span></TableCell>
                  <TableCell className="text-xs text-zinc-400">{l.otomatis ? "Ya" : "Tidak"}</TableCell>
                  <TableCell className="text-xs text-zinc-400">{l.order}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="icon" onClick={() => openEdit(l)} className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="border-zinc-700 text-red-400 hover:bg-red-950/30" onClick={() => handleDelete(l.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
