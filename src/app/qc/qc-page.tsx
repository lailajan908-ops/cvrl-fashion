"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scan, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const DEFECT_TYPES = ["Pass", "Jahitan Rusak", "Bahan Rusak", "Ukuran Salah", "Kotor", "Lainnya"]

export function QCPage({ userId }: { userId: string }) {
  const router = useRouter()

  const [barcode, setBarcode] = useState("")
  const [piece, setPiece] = useState<any>(null)
  const [pieceLoading, setPieceLoading] = useState(false)
  const [qcStage, setQcStage] = useState("QC1")
  const [result, setResult] = useState("Pass")
  const [defectPhotoPath, setDefectPhotoPath] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [recentRecords, setRecentRecords] = useState<any[]>([])
  const [sewerStats, setSewerStats] = useState<any[]>([])

  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/qc").then((r) => r.json()).then(setRecentRecords).catch(() => {})
    fetchSewerStats()
  }, [])

  async function fetchSewerStats() {
    try {
      const res = await fetch("/api/qc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "defect-summary" }),
      })
      if (res.ok) setSewerStats(await res.json())
    } catch {}
  }

  async function lookupBarcode() {
    const code = barcode.trim()
    if (!code) return
    setPieceLoading(true)
    setPiece(null)

    try {
      const res = await fetch(`/api/barcode/generate?barcode=${encodeURIComponent(code)}`)
      if (!res.ok) { toast.error("Barcode tidak ditemukan"); setPieceLoading(false); return }
      const data = await res.json()
      setPiece(data)
      setResult("Pass")
      setDefectPhotoPath("")
      setNotes("")

      // Auto-detect QC stage based on current stage
      if (data.currentStage === "ReceivedFromSewing" || data.currentStage === "Cut") {
        setQcStage("QC1")
      } else if (data.currentStage === "QC1" || data.currentStage === "ButtonHole") {
        setQcStage("QCFinal")
      } else {
        setQcStage("QC1")
      }
    } catch {
      toast.error("Gagal mencari barcode")
    }
    setPieceLoading(false)
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); lookupBarcode() }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) { toast.error("Gagal upload foto"); return }
    const data = await res.json()
    setDefectPhotoPath(data.url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!piece) { toast.error("Scan barcode dulu"); return }

    setSaving(true)
    const res = await fetch("/api/qc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: piece.barcode, qcStage, result, defectPhotoPath: defectPhotoPath || null, notes: notes || null }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success(`QC ${qcStage} dicatat: ${result}`)
    setPiece(null)
    setBarcode("")
    setSaving(false)
    router.refresh()
    fetch("/api/qc").then((r) => r.json()).then(setRecentRecords)
    fetchSewerStats()
    scanInputRef.current?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: QC Form */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>QC Inspection</CardTitle>
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
                    <span className="text-muted-foreground">Penjahit:</span>
                    <p>{piece.sewerName || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stage Saat Ini:</span>
                    <Badge>{piece.currentStage}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">PO:</span>
                    <p className="font-mono">{piece.po?.code}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Stage QC</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={qcStage}
                    onChange={(e) => setQcStage(e.target.value)}
                  >
                    <option value="QC1">QC1 (Setelah Jahit)</option>
                    <option value="QCFinal">QC Final (Sebelum Packing)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Hasil QC</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DEFECT_TYPES.map((t) => (
                      <Button
                        key={t}
                        type="button"
                        variant={result === t ? (t === "Pass" ? "default" : "destructive") : "outline"}
                        className={result === t ? "" : ""}
                        onClick={() => setResult(t)}
                      >
                        {t === "Pass" ? <Check className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>

                {result !== "Pass" && (
                  <div className="space-y-2">
                    <Label>Foto Cacat</Label>
                    <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
                    {defectPhotoPath && <p className="text-xs text-green-600">File: {defectPhotoPath}</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Catatan</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan QC (opsional)" />
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Menyimpan..." : `Simpan Hasil QC ${qcStage}`}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat QC Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>QC Stage</TableHead>
                  <TableHead>Hasil</TableHead>
                  <TableHead>Penjahit</TableHead>
                  <TableHead>QC By</TableHead>
                  <TableHead>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRecords.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada record QC</TableCell></TableRow>
                )}
                {recentRecords.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.barcodeUnit?.barcode}</TableCell>
                    <TableCell className="text-xs">{r.barcodeUnit?.produk?.kode}</TableCell>
                    <TableCell><Badge variant="outline">{r.qcStage}</Badge></TableCell>
                    <TableCell>
                      <Badge className={r.result === "Pass" ? "bg-green-500" : "bg-red-500"}>{r.result}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.barcodeUnit?.sewerName || "-"}</TableCell>
                    <TableCell className="text-xs">{r.qcBy?.name}</TableCell>
                    <TableCell className="text-xs">{new Date(r.qcAt).toLocaleString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Right: Sewer Defect Dashboard */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dashboard Cacat Penjahit</CardTitle>
          </CardHeader>
          <CardContent>
            {sewerStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada data</p>
            ) : (
              <div className="space-y-3">
                {sewerStats.map((s: any) => (
                  <div key={s.name} className="border rounded-lg p-3 space-y-1">
                    <p className="font-medium text-sm">{s.name}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Total dikirim: {s.totalPieces}</span>
                      <span>Cacat: {s.defectCount}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${parseFloat(s.defectRate) > 20 ? "bg-red-500" : parseFloat(s.defectRate) > 10 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ width: `${Math.min(parseFloat(s.defectRate), 100)}%` }}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${parseFloat(s.defectRate) > 20 ? "text-red-600" : parseFloat(s.defectRate) > 10 ? "text-yellow-600" : "text-green-600"}`}>
                      {s.defectRate}% cacat
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
