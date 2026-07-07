"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ShoppingCart, Send, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Bahan = { id: string; kode: string; nama: string; satuan: string; warna: string; kategori: string; stok: number; hargaBeli: number; stokMinimum: number }

type ListItem = {
  id?: string
  bahanId: string
  warna: string
  rolls: string
  totalKg: number
  totalMeter: number
  hargaPerKg: number
  hargaPerMeter: number
  bahan?: Bahan
}

type ShoppingList = {
  id: string; code: string; status: string; notes: string | null; buktiUrl: string | null
  createdById: string; approvedById: string | null; approvedAt: string | Date | null
  diterimaById: string | null; diterimaAt: string | Date | null
  createdAt: string | Date
  createdBy: { name: string | null }
  approvedBy: { name: string | null } | null
  diterimaBy: { name: string | null } | null
  items: (ListItem & { bahan: Bahan })[]
}

function emptyItem(): ListItem {
  return { bahanId: "", warna: "", rolls: "", totalKg: 0, totalMeter: 0, hargaPerKg: 0, hargaPerMeter: 0 }
}

const statusColors: Record<string, string> = {
  Draft: "bg-zinc-800 text-zinc-400",
  PendingApproval: "bg-amber-900/30 text-amber-500 border border-amber-800/30",
  Approved: "bg-emerald-900/30 text-emerald-500 border border-emerald-800/30",
  Diterima: "bg-blue-900/30 text-blue-500 border border-blue-800/30",
  Done: "bg-emerald-900/30 text-emerald-500 border border-emerald-800/30",
  Cancelled: "bg-red-900/30 text-red-500 border border-red-800/30",
}

function itemTotal(item: ListItem) {
  return item.totalKg * item.hargaPerKg + item.totalMeter * item.hargaPerMeter
}

