"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState } from "react"
import {
  Package, Shirt, Users, ClipboardList, Scissors, Spool, Scan,
  QrCode, ArrowLeftRight, Boxes, ShoppingCart, LayoutDashboard,
  LogOut, User, Wrench, Menu, X, DollarSign, FileSpreadsheet, MessageCircle, Bot,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { href: "/chat", label: "Chat", icon: MessageCircle, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { label: "MASTER DATA", header: true, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/master/bahan", label: "Master Bahan", icon: Package, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/master/produk", label: "Master Produk", icon: Shirt, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/master/sewing-partner", label: "Sewing Partner", icon: Users, roles: ["Owner", "ManagerProduksi"] },
  { label: "PRODUKSI", header: true, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/po-produksi", label: "PO Produksi", icon: ClipboardList, roles: ["Owner", "ManagerProduksi"] },
  { href: "/potong-bahan", label: "Potong Bahan", icon: Scissors, roles: ["Owner", "ManagerProduksi", "AdminGudang"] },
  { href: "/sewing", label: "Sewing", icon: Spool, roles: ["Owner", "ManagerProduksi", "AdminQC"] },
  { href: "/buttonhole", label: "Lubang Kancing", icon: Wrench, roles: ["Owner", "ManagerProduksi", "AdminQC"] },
  { href: "/scan", label: "Scan Barcode", icon: Scan, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC"] },
  { label: "QC & RETUR", header: true, roles: ["Owner", "AdminQC"] },
  { href: "/qc", label: "Quality Control", icon: QrCode, roles: ["Owner", "AdminQC"] },
  { href: "/retur", label: "Retur", icon: ArrowLeftRight, roles: ["Owner", "AdminQC"] },
  { label: "INVENTORY & POS", header: true, roles: ["Owner", "AdminGudang", "AdminPenjualan"] },
  { href: "/packing", label: "Packing", icon: Package, roles: ["Owner", "AdminGudang", "ManagerProduksi"] },
  { href: "/inventory", label: "Inventory", icon: Boxes, roles: ["Owner", "AdminGudang", "AdminPenjualan"] },
  { href: "/pos", label: "POS / Penjualan", icon: ShoppingCart, roles: ["Owner", "AdminPenjualan"] },
  { href: "/payments", label: "Payment Tracking", icon: DollarSign, roles: ["Owner", "AdminPenjualan"] },
  { href: "/marketplace-upload", label: "Marketplace Upload", icon: FileSpreadsheet, roles: ["Owner", "AdminPenjualan"] },
  { label: "AI", header: true, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot, roles: ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"] },
  { label: "KARYAWAN", header: true, roles: ["Owner"] },
  { href: "/karyawan", label: "Karyawan & Absensi", icon: User, roles: ["Owner"] },
]

type Props = { role: string; userName: string }

function SidebarContent({ role, pathname }: { role: string; pathname: string }) {
  const visible = navItems.filter((item) => item.roles.includes(role) || role === "Owner")

  return (
    <>
      <div className="p-4 border-b flex items-center gap-3">
        <img src="/cvrl-icon.svg" alt="CVRL" className="w-8 h-8 rounded-md" />
        <div>
          <h2 className="font-bold text-sm leading-tight">CVRL</h2>
          <p className="text-[10px] text-muted-foreground tracking-widest">FASHION</p>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visible.map((item, i) => {
          if ("header" in item) {
            return (
              <p key={i} className="text-xs font-semibold text-muted-foreground px-3 pt-4 pb-1 uppercase">
                {item.label}
              </p>
            )
          }
          const Icon = item.icon!
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn("w-full justify-start gap-3 text-sm", pathname === item.href && "bg-secondary font-medium")}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-500" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" />
          Keluar
        </Button>
      </div>
    </>
  )
}

export function DashboardNav({ role }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile header bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(true)} className="text-zinc-400 hover:text-white transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <img src="/cvrl-icon.svg" alt="CVRL" className="w-7 h-7" />
          <span className="font-bold text-sm text-white">CVRL</span>
        </div>
        <button onClick={() => signOut()} className="text-red-400 text-xs">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-zinc-50">
          <SidebarContent role={role} pathname={pathname} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r bg-zinc-50 flex-col overflow-y-auto shrink-0">
        <SidebarContent role={role} pathname={pathname} />
      </aside>
    </>
  )
}
