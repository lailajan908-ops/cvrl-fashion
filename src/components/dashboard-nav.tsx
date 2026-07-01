"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useState } from "react"
import {
  Package, Shirt, Users, ClipboardList, Scissors, Scan,
  QrCode, ArrowLeftRight, Boxes, ShoppingCart,
  LogOut, User, Wrench, DollarSign, FileSpreadsheet,
  Gauge, ShieldCheck, Menu, LayoutDashboard,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { label: "PRODUKSI", header: true, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/po-produksi", label: "Produksi", icon: ClipboardList, roles: ["Owner", "ManagerProduksi"] },
  { href: "/sewing", label: "Penjahit", icon: Users, roles: ["Owner", "ManagerProduksi", "AdminQC"] },
  { href: "/potong-bahan", label: "Potong Bahan", icon: Scissors, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/scan", label: "Scan Barcode", icon: Scan, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC"] },
  { label: "QC & RETUR", header: true, roles: ["Owner", "AdminQC"] },
  { href: "/qc", label: "QC", icon: QrCode, roles: ["Owner", "AdminQC"] },
  { href: "/buttonhole", label: "Lubang Kancing", icon: Wrench, roles: ["Owner", "ManagerProduksi", "AdminQC"] },
  { href: "/retur", label: "Retur", icon: ArrowLeftRight, roles: ["Owner", "AdminQC"] },
  { label: "BARANG & STOK", header: true, roles: ["Owner", "AdminGudang", "AdminPenjualan"] },
  { href: "/master/bahan", label: "Master Bahan", icon: Package, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/master/produk", label: "Master Produk", icon: Shirt, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["Owner", "AdminGudang", "AdminPenjualan"] },
  { href: "/packing", label: "Packing", icon: Package, roles: ["Owner", "AdminGudang", "ManagerProduksi"] },
  { label: "KARYAWAN", header: true, roles: ["Owner"] },
  { href: "/karyawan", label: "Karyawan", icon: User, roles: ["Owner"] },
  { href: "/approval", label: "Persetujuan", icon: ShieldCheck, roles: ["Owner"] },
  { href: "/master/users", label: "User Management", icon: ShieldCheck, roles: ["Owner"] },
  { label: "KEUANGAN", header: true, roles: ["Owner", "AdminPenjualan"] },
  { href: "/pos", label: "POS / Penjualan", icon: ShoppingCart, roles: ["Owner", "AdminPenjualan"] },
  { href: "/payments", label: "Payment Tracking", icon: DollarSign, roles: ["Owner", "AdminPenjualan"] },
  { href: "/marketplace-upload", label: "Marketplace", icon: FileSpreadsheet, roles: ["Owner", "AdminPenjualan"] },
  { label: "LAPORAN", header: true, roles: ["Owner"] },
  { href: "/master/sewing-partner", label: "Sewing Partner", icon: Users, roles: ["Owner", "ManagerProduksi"] },
  { label: "SUPER ADMIN", header: true, roles: ["Owner"] },
  { href: "/chat", label: "Mode Super Admin", icon: ShieldCheck, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { label: "INFORMASI", header: true, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { href: "/about", label: "Tentang", icon: Gauge, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { href: "/labels", label: "Labels", icon: ShieldCheck, roles: ["Owner"] },
]

type Props = { role: string; userName: string }

function SidebarContent({ role, pathname, onNav }: { role: string; pathname: string; onNav?: () => void }) {
  const visible = navItems.filter((item) => item.roles.includes(role) || role === "Owner")

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-lg" />
          <img src="/logo-cvrl.png" alt="R&amp;L" className="relative w-9 h-9 rounded-lg object-cover  ring-1 ring-amber-500/20" />
        </div>
        <div>
          <h2 className="font-bold text-sm leading-tight text-gold">R&amp;L</h2>
          <p className="text-[10px] text-zinc-500 tracking-[0.2em]">FASHION</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visible.map((item, i) => {
          if ("header" in item) {
            return (
              <p key={i} className="text-[10px] font-semibold text-zinc-600 px-3 pt-5 pb-1.5 uppercase tracking-[0.15em]">
                {item.label}
              </p>
            )
          }
          const Icon = item.icon!
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={onNav}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 cursor-pointer",
                  active
                    ? "bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400 border-l-2 border-amber-500"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border-l-2 border-transparent"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-amber-400")} />
                <span className="truncate">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-zinc-800/60">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-red-400 hover:bg-red-950/20 transition-all duration-200"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">Keluar</span>
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
      {/* Mobile header bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-zinc-400 hover:text-amber-400 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-md rounded" />
            <img src="/logo-cvrl.png" alt="R&amp;L" className="relative w-7 h-7 rounded object-cover  ring-1 ring-amber-500/20" />
          </div>
          <span className="font-bold text-sm text-gold">R&amp;L</span>
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
      <aside className="hidden md:flex w-64 flex-col overflow-y-auto shrink-0 bg-zinc-950/95 border-r border-zinc-800/60">
        <SidebarContent role={role} pathname={pathname} />
      </aside>
    </>
  )
}
