import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardContent } from "./dashboard-content"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const role = (session.user as any).role

  return (
    <div className="flex min-h-screen">
      <DashboardNav role={role} userName={session.user.name || session.user.email!} />
      <main className="flex-1 p-4 md:p-6 pt-16 md:pt-6 overflow-x-hidden">
        <DashboardContent session={session} />
      </main>
    </div>
  )
}
