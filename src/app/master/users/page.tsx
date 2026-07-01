import { prisma } from "@/lib/db"
import { requireRole } from "@/components/auth-guard"
import { UsersPage } from "./users-page"

export const dynamic = "force-dynamic"

export default async function MasterUsersPage() {
  await requireRole("Owner")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Master Users</h1>
      </div>
      <UsersPage users={users} />
    </div>
  )
}
