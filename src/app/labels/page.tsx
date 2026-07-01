import { requireRole } from "@/components/auth-guard"
import { LabelsPage } from "./labels-page"

export const dynamic = "force-dynamic"

export default async function LabelsRoute() {
  await requireRole("Owner")
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-gold">Label PROM</h1>
      </div>
      <LabelsPage />
    </div>
  )
}
