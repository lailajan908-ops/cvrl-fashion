import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { CuttingReportPage } from "./cutting-report-page"

export const dynamic = "force-dynamic"

export default async function PotongBahanPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminGudang")

  const poList = await prisma.productionOrder.findMany({
    where: { status: "Approved" },
    orderBy: { createdAt: "desc" },
    select: { id: true, code: true },
  })

  const bahanList = await prisma.bahan.findMany({
    orderBy: { kode: "asc" },
    select: { id: true, kode: true, nama: true, warna: true, satuan: true },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Potong Bahan (Cutting Report)</h1>
      </div>
      <CuttingReportPage poList={poList as any} bahanList={bahanList as any} />
    </div>
  )
}
