import { requireRole } from "@/components/auth-guard"
import { ReturPage } from "./retur-page"

export const dynamic = "force-dynamic"

export default async function ReturMainPage() {
  await requireRole("Owner", "AdminQC")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Retur Customer</h1>
      </div>
      <ReturPage />
    </div>
  )
}
