import { requireRole } from "@/components/auth-guard"
import { POSPage } from "./pos-page"

export const dynamic = "force-dynamic"

export default async function POSMainPage() {
  await requireRole("Owner", "AdminPenjualan")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">POS / Penjualan</h1>
      </div>
      <POSPage />
    </div>
  )
}
