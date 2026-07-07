"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState, useMemo } from "react"
import {
  Package, Shirt, Users, ClipboardList, Scissors, Scan,
  QrCode, ArrowLeftRight, Boxes, ShoppingCart,
  LogOut, User, Wrench, DollarSign, FileSpreadsheet,
  Gauge, ShieldCheck, Menu, LayoutDashboard,
  Search, ChevronDown, ChevronRight, Sparkles, Factory,
  BadgeCheck, Wallet, BarChart3, type LucideIcon,
} from "lucide-react"

interface NavItem {
  href?: string
  label: string
  icon?: LucideIcon
  header?: boolean
  roles: string[]
}

interface NavSection {
  label: string
  icon?: LucideIcon
  items: NavItem[]
  roles: string[]
}

const navSections: NavSection[] = [
  {
    label: "Utama",
    icon: LayoutDashboard,
    roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"],
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
    ],
  },
  {
    label: "Produksi",
    icon: Factory,
    roles: ["Owner", "ManagerProduksi", "AdminGudang"],
    items: [
      { href: "/po-produksi", label: "Produksi", icon: ClipboardList, roles: ["Owner", "ManagerProduksi"] },
      { href: "/sewing", label: "Penjahit", icon: Users, roles: ["Owner", "ManagerProduksi", "AdminQC"] },
      { href: "/potong-bahan", label: "Potong Bahan", icon: Scissors, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
      { href: "/scan", label: "Scan Barcode", icon: Scan, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC"] },
    ],
  },
  {
    label: "QC & Retur",
    icon: BadgeCheck,
    roles: ["Owner", "AdminQC"],
    items: [
      { href: "/qc", label: "QC", icon: QrCode, roles: ["Owner", "AdminQC"] },
      { href: "/buttonhole", label: "Lubang Kancing", icon: Wrench, roles: ["Owner", "ManagerProduksi", "AdminQC"] },
      { href: "/retur", label: "Retur", icon: ArrowLeftRight, roles: ["Owner", "AdminQC"] },
    ],
  },
  {
    label: "Barang & Stok",
    icon: Package,
    roles: ["Owner", "AdminGudang", "AdminPenjualan"],
    items: [
      { href: "/master/bahan", label: "Master Bahan", icon: Package, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
      { href: "/master/produk", label: "Master Produk", icon: Shirt, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
      { href: "/list-belanja", label: "List Belanja", icon: ShoppingCart, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
      { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["Owner", "AdminGudang", "AdminPenjualan"] },
      { href: "/packing", label: "Packing", icon: Package, roles: ["Owner", "AdminGudang", "ManagerProduksi"] },
    ],
  },
  {
    label: "Karyawan",
    icon: Users,
    roles: ["Owner"],
    items: [
      { href: "/karyawan", label: "Karyawan", icon: User, roles: ["Owner"] },
      { href: "/approval", label: "Persetujuan", icon: ShieldCheck, roles: ["Owner"] },
      { href: "/master/users", label: "User Management", icon: ShieldCheck, roles: ["Owner"] },
    ],
  },
  {
    label: "Keuangan",
    icon: Wallet,
    roles: ["Owner", "AdminPenjualan"],
    items: [
      { href: "/pos", label: "POS / Penjualan", icon: ShoppingCart, roles: ["Owner", "AdminPenjualan"] },
      { href: "/payments", label: "Payment Tracking", icon: DollarSign, roles: ["Owner", "AdminPenjualan"] },
      { href: "/marketplace-upload", label: "Marketplace", icon: FileSpreadsheet, roles: ["Owner", "AdminPenjualan"] },
    ],
  },
  {
    label: "Laporan",
    icon: BarChart3,
    roles: ["Owner"],
    items: [
      { href: "/master/sewing-partner", label: "Sewing Partner", icon: Users, roles: ["Owner", "ManagerProduksi"] },
    ],
  },
  {
    label: "AI & Tools",
    icon: Sparkles,
    roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"],
    items: [
      { href: "/chat", label: "AI Chat", icon: ShieldCheck, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
      { href: "/about", label: "Tentang", icon: Gauge, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
      { href: "/labels", label: "Labels", icon: ShieldCheck, roles: ["Owner"] },
    ],
  },
]

type Props = { role: string; userName: string }

function SidebarContent({ role, pathname, onNav }: { role: string; pathname: string; onNav?: () => void }) {
  const [search, setSearch] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const visibleSections = useMemo(() => {
    return navSections
      .filter((s) => s.roles.includes(role) || role === "Owner")
      .map((section) => ({
        ...section,
        items: section.items.filter((i) => i.roles.includes(role) || role === "Owner"),
      }))
      .filter((s) => s.items.length > 0)
  }, [role])

  const filteredSections = useMemo(() => {
    if (!search.trim()) return visibleSections
    const q = search.toLowerCase()
    return visibleSections
      .map((s) => ({
        ...s,
        items: s.items.filter((i) => i.label.toLowerCase().includes(q)),
      }))
      .filter((s) => s.items.length > 0)
  }, [visibleSections, search])

  const toggleSection = (label: string) => {
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href))

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-zinc-950 to-black">
      {/* Brand */}
      <div className="p-4 border-b border-zinc-800/40 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-amber-600 blur-sm rounded-xl" />
            <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-xl" />
            <img src="/logo-cvrl.png" alt="R&L" className="relative w-9 h-9 rounded-xl object-cover ring-1 ring-amber-500/30" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm leading-tight text-gold">R&L FASHION</h2>
            <p className="text-[9px] text-zinc-600 tracking-[0.15em] uppercase">AI-Powered ERP</p>
          </div>
        </div>
        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari menu..."
            className="w-full h-8 pl-8 pr-2 text-xs bg-zinc-900/80 border border-zinc-800/60 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all"
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-none">
        {filteredSections.map((section) => {
          const SectionIcon = section.icon
          const isExpanded = expanded[section.label] !== false
          const hasActive = section.items.some((i) => i.href && isActive(i.href))
          return (
            <div key={section.label}>
              <button
                onClick={() => toggleSection(section.label)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150",
                  hasActive
                    ? "text-amber-400 bg-amber-500/5"
                    : "text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900/50"
                )}
              >
                {SectionIcon && <SectionIcon className="h-3.5 w-3.5 shrink-0" />}
                <span className="flex-1 text-left truncate">{section.label}</span>
                {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
              </button>
              {isExpanded && (
                <div className="ml-1 pl-2 border-l border-zinc-800/40 space-y-0.5 mt-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon!
                    const active = item.href ? isActive(item.href) : false
                    return (
                      <Link key={item.href || item.label} href={item.href || "#"} onClick={onNav}>
                        <div
                          className={cn(
                            "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer",
                            active
                              ? "bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400 font-medium"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                          )}
                        >
                          {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{item.label}</span>
                          {active && <span className="ml-auto w-1 h-1 rounded-full bg-amber-400" />}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-3 border-t border-zinc-800/40 bg-black/40">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all duration-150"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  )
}

export function DashboardNav({ role }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-zinc-400 hover:text-amber-400 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-md rounded" />
            <img src="/logo-cvrl.png" alt="R&L" className="relative w-7 h-7 rounded object-cover ring-1 ring-amber-500/20" />
          </div>
          <span className="font-bold text-sm text-gold">R&L</span>
        </div>
        <button onClick={() => signOut()} className="text-zinc-500 hover:text-red-400 transition-colors">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-zinc-950 border-r border-zinc-800/60">
          <SidebarContent role={role} pathname={pathname} onNav={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 flex-col overflow-y-auto shrink-0 bg-zinc-950/95 border-r border-zinc-800/60">
        <SidebarContent role={role} pathname={pathname} />
      </aside>
    </>
  )
}
