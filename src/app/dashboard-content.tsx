"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClockCard } from "@/components/clock-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ClipboardList, Scissors, Package, ShoppingCart,
  AlertTriangle, Shirt, Users, Spool, QrCode,
  ArrowLeftRight, LayoutDashboard, Wrench, Boxes, User, Scan, DollarSign, TrendingUp, Clock
} from "lucide-react"

const stageLabels: Record<string, string> = {
  Cut: "Potong", SentToSewing: "Di Jahit", ReceivedFromSewing: "Dari Jahit",
  QC1: "QC1", ButtonHole: "Lubang Kancing", QCFinal: "QC Final",
  Packed: "Packing", Sold: "Terjual", Returned: "Retur",
}

const stageColors: Record<string, string> = {
  Cut: "bg-gray-500", SentToSewing: "bg-blue-500", ReceivedFromSewing: "bg-indigo-500",
  QC1: "bg-yellow-500", ButtonHole: "bg-orange-500", QCFinal: "bg-purple-500",
  Packed: "bg-green-500", Sold: "bg-green-700", Returned: "bg-red-500",
}

const quickLinks = [
  { href: "/po-produksi", icon: ClipboardList, label: "PO Produksi", desc: "Buat & kelola PO", color: "text-blue-500", bg: "bg-blue-50" },
  { href: "/potong-bahan", icon: Scissors, label: "Potong Bahan", desc: "Laporan potong", color: "text-orange-500", bg: "bg-orange-50" },
  { href: "/sewing", icon: Spool, label: "Sewing", desc: "Kirim/terima jahit", color: "text-indigo-500", bg: "bg-indigo-50" },
  { href: "/qc", icon: QrCode, label: "QC", desc: "Inspeksi kualitas", color: "text-yellow-500", bg: "bg-yellow-50" },
  { href: "/buttonhole", icon: Wrench, label: "Lubang Kancing", desc: "Aksesoris", color: "text-orange-600", bg: "bg-orange-50" },
  { href: "/packing", icon: Package, label: "Packing", desc: "Kemas barang", color: "text-green-500", bg: "bg-green-50" },
  { href: "/pos", icon: ShoppingCart, label: "POS / Jual", desc: "Transaksi", color: "text-emerald-600", bg: "bg-emerald-50" },
  { href: "/inventory", icon: Boxes, label: "Inventory", desc: "Stok barang", color: "text-purple-500", bg: "bg-purple-50" },
  { href: "/scan", icon: Scan, label: "Scan Barcode", desc: "Tracking produksi", color: "text-cyan-500", bg: "bg-cyan-50" },
  { href: "/retur", icon: ArrowLeftRight, label: "Retur", desc: "Barang kembali", color: "text-red-500", bg: "bg-red-50" },
  { href: "/karyawan", icon: User, label: "Karyawan", desc: "Absen & payroll", color: "text-slate-500", bg: "bg-slate-50" },
]

