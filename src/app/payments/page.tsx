import { requireRole } from "@/components/auth-guard"
import { PaymentsPage } from "./payments-page"

export const dynamic = "force-dynamic"

export default async function PaymentsMainPage() {
  await requireRole("Owner", "AdminPenjualan")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Payment Tracking</h1>
      </div>
      <PaymentsPage />
    </div>
  )
}
