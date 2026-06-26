import { requireAuth } from "@/components/auth-guard"
import { QCPage } from "./qc-page"

export const dynamic = "force-dynamic"

export default async function QCMainPage() {
  const session = await requireAuth()
  const userId = (session.user as any).id

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quality Control</h1>
      </div>
      <QCPage userId={userId} />
    </div>
  )
}
