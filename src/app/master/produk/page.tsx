import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { ProdukList } from "./produk-list"

export const dynamic = "force-dynamic"

export default async function ProdukPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminGudang")

  const produkList = await prisma.produk.findMany({
    orderBy: { createdAt: "desc" },
    include: { variasi: true },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-amber-400">Master Produk</h1>
      </div>
      <ProdukList data={produkList} />
    </div>
  )
}
