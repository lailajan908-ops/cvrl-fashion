"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Scan, CheckCircle2, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const stages = [
  { value: "Cut", label: "Selesai Potong" },
  { value: "SentToSewing", label: "Kirim ke Jahit" },
  { value: "ReceivedFromSewing", label: "Terima dari Jahit" },
  { value: "QC1", label: "QC 1" },
  { value: "ButtonHole", label: "Lobang Kancing" },
  { value: "QCFinal", label: "QC Final" },
  { value: "Packed", label: "Packing" },
]

const stageColors: Record<string, string> = {
  Cut: "bg-blue-500",
  SentToSewing: "bg-yellow-500",
  ReceivedFromSewing: "bg-orange-500",
  QC1: "bg-purple-500",
  ButtonHole: "bg-pink-500",
  QCFinal: "bg-indigo-500",
  Packed: "bg-green-500",
  Sold: "bg-emerald-700",
  Returned: "bg-red-500",
}

export function ScanPage({ userId }: { userId: string }) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [barcode, setBarcode] = useState("")
  const [stage, setStage] = useState("Cut")
  const [loading, setLoading] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)
  const [pieceInfo, setPieceInfo] = useState<any>(null)

  // Auto-focus input
  useEffect(() => { inputRef.current?.focus() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!barcode.trim()) { toast.error("Scan atau ketik barcode"); return }

    setLoading(true)
    setLastResult(null)

    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ barcode: barcode.trim(), stage, notes: "" }),
    })

    const data = await res.json()

    if (!res.ok) {
      toast.error(data.error || "Gagal scan")
      setLastResult({ success: false, error: data.error })
    } else {
      toast.success(`Scan berhasil: ${barcode.trim()} → ${stages.find(s => s.value === stage)?.label}`)
      setLastResult({ success: true })
      // Fetch piece info
      const infoRes = await fetch(`/api/barcode/generate?barcode=${encodeURIComponent(barcode.trim())}`)
      if (infoRes.ok) {
        setPieceInfo(await infoRes.json())
      }
    }

    setBarcode("")
    setLoading(false)
    inputRef.current?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Scan Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" /> Scan Barcode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Stage</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
              >
                {stages.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                ref={inputRef}
                id="barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Scan atau ketik barcode..."
                className="text-lg font-mono"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">Fokus sudah di input. Scanner akan langsung mengisi.</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Scan"}
            </Button>
          </form>

          {lastResult && (
            <div className={`p-3 rounded-lg ${lastResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              <div className="flex items-center gap-2">
                {lastResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <span className="font-medium">
                  {lastResult.success ? "Scan berhasil!" : lastResult.error}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Piece Info */}
      {pieceInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Informasi Barcode</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Barcode:</div>
              <div className="font-mono font-bold">{pieceInfo.barcode}</div>
              <div className="text-muted-foreground">Produk:</div>
              <div>{pieceInfo.produk?.kode} - {pieceInfo.produk?.nama}</div>
              <div className="text-muted-foreground">Size:</div>
              <div>{pieceInfo.size}</div>
              <div className="text-muted-foreground">Warna:</div>
              <div>{pieceInfo.color}</div>
              <div className="text-muted-foreground">PO:</div>
              <div>{pieceInfo.po?.code}</div>
              <div className="text-muted-foreground">Current Stage:</div>
              <div>
                <Badge className={stageColors[pieceInfo.currentStage] || "bg-gray-500"}>
                  {pieceInfo.currentStage}
                </Badge>
              </div>
            </div>

            {pieceInfo.scanLogs?.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Riwayat Scan</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stage</TableHead>
                      <TableHead>Waktu</TableHead>
                      <TableHead>Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pieceInfo.scanLogs.map((log: any, i: number) => (
                      <TableRow key={i}>
                        <TableCell><Badge className={stageColors[log.stage] || "bg-gray-500"}>{log.stage}</Badge></TableCell>
                        <TableCell className="text-xs">{new Date(log.scannedAt).toLocaleString("id-ID")}</TableCell>
                        <TableCell className="text-xs">{log.scannedBy?.name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
