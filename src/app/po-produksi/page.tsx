import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { POList } from "./po-list"

export const dynamic = "force-dynamic"

export default async function POPage() {
  await requireRole("Owner", "ManagerProduksi")

  const poList = await prisma.productionOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          variasi: { include: { produk: true } },
        },
      },
      approvedBy: { select: { name: true, email: true } },
    },
  })

  const produkList = await prisma.produk.findMany({
    include: { variasi: { include: { produk: true } } },
    orderBy: { kode: "asc" },
  })

  const bahanList = await prisma.bahan.findMany({
    orderBy: { kode: "asc" },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">PO Produksi</h1>
      </div>
      <POList data={poList as any} produkList={produkList as any} bahanList={bahanList as any} />
    </div>
  )
}
