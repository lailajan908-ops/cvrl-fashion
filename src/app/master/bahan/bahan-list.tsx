"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Bahan = {
  id: string
  kode: string
  nama: string
  satuan: string
  stok: number
  hargaBeli: number
}

const initialForm = { nama: "", satuan: "Meter", stok: 0, hargaBeli: 0 }

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
    setForm({ nama: item.nama, satuan: item.satuan, stok: item.stok, hargaBeli: item.hargaBeli })
    setEditing(item)
    setOpen(true)
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Bahan" : "Tambah Bahan Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Bahan</Label>
                  <Input value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama bahan" />
                </div>
                <div className="space-y-2">
                  <Label>Satuan</Label>
                  <Select value={form.satuan} onValueChange={(v) => setForm({ ...form, satuan: v || "Meter" })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KG">KG</SelectItem>
                      <SelectItem value="Meter">Meter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stok</Label>
                  <Input type="number" step="0.01" value={form.stok} onChange={(e) => setForm({ ...form, stok: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Harga Beli</Label>
                  <Input type="number" step="100" value={form.hargaBeli} onChange={(e) => setForm({ ...form, hargaBeli: parseFloat(e.target.value) || 0 })} />
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
                <TableHead>Satuan</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada data</TableCell>
                </TableRow>
              )}
              {data.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.nama}</TableCell>
                  <TableCell>{b.satuan}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </>
  )
}
