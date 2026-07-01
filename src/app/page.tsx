import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardContent } from "./dashboard-content"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const role = (session.user as any).role || "Karyawan"
  const name = session.user.name || "User"

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <DashboardNav role={role} userName={name} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-16 md:pt-6">
        <DashboardContent session={session} />
      </main>
    </div>
  )
}
