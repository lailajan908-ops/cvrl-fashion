"use client"

import { signIn, getCsrfToken } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<"login" | "register">("login")
  const videoRef = useRef<HTMLVideoElement>(null)

  const [reg, setReg] = useState({ email: "", name: "", password: "", confirm: "" })
  const [regLoading, setRegLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const form = new FormData(e.currentTarget)
    const res = await fetch("/api/auth/callback/credentials", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        csrfToken: await getCsrfToken(),
        email: form.get("email") as string,
        password: form.get("password") as string,
        callbackUrl: "/",
        json: "true",
      }),
    })

    if (res.ok) {
      window.location.href = "/"
    } else {
      setError("Email atau password salah")
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!reg.email || !reg.name || !reg.password) {
      toast.error("Semua field wajib diisi")
      return
    }
    if (reg.password.length < 6) {
      toast.error("Password minimal 6 karakter")
      return
    }
    if (reg.password !== reg.confirm) {
      toast.error("Password tidak cocok")
      return
    }

    setRegLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: reg.email, name: reg.name, password: reg.password }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal mendaftar")
      }
      toast.success("Pendaftaran berhasil! Silakan masuk.")
      setTab("login")
      setReg({ email: "", name: "", password: "", confirm: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar")
    } finally {
      setRegLoading(false)
    }
  }

  function handleVideoEnd() {
    setShowForm(true)
  }

  function skipVideo() {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = videoRef.current.duration
    }
    setShowForm(true)
  }

  return (
    <div className="relative min-h-screen overflow-y-auto bg-black">
      <AnimatePresence>
        {!showForm && (
          <motion.div
            key="video"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          >
            <video
              ref={videoRef}
              src="/welcome.mp4"
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            <div className="relative z-10 text-center px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
              >
                <img src="/cvrl-logo.svg" alt="CVRL Fashion" className="h-16 mx-auto mb-6" />
                <p className="text-zinc-400 text-sm tracking-widest uppercase">Welcome to</p>
                <h1 className="text-white text-5xl sm:text-7xl font-bold mt-2 tracking-tight">CVRL FASHION</h1>
                <p className="text-zinc-500 text-sm mt-4 max-w-md mx-auto">
                  Sistem Manajemen Produksi & Penjualan Terintegrasi
                </p>
              </motion.div>
            </div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              onClick={skipVideo}
              className="absolute bottom-8 right-8 z-20 px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
            >
              Skip &rarr;
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`min-h-screen flex items-center justify-center p-4 transition-opacity duration-500 ${showForm ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <div className="w-full max-w-sm">
          <div className="flex mb-4 bg-zinc-900/60 backdrop-blur-xl rounded-xl p-1 border border-zinc-800">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === "login" ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-white"}`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === "register" ? "bg-amber-500 text-black" : "text-zinc-400 hover:text-white"}`}
            >
              Daftar
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <Card className="bg-zinc-900/90 backdrop-blur-xl border-zinc-800 shadow-2xl">
                  <CardHeader className="text-center">
                    <img src="/cvrl-icon.svg" alt="CVRL" className="w-12 h-12 mx-auto mb-3" />
                    <CardTitle className="text-2xl text-white">CVRL Fashion</CardTitle>
                    <p className="text-sm text-zinc-400">Silakan masuk</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email</Label>
                        <Input id="email" name="email" type="email" required className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                        <Input id="password" name="password" type="password" required className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
                      </div>
                      {error && <p className="text-sm text-red-400">{error}</p>}
                      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold" disabled={loading}>
                        {loading ? "Memuat..." : "Masuk"}
                      </Button>
                    </form>
                    <form method="post" action="/api/auth/signout" className="hidden" />
                    <p className="text-xs text-zinc-600 text-center mt-4">
                      Belum punya akun?{" "}
                      <button onClick={() => setTab("register")} className="text-amber-500 hover:underline">Daftar</button>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                <Card className="bg-zinc-900/90 backdrop-blur-xl border-zinc-800 shadow-2xl">
                  <CardHeader className="text-center">
                    <img src="/cvrl-icon.svg" alt="CVRL" className="w-12 h-12 mx-auto mb-3" />
                    <CardTitle className="text-2xl text-white">Daftar Akun Baru</CardTitle>
                    <p className="text-sm text-zinc-400">Karyawan baru, daftar di sini</p>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Nama Lengkap</Label>
                        <Input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="Nama anda" required className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Email</Label>
                        <Input value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} type="email" placeholder="email@example.com" required className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Password</Label>
                        <Input value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} type="password" placeholder="Minimal 6 karakter" required className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-zinc-300">Konfirmasi Password</Label>
                        <Input value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} type="password" placeholder="Ulangi password" required className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500" />
                      </div>
                      <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-black font-semibold" disabled={regLoading}>
                        {regLoading ? "Mendaftar..." : "Daftar"}
                      </Button>
                    </form>
                    <p className="text-xs text-zinc-600 text-center mt-4">
                      Sudah punya akun?{" "}
                      <button onClick={() => setTab("login")} className="text-amber-500 hover:underline">Masuk</button>
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
