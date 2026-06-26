import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { SewingPage } from "./sewing-page"

export const dynamic = "force-dynamic"

export default async function SewingMainPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminQC")

  const partners = await prisma.sewingPartner.findMany({
    orderBy: { nama: "asc" },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sewing (Penjahit)</h1>
      </div>
      <SewingPage partners={partners as any} />
    </div>
  )
}
