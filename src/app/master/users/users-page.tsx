"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const ROLES = ["Karyawan", "AdminPenjualan", "AdminGudang", "AdminQC", "ManagerProduksi", "Owner"]

interface UserItem {
  id: string
  email: string
  name: string | null
  role: string
  isActive: boolean
}

export function UsersPage({ users: initial }: { users: UserItem[] }) {
  const router = useRouter()
  const [users, setUsers] = useState<UserItem[]>(initial)
  const [dirty, setDirty] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<Set<string>>(new Set())

  const updateUser = useCallback((id: string, field: "role" | "isActive", value: string | boolean | null) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value ?? "Karyawan" } : u)))
    setDirty((prev) => new Set(prev).add(id))
  }, [])

  async function handleSave(id: string) {
    const user = users.find((u) => u.id === id)
    if (!user) return

    setLoading((prev) => new Set(prev).add(id))

    const res = await fetch("/api/master/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: user.role, isActive: user.isActive }),
    })

    setLoading((prev) => { const next = new Set(prev); next.delete(id); return next })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error || "Gagal menyimpan")
      return
    }

    toast.success("User diperbarui")
    setDirty((prev) => { const next = new Set(prev); next.delete(id); return next })
    router.refresh()
  }

  const statusColor = (isActive: boolean) => (isActive ? "bg-green-500" : "bg-red-500")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Users</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada user</TableCell></TableRow>
              )}
              {users.map((user, i) => (
                <TableRow key={user.id}>
                  <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-xs">{user.email}</TableCell>
                  <TableCell>
                    <Select
                      value={user.role ?? "Karyawan"}
                      onValueChange={(v) => updateUser(user.id, "role", v ?? "Karyawan")}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={(v) => updateUser(user.id, "isActive", v)}
                      />
                      <Badge className={statusColor(user.isActive)}>
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!dirty.has(user.id) || loading.has(user.id)}
                      onClick={() => handleSave(user.id)}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      {loading.has(user.id) ? "..." : "Simpan"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
