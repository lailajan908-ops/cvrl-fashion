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
import { Plus, Pencil, Trash2, CheckCircle, XCircle, ShoppingCart, Send, Printer, Package } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type Bahan = { id: string; kode: string; nama: string; satuan: string; warnaList: string; kategori: string; stok: number; hargaBeli: number }

type OrderItem = {
  id?: string
  bahanId: string
  warna: string
  rollOrdered: number
  weights: { roll: number; weight: number }[]
  totalWeight: number
  price: number
  bahan?: Bahan
}

type PurchaseOrder = {
  id: string; code: string; supplier: string; status: string; notes: string | null
  fakturNo: string | null; hargaBeli: number | null
  createdById: string; createdAt: string | Date
  createdBy: { name: string | null }
  items: (OrderItem & { bahan: Bahan })[]
}

const statusColors: Record<string, string> = {
  Draft: "bg-zinc-800 text-zinc-400",
  Ordered: "bg-amber-900/30 text-amber-500 border border-amber-800/30",
  Received: "bg-blue-900/30 text-blue-500 border border-blue-800/30",
  Done: "bg-emerald-900/30 text-emerald-500 border border-emerald-800/30",
  Cancelled: "bg-red-900/30 text-red-500 border border-red-800/30",
}

function emptyItem(): OrderItem {
  return { bahanId: "", warna: "", rollOrdered: 0, weights: [], totalWeight: 0, price: 0 }
}

