import { requireRole } from "@/components/auth-guard"
import { ChatPage } from "./chat-page"

export const dynamic = "force-dynamic"

export default async function ChatMainPage() {
  await requireRole("Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chat</h1>
      </div>
      <ChatPage />
    </div>
  )
}
