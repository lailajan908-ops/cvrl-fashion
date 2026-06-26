import { requireRole } from "@/components/auth-guard"
import { KaryawanPage } from "./karyawan-page"

export const dynamic = "force-dynamic"

export default async function KaryawanMainPage() {
  await requireRole("Owner")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Karyawan & Payroll</h1>
      </div>
      <KaryawanPage />
    </div>
  )
}
