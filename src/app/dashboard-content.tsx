"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ClockCard } from "@/components/clock-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users, Scissors, Package, ShoppingCart, AlertTriangle, TrendingUp, Clock,
  UserCheck, UserX, UserMinus, Zap, ShieldAlert, DollarSign, BarChart3,
  ChevronRight, Gauge, Wrench, QrCode, Boxes, ArrowLeftRight, ArrowUp,
  Layers,
} from "lucide-react"

const stageLabels: Record<string, string> = {
  Cut: "Potong", SentToSewing: "Di Jahit", ReceivedFromSewing: "Dari Jahit",
  QC1: "QC1", ButtonHole: "Lubang Kancing", QCFinal: "QC Final",
  Packed: "Packing", Sold: "Terjual", Returned: "Retur",
}

const produksiFoto = [
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80",
  "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&q=80",
  "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80",
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80",
  "https://images.unsplash.com/photo-1603400521630-9f2de124b33b?w=400&q=80",
]

const mockSewingStatus = [
  { name: "Ahmad Fauzi", status: "Active", lastActivity: "12:30", sisa: 24 },
  { name: "Siti Rahma", status: "Active", lastActivity: "12:28", sisa: 12 },
  { name: "Doni Prasetyo", status: "On Break", lastActivity: "11:45", sisa: 36 },
  { name: "Maya Sari", status: "Off", lastActivity: "Kemarin", sisa: 0 },
  { name: "Rudi Hartono", status: "Active", lastActivity: "12:32", sisa: 8 },
  { name: "Fitriani", status: "Active", lastActivity: "12:25", sisa: 18 },
  { name: "Bambang", status: "On Break", lastActivity: "11:50", sisa: 42 },
]

const mockTopProducts = [
  { name: "Kemeja Denim Pria", sold: 342, price: 89900, growth: 12.5, image: produksiFoto[0] },
  { name: "Cardigan Wanita", sold: 287, price: 129000, growth: 8.3, image: produksiFoto[1] },
  { name: "Jaket Bomber", sold: 198, price: 159000, growth: 24.1, image: produksiFoto[2] },
  { name: "Kaos Oversize", sold: 512, price: 59900, growth: -2.4, image: produksiFoto[3] },
  { name: "Celana Chino", sold: 165, price: 119000, growth: 5.7, image: produksiFoto[4] },
]

const mockProduksi = [
  { po: "PO-2026-001", produk: "Kemeja Denim", warna: "Biru", size: "L", stage: "SentToSewing", priority: "High", foto: produksiFoto[0] },
  { po: "PO-2026-002", produk: "Cardigan", warna: "Hitam", size: "M", stage: "Cut", priority: "Normal", foto: produksiFoto[1] },
  { po: "PO-2026-003", produk: "Jaket Bomber", warna: "Army", size: "XL", stage: "QCFinal", priority: "High", foto: produksiFoto[2] },
  { po: "PO-2026-004", produk: "Kaos Oversize", warna: "Putih", size: "L", stage: "Packed", priority: "Low", foto: produksiFoto[3] },
  { po: "PO-2026-005", produk: "Celana Chino", warna: "Cokelat", size: "32", stage: "QC1", priority: "Normal", foto: produksiFoto[4] },
]

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    "On Break": "bg-amber-500/10 text-amber-400 border-amber-500/30",
    Off: "bg-red-500/10 text-red-400 border-red-500/30",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[status] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
      {status}
    </span>
  )
}