export function SuratJalanClient({ bahanList, initialOrders, userRole }: {
  bahanList: Bahan[]
  initialOrders: PurchaseOrder[]
  userRole: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)
  const [supplier, setSupplier] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<OrderItem[]>([emptyItem()])
  const [tab, setTab] = useState("all")
  const [terimaOpen, setTerimaOpen] = useState(false)
  const [terimaOrder, setTerimaOrder] = useState<PurchaseOrder | null>(null)
  const [fakturNo, setFakturNo] = useState("")
  const [hargaBeli, setHargaBeli] = useState(0)

  const statuses = ["all", "Draft", "Ordered", "Received", "Done", "Cancelled"]
  const filtered = tab === "all" ? initialOrders : initialOrders.filter((o) => o.status === tab)

  function resetForm() {
    setSupplier("")
    setNotes("")
    setItems([emptyItem()])
    setEditing(null)
  }

  function openEdit(order: PurchaseOrder) {
    setSupplier(order.supplier)
    setNotes(order.notes || "")
    setItems(order.items.map((i) => ({
      bahanId: i.bahanId,
      warna: i.warna,
      rollOrdered: i.rollOrdered,
      weights: [],
      totalWeight: 0,
      price: 0,
    })))
    setEditing(order)
    setOpen(true)
  }

  function addItem() { setItems([...items, emptyItem()]) }

  function removeItem(idx: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: string, value: any) {
    const updated = [...items]
    ;(updated[idx] as any)[field] = value
    if (field === "bahanId") {
      const bahan = bahanList.find((b) => b.id === value)
      if (bahan) {
        let warnaArr: string[] = []
        try { warnaArr = JSON.parse(bahan.warnaList || "[]") } catch {}
        updated[idx].warna = warnaArr[0] || ""
      }
    }
    setItems(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplier) { toast.error("Nama supplier/toko wajib diisi"); return }
    const validItems = items.filter((i) => i.bahanId)
    if (validItems.length === 0) { toast.error("Pilih minimal satu bahan"); return }

    const body = {
      supplier,
      notes: notes || null,
      items: validItems.map((i) => ({ bahanId: i.bahanId, warna: i.warna, rollOrdered: i.rollOrdered })),
    }

    const res = await fetch("/api/purchase-order", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...body, id: editing.id } : body),
    })

    if (!res.ok) { const err = await res.json(); toast.error(err.error || "Gagal menyimpan"); return }

    toast.success(editing ? "Order diperbarui" : "Surat Jalan Order dibuat")
    resetForm(); setOpen(false); router.refresh()
  }

  async function handleAction(id: string, action: string, extra?: Record<string, any>) {
    const confirmMsg: Record<string, string> = {
      order: "Kirim order ini ke supplier?",
      cancel: "Batalkan order ini?",
      done: "Tandai selesai? Stok bahan akan otomatis bertambah.",
    }
    if (confirmMsg[action] && !confirm(confirmMsg[action])) return

    const res = await fetch(`/api/purchase-order/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    })
    if (!res.ok) { const err = await res.json(); toast.error(err.error || "Gagal"); return }
    toast.success("Berhasil"); router.refresh()
  }

  // Terima dialog
  function openTerima(order: PurchaseOrder) {
    setTerimaOrder(order)
    setTerimaItems(order.items.map((i) => ({
      ...i,
      weights: i.weights?.length ? i.weights : Array.from({ length: i.rollOrdered }, (_, ri) => ({ roll: ri + 1, weight: 0 })),
      totalWeight: i.totalWeight || 0,
      price: i.price || 0,
    })))
    setFakturNo(order.fakturNo || "")
    setHargaBeli(order.hargaBeli || 0)
    setTerimaOpen(true)
  }

  const [terimaItems, setTerimaItems] = useState<(OrderItem & { bahan: Bahan })[]>([])

  function updateTerimaWeight(itemIdx: number, rollIdx: number, value: number) {
    const updated = [...terimaItems]
    updated[itemIdx].weights[rollIdx] = { roll: rollIdx + 1, weight: value }
    updated[itemIdx].totalWeight = updated[itemIdx].weights.reduce((sum, w) => sum + w.weight, 0)
    updated[itemIdx].price = updated[itemIdx].totalWeight * hargaBeli
    setTerimaItems(updated)
  }

  async function handleTerima() {
    if (!terimaOrder) return
    const itemsPayload = terimaItems.map((i) => ({
      id: i.id,
      weights: i.weights,
      totalWeight: i.totalWeight,
      price: i.price,
    }))
    await handleAction(terimaOrder.id, "terima", { fakturNo, hargaBeli, items: itemsPayload })
    setTerimaOpen(false); setTerimaOrder(null)
  }

  // Print surat jalan
  function handlePrint(order: PurchaseOrder) {
    const printWin = window.open("", "_blank")
    if (!printWin) { toast.error("Pop-up blocked"); return }
    printWin.document.write(`
      <html><head><title>Surat Jalan - ${order.code}</title>
      <style>
        body { font-family: monospace; padding: 40px; max-width: 800px; margin: auto; }
        h1 { text-align: center; font-size: 18px; margin-bottom: 4px; }
        h2 { text-align: center; font-size: 14px; color: #666; font-weight: normal; margin-top: 0; }
        .header { display: flex; justify-content: space-between; margin: 20px 0; padding: 8px 0; border-top: 1px solid #000; border-bottom: 1px solid #000; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #000; padding: 6px 8px; text-align: left; font-size: 12px; }
        th { background: #f0f0f0; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .footer div { text-align: center; }
        .footer .line { margin-top: 30px; border-top: 1px solid #000; padding-top: 4px; font-size: 11px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>R&L FASHION</h1>
      <h2>SURAT JALAN ORDER - ${order.code}</h2>
      <div class="header">
        <div><strong>Supplier:</strong> ${order.supplier}</div>
        <div><strong>Tanggal:</strong> ${new Date(order.createdAt).toLocaleDateString("id-ID")}</div>
      </div>
      <table>
        <tr><th>No</th><th>Bahan</th><th>Warna</th><th>Jumlah Roll</th></tr>
        ${order.items.map((item, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${item.bahan.nama}</td>
            <td>${item.warna}</td>
            <td style="text-align:center">${item.rollOrdered} Roll</td>
          </tr>
        `).join("")}
      </table>
      <p style="font-size:11px;margin-top:8px"><strong>Catatan:</strong> ${order.notes || "-"}</p>
      <div class="footer">
        <div><span class="line">Pembuat</span></div>
        <div><span class="line">Supplier</span></div>
        <div><span class="line">Penerima</span></div>
      </div>
      <script>window.print()</script>
      </body></html>
    `)
    printWin.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Surat Jalan Order</h1>
          <p className="text-sm text-zinc-500 mt-1">Pesan bahan baku ke supplier / toko</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Buat Order Baru</Button>} />
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Surat Jalan Order" : "Buat Surat Jalan Order Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Pilih Supplier / Toko</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nama supplier atau toko" />
              </div>
              <div className="space-y-2">
                <Label>Catatan</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opsional..." />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Rincian Order Per Bahan & Warna</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Item
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    const bahan = bahanList.find((b) => b.id === item.bahanId)
                    let warnaArr: string[] = []
                    try { if (bahan) warnaArr = JSON.parse(bahan.warnaList || "[]") } catch {}
                    return (
                      <div key={idx} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex-1 min-w-[180px] space-y-1">
                            <Label className="text-[10px]">Pilih Bahan</Label>
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
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-red-500" onClick={() => removeItem(idx)} disabled={items.length <= 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {bahan && warnaArr.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-[10px]">Jumlah Roll Per Warna</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {warnaArr.map((w) => {
                                const isSelected = item.warna === w
                                return (
                                  <div
                                    key={w}
                                    onClick={() => updateItem(idx, "warna", w)}
                                    className={`p-2 rounded border cursor-pointer transition-all ${
                                      isSelected ? "border-amber-700 bg-amber-500/10" : "border-zinc-800 hover:border-zinc-600"
                                    }`}
                                  >
                                    <p className="text-xs font-medium">{w}</p>
                                    {isSelected && (
                                      <Input
                                        type="number" min="0"
                                        className="h-7 text-xs mt-1"
                                        value={item.rollOrdered || ""}
                                        placeholder="Jml roll"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateItem(idx, "rollOrdered", parseInt(e.target.value) || 0)}
                                      />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        {bahan && warnaArr.length === 0 && (
                          <div className="flex gap-2 items-end">
                            <div className="space-y-1 flex-1">
                              <Label className="text-[10px]">Warna</Label>
                              <Input value={item.warna} onChange={(e) => updateItem(idx, "warna", e.target.value)} placeholder="Nama warna" />
                            </div>
                            <div className="w-24 space-y-1">
                              <Label className="text-[10px]">Jumlah Roll</Label>
                              <Input type="number" min="0" value={item.rollOrdered || ""} onChange={(e) => updateItem(idx, "rollOrdered", parseInt(e.target.value) || 0)} />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              <Button type="submit" className="w-full">{editing ? "Simpan" : "Simpan sebagai Draft"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tab filter */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {statuses.map((s) => {
          const count = s === "all" ? initialOrders.length : initialOrders.filter((o) => o.status === s).length
          const labels: Record<string, string> = { all: "Semua", Draft: "Draft", Ordered: "Dipesan", Received: "Diterima", Done: "Selesai", Cancelled: "Dibatalkan" }
          return (
            <button key={s} onClick={() => setTab(s)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${tab === s ? "bg-amber-500/10 text-amber-400 border border-amber-800/30" : "text-zinc-500 hover:text-zinc-300 border border-transparent"}`}>
              {labels[s]} ({count})
            </button>
          )
        })}
      </div>

      {/* Daftar Orders */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-8 w-8 text-zinc-800 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">Belum ada order</p>
            </CardContent>
          </Card>
        )}

        {filtered.map((order) => (
          <Card key={order.id}>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">{order.code}</CardTitle>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusColors[order.status] || ""}`}>{order.status}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {order.status === "Draft" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleAction(order.id, "order")}>
                      <Send className="h-3 w-3 mr-1" /> Kirim Order
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint(order)}>
                      <Printer className="h-3 w-3 mr-1" /> Cetak
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => openEdit(order)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleAction(order.id, "cancel")}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
                {order.status === "Ordered" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openTerima(order)}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Terima Barang
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint(order)}>
                      <Printer className="h-3 w-3 mr-1" /> Cetak
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500" onClick={() => handleAction(order.id, "cancel")}>
                      <XCircle className="h-3 w-3 mr-1" /> Batalkan
                    </Button>
                  </>
                )}
                {order.status === "Received" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => handleAction(order.id, "done")}>
                      <CheckCircle className="h-3 w-3 mr-1" /> Selesai
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handlePrint(order)}>
                      <Printer className="h-3 w-3 mr-1" /> Cetak
                    </Button>
                  </>
                )}
                {order.status === "Done" && (
                  <Button variant="outline" size="sm" onClick={() => handlePrint(order)}>
                    <Printer className="h-3 w-3 mr-1" /> Cetak
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-zinc-500 mb-3 space-y-1">
                <span>Supplier: <span className="text-zinc-300 font-medium">{order.supplier}</span></span>
                <span className="ml-4">Dibuat oleh: <span className="text-zinc-300">{order.createdBy.name || "Unknown"}</span></span>
                {order.notes && <p className="text-zinc-600 mt-1">Catatan: {order.notes}</p>}
                {order.fakturNo && <p className="text-zinc-600 mt-1">No. Faktur: {order.fakturNo}</p>}
                {order.hargaBeli && order.hargaBeli > 0 && <p className="text-zinc-600">Harga Beli: Rp {order.hargaBeli.toLocaleString()} / {order.items[0]?.bahan.satuan || "satuan"}</p>}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bahan</TableHead>
                      <TableHead>Warna</TableHead>
                      <TableHead>Roll Dipesan</TableHead>
                      {["Received", "Done"].includes(order.status) && (
                        <>
                          <TableHead>Total Berat</TableHead>
                          <TableHead>Harga</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, idx) => (
                      <TableRow key={item.id || idx}>
                        <TableCell className="font-medium">{item.bahan.nama}</TableCell>
                        <TableCell>{item.warna}</TableCell>
                        <TableCell>{item.rollOrdered} Roll</TableCell>
                        {["Received", "Done"].includes(order.status) && (
                          <>
                            <TableCell>{item.totalWeight > 0 ? `${item.totalWeight} ${item.bahan.satuan}` : "-"}</TableCell>
                            <TableCell>{item.price > 0 ? `Rp ${item.price.toLocaleString()}` : "-"}</TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {["Received", "Done"].includes(order.status) && (
                <div className="flex justify-end mt-3 pt-3 border-t border-zinc-800/40">
                  <p className="text-sm">
                    Total Harga Nota: <span className="text-amber-400 font-bold">Rp {order.items.reduce((s, i) => s + (i.price || 0), 0).toLocaleString()}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Terima Barang */}
      <Dialog open={terimaOpen} onOpenChange={setTerimaOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terima Barang - {terimaOrder?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>No. Faktur / Nota Supplier</Label>
                <Input value={fakturNo} onChange={(e) => setFakturNo(e.target.value)} placeholder="Masukkan no faktur" />
              </div>
              <div className="space-y-2">
                <Label>Harga Beli (Per {terimaOrder?.items[0]?.bahan?.satuan || "Satuan"})</Label>
                <Input type="number" step="100" min="0" value={hargaBeli || ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0
                    setHargaBeli(v)
                    const updated = [...terimaItems]
                    updated.forEach((item) => { item.price = item.totalWeight * v })
                    setTerimaItems(updated)
                  }}
                  placeholder="Rp" />
              </div>
            </div>

            <div className="space-y-4">
              {terimaItems.map((item, itemIdx) => {
                const bahan = bahanList.find((b) => b.id === item.bahanId)
                const satuan = bahan?.satuan || "Kg"
                return (
                  <div key={item.id || itemIdx} className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium">
                        <span className="text-zinc-400">{item.warna}</span> — Dipesan: {item.rollOrdered} Roll
                      </p>
                      <p className="text-xs text-amber-400">
                        Total {satuan}: {item.totalWeight.toFixed(2)}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {item.weights.map((w, rollIdx) => (
                        <div key={rollIdx} className="space-y-1">
                          <Label className="text-[9px] text-zinc-500">Roll {rollIdx + 1}</Label>
                          <Input
                            type="number" step="0.01" min="0"
                            className="h-8 text-xs"
                            value={w.weight || ""}
                            placeholder={`${satuan}`}
                            onChange={(e) => updateTerimaWeight(itemIdx, rollIdx, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[10px] text-zinc-600">
                      <span>Subtotal: Rp {(item.price || 0).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
              <div className="flex justify-between text-sm">
                <span>Total Semua Stok Masuk:</span>
                <span className="text-amber-400 font-bold">
                  {terimaItems.reduce((s, i) => s + i.totalWeight, 0).toFixed(2)} {terimaOrder?.items[0]?.bahan?.satuan || "Kg"}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Total Jumlah Harga Nota:</span>
                <span className="text-amber-400 font-bold">
                  Rp {terimaItems.reduce((s, i) => s + (i.price || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            <Button onClick={handleTerima} className="w-full">
              <CheckCircle className="h-4 w-4 mr-1" /> Simpan & Masuk Stok
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