export function DashboardContent({ session }: { session: any }) {
  const [data, setData] = useState<any>(null)
  const [greeting, setGreeting] = useState("")

  useEffect(() => {
    fetch("/api/inventory?type=overview").then((r) => r.json()).then(setData).catch(() => {})
    const h = new Date().getHours()
    if (h < 11) setGreeting("Selamat Pagi")
    else if (h < 15) setGreeting("Selamat Siang")
    else if (h < 18) setGreeting("Selamat Sore")
    else setGreeting("Selamat Malam")
  }, [])

  const totalPieces = data?.stageCounts?.reduce((s: number, x: any) => s + x.count, 0) || 0
  const inProduction = data?.stageCounts?.filter((s: any) => !["Packed", "Sold", "Returned"].includes(s.stage)).reduce((a: number, s: any) => a + s.count, 0) || 0
  const packed = data?.stageCounts?.find((s: any) => s.stage === "Packed")?.count || 0
  const sold = data?.stageCounts?.find((s: any) => s.stage === "Sold")?.count || 0
  const returned = data?.stageCounts?.find((s: any) => s.stage === "Returned")?.count || 0
  const lowStok = data?.bahanStok?.filter((b: any) => b.stok <= b.stokMinimum) || []

  return (
    <div className="space-y-6">
      {/* Welcome Video Hero */}
      <div className="relative -mx-6 -mt-6 mb-2 overflow-hidden bg-black h-[70vh] min-h-[400px] max-h-[700px]">
        <video
          src="/welcome.mp4"
          className="w-full h-full object-cover"
          controls
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-8 left-8 right-8 pointer-events-none">
          <img src="/cvrl-logo.svg" alt="CVRL Fashion" className="h-14 mb-3 drop-shadow-lg" />
          <div className="flex items-center gap-3">
            <h1 className="text-white text-3xl sm:text-4xl font-bold drop-shadow-lg tracking-tight">CVRL FASHION</h1>
          </div>
          <p className="text-white/80 text-sm sm:text-base drop-shadow max-w-xl mt-1">
            {greeting}, {session.user?.name?.split(" ")[0] || "User"}! Selamat datang di sistem manajemen produksi terintegrasi.
          </p>
          <p className="text-white/50 text-xs mt-1 drop-shadow">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground -mt-4 mb-4">
        <Clock className="h-3 w-3" />
        Dashboard Production Overview
      </div>

      {/* Clock In/Out */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-1">
          <ClockCard />
        </div>
        <div className="sm:col-span-3">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Produksi</p>
            <p className="text-xl font-bold mt-0.5">{totalPieces.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">pieces</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Dalam Proses</p>
            <p className="text-xl font-bold mt-0.5">{inProduction.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">pieces</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Siap Jual</p>
            <p className="text-xl font-bold mt-0.5">{packed.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">packed</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Terjual</p>
            <p className="text-xl font-bold mt-0.5">{sold.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">sold</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Retur</p>
            <p className="text-xl font-bold mt-0.5">{returned.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">returned</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-400">
          <CardContent className="p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Stok Alert</p>
            <p className="text-xl font-bold mt-0.5">{lowStok.length}</p>
            <p className="text-[10px] text-muted-foreground">bahan</p>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production Pipeline */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-zinc-500" />
                <h2 className="font-semibold text-sm">Pipeline Produksi</h2>
              </div>
              <span className="text-xs text-muted-foreground">{totalPieces} total pieces</span>
            </div>
            <div className="p-4 space-y-3">
              {data?.stageCounts?.map((s: any) => {
                const max = Math.max(...data.stageCounts.map((x: any) => x.count), 1)
                const pct = Math.round((s.count / max) * 100)
                return (
                  <div key={s.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${stageColors[s.stage]}`} />
                        <span className="font-medium">{stageLabels[s.stage] || s.stage}</span>
                      </div>
                      <span className="text-muted-foreground">{s.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${s.stage === "Packed" ? "bg-green-500" : s.stage === "Sold" ? "bg-emerald-600" : s.stage === "Returned" ? "bg-red-500" : "bg-zinc-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Stock Alerts */}
        <div>
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-red-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h2 className="font-semibold text-sm text-red-700">Peringatan Stok</h2>
              </div>
              <Badge className="bg-red-500 text-white text-[10px]">{lowStok.length}</Badge>
            </div>
            <div className="p-3 space-y-2">
              {lowStok.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Semua stok aman
                </p>
              )}
              {lowStok.slice(0, 6).map((b: any) => (
                <div key={b.id} className="flex items-center justify-between border-b border-dashed last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="text-xs font-medium">{b.nama}</p>
                    <p className="text-[10px] text-muted-foreground">{b.warna} &middot; {b.kategori}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-red-500">{b.stok} {b.satuan}</p>
                    <p className="text-[10px] text-muted-foreground">min: {b.stokMinimum}</p>
                  </div>
                </div>
              ))}
              {lowStok.length > 6 && (
                <Link href="/inventory" className="text-xs text-blue-600 hover:underline block text-center pt-1">
                  +{lowStok.length - 6} lainnya
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold text-sm">Menu Cepat</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-zinc-200 hover:border-zinc-300 group">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${link.bg} ${link.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium group-hover:text-zinc-900 transition-colors">{link.label}</p>
                      <p className="text-[10px] text-muted-foreground">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