export function ListBelanjaClient({ bahanList, initialLists, userRole }: {
  bahanList: Bahan[]
  initialLists: ShoppingList[]
  userRole: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ShoppingList | null>(null)
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<ListItem[]>([emptyItem()])
  const [tab, setTab] = useState<string>("all")
  const [terimaOpen, setTerimaOpen] = useState(false)
  const [terimaList, setTerimaList] = useState<ShoppingList | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const canApprove = userRole === "Owner" || userRole === "ManagerProduksi"

  const statuses = ["all", "Draft", "PendingApproval", "Approved", "Diterima", "Done", "Cancelled"]
  const filtered = tab === "all" ? initialLists : initialLists.filter((l) => l.status === tab)

  function resetForm() {
    setNotes("")
    setItems([emptyItem()])
    setEditing(null)
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(list: ShoppingList) {
    setNotes(list.notes || "")
    setItems(list.items.map((i) => ({
      bahanId: i.bahanId,
      warna: i.warna,
      rolls: i.rolls,
      totalKg: i.totalKg,
      totalMeter: i.totalMeter,
      hargaPerKg: i.hargaPerKg,
      hargaPerMeter: i.hargaPerMeter,
    })))
    setEditing(list)
    setOpen(true)
  }

  function addItem() {
    setItems([...items, emptyItem()])
  }

  function removeItem(idx: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: keyof ListItem, value: any) {
    const updated = [...items]
    ;(updated[idx] as any)[field] = value

    if (field === "bahanId") {
      const bahan = bahanList.find((b) => b.id === value)
      if (bahan) {
        updated[idx].warna = bahan.warna
        updated[idx].hargaPerKg = bahan.kategori === "Bahan Baku" ? bahan.hargaBeli : 0
        updated[idx].hargaPerMeter = bahan.kategori === "Aksesoris" ? bahan.hargaBeli : 0
      }
    }

    if (field === "rolls") {
      const nums = value.split(",").map((s: string) => parseFloat(s.trim())).filter((n: number) => !isNaN(n))
      const total = nums.reduce((sum: number, n: number) => sum + n, 0)
      updated[idx].totalKg = total
    }

    setItems(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validItems = items.filter((i) => i.bahanId && (i.totalKg > 0 || i.totalMeter > 0))
    if (validItems.length === 0) {
      toast.error("Minimal satu item dengan total > 0")
      return
    }

    const body = {
      notes: notes || null,
      items: validItems.map((i) => ({
        bahanId: i.bahanId,
        warna: i.warna,
        rolls: i.rolls,
        totalKg: i.totalKg,
        totalMeter: i.totalMeter,
        hargaPerKg: i.hargaPerKg,
        hargaPerMeter: i.hargaPerMeter,
      })),
    }

    const res = await fetch("/api/shopping-list", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...body, id: editing.id } : body),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal menyimpan")
      return
    }

    toast.success(editing ? "List Belanja diperbarui" : "List Belanja dibuat")
    resetForm()
    setOpen(false)
    router.refresh()
  }

  async function handleAction(id: string, action: string, extra?: Record<string, any>) {
    const confirmMsg: Record<string, string> = {
      submit: "Kirim list ini untuk approval?",
      approve: "Setujui list belanja ini?",
      cancel: "Batalkan list belanja ini?",
      done: "Tandai selesai? Stok bahan akan otomatis bertambah.",
    }
    if (confirmMsg[action] && !confirm(confirmMsg[action])) return

    const res = await fetch(`/api/shopping-list/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal")
      return
    }

    toast.success("Berhasil")
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus list belanja ini?")) return

    const res = await fetch(`/api/shopping-list?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal menghapus")
      return
    }

    toast.success("List Belanja dihapus")
    router.refresh()
  }

  function openTerima(list: ShoppingList) {
    setTerimaList(list)
    setTerimaOpen(true)
  }

  async function handleTerima() {
    if (!terimaList) return
    setUploading(true)

    let buktiUrl: string | null = null

    if (fileRef.current?.files?.[0]) {
      const formData = new FormData()
      formData.append("file", fileRef.current.files[0])

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        toast.error("Gagal upload foto surat jalan")
        setUploading(false)
        return
      }

      const uploadData = await uploadRes.json()
      buktiUrl = uploadData.url
    }

    await handleAction(terimaList.id, "terima", { buktiUrl })
    setTerimaOpen(false)
    setTerimaList(null)
    setUploading(false)
  }

  function listTotal(lists: ListItem[]) {
    return lists.reduce((sum, i) => sum + itemTotal(i), 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">List Belanja</h1>
          <p className="text-sm text-zinc-500 mt-1">Catat kebutuhan bahan & aksesoris untuk dibelanjakan</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Buat List Belanja</Button>} />
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit List Belanja" : "Buat List Belanja Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opsional..." />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const total = itemTotal(item)
                    return (
                      <div key={idx} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex-1 min-w-[160px] space-y-1">
                            <Label className="text-[10px]">Jenis Kain / Bahan</Label>
                            <Select value={item.bahanId} onValueChange={(v) => updateItem(idx, "bahanId", v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih bahan..." />
                              </SelectTrigger>
                              <SelectContent>
                                {bahanList.map((b) => (
                                  <SelectItem key={b.id} value={b.id}>
                                    {b.kode} - {b.nama} ({b.kategori})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-28 space-y-1">
                            <Label className="text-[10px]">Warna</Label>
                            <Input value={item.warna} onChange={(e) => updateItem(idx, "warna", e.target.value)} placeholder="Warna" />
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex-1 min-w-[200px] space-y-1">
                            <Label className="text-[10px]">Rincian Roll (Kg) — pisahkan dengan koma</Label>
                            <Input
                              value={item.rolls}
                              onChange={(e) => updateItem(idx, "rolls", e.target.value)}
                              placeholder="25.55, 25.80, 25.80, 25.90"
                            />
                          </div>
                          <div className="w-20 space-y-1">
                            <Label className="text-[10px]">Total Kg</Label>
                            <Input type="number" step="0.01" min="0" value={item.totalKg || ""} onChange={(e) => updateItem(idx, "totalKg", parseFloat(e.target.value) || 0)} />
                          </div>
                          <div className="w-24 space-y-1">
                            <Label className="text-[10px]">Harga / Kg</Label>
                            <Input type="number" step="100" min="0" value={item.hargaPerKg || ""} onChange={(e) => updateItem(idx, "hargaPerKg", parseFloat(e.target.value) || 0)} />
                          </div>
                        </div>

                        <div className="flex flex-wrap items-end gap-2">
                          <div className="w-24 space-y-1">
                            <Label className="text-[10px]">Total Meter</Label>
                            <Input type="number" step="0.01" min="0" value={item.totalMeter || ""} onChange={(e) => updateItem(idx, "totalMeter", parseFloat(e.target.value) || 0)} />
                          </div>
                          <div className="w-28 space-y-1">
                            <Label className="text-[10px]">Harga / Meter</Label>
                            <Input type="number" step="100" min="0" value={item.hargaPerMeter || ""} onChange={(e) => updateItem(idx, "hargaPerMeter", parseFloat(e.target.value) || 0)} />
                          </div>
                          <div className="text-xs text-zinc-400 py-1">
                            Subtotal: <span className="text-amber-400 font-semibold">Rp {total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="text-right text-sm text-zinc-400">
                Total Estimasi: <span className="text-amber-400 font-bold">Rp {listTotal(items).toLocaleString()}</span>
              </div>

              <Button type="submit" className="w-full">{editing ? "Simpan" : "Simpan sebagai Draft"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {statuses.map((s) => {
          const count = s === "all" ? initialLists.length : initialLists.filter((l) => l.status === s).length
          const labels: Record<string, string> = { all: "Semua", Draft: "Draft", PendingApproval: "Menunggu", Approved: "Disetujui", Diterima: "Diterima", Done: "Selesai", Cancelled: "Dibatalkan" }
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                tab === s ? "bg-amber-500/10 text-amber-400 border border-amber-800/30" : "text-zinc-500 hover:text-zinc-300 border border-transparent"
              }`}
            >
              {labels[s]} ({count})
            </button>
          )
        })}
      </div>

      {/* Dialog Terima Barang */}
      <Dialog open={terimaOpen} onOpenChange={setTerimaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Terima Barang - {terimaList?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Foto Surat Jalan (dari supplier/toko)</Label>
              <input type="file" ref={fileRef} accept="image/*" className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-zinc-700 file:text-xs file:bg-zinc-900 file:text-zinc-300 hover:file:bg-zinc-800" />
            </div>
            <Button onClick={handleTerima} disabled={uploading} className="w-full">
              {uploading ? "Mengupload..." : <><CheckCircle className="h-4 w-4 mr-1" /> Konfirmasi Terima Barang</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lists */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingCart className="h-8 w-8 text-zinc-800 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">Belum ada list belanja</p>
            </CardContent>
          </Card>
        )}

        {filtered.map((list) => (
          <Card key={list.id}>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{list.code}</CardTitle>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[list.status] || ""}`}>{list.status}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {list.status === "Draft" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleAction(list.id, "submit")}>
                      <Send className="h-3 w-3 mr-1" /> Kirim Approval
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEdit(list)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(list.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {list.status === "PendingApproval" && canApprove && (
                  <>
                    <Button variant="outline" size="sm" className="text-emerald-500" onClick={() => handleAction(list.id, "approve")}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Setujui
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleAction(list.id, "cancel")}>
                      <XCircle className="h-3 w-3 mr-1" /> Tolak
                    </Button>
                  </>
                )}
                {list.status === "Approved" && (
                  <Button variant="outline" size="sm" onClick={() => openTerima(list)}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Terima Barang
                  </Button>
                )}
                {list.status === "Diterima" && canApprove && (
                  <Button variant="outline" size="sm" onClick={() => handleAction(list.id, "done")}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Tandai Selesai
                  </Button>
                )}
                {list.status === "PendingApproval" && !canApprove && (
                  <span className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> Menunggu persetujuan
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500 mb-3 space-y-1">
                <span>Dibuat oleh: <span className="text-zinc-300">{list.createdBy.name || "Unknown"}</span></span>
                {list.approvedBy && (
                  <span className="ml-4">Disetujui oleh: <span className="text-zinc-300">{list.approvedBy.name}</span></span>
                )}
                {list.diterimaBy && (
                  <span className="ml-4">Diterima oleh: <span className="text-zinc-300">{list.diterimaBy.name}</span></span>
                )}
                {list.notes && <p className="text-zinc-600 mt-1">Catatan: {list.notes}</p>}
              </div>

              {list.buktiUrl && (
                <div className="mb-3 p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Surat Jalan</p>
                  <a href={list.buktiUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={list.buktiUrl} alt="Surat Jalan" className="max-h-48 rounded object-contain bg-black/40" />
                  </a>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Jenis Kain</TableHead>
                      <TableHead>Warna</TableHead>
                      <TableHead>Rincian Roll (Kg)</TableHead>
                      <TableHead>Total Kg</TableHead>
                      <TableHead>Harga/Kg</TableHead>
                      <TableHead>Total Meter</TableHead>
                      <TableHead>Harga/Meter</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.items.map((item, idx) => (
                      <TableRow key={item.id || idx}>
                        <TableCell className="font-medium">{item.bahan.nama}</TableCell>
                        <TableCell>{item.warna}</TableCell>
                        <TableCell className="text-xs text-zinc-400 max-w-[200px] truncate">{item.rolls}</TableCell>
                        <TableCell>{item.totalKg > 0 ? `${item.totalKg} Kg` : "-"}</TableCell>
                        <TableCell>{item.hargaPerKg > 0 ? `Rp ${item.hargaPerKg.toLocaleString()}` : "-"}</TableCell>
                        <TableCell>{item.totalMeter > 0 ? `${item.totalMeter} M` : "-"}</TableCell>
                        <TableCell>{item.hargaPerMeter > 0 ? `Rp ${item.hargaPerMeter.toLocaleString()}` : "-"}</TableCell>
                        <TableCell className="text-right">Rp {itemTotal(item).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end mt-3 pt-3 border-t border-zinc-800/40">
                <p className="text-sm">
                  Total: <span className="text-amber-400 font-bold">Rp {listTotal(list.items).toLocaleString()}</span>
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
