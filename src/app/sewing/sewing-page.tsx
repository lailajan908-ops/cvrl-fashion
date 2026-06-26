"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeftRight, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const statusColors: Record<string, string> = {
  Sent: "bg-blue-500",
  PartialReceived: "bg-yellow-500",
  Received: "bg-green-500",
}

export function SewingPage({ partners }: { partners: { id: string; nama: string }[] }) {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [openSend, setOpenSend] = useState(false)
  const [openReceive, setOpenReceive] = useState(false)

  const [selectedPartnerId, setSelectedPartnerId] = useState("")
  const [selectedPoId, setSelectedPoId] = useState("")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [barcodes, setBarcodes] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  // Receive state
  const [receiveReportId, setReceiveReportId] = useState("")
  const [receiveBarcodeInput, setReceiveBarcodeInput] = useState("")
  const [receiveBarcodes, setReceiveBarcodes] = useState<string[]>([])
  const [receiveReportDetails, setReceiveReportDetails] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/sewing").then((r) => r.json()).then(setReports).catch(() => {})
  }, [])

  function resetSendForm() {
    setSelectedPartnerId("")
    setSelectedPoId("")
    setBarcodeInput("")
    setBarcodes([])
    setNotes("")
  }

  function addBarcode() {
    const code = barcodeInput.trim()
    if (!code) return
    if (barcodes.includes(code)) { toast.error("Barcode sudah ada"); return }
    setBarcodes([...barcodes, code])
    setBarcodeInput("")
  }

  function removeBarcode(idx: number) {
    setBarcodes(barcodes.filter((_, i) => i !== idx))
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addBarcode() }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPartnerId) { toast.error("Pilih sewing partner"); return }
    if (barcodes.length === 0) { toast.error("Scan minimal 1 barcode"); return }

    setSaving(true)
    const res = await fetch("/api/sewing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partnerId: selectedPartnerId,
        poId: selectedPoId || null,
        barcodes,
        notes,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success("Dikirim ke penjahit")
    resetSendForm()
    setOpenSend(false)
    setSaving(false)
    router.refresh()
    fetch("/api/sewing").then((r) => r.json()).then(setReports)
  }

  async function openReceiveDialog(report: any) {
    setReceiveReportId(report.id)
    setReceiveBarcodeInput("")
    setReceiveBarcodes([])
    // Fetch full report details
    const res = await fetch(`/api/sewing?id=${report.id}`)
    const data = await res.json()
    setReceiveReportDetails(data?.details || [])
    setOpenReceive(true)
  }

  function addReceiveBarcode() {
    const code = receiveBarcodeInput.trim()
    if (!code) return
    const detail = receiveReportDetails.find((d) => d.barcodeUnit?.barcode === code)
    if (!detail) { toast.error("Barcode tidak ada di pengiriman ini"); return }
    if (detail.status === "Received") { toast.error("Barcode sudah diterima"); return }
    if (receiveBarcodes.includes(code)) { toast.error("Sudah ditambahkan"); return }
    setReceiveBarcodes([...receiveBarcodes, code])
    setReceiveBarcodeInput("")
  }

  function handleReceiveBarcodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addReceiveBarcode() }
  }

  async function handleReceive(e: React.FormEvent) {
    e.preventDefault()
    if (receiveBarcodes.length === 0) { toast.error("Scan minimal 1 barcode"); return }

    setSaving(true)
    const res = await fetch("/api/sewing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reportId: receiveReportId,
        barcodes: receiveBarcodes,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success("Barang diterima dari penjahit")
    setOpenReceive(false)
    setSaving(false)
    router.refresh()
    fetch("/api/sewing").then((r) => r.json()).then(setReports)
  }

  const sentCount = (details: any[]) => details.filter((d: any) => d.status === "Sent").length
  const receivedCount = (details: any[]) => details.filter((d: any) => d.status === "Received").length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Laporan Sewing</CardTitle>
          <div className="flex gap-2">
            <Dialog open={openSend} onOpenChange={(v) => { setOpenSend(v); if (!v) resetSendForm() }}>
              <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Kirim ke Penjahit</Button>} />
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Kirim Potongan ke Penjahit</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSend} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Sewing Partner</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={selectedPartnerId}
                      onChange={(e) => setSelectedPartnerId(e.target.value)}
                      required
                    >
                      <option value="">Pilih Partner</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.nama}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>PO (opsional)</Label>
                    <Input value={selectedPoId} onChange={(e) => setSelectedPoId(e.target.value)} placeholder="ID PO (opsional)" />
                  </div>

                  <div className="space-y-2">
                    <Label>Scan Barcode</Label>
                    <div className="flex gap-2">
                      <Input
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={handleBarcodeKeyDown}
                        placeholder="Scan barcode lalu Enter"
                        autoFocus
                      />
                      <Button type="button" variant="outline" onClick={addBarcode}>Tambah</Button>
                    </div>
                    {barcodes.length > 0 && (
                      <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                        {barcodes.map((b, i) => (
                          <div key={i} className="flex items-center justify-between text-sm">
                            <span className="font-mono text-xs">{b}</span>
                            <Button type="button" variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeBarcode(i)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)" />
                  </div>

                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Menyimpan..." : `Kirim ${barcodes.length} Potongan`}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partner</TableHead>
                <TableHead>PO</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dikirim</TableHead>
                <TableHead>Diterima</TableHead>
                <TableHead>Dikirim Oleh</TableHead>
                <TableHead>Tanggal Kirim</TableHead>
                <TableHead>Tanggal Terima</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Belum ada pengiriman</TableCell></TableRow>
              )}
              {reports.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.partner?.nama}</TableCell>
                  <TableCell className="text-xs">{r.po?.code || "-"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[r.status] || "bg-gray-500"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{(r as any)._count?.details ?? 0}</TableCell>
                  <TableCell className="text-xs">
                    {r.status === "Received" ? (r as any)._count?.details : (r.status === "Sent" ? "0" : "-")}
                  </TableCell>
                  <TableCell className="text-xs">{r.sentBy?.name}</TableCell>
                  <TableCell className="text-xs">{new Date(r.sentAt).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-xs">{r.receivedAt ? new Date(r.receivedAt).toLocaleDateString("id-ID") : "-"}</TableCell>
                  <TableCell>
                    {r.status !== "Received" && (
                      <Button variant="outline" size="sm" onClick={() => openReceiveDialog(r)}>
                        <ArrowLeftRight className="h-3 w-3 mr-1" /> Terima
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={openReceive} onOpenChange={setOpenReceive}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Terima Barang dari Penjahit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReceive} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Detail pengiriman: {receiveReportDetails.length} potongan
              </Label>
              <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                {receiveReportDetails.map((d: any, i: number) => (
                  <div key={i} className={`text-xs flex justify-between ${d.status === "Received" ? "text-green-600" : ""}`}>
                    <span className="font-mono">{d.barcodeUnit?.barcode}</span>
                    <span>{d.status === "Received" ? "Sudah diterima" : "Menunggu"}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Scan Barcode yang Diterima</Label>
              <div className="flex gap-2">
                <Input
                  value={receiveBarcodeInput}
                  onChange={(e) => setReceiveBarcodeInput(e.target.value)}
                  onKeyDown={handleReceiveBarcodeKeyDown}
                  placeholder="Scan barcode lalu Enter"
                  autoFocus
                />
                <Button type="button" variant="outline" onClick={addReceiveBarcode}>Tambah</Button>
              </div>
              {receiveBarcodes.length > 0 && (
                <div className="border rounded-md p-2 max-h-32 overflow-y-auto space-y-1">
                  {receiveBarcodes.map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-xs">{b}</span>
                      <span className="text-xs text-green-600">Diterima</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Menyimpan..." : `Terima ${receiveBarcodes.length} Potongan`}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
