import { requireRole } from "@/components/auth-guard"
import { AiAssistantPage } from "./ai-assistant-page"

export const dynamic = "force-dynamic"

export default async function AiAssistantMainPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">AI Assistant</h1>
      </div>
      <AiAssistantPage />
    </div>
  )
}
