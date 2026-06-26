import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { BahanList } from "./bahan-list"

export const dynamic = "force-dynamic"

export default async function BahanPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminGudang")

  const bahanList = await prisma.bahan.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Master Bahan</h1>
      </div>
      <BahanList data={bahanList} />
    </div>
  )
}
