"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, DollarSign, CreditCard, TrendingUp, Filter } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const PAYMENT_METHODS = ["Cash", "Transfer", "ShopeePay", "LazadaWallet", "COD", "BankTransfer", "Others"]
const PLATFORMS = ["Shopee", "Lazada", "Tokopedia", "TiktokShop"]
const STATUSES = ["Pending", "Confirmed", "Failed", "Refunded"]
const ECO_STATUSES = ["Processing", "Shipped", "Delivered", "Completed", "Cancelled"]
const REASONS = ["Cacat Jahit", "Bahan Rusak", "Ukuran Salah", "Warna Berbeda", "Kualitas Kurang", "Lainnya"]

function statusBadge(status: string) {
  const map: Record<string, string> = {
    Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Processing: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Shipped: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
    Delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  }
  return map[status] || "bg-gray-100 text-gray-800"
}

export function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<any[]>([])
  const [ecoSales, setEcoSales] = useState<any[]>([])
  const [tab, setTab] = useState("payments")

  // Filters
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPlatform, setFilterPlatform] = useState("")
  const [filterFrom, setFilterFrom] = useState("")
  const [filterTo, setFilterTo] = useState("")

  // Dialogs
  const [openPayment, setOpenPayment] = useState(false)
  const [openEcoSale, setOpenEcoSale] = useState(false)
  const [openEcoDetail, setOpenEcoDetail] = useState(false)
  const [detailSale, setDetailSale] = useState<any>(null)
  const [openPayInEco, setOpenPayInEco] = useState(false)

  // Payment form
  const [pmEcoSaleId, setPmEcoSaleId] = useState("")
  const [pmSaleId, setPmSaleId] = useState("")
  const [pmAmount, setPmAmount] = useState("")
  const [pmMethod, setPmMethod] = useState("Transfer")
  const [pmDate, setPmDate] = useState(new Date().toISOString().slice(0, 10))
  const [pmStatus, setPmStatus] = useState("Pending")
  const [pmRef, setPmRef] = useState("")
  const [pmNotes, setPmNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // Eco Sale form
  const [ecoPlatform, setEcoPlatform] = useState("Shopee")
  const [ecoOrderId, setEcoOrderId] = useState("")
  const [ecoOrderDate, setEcoOrderDate] = useState(new Date().toISOString().slice(0, 10))
  const [ecoCustName, setEcoCustName] = useState("")
  const [ecoTotal, setEcoTotal] = useState("")
  const [ecoShipping, setEcoShipping] = useState("0")
  const [ecoFee, setEcoFee] = useState("0")
  const [ecoStatus, setEcoStatus] = useState("Processing")
  const [ecoNotes, setEcoNotes] = useState("")
  const [savingEco, setSavingEco] = useState(false)

  function loadPayments() {
    const params = new URLSearchParams()
    if (filterStatus) params.set("status", filterStatus)
    if (filterPlatform) params.set("platform", filterPlatform)
    if (filterFrom) params.set("from", filterFrom)
    if (filterTo) params.set("to", filterTo)
    fetch(`/api/payments?${params}`).then((r) => r.json()).then(setPayments).catch(() => {})
  }

  function loadEcoSales() {
    const params = new URLSearchParams()
    if (filterPlatform) params.set("platform", filterPlatform)
    if (filterStatus) params.set("status", filterStatus)
    if (filterFrom) params.set("from", filterFrom)
    if (filterTo) params.set("to", filterTo)
    fetch(`/api/ecommerce-sales?${params}`).then((r) => r.json()).then(setEcoSales).catch(() => {})
  }

  useEffect(() => { loadPayments() }, [filterStatus, filterPlatform, filterFrom, filterTo])
  useEffect(() => { loadEcoSales() }, [filterStatus, filterPlatform, filterFrom, filterTo])

  function resetPaymentForm() {
    setPmEcoSaleId(""); setPmSaleId("")
    setPmAmount(""); setPmMethod("Transfer")
    setPmDate(new Date().toISOString().slice(0, 10))
    setPmStatus("Pending"); setPmRef(""); setPmNotes("")
  }

  function resetEcoForm() {
    setEcoPlatform("Shopee"); setEcoOrderId("")
    setEcoOrderDate(new Date().toISOString().slice(0, 10))
    setEcoCustName(""); setEcoTotal("")
    setEcoShipping("0"); setEcoFee("0"); setEcoStatus("Processing"); setEcoNotes("")
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pmAmount) { toast.error("Jumlah wajib diisi"); return }
    setSaving(true)
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ecommerceSaleId: pmEcoSaleId || null,
        saleId: pmSaleId || null,
        amount: parseFloat(pmAmount),
        paymentMethod: pmMethod,
        paymentDate: pmDate,
        status: pmStatus,
        referenceNumber: pmRef || null,
        notes: pmNotes || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal menyimpan")
      setSaving(false)
      return
    }
    toast.success("Pembayaran dicatat")
    resetPaymentForm(); setOpenPayment(false); setSaving(false)
    loadPayments()
  }

  async function handleEcoSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ecoOrderId || !ecoTotal) { toast.error("Order ID dan total wajib diisi"); return }
    setSavingEco(true)
    const res = await fetch("/api/ecommerce-sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform: ecoPlatform,
        orderId: ecoOrderId.trim(),
        orderDate: ecoOrderDate,
        customerName: ecoCustName || null,
        totalAmount: parseFloat(ecoTotal),
        shippingCost: parseFloat(ecoShipping) || 0,
        platformFee: parseFloat(ecoFee) || 0,
        status: ecoStatus,
        notes: ecoNotes || null,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal menyimpan")
      setSavingEco(false)
      return
    }
    toast.success("Penjualan e-commerce dicatat")
    resetEcoForm(); setOpenEcoSale(false); setSavingEco(false)
    loadEcoSales()
  }

  async function openEcoDetailView(id: string) {
    const res = await fetch(`/api/ecommerce-sales/${id}`)
    if (res.ok) {
      setDetailSale(await res.json())
      setOpenEcoDetail(true)
    }
  }

  async function updatePaymentStatus(id: string, status: string) {
    const res = await fetch(`/api/payments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error("Gagal update status"); return }
    toast.success("Status diperbarui")
    loadPayments(); loadEcoSales()
  }

  async function updateEcoStatus(id: string, status: string) {
    const res = await fetch(`/api/ecommerce-sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error("Gagal update status"); return }
    toast.success("Status diperbarui")
    loadEcoSales()
  }

  // Summary calculations
  const totalConfirmed = payments.filter((p) => p.status === "Confirmed").reduce((s, p) => s + p.amount, 0)
  const totalPending = payments.filter((p) => p.status === "Pending").reduce((s, p) => s + p.amount, 0)
  const byPlatform = PLATFORMS.map((pl) => ({
    platform: pl,
    count: ecoSales.filter((s) => s.platform === pl).length,
    amount: payments.filter((p) => p.ecommerceSale?.platform === pl).reduce((s, p) => s + p.amount, 0),
    pending: payments.filter((p) => p.ecommerceSale?.platform === pl && p.status === "Pending").reduce((s, p) => s + p.amount, 0),
  }))

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="payments">All Payments</TabsTrigger>
          <TabsTrigger value="ecommerce">E-commerce Sales</TabsTrigger>
        </TabsList>
        <div className="flex gap-2">
          {tab === "payments" && (
            <Dialog open={openPayment} onOpenChange={(v) => { setOpenPayment(v); if (!v) resetPaymentForm() }}>
              <DialogTrigger render={<Button><DollarSign className="mr-2 h-4 w-4" /> Catat Pembayaran</Button>} />
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Catat Pembayaran</DialogTitle></DialogHeader>
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipe</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={pmEcoSaleId ? "eco" : pmSaleId ? "pos" : ""} onChange={(e) => { if (e.target.value === "eco") setPmEcoSaleId("manual"); else setPmSaleId("manual") }}>
                      <option value="">Pilih tipe (opsional)</option>
                      <option value="eco">E-commerce Sale</option>
                      <option value="pos">POS Sale</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Jumlah</Label>
                    <Input type="number" step="0.01" value={pmAmount} onChange={(e) => setPmAmount(e.target.value)} placeholder="0" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Metode</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={pmMethod} onChange={(e) => setPmMethod(e.target.value)}>
                        {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={pmStatus} onChange={(e) => setPmStatus(e.target.value)}>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Bayar</Label>
                    <Input type="date" value={pmDate} onChange={(e) => setPmDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>No. Referensi</Label>
                    <Input value={pmRef} onChange={(e) => setPmRef(e.target.value)} placeholder="No. transfer / invoice (opsional)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Input value={pmNotes} onChange={(e) => setPmNotes(e.target.value)} placeholder="Catatan (opsional)" />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Menyimpan..." : "Catat Pembayaran"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {tab === "ecommerce" && (
            <Dialog open={openEcoSale} onOpenChange={(v) => { setOpenEcoSale(v); if (!v) resetEcoForm() }}>
              <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Tambah Penjualan</Button>} />
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Tambah Penjualan E-commerce</DialogTitle></DialogHeader>
                <form onSubmit={handleEcoSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={ecoPlatform} onChange={(e) => setEcoPlatform(e.target.value)}>
                        {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={ecoStatus} onChange={(e) => setEcoStatus(e.target.value)}>
                        {ECO_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Order ID</Label>
                    <Input value={ecoOrderId} onChange={(e) => setEcoOrderId(e.target.value)} placeholder="No. order dari platform" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Order</Label>
                      <Input type="date" value={ecoOrderDate} onChange={(e) => setEcoOrderDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Total Penjualan</Label>
                      <Input type="number" step="0.01" value={ecoTotal} onChange={(e) => setEcoTotal(e.target.value)} placeholder="0" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Ongkos Kirim</Label>
                      <Input type="number" step="0.01" value={ecoShipping} onChange={(e) => setEcoShipping(e.target.value)} placeholder="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Biaya Platform</Label>
                      <Input type="number" step="0.01" value={ecoFee} onChange={(e) => setEcoFee(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Customer</Label>
                    <Input value={ecoCustName} onChange={(e) => setEcoCustName(e.target.value)} placeholder="Nama pembeli" />
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Input value={ecoNotes} onChange={(e) => setEcoNotes(e.target.value)} placeholder="Catatan (opsional)" />
                  </div>
                  <Button type="submit" className="w-full" disabled={savingEco}>
                    {savingEco ? "Menyimpan..." : "Tambah Penjualan"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Payments</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">Confirmed</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">Rp {totalConfirmed.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-500/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-600">Pending</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">Rp {totalPending.toLocaleString("id-ID")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">E-commerce Sales</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{ecoSales.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {byPlatform.map((bp) => (
          <Card key={bp.platform} className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-amber-400">{bp.platform}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{bp.count} orders</p>
              <p className="text-lg font-bold text-white">Rp {bp.amount.toLocaleString("id-ID")}</p>
              {bp.pending > 0 && <p className="text-xs text-yellow-400">{bp.pending.toLocaleString("id-ID")} pending</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <select className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {(tab === "payments" ? STATUSES : ECO_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Platform</Label>
          <select className="flex h-8 rounded-md border border-input bg-transparent px-2 text-xs" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="">All Platforms</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Dari</Label>
          <Input type="date" className="h-8 w-36 text-xs" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sampai</Label>
          <Input type="date" className="h-8 w-36 text-xs" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterStatus(""); setFilterPlatform(""); setFilterFrom(""); setFilterTo("") }}>
          Reset
        </Button>
      </div>

      {/* Tab: Payments */}
      <TabsContent value="payments">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Sumber</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Dicatat Oleh</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Belum ada pembayaran</TableCell></TableRow>
                )}
                {payments.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{new Date(p.paymentDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="text-xs">
                      {p.ecommerceSale ? (
                        <Badge variant="outline" className="text-xs">{p.ecommerceSale.platform}</Badge>
                      ) : p.sale ? (
                        <Badge variant="outline" className="text-xs">POS</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{p.paymentMethod}</TableCell>
                    <TableCell className="text-xs font-medium">Rp {p.amount.toLocaleString("id-ID")}</TableCell>
                    <TableCell>
                      <Badge className={statusBadge(p.status)}>{p.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{p.referenceNumber || "-"}</TableCell>
                    <TableCell className="text-xs">{p.recordedBy?.name}</TableCell>
                    <TableCell>
                      <select
                        className="h-7 text-xs rounded border border-input bg-transparent px-1"
                        value={p.status}
                        onChange={(e) => updatePaymentStatus(p.id, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab: E-commerce Sales */}
      <TabsContent value="ecommerce">
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Biaya</TableHead>
                  <TableHead>Bersih</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tagihan</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ecoSales.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Belum ada penjualan e-commerce</TableCell></TableRow>
                )}
                {ecoSales.map((s: any) => {
                  const totalPaid = s.payments?.filter((p: any) => p.status === "Confirmed").reduce((sum: number, p: any) => sum + p.amount, 0) || 0
                  return (
                    <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openEcoDetailView(s.id)}>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{s.platform}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{s.orderId}</TableCell>
                      <TableCell className="text-xs">{s.customerName || "-"}</TableCell>
                      <TableCell className="text-xs font-medium">Rp {s.totalAmount.toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{(s.shippingCost + s.platformFee).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="text-xs">Rp {s.netAmount.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <Badge className={statusBadge(s.status)}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {totalPaid >= s.netAmount ? (
                          <span className="text-green-600 font-medium">Lunas</span>
                        ) : (
                          <span className="text-yellow-600">Rp {(s.netAmount - totalPaid).toLocaleString("id-ID")}</span>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <select
                          className="h-7 text-xs rounded border border-input bg-transparent px-1"
                          value={s.status}
                          onChange={(e) => updateEcoStatus(s.id, e.target.value)}
                        >
                          {ECO_STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                        </select>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Detail E-commerce Sale Dialog */}
      <Dialog open={openEcoDetail} onOpenChange={setOpenEcoDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Detail Penjualan {detailSale?.platform}</DialogTitle></DialogHeader>
          {detailSale && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Order ID:</span> <span className="font-mono">{detailSale.orderId}</span></div>
                <div><span className="text-muted-foreground">Customer:</span> {detailSale.customerName || "-"}</div>
                <div><span className="text-muted-foreground">Total:</span> Rp {detailSale.totalAmount.toLocaleString("id-ID")}</div>
                <div><span className="text-muted-foreground">Ongkir:</span> Rp {detailSale.shippingCost.toLocaleString("id-ID")}</div>
                <div><span className="text-muted-foreground">Biaya Platform:</span> Rp {detailSale.platformFee.toLocaleString("id-ID")}</div>
                <div><span className="text-muted-foreground">Bersih:</span> <span className="font-bold">Rp {detailSale.netAmount.toLocaleString("id-ID")}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <Badge className={statusBadge(detailSale.status)}>{detailSale.status}</Badge></div>
                <div><span className="text-muted-foreground">Tanggal:</span> {new Date(detailSale.orderDate).toLocaleDateString("id-ID")}</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium">Riwayat Pembayaran</h4>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setOpenEcoDetail(false); setPmEcoSaleId(detailSale.id); setOpenPayment(true) }}>
                    <DollarSign className="h-3 w-3 mr-1" /> Bayar
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Tanggal</TableHead>
                      <TableHead className="text-xs">Metode</TableHead>
                      <TableHead className="text-xs">Jumlah</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Referensi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailSale.payments?.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada pembayaran</TableCell></TableRow>
                    )}
                    {detailSale.payments?.map((pm: any) => (
                      <TableRow key={pm.id}>
                        <TableCell className="text-xs">{new Date(pm.paymentDate).toLocaleDateString("id-ID")}</TableCell>
                        <TableCell className="text-xs">{pm.paymentMethod}</TableCell>
                        <TableCell className="text-xs font-medium">Rp {pm.amount.toLocaleString("id-ID")}</TableCell>
                        <TableCell><Badge className={statusBadge(pm.status)}>{pm.status}</Badge></TableCell>
                        <TableCell className="text-xs font-mono">{pm.referenceNumber || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {detailSale.notes && (
                <div className="text-sm"><span className="text-muted-foreground">Catatan:</span> {detailSale.notes}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
