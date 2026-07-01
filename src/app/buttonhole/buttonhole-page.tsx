"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scan, Check } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function ButtonholePage({ userId }: { userId: string }) {
  const router = useRouter()

  const [barcode, setBarcode] = useState("")
  const [piece, setPiece] = useState<any>(null)
  const [pieceLoading, setPieceLoading] = useState(false)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [records, setRecords] = useState<any[]>([])

  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/buttonhole").then((r) => r.json()).then(setRecords).catch(() => {})
  }, [])

  async function lookupBarcode() {
    const code = barcode.trim()
    if (!code) return
    setPieceLoading(true)
    setPiece(null)

    try {
      const res = await fetch(`/api/barcode/generate?barcode=${encodeURIComponent(code)}`)
      if (!res.ok) { toast.error("Barcode tidak ditemukan"); setPieceLoading(false); return }
      const data = await res.json()
      if (data.currentStage !== "ButtonHole" && data.currentStage !== "QC1") {
        toast.error(`Barcode dalam stage "${data.currentStage}". Harus QC1 atau ButtonHole`)
        setPieceLoading(false)
        return
      }
      setPiece(data)
      setNotes("")
    } catch {
      toast.error("Gagal mencari barcode")
    }
    setPieceLoading(false)
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); lookupBarcode() }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!piece) { toast.error("Scan barcode dulu"); return }

    setSaving(true)
    const res = await fetch("/api/buttonhole", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: piece.barcode, notes: notes || null }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success("Lubang kancing selesai")
    setPiece(null)
    setBarcode("")
    setSaving(false)
    router.refresh()
    fetch("/api/buttonhole").then((r) => r.json()).then(setRecords)
    scanInputRef.current?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Proses Lubang Kancing & Aksesoris</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={scanInputRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan barcode"
                className="text-lg font-mono"
                autoFocus
              />
              <Button onClick={lookupBarcode} disabled={pieceLoading}>
                <Scan className="h-4 w-4 mr-2" /> Cari
              </Button>
            </div>

            {piece && (
              <form onSubmit={handleSubmit} className="space-y-4 border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Barcode:</span>
                    <p className="font-mono font-medium">{piece.barcode}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Produk:</span>
                    <p>{piece.produk?.kode} - {piece.produk?.nama}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Size / Warna:</span>
                    <p>{piece.size} / {piece.color}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stage:</span>
                    <Badge>{piece.currentStage}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Aksesoris yang ditambahkan (label, kancing, dll)" />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Menyimpan..." : <><Check className="h-4 w-4 mr-2" /> Selesai Lubang Kancing</>}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat Lubang Kancing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Size/Warna</TableHead>
                  <TableHead>Dikerjakan Oleh</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada record</TableCell></TableRow>
                )}
                {records.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.barcodeUnit?.barcode}</TableCell>
                    <TableCell className="text-xs">{r.barcodeUnit?.produk?.kode}</TableCell>
                    <TableCell className="text-xs">{r.barcodeUnit?.size}/{r.barcodeUnit?.color}</TableCell>
                    <TableCell className="text-xs">{r.doneBy?.name}</TableCell>
                    <TableCell className="text-xs">{new Date(r.doneAt).toLocaleString("id-ID")}</TableCell>
                    <TableCell className="text-xs">{r.notes || "-"}</TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
            </CardContent>
          </Card>
        </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Aksesoris</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Aksesoris dikelola di Master Bahan dengan kategori "Aksesoris".</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/master/bahan")}>
              Kelola Aksesoris
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
