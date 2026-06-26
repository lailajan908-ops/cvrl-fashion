import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { SewingPartnerList } from "./sewing-partner-list"

export const dynamic = "force-dynamic"

export default async function SewingPartnerPage() {
  await requireRole("Owner", "ManagerProduksi")

  const partners = await prisma.sewingPartner.findMany({ orderBy: { nama: "asc" } })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sewing Partners</h1>
      </div>
      <SewingPartnerList data={partners} />
    </div>
  )
}
