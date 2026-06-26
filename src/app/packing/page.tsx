import { requireRole } from "@/components/auth-guard"
import { PackingPage } from "./packing-page"

export const dynamic = "force-dynamic"

export default async function PackingMainPage() {
  await requireRole("Owner", "AdminGudang", "ManagerProduksi")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Packing & Pengemasan</h1>
      </div>
      <PackingPage />
    </div>
  )
}
