"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Package, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function PackingPage() {
  const router = useRouter()
  const [batches, setBatches] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const [barcodeInput, setBarcodeInput] = useState("")
  const [barcodes, setBarcodes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/packing").then((r) => r.json()).then(setBatches).catch(() => {})
  }, [])

  function resetForm() { setBarcodeInput(""); setBarcodes([]) }

  function addBarcode() {
    const code = barcodeInput.trim()
    if (!code) return
    if (barcodes.includes(code)) { toast.error("Barcode sudah ada"); return }
    setBarcodes([...barcodes, code])
    setBarcodeInput("")
  }

  function removeBarcode(idx: number) { setBarcodes(barcodes.filter((_, i) => i !== idx)) }

  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === "Enter") { e.preventDefault(); addBarcode() } }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (barcodes.length === 0) { toast.error("Scan minimal 1 barcode"); return }

    setSaving(true)
    const res = await fetch("/api/packing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcodes }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success(`${barcodes.length} pcs berhasil di-pack`)
    resetForm()
    setOpen(false)
    setSaving(false)
    router.refresh()
    fetch("/api/packing").then((r) => r.json()).then(setBatches)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Packing (Pengemasan)</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Packing Batch Baru</Button>} />
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Buat Batch Packing Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Scan Barcode (QCFinal / ButtonHole)</Label>
                <div className="flex gap-2">
                  <Input
                    ref={scanRef}
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Scan barcode lalu Enter"
                    autoFocus
                  />
                  <Button type="button" variant="outline" onClick={addBarcode}>Tambah</Button>
                </div>
                {barcodes.length > 0 && (
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto space-y-1">
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
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Menyimpan..." : <><Package className="h-4 w-4 mr-2" /> Pack {barcodes.length} Barang</>}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch #</TableHead>
              <TableHead>Total Pcs</TableHead>
              <TableHead>PO</TableHead>
              <TableHead>Dikemas Oleh</TableHead>
              <TableHead>Waktu</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada packing</TableCell></TableRow>
            )}
            {batches.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs font-medium">{b.batchNumber}</TableCell>
                <TableCell>{(b as any)._count?.items ?? 0}</TableCell>
                <TableCell className="text-xs">{b.po?.code || "-"}</TableCell>
                <TableCell className="text-xs">{b.packedBy?.name}</TableCell>
                <TableCell className="text-xs">{new Date(b.packedAt).toLocaleString("id-ID")}</TableCell>
                <TableCell className="text-xs">{b.notes || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