const stageColors: Record<string, string> = {
  Cut: "bg-gradient-to-r from-zinc-500 to-zinc-400", SentToSewing: "bg-gradient-to-r from-blue-500 to-blue-400",
  ReceivedFromSewing: "bg-gradient-to-r from-indigo-500 to-indigo-400",
  QC1: "bg-gradient-to-r from-amber-500 to-amber-400", ButtonHole: "bg-gradient-to-r from-orange-500 to-orange-400",
  QCFinal: "bg-gradient-to-r from-purple-500 to-purple-400",
  Packed: "bg-gradient-to-r from-green-500 to-green-400", Sold: "bg-gradient-to-r from-emerald-600 to-emerald-500",
  Returned: "bg-gradient-to-r from-red-500 to-red-400",
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    High: "bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-400 border-red-500/30",
    Normal: "bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border-blue-500/30",
    Low: "bg-zinc-800 text-zinc-400 border-zinc-700",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${colors[priority] || ""}`}>
      {priority}
    </span>
  )
}

function StageProgress({ stage }: { stage: string }) {
  const stages = ["Cut", "SentToSewing", "ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed"]
  const idx = stages.indexOf(stage)
  const pct = Math.round(((idx + 1) / stages.length) * 100)
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-zinc-700/50 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-zinc-500 w-12 text-right">{stageLabels[stage] || stage}</span>
    </div>
  )
}

export function DashboardContent({ session }: { session: any }) {
  const [data, setData] = useState<any>(null)
  const [greeting, setGreeting] = useState("")
  const [productImgIdx, setProductImgIdx] = useState(0)

  useEffect(() => {
    fetch("/api/inventory?type=overview").then((r) => r.json()).then(setData).catch(() => {})
    const h = new Date().getHours()
    if (h < 11) setGreeting("Pagi")
    else if (h < 15) setGreeting("Siang")
    else setGreeting("Sore")
    const interval = setInterval(() => setProductImgIdx((i) => (i + 1) % produksiFoto.length), 5000)
    return () => clearInterval(interval)
  }, [])

  const stageCounts = data?.stageCounts || []
  const totalPieces = stageCounts.reduce((s: number, x: any) => s + x.count, 0) || 0
  const inProduction = stageCounts.filter((s: any) => !["Packed", "Sold", "Returned"].includes(s.stage)).reduce((a: number, s: any) => a + s.count, 0) || 0
  const packed = stageCounts.find((s: any) => s.stage === "Packed")?.count || 0
  const sold = stageCounts.find((s: any) => s.stage === "Sold")?.count || 0
  const returned = stageCounts.find((s: any) => s.stage === "Returned")?.count || 0
  const lowStok = data?.bahanStok?.filter((b: any) => b.stok <= b.stokMinimum) || []
  const totalOmset = sold * 85000

  const kpiCards = [
    { label: "Hadir Hari Ini", value: "—", icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Produksi", value: totalPieces.toLocaleString(), icon: Package, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Dalam Proses", value: inProduction.toLocaleString(), icon: Scissors, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Siap Jual", value: packed.toLocaleString(), icon: Layers, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Terjual", value: sold.toLocaleString(), icon: TrendingUp, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Retur", value: returned.toLocaleString(), icon: ArrowLeftRight, color: "text-red-400", bg: "bg-red-500/10" },
    { label: "Total Omset", value: `Rp${(totalOmset / 1000).toFixed(0)}rb`, icon: DollarSign, color: "text-amber-400", bg: "bg-amber-500/10" },
  ]

  const topProduksi = mockProduksi.slice(0, 5)
  const criticalPenjahit = mockSewingStatus.filter((s) => s.status !== "Active")
  const aiAlerts = [
    { type: "high", text: "Stok bahan Kain Denim tinggal 15 meter — estimasi habis 2 hari", action: "Pesan ulang sekarang" },
    { type: "medium", text: "Produksi PO-2026-003 (Jaket Bomber) molor 3 hari dari target", action: "Review jadwal produksi" },
    { type: "low", text: "Ahmad Fauzi absen 2 hari berturut-turut tanpa keterangan", action: "Hubungi HRD" },
  ]

  return (
    <div className="space-y-6">
      {/* ===== MOBILE HEADER ===== */}
      <div className="lg:hidden">
        <div className="relative h-48 -mx-4 -mt-4 mb-4 overflow-hidden bg-zinc-900">
          <img src={produksiFoto[productImgIdx]} alt="Produk" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/30 blur-md rounded" />
                <img src="/logo-cvrl.png" alt="" className="relative w-8 h-8 rounded object-cover  ring-1 ring-amber-500/30" />
              </div>
              <span className="text-gold font-bold tracking-wide">R&amp;L FASHION</span>
            </div>
            <p className="text-zinc-200 text-lg font-semibold">{greeting}, {session.user?.name?.split(" ")[0] || "Owner"}</p>
          </div>
          <div className="absolute top-4 right-4 flex gap-1">
            {produksiFoto.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === productImgIdx ? "bg-amber-400 shadow-lg shadow-amber-500/50" : "bg-zinc-600"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP HEADER ===== */}
      <div className="hidden lg:flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gold">{greeting}, {session.user?.name?.split(" ")[0] || "Owner"}</h1>
          <p className="text-sm text-zinc-500">
            {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ClockCard />
        </div>
      </div>

      {/* ===== KPI ROW ===== */}
      <div className="flex lg:grid lg:grid-cols-7 gap-3 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
        {kpiCards.map((k, i) => {
          const Icon = k.icon
          return (
            <Card key={i} className="min-w-[140px] lg:min-w-0 shrink-0 card-luxury">
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-2 rounded-lg ${k.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${k.color}`} />
                  </div>
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider truncate">{k.label}</span>
                </div>
                <p className="text-xl font-bold text-zinc-100">{k.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ===== MOBILE: CLOCK ===== */}
      <div className="lg:hidden">
        <ClockCard />
      </div>

      {/* ===== MAIN GRID ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* A. Status Penjahit */}
        <Card className="card-luxury">
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="font-semibold text-sm text-zinc-200">Status Penjahit</h2>
            </div>
            <Link href="/sewing" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Lihat semua</Link>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {mockSewingStatus.map((s, i) => (
              <div key={i} className="p-3.5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 ring-1 ring-zinc-700/50">
                    <AvatarFallback className="text-[10px] bg-zinc-800 text-zinc-400">
                      {s.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{s.name}</p>
                    <p className="text-[10px] text-zinc-500">Terakhir: {s.lastActivity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.status === "Active" && s.sisa > 0 && <span className="text-[10px] text-zinc-500">{s.sisa} pcs</span>}
                  <StatusBadge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* B. Monitoring Produksi */}
        <Card className="card-luxury lg:col-span-1">
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <BarChart3 className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="font-semibold text-sm text-zinc-200">Monitoring Produksi</h2>
            </div>
            <Link href="/po-produksi" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Kelola</Link>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {topProduksi.map((p, i) => (
              <div key={i} className="p-3.5 flex gap-3 hover:bg-zinc-800/30 transition-colors">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-lg blur-sm" />
                  <img src={p.foto} alt="" className="relative w-12 h-12 rounded-lg object-cover ring-1 ring-zinc-700/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-zinc-200 truncate">{p.produk}</p>
                    <PriorityBadge priority={p.priority} />
                  </div>
                  <p className="text-[10px] text-zinc-500">{p.warna} / {p.size} • {p.po}</p>
                  <div className="mt-1.5">
                    <StageProgress stage={p.stage} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* C. Produk Terlaris */}
        <Card className="card-luxury">
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <ShoppingCart className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="font-semibold text-sm text-zinc-200">Terlaris Shopee</h2>
            </div>
            <Link href="/marketplace-upload" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Kelola</Link>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {mockTopProducts.map((p, i) => (
              <div key={i} className="p-3.5 flex gap-3 hover:bg-zinc-800/30 transition-colors">
                <div className="relative">
                  <div className="absolute inset-0 bg-amber-500/10 rounded-lg blur-sm" />
                  <img src={p.image} alt="" className="relative w-12 h-12 rounded-lg object-cover ring-1 ring-zinc-700/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-zinc-200 truncate">{p.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-semibold text-gold-subtle">Rp{(p.price / 1000).toFixed(0)}rb</span>
                    <span className="text-[10px] text-zinc-500">{p.sold} terjual</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`text-[10px] font-medium ${p.growth >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      <ArrowUp className={`h-2.5 w-2.5 inline ${p.growth < 0 ? "rotate-180" : ""}`} />
                      {Math.abs(p.growth)}%
                    </span>
                    <span className="text-[10px] text-zinc-600">vs bulan lalu</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ===== LOWER SECTION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monitoring Karyawan */}
        <Card className="card-luxury">
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-indigo-500/10">
                <Users className="h-4 w-4 text-indigo-400" />
              </div>
              <h2 className="font-semibold text-sm text-zinc-200">Monitoring Karyawan</h2>
            </div>
            <Link href="/karyawan" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">Detail</Link>
          </div>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center flex-1 border-r border-zinc-800/60">
                <p className="text-xl font-bold text-emerald-400">—</p>
                <p className="text-[10px] text-zinc-500 mt-1">Hadir</p>
              </div>
              <div className="text-center flex-1 border-r border-zinc-800/60">
                <p className="text-xl font-bold text-amber-400">—</p>
                <p className="text-[10px] text-zinc-500 mt-1">Izin</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-xl font-bold text-red-400">—</p>
                <p className="text-[10px] text-zinc-500 mt-1">Alpha</p>
              </div>
            </div>
            <Link href="/karyawan" className="block text-center text-xs text-amber-400 hover:text-amber-300 transition-colors py-1">
              Lihat absensi lengkap
            </Link>
          </CardContent>
        </Card>

        {/* Productivity Chart */}
        <Card className="card-luxury">
          <div className="p-4 border-b border-zinc-800/60 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="font-semibold text-sm text-zinc-200">Produktivitas Hari Ini</h2>
          </div>
          <CardContent className="p-4 space-y-3">
            {stageCounts.slice(0, 5).map((s: any) => {
              const max = Math.max(...stageCounts.map((x: any) => x.count), 1)
              const pct = Math.round((s.count / max) * 100)
              return (
                <div key={s.stage}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-300">{stageLabels[s.stage] || s.stage}</span>
                    <span className="text-zinc-500">{s.count}</span>
                  </div>
                  <div className="w-full bg-zinc-700/50 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${stageColors[s.stage] || "bg-zinc-500"}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {stageCounts.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-6">Belum ada data</p>
            )}
          </CardContent>
        </Card>

        {/* AI Alert */}
        <Card className="card-luxury">
          <div className="p-4 border-b border-zinc-800/60 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <ShieldAlert className="h-4 w-4 text-red-400" />
            </div>
            <h2 className="font-semibold text-sm text-zinc-200">Peringatan & Risiko</h2>
            {aiAlerts.filter((a) => a.type === "high").length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] ml-auto">{aiAlerts.filter((a) => a.type === "high").length}</Badge>
            )}
          </div>
          <div className="p-4 space-y-2.5">
            {aiAlerts.map((a, i) => (
              <div key={i} className={`p-3.5 rounded-xl border ${a.type === "high" ? "bg-red-950/30 border-red-900/40" : a.type === "medium" ? "bg-orange-950/30 border-orange-900/40" : "bg-yellow-950/30 border-yellow-900/40"}`}>
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${a.type === "high" ? "text-red-400" : a.type === "medium" ? "text-orange-400" : "text-yellow-400"}`} />
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${a.type === "high" ? "text-red-300" : a.type === "medium" ? "text-orange-300" : "text-yellow-300"}`}>
                      {a.text}
                    </p>
                    <p className={`text-[10px] mt-1 font-medium ${a.type === "high" ? "text-red-400" : "text-orange-400"}`}>
                      {a.action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ===== MOBILE: CRITICAL PENJAHIT ===== */}
      <div className="lg:hidden">
        <Card className="card-luxury">
          <div className="p-4 border-b border-zinc-800/60 flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-red-500/10">
              <UserX className="h-4 w-4 text-red-400" />
            </div>
            <h2 className="font-semibold text-sm text-zinc-200">Penjahit Bermasalah</h2>
            {criticalPenjahit.length > 0 && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] ml-auto">{criticalPenjahit.length}</Badge>
            )}
          </div>
          {criticalPenjahit.length === 0 ? (
            <CardContent className="p-6 text-center text-xs text-zinc-600">
              Semua penjahit aktif
            </CardContent>
          ) : (
            <div className="divide-y divide-zinc-800/40">
              {criticalPenjahit.map((s, i) => (
                <div key={i} className="p-3.5 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8 ring-1 ring-zinc-700/50">
                      <AvatarFallback className="text-xs bg-zinc-800 text-zinc-400">
                        {s.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{s.name}</p>
                      <p className="text-[10px] text-zinc-500">Sisa: {s.sisa} pcs</p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ===== STOCK ALERTS ===== */}
      <div className="hidden lg:block">
        <Card className="card-luxury">
          <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-red-500/10">
                <AlertTriangle className="h-4 w-4 text-red-400" />
              </div>
              <h2 className="font-semibold text-sm text-zinc-200">Peringatan Stok Bahan</h2>
            </div>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">{lowStok.length}</Badge>
          </div>
          <CardContent className="p-4">
            {lowStok.length === 0 ? (
              <p className="text-xs text-zinc-600 text-center py-4">Semua stok aman</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {lowStok.slice(0, 8).map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-red-950/20 border border-red-900/30">
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{b.nama}</p>
                      <p className="text-[10px] text-zinc-500">{b.warna}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-400">{b.stok} {b.satuan}</p>
                      <p className="text-[10px] text-zinc-600">min: {b.stokMinimum}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {lowStok.length > 8 && (
              <Link href="/inventory" className="block text-center text-xs text-amber-400 hover:text-amber-300 transition-colors mt-3">
                +{lowStok.length - 8} bahan lainnya
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
