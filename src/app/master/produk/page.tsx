import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { ProdukList } from "./produk-list"

export const dynamic = "force-dynamic"

export default async function ProdukPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminGudang")

  const produkList = await prisma.produk.findMany({
    orderBy: { createdAt: "desc" },
    include: { variasi: true, images: { orderBy: { order: "asc" }, take: 1 }, kategori: true },
  }) as any

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gold">Master Produk</h1>
      </div>
      <ProdukList data={produkList} />
    </div>
  )
}
