import { requireRole } from "@/components/auth-guard"
import { InventoryPage } from "./inventory-page"

export const dynamic = "force-dynamic"

export default async function InventoryMainPage() {
  await requireRole("Owner", "AdminGudang", "AdminPenjualan")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
      </div>
      <InventoryPage />
    </div>
  )
}
