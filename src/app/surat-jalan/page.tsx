import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { DashboardNav } from "@/components/dashboard-nav"
import { SuratJalanClient } from "./surat-jalan-client"

export const dynamic = "force-dynamic"

export default async function SuratJalanPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const role = (session.user as any).role || "Karyawan"
  const name = session.user.name || "User"

  if (!["Owner", "ManagerProduksi", "AdminGudang"].includes(role)) redirect("/")

  const bahanList = await prisma.bahan.findMany({ orderBy: { createdAt: "desc" } })
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      items: { include: { bahan: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-black">
      <DashboardNav role={role} userName={name} />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pt-16 md:pt-6">
        <SuratJalanClient bahanList={bahanList as any} initialOrders={orders as any} userRole={role} />
      </main>
    </div>
  )
}
