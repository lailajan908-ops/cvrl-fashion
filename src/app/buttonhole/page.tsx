import { requireRole } from "@/components/auth-guard"
import { ButtonholePage } from "./buttonhole-page"

export const dynamic = "force-dynamic"

export default async function ButtonholeMainPage() {
  const session = await requireRole("Owner", "ManagerProduksi", "AdminQC")
  const userId = (session.user as any).id

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lubang Kancing & Aksesoris</h1>
      </div>
      <ButtonholePage userId={userId} />
    </div>
  )
}
