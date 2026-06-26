import { requireRole } from "@/components/auth-guard"
import { MarketplaceUploadPage } from "./marketplace-upload-page"

export const dynamic = "force-dynamic"

export default async function MarketplaceUploadMainPage() {
  await requireRole("Owner", "AdminPenjualan")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Marketplace Upload</h1>
      </div>
      <MarketplaceUploadPage />
    </div>
  )
}
