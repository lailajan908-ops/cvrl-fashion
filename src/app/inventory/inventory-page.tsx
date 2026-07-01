"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const stageColors: Record<string, string> = {
  Cut: "bg-gray-500",
  SentToSewing: "bg-blue-500",
  ReceivedFromSewing: "bg-indigo-500",
  QC1: "bg-yellow-500",
  ButtonHole: "bg-orange-500",
  QCFinal: "bg-purple-500",
  Packed: "bg-green-500",
  Sold: "bg-green-700",
  Returned: "bg-red-500",
}

const stageLabels: Record<string, string> = {
  Cut: "Potong",
  SentToSewing: "Dikirim ke Jahit",
  ReceivedFromSewing: "Diterima dari Jahit",
  QC1: "QC1",
  ButtonHole: "Lubang Kancing",
  QCFinal: "QC Final",
  Packed: "Packing",
  Sold: "Terjual",
  Returned: "Retur",
}

export function InventoryPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/inventory?type=overview").then((r) => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data) return <p className="text-muted-foreground">Loading...</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Progress Produksi per Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stageCounts?.map((s: any) => {
                const max = Math.max(...data.stageCounts.map((x: any) => x.count), 1)
                return (
                  <TableRow key={s.stage}>
                    <TableCell>
                      <Badge className={stageColors[s.stage] || "bg-gray-500"}>{stageLabels[s.stage] || s.stage}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{s.count}</TableCell>
                    <TableCell>
                   <div className="w-full bg-zinc-700/50 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: `${(s.count / max) * 100}%` }} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stok Bahan Baku & Aksesoris</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bahanStok?.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada bahan</TableCell></TableRow>
              )}
              {data.bahanStok?.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.kode}</TableCell>
                  <TableCell>{b.nama}</TableCell>
                  <TableCell><span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{b.kategori}</span></TableCell>
                  <TableCell className={b.stok <= b.stokMinimum ? "text-red-500 font-bold" : ""}>{b.stok} {b.satuan}</TableCell>
                  <TableCell>{b.stokMinimum}</TableCell>
                  <TableCell>
                    <Badge className={b.stok <= b.stokMinimum ? "bg-red-500" : "bg-green-500"}>
                      {b.stok <= b.stokMinimum ? "Stok Minimum" : "Tersedia"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
