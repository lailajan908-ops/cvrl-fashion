"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, UserPlus, Shield } from "lucide-react"
import { toast } from "sonner"

const AVAILABLE_ROLES = [
  { id: "QC", label: "QC", desc: "Quality Control" },
  { id: "Packing", label: "Packing", desc: "Packing Barang" },
  { id: "PotongBahan", label: "Potong Bahan", desc: "Potong Kain" },
  { id: "Sewing", label: "Sewing", desc: "Jahit" },
]

export default function ApprovalPage() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string[]>>({})
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    fetchPending()
  }, [])

  async function fetchPending() {
    setLoading(true)
    const res = await fetch("/api/karyawan?status=PENDING")
    if (res.ok) {
      const data = await res.json()
      setPending(data)
      // Initialize selected roles
      const init: Record<string, string[]> = {}
      data.forEach((u: any) => { init[u.id] = u.roles || [] })
      setSelectedRoles(init)
    }
    setLoading(false)
  }

  function toggleRole(userId: string, roleId: string) {
    setSelectedRoles(prev => {
      const current = prev[userId] || []
      const updated = current.includes(roleId)
        ? current.filter(r => r !== roleId)
        : [...current, roleId]
      return { ...prev, [userId]: updated }
    })
  }

  async function handleApprove(userId: string) {
    const roles = selectedRoles[userId] || []
    if (roles.length === 0) {
      toast.error("Pilih minimal 1 role untuk karyawan")
      return
    }

    setApproving(userId)
    const res = await fetch(`/api/karyawan/${userId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles }),
    })

    if (res.ok) {
      toast.success("Karyawan berhasil diaktifkan!")
      fetchPending()
    } else {
      const err = await res.json()
      toast.error(err.error || "Gagal mengaktifkan")
    }
    setApproving(null)
  }

  async function handleReject(userId: string) {
    if (!confirm("Yakin tolak karyawan ini?")) return

    const res = await fetch(`/api/karyawan/${userId}`, {
      method: "DELETE",
    })

    if (res.ok) {
      toast.success("Karyawan ditolak dan dihapus")
      fetchPending()
    } else {
      toast.error("Gagal menolak")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            Persetujuan Karyawan
          </h1>
          <p className="text-zinc-500 mt-1">
            Aktifkan akun karyawan dan pilih role yang boleh diakses
          </p>
        </div>

        {/* Pending List */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Memuat...</div>
        ) : pending.length === 0 ? (
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="py-12 text-center">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <p className="text-zinc-400">Tidak ada karyawan yang menunggu persetujuan</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pending.map((user) => (
              <Card key={user.id} className="bg-zinc-900/80 border-zinc-800 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{user.name}</CardTitle>
                        <p className="text-sm text-zinc-500">
                          Daftar: {new Date(user.createdAt).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                      MENUNGGU
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Role Selection */}
                  <div>
                    <p className="text-sm text-zinc-400 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Pilih Role (maksimal 4):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {AVAILABLE_ROLES.map((role) => {
                        const isSelected = (selectedRoles[user.id] || []).includes(role.id)
                        const isMax = (selectedRoles[user.id] || []).length >= 4 && !isSelected
                        return (
                          <button
                            key={role.id}
                            onClick={() => !isMax && toggleRole(user.id, role.id)}
                            disabled={isMax}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              isSelected
                                ? "border-amber-500 bg-amber-500/20"
                                : isMax
                                ? "border-zinc-800 bg-zinc-800/30 opacity-50"
                                : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                            }`}
                          >
                            <div className="font-medium text-sm">{role.label}</div>
                            <div className="text-xs text-zinc-500">{role.desc}</div>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {(selectedRoles[user.id] || []).length}/4 role dipilih
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => handleApprove(user.id)}
                      disabled={approving === user.id || (selectedRoles[user.id] || []).length === 0}
                      className="flex-1 bg-green-600 hover:bg-green-500"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {approving === user.id ? "Mengaktifkan..." : "Aktifkan"}
                    </Button>
                    <Button
                      onClick={() => handleReject(user.id)}
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-500"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}