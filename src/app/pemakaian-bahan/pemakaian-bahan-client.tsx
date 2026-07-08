"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Scissors } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Bahan = { id: string; kode: string; nama: string; satuan: string; warnaList: string; stok: number; hargaBeli: number }

type MaterialUsage = {
  id: string
  modelName: string
  bahanId: string
  warna: string
  rollCount: number
  totalWeight: number
  createdAt: string | Date
  createdBy: { name: string | null }
  bahan: Bahan
}

const initialForm = { modelName: "", bahanId: "", warna: "", rollCount: 0, totalWeight: 0 }

export function PemakaianBahanClient({ bahanList, initialUsages, userRole }: {
  bahanList: Bahan[]
  initialUsages: MaterialUsage[]
  userRole: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)

  const selectedBahan = bahanList.find((b) => b.id === form.bahanId)
  let warnaArr: string[] = []
  try { if (selectedBahan) warnaArr = JSON.parse(selectedBahan.warnaList || "[]") } catch {}

  function resetForm() { setForm(initialForm) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.modelName) { toast.error("Nama model baju wajib diisi"); return }
    if (!form.bahanId) { toast.error("Pilih bahan"); return }
    if (!form.totalWeight || form.totalWeight <= 0) { toast.error("Total berat/panjang harus diisi"); return }

    const res = await fetch("/api/material-usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal menyimpan")
      return
    }

    toast.success("Pemakaian bahan dicatat, stok berkurang")
    resetForm(); setOpen(false); router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pemakaian Bahan</h1>
          <p className="text-sm text-zinc-500 mt-1">Catat pengambilan bahan untuk produksi baju</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Catat Pemakaian Baru</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Catat Pemakaian Bahan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Model Baju / Artikel</Label>
                <Input value={form.modelName} onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                  placeholder="Contoh: Celana Kulot, Hoodie RL" />
              </div>
              <div className="space-y-2">
                <Label>Pilih Bahan</Label>
                <Select value={form.bahanId} onValueChange={(v) => setForm({ ...form, bahanId: v || "", warna: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih bahan..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bahanList.filter((b) => b.stok > 0).map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.kode} - {b.nama} (Stok: {b.stok} {b.satuan})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {warnaArr.length > 0 && (
                <div className="space-y-2">
                  <Label>Pilih Warna</Label>
                  <Select value={form.warna} onValueChange={(v) => setForm({ ...form, warna: v || "" })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih warna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warnaArr.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {warnaArr.length === 0 && (
                <div className="space-y-2">
                  <Label>Warna</Label>
                  <Input value={form.warna} onChange={(e) => setForm({ ...form, warna: e.target.value })} placeholder="Nama warna" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jumlah Roll yang Diambil</Label>
                  <Input type="number" min="0" value={form.rollCount || ""}
                    onChange={(e) => setForm({ ...form, rollCount: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Total Berat / Panjang ({selectedBahan?.satuan || "satuan"})</Label>
                  <Input type="number" step="0.01" min="0" value={form.totalWeight || ""}
                    onChange={(e) => setForm({ ...form, totalWeight: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>
              {selectedBahan && (
                <p className="text-xs text-zinc-500">
                  Stok tersedia: <span className="text-amber-400">{selectedBahan.stok} {selectedBahan.satuan}</span>
                </p>
              )}
              <Button type="submit" className="w-full">
                <Scissors className="h-4 w-4 mr-1" /> Simpan Pemakaian
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Daftar Pemakaian */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Pemakaian Bahan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Model Baju</TableHead>
                  <TableHead>Bahan</TableHead>
                  <TableHead>Warna</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialUsages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada pemakaian bahan</TableCell>
                  </TableRow>
                )}
                {initialUsages.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="text-xs text-zinc-400">{new Date(u.createdAt).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="font-medium">{u.modelName}</TableCell>
                    <TableCell>{u.bahan.nama}</TableCell>
                    <TableCell><span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{u.warna}</span></TableCell>
                    <TableCell>{u.rollCount} Roll</TableCell>
                    <TableCell>{u.totalWeight} {u.bahan.satuan}</TableCell>
                    <TableCell className="text-xs text-zinc-400">{u.createdBy.name || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
