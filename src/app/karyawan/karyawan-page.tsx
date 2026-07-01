"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function KaryawanPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  const PAYROLL_TYPES = ["HarianTetap", "BulananTetap", "HarianBorongan"]
  const ROLES = ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"]

  const [form, setForm] = useState({ email: "", name: "", password: "", role: "Karyawan", noHp: "", alamat: "", tanggalMasuk: "", payrollType: "HarianTetap", dailyRate: "", monthlySalary: "", pieceRate: "" })

  useEffect(() => {
    fetch("/api/karyawan").then((r) => r.json()).then(setEmployees)
    fetchTodayStatus()
  }, [])

  const [todayStatus, setTodayStatus] = useState<any>(null)

  async function fetchTodayStatus() {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch(`/api/attendance?tanggal=${today}`)
    if (res.ok) {
      const data = await res.json()
      setTodayStatus(data[0] || null)
    }
  }

  async function handleClock(action: string) {
    const res = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal")
      return
    }
    toast.success(action === "clockIn" ? "Clock-in berhasil" : "Clock-out berhasil")
    fetchTodayStatus()
  }

  const initialForm = { email: "", name: "", password: "", role: "Karyawan", noHp: "", alamat: "", tanggalMasuk: "", payrollType: "HarianTetap", dailyRate: "", monthlySalary: "", pieceRate: "" }

  function resetForm() { setForm(initialForm); setEditing(null) }

  function openEdit(emp: any) {
    setForm({
      email: emp.email, name: emp.name || "", password: "",
      role: emp.role, noHp: emp.noHp || "", alamat: emp.alamat || "",
      tanggalMasuk: emp.tanggalMasuk ? emp.tanggalMasuk.slice(0, 10) : "",
      payrollType: emp.payrollType, dailyRate: emp.dailyRate.toString(),
      monthlySalary: emp.monthlySalary.toString(), pieceRate: emp.pieceRate.toString(),
    })
    setEditing(emp)
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.name || (!editing && !form.password)) {
      toast.error("Email, nama, dan password wajib diisi")
      return
    }

    const body: any = {
      email: form.email, name: form.name, role: form.role,
      noHp: form.noHp || null, alamat: form.alamat || null,
      tanggalMasuk: form.tanggalMasuk || null,
      payrollType: form.payrollType,
      dailyRate: parseFloat(form.dailyRate) || 0,
      monthlySalary: parseFloat(form.monthlySalary) || 0,
      pieceRate: parseFloat(form.pieceRate) || 0,
    }
    if (editing) body.id = editing.id
    if (form.password) body.password = form.password

    const res = await fetch(`/api/karyawan`, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal")
      return
    }

    toast.success(editing ? "Karyawan diperbarui" : "Karyawan ditambahkan")
    resetForm(); setOpen(false); router.refresh()
    fetch("/api/karyawan").then((r) => r.json()).then(setEmployees)
  }

  async function handleApprove(emp: any) {
    const res = await fetch(`/api/karyawan`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: emp.id, email: emp.email, name: emp.name, role: emp.role,
        isActive: true,
        noHp: emp.noHp || null, alamat: emp.alamat || null,
        tanggalMasuk: emp.tanggalMasuk || null,
        payrollType: emp.payrollType,
        dailyRate: emp.dailyRate || 0,
        monthlySalary: emp.monthlySalary || 0,
        pieceRate: emp.pieceRate || 0,
      }),
    })
    if (!res.ok) { toast.error("Gagal menyetujui"); return }
    toast.success(`${emp.name} telah disetujui`)
    fetch("/api/karyawan").then((r) => r.json()).then(setEmployees)
  }

  const pending = employees.filter(e => !e.isActive)
  const approved = employees.filter(e => e.isActive)

  const payrollLabels: Record<string, string> = {
    HarianTetap: "Harian Tetap",
    BulananTetap: "Bulanan Tetap",
    HarianBorongan: "Harian Borongan",
  }

  return (
    <div className="space-y-6">
      {/* Clock In/Out */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle>Absensi Hari Ini</CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => handleClock("clockIn")} disabled={todayStatus?.clockIn}>
              <Clock className="h-4 w-4 mr-2" /> Clock In
            </Button>
            <Button variant="outline" onClick={() => handleClock("clockOut")} disabled={!todayStatus?.clockIn || !!todayStatus?.clockOut}>
              <Clock className="h-4 w-4 mr-2" /> Clock Out
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todayStatus ? (
            <div className="text-sm space-y-1">
              <p>Clock In: {todayStatus.clockIn ? new Date(todayStatus.clockIn).toLocaleTimeString("id-ID") : "-"}</p>
              <p>Clock Out: {todayStatus.clockOut ? new Date(todayStatus.clockOut).toLocaleTimeString("id-ID") : "-"}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum absen hari ini</p>
          )}
        </CardContent>
      </Card>

      {/* Pending Approval */}
      {pending.length > 0 && (
        <Card className="border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-amber-400 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Menunggu Persetujuan ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tanggal Daftar</TableHead>
                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((emp: any) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.name}</TableCell>
                      <TableCell className="text-xs">{emp.email}</TableCell>
                      <TableCell><Badge variant="outline">{emp.role}</Badge></TableCell>
                      <TableCell className="text-xs">{new Date(emp.createdAt).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="text-green-500 border-green-500/30"
                            onClick={() => handleApprove(emp)}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Setujui
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => openEdit(emp)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Employee List */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle>Daftar Karyawan</CardTitle>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Tambah Karyawan</Button>} />
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Karyawan" : "Tambah Karyawan Baru"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" required />
                </div>
                <div className="space-y-2">
                  <Label>Nama</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Password {editing && "(kosongkan jika tidak diubah)"}</Label>
                  <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select className="flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>No. HP</Label>
                  <Input value={form.noHp} onChange={(e) => setForm({ ...form, noHp: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Alamat</Label>
                  <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tanggal Masuk</Label>
                  <Input type="date" value={form.tanggalMasuk} onChange={(e) => setForm({ ...form, tanggalMasuk: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tipe Payroll</Label>
                  <select className="flex h-9 w-full rounded-md border px-3 py-1 text-sm" value={form.payrollType} onChange={(e) => setForm({ ...form, payrollType: e.target.value })}>
                    {PAYROLL_TYPES.map((t) => <option key={t} value={t}>{payrollLabels[t]}</option>)}
                  </select>
                </div>
                {form.payrollType === "HarianTetap" && (
                  <div className="space-y-2">
                    <Label>Rate Harian (Rp)</Label>
                    <Input type="number" value={form.dailyRate} onChange={(e) => setForm({ ...form, dailyRate: e.target.value })} />
                  </div>
                )}
                {form.payrollType === "BulananTetap" && (
                  <div className="space-y-2">
                    <Label>Gaji Bulanan (Rp)</Label>
                    <Input type="number" value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} />
                  </div>
                )}
                {form.payrollType === "HarianBorongan" && (
                  <div className="space-y-2">
                    <Label>Rate per Piece (Rp)</Label>
                    <Input type="number" value={form.pieceRate} onChange={(e) => setForm({ ...form, pieceRate: e.target.value })} />
                  </div>
                )}
                <Button type="submit" className="w-full">{editing ? "Simpan" : "Tambah Karyawan"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tipe Gaji</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approved.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Belum ada karyawan</TableCell></TableRow>
              )}
              {approved.map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell className="text-xs">{emp.email}</TableCell>
                  <TableCell><Badge variant="outline">{emp.role}</Badge></TableCell>
                  <TableCell className="text-xs">{payrollLabels[emp.payrollType]}</TableCell>
                  <TableCell className="text-xs">
                    {emp.payrollType === "HarianTetap" && `Rp ${emp.dailyRate.toLocaleString()}/hari`}
                    {emp.payrollType === "BulananTetap" && `Rp ${emp.monthlySalary.toLocaleString()}/bln`}
                    {emp.payrollType === "HarianBorongan" && `Rp ${emp.pieceRate.toLocaleString()}/pc`}
                  </TableCell>
                  <TableCell>
                    <Badge className={emp.isActive ? "bg-green-500" : "bg-red-500"}>{emp.isActive ? "Aktif" : "Nonaktif"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="icon" onClick={() => openEdit(emp)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
