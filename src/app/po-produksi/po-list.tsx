"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

const statusColors: Record<string, string> = {
  Draft: "bg-gray-500",
  PendingApproval: "bg-yellow-500",
  Approved: "bg-green-500",
  Rejected: "bg-red-500",
  InProgress: "bg-blue-500",
  Completed: "bg-green-700",
}

export function POList({ data, produkList, bahanList }: { data: any[]; produkList: any[]; bahanList: any[] }) {
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState("")
  const [poItems, setPoItems] = useState<any[]>([])
  const [poBahan, setPoBahan] = useState<any[]>([])

  function resetForm() { setPoItems([]); setPoBahan([]); setNotes("") }

  function addItem() {
    const firstVar = produkList[0]?.variasi?.[0]
    if (!firstVar) { toast.error("Buat produk dulu"); return }
    setPoItems([...poItems, { produkVariasiId: firstVar.id, targetQty: 0, estimasiBiaya: "", estimasiHargaMasuk: "" }])
  }

  function updateItem(idx: number, field: string, value: any) {
    const updated = [...poItems]
    updated[idx] = { ...updated[idx], [field]: value }
    setPoItems(updated)
  }

  function removeItem(idx: number) { setPoItems(poItems.filter((_: any, i: number) => i !== idx)) }

  function addBahan() {
    const firstBahan = bahanList[0]
    if (!firstBahan) { toast.error("Buat bahan dulu"); return }
    setPoBahan([...poBahan, { bahanId: firstBahan.id, estimatedAmount: "0" }])
  }

  function updateBahan(idx: number, field: string, value: string) {
    const updated = [...poBahan]
    updated[idx] = { ...updated[idx], [field]: value }
    setPoBahan(updated)
  }

  function removeBahan(idx: number) { setPoBahan(poBahan.filter((_: any, i: number) => i !== idx)) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const validItems = poItems.filter((i: any) => i.targetQty > 0)
    if (validItems.length === 0) { toast.error("Tambah minimal 1 item dengan qty > 0"); return }

    const res = await fetch("/api/po-produksi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: validItems.map((i: any) => ({
          produkVariasiId: i.produkVariasiId,
          targetQty: i.targetQty,
          estimasiBiaya: i.estimasiBiaya ? parseFloat(i.estimasiBiaya) : null,
          estimasiHargaMasuk: i.estimasiHargaMasuk ? parseFloat(i.estimasiHargaMasuk) : null,
        })),
        bahanEstimasi: poBahan.filter((b: any) => parseFloat(b.estimatedAmount) > 0).map((b: any) => ({
          bahanId: b.bahanId,
          estimatedAmount: parseFloat(b.estimatedAmount),
        })),
        notes,
      }),
    })

    if (!res.ok) { const err = await res.json(); toast.error(err.error || "Gagal"); return }
    toast.success("PO dibuat")
    resetForm(); setOpen(false); router.refresh()
  }

  async function handleApprove(id: string, status: string) {
    const res = await fetch("/api/po-produksi", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
    if (!res.ok) { toast.error("Gagal update status"); return }
    toast.success(`PO ${status === "Approved" ? "disetujui" : "ditolak"}`)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus PO ini?")) return
    const res = await fetch(`/api/po-produksi?id=${id}`, { method: "DELETE" })
    if (!res.ok) { toast.error("Gagal hapus"); return }
    toast.success("PO dihapus"); router.refresh()
  }

  const totalQty = (items: any[]) => items.reduce((s: number, i: any) => s + i.targetQty, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle>Daftar PO Produksi</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Buat PO Baru</Button>} />
          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat PO Produksi Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Item Produk (size + warna)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Item
                  </Button>
                </div>
                {poItems.length === 0 && <p className="text-sm text-muted-foreground">Belum ada item. Klik Tambah Item.</p>}
                {poItems.map((item: any, i: number) => {
                  const selectedVariasi = produkList.flatMap((p: any) => p.variasi).find((v: any) => v.id === item.produkVariasiId)
                  return (
                    <div key={i} className="flex gap-2 items-end border p-3 rounded-lg flex-wrap">
                      <div className="w-full sm:flex-1">
                        <Label className="text-xs">Produk</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={item.produkVariasiId}
                          onChange={(e) => updateItem(i, "produkVariasiId", e.target.value)}
                        >
                          {produkList.map((p: any) => p.variasi.map((v: any) => (
                            <option key={v.id} value={v.id}>{p.kode} - {v.size}/{v.warna}</option>
                          )))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[80px]">
                        <Label className="text-xs">Target Qty</Label>
                        <Input type="number" min="1" value={item.targetQty || ""}
                          onChange={(e) => updateItem(i, "targetQty", parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <Label className="text-xs">Estimasi Biaya</Label>
                        <Input type="number" step="1000" value={item.estimasiBiaya}
                          onChange={(e) => updateItem(i, "estimasiBiaya", e.target.value)} placeholder="Rp" />
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <Label className="text-xs">Harga Masuk/pc</Label>
                        <Input type="number" step="100" value={item.estimasiHargaMasuk}
                          onChange={(e) => updateItem(i, "estimasiHargaMasuk", e.target.value)} placeholder="Rp" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Estimasi Bahan</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBahan}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Bahan
                  </Button>
                </div>
                {poBahan.map((b: any, i: number) => {
                  const selectedBahan = bahanList.find((bh: any) => bh.id === b.bahanId)
                  return (
                    <div key={i} className="flex gap-2 items-end flex-wrap">
                      <div className="w-full sm:flex-1">
                        <Label className="text-xs">Bahan</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                          value={b.bahanId}
                          onChange={(e) => updateBahan(i, "bahanId", e.target.value)}
                        >
                          {bahanList.map((bh: any) => (
                            <option key={bh.id} value={bh.id}>{bh.kode} - {bh.nama} ({bh.warna})</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <Label className="text-xs">Jumlah ({selectedBahan?.satuan || ""})</Label>
                        <Input type="number" step="0.01" value={b.estimatedAmount}
                          onChange={(e) => updateBahan(i, "estimatedAmount", e.target.value)} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeBahan(i)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <Label>Catatan</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan PO (opsional)" />
              </div>

              <Button type="submit" className="w-full">Buat PO</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kode PO</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Qty</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Disetujui Oleh</TableHead>
              <TableHead className="w-44">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada PO</TableCell></TableRow>
            )}
            {data.map((po: any) => (
              <TableRow key={po.id}>
                <TableCell className="font-medium">{po.code}</TableCell>
                <TableCell>
                  <Badge className={statusColors[po.status] || "bg-gray-500"}>{po.status}</Badge>
                </TableCell>
                <TableCell>
                  {po.items?.map((item: any, i: number) => (
                    <div key={i} className="text-xs">
                      {item.variasi?.produk?.kode} - {item.variasi?.size}/{item.variasi?.warna}
                    </div>
                  ))}
                </TableCell>
                <TableCell>{totalQty(po.items || [])}</TableCell>
                <TableCell className="text-xs">{new Date(po.createdAt).toLocaleDateString("id-ID")}</TableCell>
                <TableCell className="text-xs">{po.approvedBy?.name || "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {role === "Owner" && po.status === "PendingApproval" && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-600" onClick={() => handleApprove(po.id, "Approved")}>
                          <Check className="h-3 w-3 mr-1" /> Setuju
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleApprove(po.id, "Rejected")}>
                          <X className="h-3 w-3 mr-1" /> Tolak
                        </Button>
                      </>
                    )}
                    {po.status === "Draft" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => handleApprove(po.id, "PendingApproval")}>
                          Ajukan
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(po.id)}>Hapus</Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
  )
}
