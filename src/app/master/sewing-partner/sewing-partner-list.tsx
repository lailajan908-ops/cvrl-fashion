"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Partner = { id: string; nama: string }

export function SewingPartnerList({ data }: { data: Partner[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)
  const [nama, setNama] = useState("")

  function resetForm() { setNama(""); setEditing(null) }

  function openEdit(item: Partner) { setNama(item.nama); setEditing(item); setOpen(true) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nama) { toast.error("Nama wajib diisi"); return }

    const res = await fetch("/api/master/sewing-partner", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing?.id, nama }),
    })

    if (!res.ok) { const err = await res.json(); toast.error(err.error || "Gagal menyimpan"); return }
    toast.success(editing ? "Diperbarui" : "Ditambahkan")
    resetForm(); setOpen(false); router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus sewing partner ini?")) return
    const res = await fetch(`/api/master/sewing-partner?id=${id}`, { method: "DELETE" })
    if (!res.ok) { const err = await res.json(); toast.error(err.error || "Gagal menghapus"); return }
    toast.success("Dihapus"); router.refresh()
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Daftar Sewing Partner</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Tambah Partner</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Partner" : "Tambah Partner Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Partner</Label>
                <Input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama penjahit" />
              </div>
              <Button type="submit" className="w-full">{editing ? "Simpan" : "Tambah"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="w-24">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground">Belum ada data</TableCell></TableRow>
            )}
            {data.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nama}</TableCell>
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
