import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { PromoList } from "./promo-list"

export const dynamic = "force-dynamic"

export default async function PromoPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminGudang", "AdminPenjualan")

  const promos = await prisma.promo.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          variasi: { include: { produk: true } }
        }
      }
    }
  })

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gold">Modul Promo (PROM)</h1>
      </div>
      <PromoList data={promos} />
    </div>
  )
}
