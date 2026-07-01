"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

type PO = { id: string; code: string }
type Bahan = { id: string; kode: string; nama: string; warna: string; satuan: string }
type ProdukVariasi = { id: string; size: string; warna: string; produk: { id: string; kode: string; nama: string } }

type DetailRow = {
  bahanId: string
  size: string
  warna: string
  unitUsedMode: string
  amountUsed: number
  cuttingCount: number
  perPieceMultiplier: number
  resultQty: number
}

export function CuttingReportPage({ poList: initialPoList, bahanList: initialBahanList }: { poList: PO[]; bahanList: Bahan[] }) {
  const router = useRouter()

  const [poList] = useState(initialPoList)
  const [bahanList] = useState(initialBahanList)
  const [reports, setReports] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  const [selectedPoId, setSelectedPoId] = useState("")
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [panelLength, setPanelLength] = useState("")
  const [panelCount, setPanelCount] = useState("")
  const [photoPath, setPhotoPath] = useState("")
  const [details, setDetails] = useState<DetailRow[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/cutting-report")
      .then((r) => r.json())
      .then(setReports)
      .catch(() => {})
  }, [])

  function resetForm() {
    setSelectedPoId("")
    setReportDate(new Date().toISOString().slice(0, 10))
    setPanelLength("")
    setPanelCount("")
    setPhotoPath("")
    setDetails([])
  }

  function addDetail() {
    const firstBahan = bahanList[0]
    if (!firstBahan) { toast.error("Buat bahan dulu"); return }
    setDetails([...details, {
      bahanId: firstBahan.id,
      size: "",
      warna: "",
      unitUsedMode: firstBahan.satuan === "KG" ? "KG" : "Meter",
      amountUsed: 0,
      cuttingCount: 0,
      perPieceMultiplier: 1,
      resultQty: 0,
    }])
  }

  function updateDetail(idx: number, field: string, value: any) {
    const updated = [...details]
    const row = { ...updated[idx], [field]: value }
    if (field === "cuttingCount" || field === "perPieceMultiplier") {
      row.resultQty = row.cuttingCount * row.perPieceMultiplier
    }
    updated[idx] = row
    setDetails(updated)
  }

  function removeDetail(idx: number) {
    setDetails(details.filter((_, i) => i !== idx))
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: formData })
    if (!res.ok) { toast.error("Gagal upload foto"); return }
    const data = await res.json()
    setPhotoPath(data.url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedPoId) { toast.error("Pilih PO"); return }
    if (!photoPath) { toast.error("Upload foto laporan potong"); return }
    const validDetails = details.filter((d) => d.amountUsed > 0 && d.cuttingCount > 0 && d.resultQty > 0)
    if (validDetails.length === 0) { toast.error("Tambah minimal 1 detail dengan qty > 0"); return }
    if (validDetails.some((d) => !d.size || !d.warna)) { toast.error("Semua detail harus memiliki size dan warna"); return }

    setSaving(true)
    const res = await fetch("/api/cutting-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poId: selectedPoId,
        reportDate,
        panelLength: panelLength ? parseFloat(panelLength) : null,
        panelCount: panelCount ? parseInt(panelCount) : null,
        photoPath,
        details: validDetails,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal menyimpan" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success("Laporan potong berhasil disimpan")
    resetForm()
    setOpen(false)
    setSaving(false)
    router.refresh()
    fetch("/api/cutting-report").then((r) => r.json()).then(setReports)
  }

  const totalQty = (details: any[]) => details.reduce((s: number, d: any) => s + d.resultQty, 0)

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle>Laporan Potong Bahan</CardTitle>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Laporan Potong Baru</Button>} />
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Laporan Potong Bahan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PO Produksi</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    value={selectedPoId}
                    onChange={(e) => setSelectedPoId(e.target.value)}
                    required
                  >
                    <option value="">Pilih PO</option>
                    {poList.map((po) => (
                      <option key={po.id} value={po.id}>{po.code}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Potong</Label>
                  <Input type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Panjang Panel (cm)</Label>
                  <Input type="number" step="0.1" value={panelLength} onChange={(e) => setPanelLength(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Jumlah Panel</Label>
                  <Input type="number" min="1" value={panelCount} onChange={(e) => setPanelCount(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Foto Laporan Potong</Label>
                <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
                {photoPath && <p className="text-xs text-green-600">File terupload: {photoPath}</p>}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">Detail Potong (per Ukuran + Warna)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDetail}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Detail
                  </Button>
                </div>
                {details.length === 0 && <p className="text-sm text-muted-foreground">Belum ada detail. Klik Tambah Detail.</p>}
                {details.map((d, i) => (
                  <div key={i} className="flex gap-2 items-end border p-3 rounded-lg flex-wrap">
                    <div className="w-full sm:w-36">
                      <Label className="text-xs">Bahan</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={d.bahanId}
                        onChange={(e) => updateDetail(i, "bahanId", e.target.value)}
                      >
                        {bahanList.map((b) => (
                          <option key={b.id} value={b.id}>{b.kode} - {b.nama} ({b.warna})</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <Label className="text-xs">Size</Label>
                      <Input value={d.size} onChange={(e) => updateDetail(i, "size", e.target.value)} placeholder="M" />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <Label className="text-xs">Warna</Label>
                      <Input value={d.warna} onChange={(e) => updateDetail(i, "warna", e.target.value)} placeholder="Hitam" />
                    </div>
                    <div className="w-full sm:w-20">
                      <Label className="text-xs">Unit</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                        value={d.unitUsedMode}
                        onChange={(e) => updateDetail(i, "unitUsedMode", e.target.value)}
                      >
                        <option value="Meter">Meter</option>
                        <option value="KG">KG</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Label className="text-xs">Jumlah Digunakan</Label>
                      <Input type="number" step="0.01" min="0" value={d.amountUsed || ""}
                        onChange={(e) => updateDetail(i, "amountUsed", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <Label className="text-xs">Jml Potong</Label>
                      <Input type="number" min="0" value={d.cuttingCount || ""}
                        onChange={(e) => updateDetail(i, "cuttingCount", parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <Label className="text-xs">Multiplier/pc</Label>
                      <Input type="number" min="1" value={d.perPieceMultiplier}
                        onChange={(e) => updateDetail(i, "perPieceMultiplier", parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="flex-1 min-w-[80px]">
                      <Label className="text-xs">Hasil (pcs)</Label>
                      <Input type="number" min="0" value={d.resultQty || ""}
                        onChange={(e) => updateDetail(i, "resultQty", parseInt(e.target.value) || 0)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeDetail(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Laporan Potong"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Panel</TableHead>
              <TableHead>Material Digunakan</TableHead>
              <TableHead>Hasil Potong</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Dipotong Oleh</TableHead>
              <TableHead>Foto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Belum ada laporan potong</TableCell></TableRow>
            )}
            {reports.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.po?.code}</TableCell>
                <TableCell className="text-xs">{new Date(r.reportDate).toLocaleDateString("id-ID")}</TableCell>
                <TableCell className="text-xs">{r.panelLength ? `${r.panelLength}cm x ${r.panelCount}` : "-"}</TableCell>
                <TableCell className="text-xs">{(r.totalMaterialUsed ?? 0).toFixed(2)}</TableCell>
                <TableCell className="text-xs">{r.totalResultQty ?? 0} pcs</TableCell>
                <TableCell>
                  {r.details?.map((d: any, i: number) => (
                    <div key={i} className="text-xs">
                      {d.size}/{d.warna}: {d.bahan?.kode} {d.amountUsed}{d.unitUsedMode} &rarr; {d.resultQty}pcs
                    </div>
                  ))}
                </TableCell>
                <TableCell className="text-xs">{r.cutBy?.name}</TableCell>
                <TableCell>
                  {r.photoPath && <a href={r.photoPath} target="_blank" className="text-xs text-blue-600 underline">Lihat</a>}
                </TableCell>
              </TableRow>
            ))}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
  )
}
