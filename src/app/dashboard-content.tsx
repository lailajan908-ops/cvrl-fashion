"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ClockCard } from "@/components/clock-card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Package, TrendingUp, DollarSign, Users, Scissors, ShoppingCart,
  AlertTriangle, Activity, BarChart3, Boxes, ChevronRight,
  ArrowUpRight, Sparkles, Clock, ShieldAlert,
} from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

function KpiCard({ label, value, icon: Icon, sub, trend }: {
  label: string; value: string | number; icon: any; sub: string; trend?: { up: boolean; text: string }
}) {
  const [display, setDisplay] = useState("0")
  const numVal = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""))
  const isRp = String(value).includes("Rp")

  useEffect(() => {
    if (!numVal || isNaN(numVal)) { setDisplay(String(value)); return }
    let start = 0
    const duration = 1000
    const step = Math.ceil(numVal / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= numVal) { start = numVal; clearInterval(timer) }
      setDisplay(isRp ? `Rp${(start / 1e6).toFixed(1)}jt` : start.toLocaleString())
    }, 16)
    return () => clearInterval(timer)
  }, [numVal])

  return (
    <div className="group relative">
      <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-600/20 via-transparent to-amber-600/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="relative bg-[#0d0a08] border border-zinc-800/40 rounded-xl p-5 group-hover:border-amber-900/40 transition-all duration-500">
        <div className="flex items-start justify-between mb-4">
          <span className="text-[10px] text-zinc-600 font-semibold uppercase tracking-[0.15em]">{label}</span>
          <Icon className="h-4 w-4 text-amber-600/60" />
        </div>
        <p className="text-2xl font-bold text-zinc-100 tracking-tight">{display}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="w-6 h-px bg-amber-700/40" />
          <span className="text-[10px] text-zinc-600 tracking-wide">{sub}</span>
          {trend && (
            <span className={`text-[10px] flex items-center gap-0.5 ml-auto ${trend.up ? "text-emerald-600" : "text-red-500"}`}>
              {trend.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3 rotate-90" />}
              {trend.text}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, label, action }: {
  icon: any; label: string; action?: React.ReactNode
}) {
  return (
    <div className="px-5 py-4 border-b border-zinc-800/20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="h-3.5 w-3.5 text-amber-600/70" />
        <span className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">{label}</span>
      </div>
      {action}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Active: "text-emerald-500 border-emerald-900/30",
    "On Break": "text-amber-500 border-amber-900/30",
    Off: "text-red-400 border-red-900/30",
  }
  const dot: Record<string, string> = {
    Active: "bg-emerald-500",
    "On Break": "bg-amber-500",
    Off: "bg-red-400",
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full border tracking-wider uppercase ${colors[status] || "text-zinc-500 border-zinc-800/30"}`}>
      <span className={`w-1 h-1 rounded-full ${dot[status] || "bg-zinc-500"}`} />
      {status}
    </span>
  )
}

function MiniProgress({ stage, label }: { stage: string; label: string }) {
  const stages = ["Cut", "SentToSewing", "ReceivedFromSewing", "QC1", "ButtonHole", "QCFinal", "Packed"]
  const idx = stages.indexOf(stage)
  const pct = Math.round(((idx + 1) / stages.length) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-zinc-800/40 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[9px] text-zinc-600 w-16 text-right tracking-wider uppercase">{label}</span>
    </div>
  )
}

export function DashboardContent({ session }: { session: any }) {
  const { locale } = useLanguage()
  const [data, setData] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [meta, setMeta] = useState<any>({})
  const [greeting, setGreeting] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [ovRes, aiRes] = await Promise.all([
          fetch("/api/inventory?type=overview"),
          fetch("/api/ai/dashboard-insights"),
        ])
        setData(await ovRes.json())
        const ai = await aiRes.json()
        setInsights(ai.insights || [])
        setAlerts(ai.alerts || [])
        setMeta(ai.metadata || {})
      } catch {}
      setLoading(false)
    }
    load()
    const h = new Date().getHours()
    if (h < 11) setGreeting("morning")
    else if (h < 15) setGreeting("afternoon")
    else setGreeting("evening")
  }, [])

  const sc = data?.stageCounts || []
  const totalPieces = sc.reduce((s: number, x: any) => s + x.count, 0) || 0
  const inProduction = sc.filter((s: any) => !["Packed", "Sold", "Returned"].includes(s.stage)).reduce((a: number, s: any) => a + s.count, 0) || 0
  const packed = sc.find((s: any) => s.stage === "Packed")?.count || 0
  const sold = sc.find((s: any) => s.stage === "Sold")?.count || 0
  const returned = sc.find((s: any) => s.stage === "Returned")?.count || 0
  const lowStok = data?.bahanStok?.filter((b: any) => b.stok <= b.stokMinimum) || []
  const totalOmset = meta.totalRevenue ?? sold * 85000
  const sewingStatus = data?.sewingStatus || []
  const topProduksi = (data?.topProduksi || []).slice(0, 4)
  const topProducts = data?.topProducts || []

  const stageLabels: Record<string, string> = {
    Cut: t(locale, "stage.cut"),
    SentToSewing: t(locale, "stage.sewing"),
    ReceivedFromSewing: t(locale, "stage.fromsewing"),
    QC1: "QC1",
    ButtonHole: t(locale, "stage.buttonhole"),
    QCFinal: t(locale, "stage.qcfinal"),
    Packed: t(locale, "stage.packing"),
    Sold: t(locale, "stage.sold"),
    Returned: t(locale, "stage.returned"),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 border border-zinc-800 rounded-full" />
            <div className="absolute inset-0 border border-transparent border-t-amber-600 rounded-full animate-spin" />
          </div>
          <p className="text-xs text-zinc-700 tracking-wider uppercase">{t(locale, "loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="font-serif text-2xl lg:text-3xl text-zinc-100 font-bold tracking-wide">
              {t(locale, `greeting.${greeting}`)}
              <span className="text-zinc-500 font-normal">, {session.user?.name?.split(" ")[0] || "Owner"}</span>
            </h1>
            <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-900/20 text-[9px] text-amber-600 font-medium uppercase tracking-[0.15em]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {t(locale, "ai.active")}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-700 tracking-wide">
            <span>{new Date().toLocaleDateString(locale === "fa" ? "fa-IR" : locale === "en" ? "en-US" : "id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
            <span className="w-px h-3 bg-zinc-800" />
            <ClockCard />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/chat">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800/40 hover:border-amber-800/30 hover:bg-amber-950/10 transition-all text-xs text-zinc-500 hover:text-amber-500 tracking-wider uppercase">
              <Sparkles className="h-3 w-3" />
              {t(locale, "ai.assistant")}
              <ChevronRight className="h-3 w-3" />
            </div>
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { href: "/pos", label: t(locale, "nav.pos"), icon: ShoppingCart },
          { href: "/sewing", label: t(locale, "nav.sewing"), icon: Users },
          { href: "/inventory", label: t(locale, "nav.inventory"), icon: Package },
          { href: "/po-produksi", label: t(locale, "nav.production"), icon: Activity },
          { href: "/master/produk", label: t(locale, "nav.products"), icon: Boxes },
          { href: "/payments", label: t(locale, "nav.payments"), icon: DollarSign },
        ].map((q) => {
          const Icon = q.icon
          return (
            <Link key={q.href} href={q.href}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800/30 bg-[#0d0a08] hover:border-amber-900/30 hover:bg-amber-950/5 transition-all cursor-pointer shrink-0 group">
                <Icon className="h-3.5 w-3.5 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                <span className="text-xs text-zinc-500 group-hover:text-zinc-300 transition-colors whitespace-nowrap tracking-wide">{q.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard label={t(locale, "kpi.total.production")} value={totalPieces} icon={Package} sub={t(locale, "kpi.sub.total")} trend={{ up: true, text: "12%" }} />
        <KpiCard label={t(locale, "kpi.in.progress")} value={inProduction} icon={Activity} sub={t(locale, "kpi.sub.processing")} />
        <KpiCard label={t(locale, "kpi.ready")} value={packed} icon={Boxes} sub={t(locale, "kpi.sub.ready")} trend={{ up: true, text: "8%" }} />
        <KpiCard label={t(locale, "kpi.sold")} value={sold} icon={TrendingUp} sub={t(locale, "kpi.sub.sold")} trend={{ up: true, text: "5%" }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <KpiCard label={t(locale, "kpi.revenue")} value={`Rp${(totalOmset / 1e6).toFixed(1)}jt`} icon={DollarSign} sub={t(locale, "kpi.sub.revenue")} trend={{ up: true, text: "15%" }} />
        <KpiCard label={t(locale, "kpi.return")} value={returned} icon={AlertTriangle} sub={returned > 0 ? t(locale, "kpi.sub.return.attention") : t(locale, "kpi.sub.return.safe")} />
      </div>

      {/* AI INSIGHTS */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {insights.slice(0, 3).map((ins: any, i: number) => {
            const iconMap: Record<string, any> = {
              "trending-up": TrendingUp, "alert-triangle": AlertTriangle,
              "users": Users, "shopping-cart": ShoppingCart,
              "package": Package, "scissors": Scissors,
            }
            const Icon = iconMap[ins.icon] || Sparkles
            const styles: Record<string, { icon: string; border: string; label: string }> = {
              positive: { icon: "text-emerald-500", border: "border-emerald-900/20", label: t(locale, "ai.positive") },
              warning: { icon: "text-amber-500", border: "border-amber-900/20", label: t(locale, "ai.warning") },
              info: { icon: "text-blue-500", border: "border-blue-900/20", label: t(locale, "ai.info") },
            }
            const st = styles[ins.type] || styles.info
            return (
              <div key={i} className="bg-[#0d0a08] border border-zinc-800/40 rounded-xl p-5 hover:border-zinc-700/40 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                    <Icon className={`h-4 w-4 ${st.icon}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-semibold text-zinc-200">{ins.title}</p>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${st.border} ${st.icon} uppercase tracking-wider`}>{st.label}</span>
                    </div>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">{ins.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRODUCTION */}
        <div className="bg-[#0d0a08] border border-zinc-800/40 rounded-xl">
          <SectionHeader icon={Activity} label={t(locale, "section.production")}
            action={<Link href="/po-produksi" className="text-[10px] text-amber-600 hover:text-amber-500 font-medium uppercase tracking-wider flex items-center gap-1">{t(locale, "action.manage")} <ChevronRight className="h-3 w-3" /></Link>}
          />
          <div className="divide-y divide-zinc-800/15 max-h-[360px] overflow-y-auto">
            {topProduksi.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="h-6 w-6 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-700 tracking-wide">{t(locale, "empty.no.data")}</p>
              </div>
            ) : (
              topProduksi.map((p: any, i: number) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-900/30 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-900/30 to-zinc-900 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0 border border-zinc-800/40">
                    {p.produk?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200 truncate">{p.produk}</p>
                    <p className="text-[9px] text-zinc-600 tracking-wide uppercase">{p.warna} / {p.size}</p>
                    <MiniProgress stage={p.stage} label={stageLabels[p.stage] || p.stage} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SEWING STATUS */}
        <div className="bg-[#0d0a08] border border-zinc-800/40 rounded-xl">
          <SectionHeader icon={Users} label={t(locale, "section.sewing")}
            action={<Link href="/sewing" className="text-[10px] text-amber-600 hover:text-amber-500 font-medium uppercase tracking-wider flex items-center gap-1">{t(locale, "action.view")} <ChevronRight className="h-3 w-3" /></Link>}
          />
          <div className="divide-y divide-zinc-800/15 max-h-[360px] overflow-y-auto">
            {sewingStatus.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="h-6 w-6 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-700 tracking-wide">{t(locale, "empty.no.data")}</p>
              </div>
            ) : (
              sewingStatus.slice(0, 7).map((s: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between hover:bg-zinc-900/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[9px] bg-zinc-900 text-zinc-600 font-medium border border-zinc-800/40">
                        {s.name?.split(" ").map((n: string) => n[0]).join("") || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{s.name}</p>
                      <p className="text-[9px] text-zinc-600 tracking-wide">{s.lastActivity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.status === "Active" && s.sisa > 0 && (
                      <span className="text-[9px] text-zinc-600 bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-800/30">{s.sisa}pcs</span>
                    )}
                    <StatusBadge status={s.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PRODUCTS */}
        <div className="bg-[#0d0a08] border border-zinc-800/40 rounded-xl">
          <SectionHeader icon={TrendingUp} label={t(locale, "section.products")}
            action={<Link href="/marketplace-upload" className="text-[10px] text-amber-600 hover:text-amber-500 font-medium uppercase tracking-wider flex items-center gap-1">{t(locale, "action.manage")} <ChevronRight className="h-3 w-3" /></Link>}
          />
          <div className="divide-y divide-zinc-800/15 max-h-[300px] overflow-y-auto">
            {topProducts.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="h-6 w-6 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-700 tracking-wide">{t(locale, "empty.no.data")}</p>
              </div>
            ) : (
              topProducts.slice(0, 5).map((p: any, i: number) => (
                <div key={i} className="px-5 py-3 flex items-center gap-4 hover:bg-zinc-900/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-900/30 to-zinc-900 flex items-center justify-center text-xs font-bold text-amber-600 shrink-0 border border-zinc-800/40">
                    {p.name?.charAt(0) || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-zinc-200 truncate">{p.name}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] font-semibold text-amber-600">Rp{(p.price / 1000).toFixed(0)}rb</span>
                      <span className="text-[9px] text-zinc-600 flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        {p.sold} {t(locale, "action.sold")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* PRODUCTIVITY */}
        <div className="bg-[#0d0a08] border border-zinc-800/40 rounded-xl">
          <SectionHeader icon={BarChart3} label={t(locale, "section.productivity")} />
          <div className="p-5 space-y-4">
            {sc.length === 0 ? (
              <p className="text-xs text-zinc-700 text-center py-6 tracking-wide">{t(locale, "empty.no.data")}</p>
            ) : (
              sc.slice(0, 7).map((s: any) => {
                const max = Math.max(...sc.map((x: any) => x.count), 1)
                const pct = Math.round((s.count / max) * 100)
                return (
                  <div key={s.stage}>
                    <div className="flex justify-between text-[11px] mb-1.5">
                      <span className="text-zinc-400 tracking-wide uppercase">{stageLabels[s.stage] || s.stage}</span>
                      <span className="text-zinc-600">{s.count} {t(locale, "kpi.sub.unit")}</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-700 to-amber-500 rounded-full"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ALERTS */}
        <div className="bg-[#0d0a08] border border-zinc-800/40 rounded-xl">
          <SectionHeader icon={ShieldAlert} label={t(locale, "section.alerts")}
            action={alerts.length > 0 ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-900/20 text-red-500 border border-red-900/30 font-medium">{alerts.length}</span>
            ) : undefined}
          />
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {alerts.length === 0 && lowStok.length === 0 ? (
              <div className="py-6 text-center">
                <ShieldAlert className="h-6 w-6 text-zinc-800 mx-auto mb-2" />
                <p className="text-xs text-zinc-700 tracking-wide">{t(locale, "all.good")}</p>
              </div>
            ) : (
              <>
                {lowStok.slice(0, 3).map((b: any) => (
                  <div key={b.id} className="p-3 rounded-lg bg-red-950/10 border border-red-900/20">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-red-400 font-medium">{t(locale, "alert.stock.low", { name: b.nama })}</p>
                        <p className="text-[9px] text-zinc-600 mt-0.5">{t(locale, "alert.stock.remaining", { stock: b.stok, unit: b.satuan, min: b.stokMinimum })}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {alerts.slice(0, 3).map((a: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg border ${
                    a.type === "high" ? "bg-red-950/10 border-red-900/20" :
                    a.type === "medium" ? "bg-amber-950/10 border-amber-900/20" :
                    "bg-yellow-950/10 border-yellow-900/20"
                  }`}>
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className={`h-3 w-3 shrink-0 mt-0.5 ${
                        a.type === "high" ? "text-red-500" :
                        a.type === "medium" ? "text-amber-500" : "text-yellow-500"
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-[11px] font-medium ${
                          a.type === "high" ? "text-red-400" :
                          a.type === "medium" ? "text-amber-400" : "text-yellow-400"
                        }`}>{a.text}</p>
                        <p className="text-[9px] text-zinc-600 mt-0.5">{a.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
