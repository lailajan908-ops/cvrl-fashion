"use client"

import { useState } from "react"
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
  const [items, setItems] = useState<{ bahanId: string; warna: string; rollOrdered: number }[]>([])
  const [tab, setTab] = useState("all")
  const [terimaOpen, setTerimaOpen] = useState(false)
  const [terimaOrder, setTerimaOrder] = useState<PurchaseOrder | null>(null)
  const [fakturNo, setFakturNo] = useState("")
  const [hargaBeli, setHargaBeli] = useState(0)
  // Add-item state
  const [addBahanId, setAddBahanId] = useState("")
  const [addColors, setAddColors] = useState<string[]>([])
  const [colorRolls, setColorRolls] = useState<Record<string, number>>({})

  const statuses = ["all", "Draft", "Ordered", "Received", "Done", "Cancelled"]
  const filtered = tab === "all" ? initialOrders : initialOrders.filter((o) => o.status === tab)
  const selectedBahan = bahanList.find((b) => b.id === addBahanId)
  let availableWarna: string[] = []
  try { if (selectedBahan) availableWarna = JSON.parse(selectedBahan.warnaList || "[]") } catch {}

  function resetForm() {
    setSupplier(""); setNotes(""); setItems([]); setEditing(null)
    setAddBahanId(""); setAddColors([]); setColorRolls({})
  }

  function openEdit(order: PurchaseOrder) {
    setSupplier(order.supplier)
    setNotes(order.notes || "")
    setItems(order.items.map((i) => ({ bahanId: i.bahanId, warna: i.warna, rollOrdered: i.rollOrdered })))
    setEditing(order)
    setOpen(true)
  }

  function toggleAddColor(w: string) {
    setAddColors((prev) =>
      prev.includes(w) ? prev.filter((c) => c !== w) : [...prev, w]
    )
  }

  function addItemsFromSelection() {
    if (!addBahanId) { toast.error("Pilih bahan"); return }
    if (addColors.length === 0) { toast.error("Pilih minimal satu warna"); return }
    const newItems: { bahanId: string; warna: string; rollOrdered: number }[] = []
    for (const warna of addColors) {
      const roll = colorRolls[warna] || 0
      if (roll <= 0) { toast.error(`Isi jumlah roll untuk ${warna}`); return }
      newItems.push({ bahanId: addBahanId, warna, rollOrdered: roll })
    }
    setItems([...items, ...newItems])
    setAddBahanId(""); setAddColors([]); setColorRolls({})
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function getBahan(bahanId: string) {
    return bahanList.find((b) => b.id === bahanId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supplier) { toast.error("Nama supplier/toko wajib diisi"); return }
    if (items.length === 0) { toast.error("Belum ada item order"); return }

    const body = { supplier, notes: notes || null, items }

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
  const [terimaItems, setTerimaItems] = useState<(OrderItem & { bahan: Bahan })[]>([])

  function openTerima(order: PurchaseOrder) {
    setTerimaOrder(order)
    setTerimaItems(order.items.map((i) => ({
      ...i,
      weights: i.weights?.length ? i.weights : Array.from({ length: i.rollOrdered }, (_, ri) => ({ roll: ri + 1, weight: 0 })),
      totalWeight: i.totalWeight || 0,
      price: i.price || 0,
      bahan: i.bahan,
    })))
    setFakturNo(order.fakturNo || "")
    setHargaBeli(order.hargaBeli || 0)
    setTerimaOpen(true)
  }

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Surat Jalan Order" : "Buat Surat Jalan Order Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Pilih Supplier / Toko</Label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nama supplier atau toko" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Catatan</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan opsional..." />
              </div>

              {/* Multi-color Item Adder */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
                <p className="text-sm font-medium">Tambah Item Order</p>
                <div className="space-y-2">
                  <Label className="text-[11px] text-zinc-400">Pilih Bahan Baku</Label>
                  <Select value={addBahanId} onValueChange={(v) => { setAddBahanId(v || ""); setAddColors([]); setColorRolls({}) }}>
                    <SelectTrigger className="h-10">
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

                {selectedBahan && availableWarna.length > 0 && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-zinc-400">Pilih Warna (centang yang dipesan)</Label>
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                        {availableWarna.map((w) => {
                          const sel = addColors.includes(w)
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() => toggleAddColor(w)}
                              className={`text-[11px] px-2 py-1.5 rounded border transition-all ${
                                sel
                                  ? "bg-amber-500/20 border-amber-700 text-amber-400"
                                  : "border-zinc-800 text-zinc-500 hover:border-zinc-600"
                              }`}
                            >
                              {w}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {addColors.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-[11px] text-zinc-400">Jumlah Roll Per Warna</Label>
                        {addColors.map((w) => (
                          <div key={w} className="flex items-center gap-3 p-2 rounded border border-zinc-800 bg-zinc-900/80">
                            <span className="w-20 text-xs font-medium">{w}</span>
                            <Input
                              type="number" min="1"
                              className="h-8 w-24 text-xs"
                              value={colorRolls[w] || ""}
                              placeholder="Jumlah roll"
                              onChange={(e) => setColorRolls({ ...colorRolls, [w]: parseInt(e.target.value) || 0 })}
                            />
                            <span className="text-[10px] text-zinc-500">Roll</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button type="button" variant="outline" size="sm" onClick={addItemsFromSelection}>
                      <Plus className="h-3 w-3 mr-1" /> Tambah ke Order
                    </Button>
                  </>
                )}

                {selectedBahan && availableWarna.length === 0 && (
                  <p className="text-xs text-zinc-500">Bahan ini belum memiliki daftar warna. Tambahkan warna di Master Bahan terlebih dahulu.</p>
                )}
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Rincian Order ({items.length} item)</Label>
                  <div className="overflow-x-auto rounded-lg border border-zinc-800">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bahan</TableHead>
                          <TableHead>Warna</TableHead>
                          <TableHead className="text-right">Roll</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, idx) => {
                          const b = getBahan(item.bahanId)
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-medium text-xs">{b?.nama || "-"}</TableCell>
                              <TableCell>
                                <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">{item.warna}</span>
                              </TableCell>
                              <TableCell className="text-right text-xs">{item.rollOrdered} Roll</TableCell>
                              <TableCell>
                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeItem(idx)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-10">{editing ? "Simpan" : "Simpan sebagai Draft"}</Button>
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
                {order.hargaBeli && order.hargaBeli > 0 && <p className="text-zinc-600">Harga Beli: Rp {order.hargaBeli.toLocaleString()} / {order.items[0]?.bahan?.satuan || "satuan"}</p>}
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bahan</TableHead>
                      <TableHead>Warna</TableHead>
                      <TableHead>Roll</TableHead>
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
                        <TableCell className="font-medium text-xs">{item.bahan.nama}</TableCell>
                        <TableCell><span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{item.warna}</span></TableCell>
                        <TableCell className="text-xs">{item.rollOrdered} Roll</TableCell>
                        {["Received", "Done"].includes(order.status) && (
                          <>
                            <TableCell className="text-xs">{item.totalWeight > 0 ? `${item.totalWeight.toFixed(2)} ${item.bahan.satuan}` : "-"}</TableCell>
                            <TableCell className="text-xs">{item.price > 0 ? `Rp ${item.price.toLocaleString()}` : "-"}</TableCell>
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
            <DialogTitle>Terima Barang — {terimaOrder?.code}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">No. Faktur / Nota Supplier</Label>
                <Input value={fakturNo} onChange={(e) => setFakturNo(e.target.value)} placeholder="Masukkan no faktur" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Harga Beli (Per {terimaOrder?.items[0]?.bahan?.satuan || "Satuan"})</Label>
                <Input type="number" step="100" min="0" value={hargaBeli || ""}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value) || 0
                    setHargaBeli(v)
                    setTerimaItems((prev) => prev.map((item) => ({ ...item, price: item.totalWeight * v })))
                  }}
                  placeholder="Rp" className="h-10" />
              </div>
            </div>

            <div className="space-y-4">
              {terimaItems.map((item, itemIdx) => {
                const satuan = item.bahan?.satuan || "Kg"
                return (
                  <div key={item.id || itemIdx} className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400">{item.bahan?.nama}</span>
                        <span className="text-xs font-medium text-amber-400">{item.warna}</span>
                      </div>
                      <p className="text-xs text-zinc-500">Dipesan: {item.rollOrdered} Roll</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {item.weights.map((w, rollIdx) => (
                        <div key={rollIdx} className="space-y-1">
                          <Label className="text-[10px] text-zinc-500">Roll {rollIdx + 1}</Label>
                          <Input
                            type="number" step="0.01" min="0"
                            className="h-9 text-sm"
                            value={w.weight || ""}
                            placeholder={satuan}
                            onChange={(e) => updateTerimaWeight(itemIdx, rollIdx, parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Total {satuan}: <strong className="text-amber-400">{item.totalWeight.toFixed(2)}</strong></span>
                      <span className="text-zinc-400">Subtotal: <strong>Rp {(item.price || 0).toLocaleString()}</strong></span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-4 rounded-lg bg-zinc-900/80 border border-zinc-800 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300">Total Semua Stok Masuk:</span>
                <span className="text-amber-400 font-bold">
                  {terimaItems.reduce((s, i) => s + i.totalWeight, 0).toFixed(2)} {terimaOrder?.items[0]?.bahan?.satuan || "Kg"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300">Total Jumlah Harga Nota:</span>
                <span className="text-amber-400 font-bold">
                  Rp {terimaItems.reduce((s, i) => s + (i.price || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>

            <Button onClick={handleTerima} className="w-full h-10">
              <CheckCircle className="h-4 w-4 mr-1" /> Simpan & Masuk Stok
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
