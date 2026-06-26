"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, ArrowLeftRight } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ReturPage() {
  const router = useRouter()
  const [returns, setReturns] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const [barcode, setBarcode] = useState("")
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState("Cacat Jahit")
  const [condition, setCondition] = useState("Rusak")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/retur").then((r) => r.json()).then(setReturns).catch(() => {})
  }, [])

  function resetForm() {
    setBarcode(""); setReturnDate(new Date().toISOString().slice(0, 10))
    setReason("Cacat Jahit"); setCondition("Rusak"); setNotes("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!barcode) { toast.error("Scan barcode dulu"); return }

    setSaving(true)
    const res = await fetch("/api/retur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: barcode.trim(), returnDate, reason, condition, notes: notes || null }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success("Retur dicatat")
    resetForm()
    setOpen(false)
    setSaving(false)
    router.refresh()
    fetch("/api/retur").then((r) => r.json()).then(setReturns)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Retur Customer</CardTitle>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
              <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Catat Retur</Button>} />
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Catat Retur Barang</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Scan Barcode</Label>
                    <Input
                      ref={scanRef}
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Scan barcode barang retur"
                      className="font-mono"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Retur</Label>
                    <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Alasan Retur</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    >
                      <option value="Cacat Jahit">Cacat Jahit</option>
                      <option value="Bahan Rusak">Bahan Rusak</option>
                      <option value="Ukuran Salah">Ukuran Salah</option>
                      <option value="Warna Berbeda">Warna Berbeda</option>
                      <option value="Kualitas Kurang">Kualitas Kurang</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Kondisi Barang</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                    >
                      <option value="Rusak">Rusak</option>
                      <option value="Baik">Baik (dapat dijual kembali)</option>
                      <option value="Tidak Lengkap">Tidak Lengkap</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)" />
                  </div>
                  <Button type="submit" className="w-full" disabled={saving}>
                    {saving ? "Menyimpan..." : <><ArrowLeftRight className="h-4 w-4 mr-2" /> Catat Retur</>}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Kondisi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Dicatat Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada retur</TableCell></TableRow>
                )}
                {returns.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.barcodeUnit?.barcode}</TableCell>
                    <TableCell className="text-xs">{r.barcodeUnit?.produk?.kode}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.reason}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.condition}</TableCell>
                    <TableCell className="text-xs">{new Date(r.returnDate).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="text-xs">{r.returnedBy?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Retur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Retur</p>
              <p className="text-3xl font-bold">{returns.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Berdasarkan Alasan</p>
              {["Cacat Jahit", "Bahan Rusak", "Ukuran Salah", "Warna Berbeda", "Kualitas Kurang", "Lainnya"].map((r) => {
                const count = returns.filter((x: any) => x.reason === r).length
                if (count === 0) return null
                return (
                  <div key={r} className="flex justify-between text-sm">
                    <span>{r}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
