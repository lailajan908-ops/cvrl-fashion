import { requireRole } from "@/components/auth-guard"
import { ScanPage } from "./scan-page"

export const dynamic = "force-dynamic"

export default async function ScanBarcodePage() {
  const session = await requireRole("Owner", "ManagerProduksi", "AdminGudang", "AdminQC")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scan Barcode</h1>
      </div>
      <ScanPage userId={(session.user as any).id} />
    </div>
  )
}
