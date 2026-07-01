"use client"

import { signIn } from "next-auth/react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Eye, EyeOff, Mail, Lock, ChevronRight } from "lucide-react"

export function LoginPageContent() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<"login" | "register">("login")
  const [showPassword, setShowPassword] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [reg, setReg] = useState({ name: "", password: "", confirm: "" })
  const [regLoading, setRegLoading] = useState(false)

  useEffect(() => {
    const error = searchParams.get("error")
    if (error === "CredentialsSignin") {
      toast.error("Email/password salah atau akun belum diaktifkan Owner")
    }
  }, [searchParams])

  async function handleLogin() {
    setLoginLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.ok) {
        window.location.href = "/"
      } else {
        toast.error("Email/password salah atau akun belum diaktifkan Owner")
      }
    } catch (err) {
      toast.error("Terjadi kesalahan: " + (err instanceof Error ? err.message : "unknown"))
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!reg.name || !reg.password) {
      toast.error("Nama dan password wajib diisi")
      return
    }
    if (reg.password.length < 4) {
      toast.error("Password minimal 4 karakter")
      return
    }
    if (reg.password !== reg.confirm) {
      toast.error("Password tidak cocok")
      return
    }

    setRegLoading(true)
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: reg.name, password: reg.password }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal mendaftar")
      }
      const data = await res.json()
      toast.success(data.message || "Pendaftaran berhasil! Menunggu persetujuan Owner.")
      setTab("login")
      setReg({ name: "", password: "", confirm: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendaftar")
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-y-auto bg-black selection:bg-amber-500/30">
      <img src="/poto background.png" alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-40" />

      <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/20 via-transparent to-amber-950/10 animate-pulse" />

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[420px]">
          <div className="flex mb-6 bg-zinc-900/80 backdrop-blur-2xl rounded-2xl p-1.5 border border-zinc-800/60 shadow-xl">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                tab === "login"
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/25"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-300 ${
                tab === "register"
                  ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-lg shadow-amber-500/25"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Daftar
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/60 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

                    <div className="p-6 sm:p-8 lg:p-10 text-center">
                      <div className="relative inline-flex mb-5">
                        <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full" />
                        <img
                          src="/logo-cvrl.png"
                          alt="R&amp;L"
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-2xl shadow-amber-500/20 ring-1 ring-amber-500/20"
                        />
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                        R&amp;L
                      </h1>
                      <p className="text-zinc-500 text-sm mb-7 tracking-wide">
                        Premium Fashion Manufacturer
                      </p>

                      <div className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              type="email"
                              required
                              placeholder="email@example.com"
                              className="h-11 pl-10 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 rounded-xl focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              type={showPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              className="h-11 pl-10 pr-10 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 rounded-xl focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          onClick={handleLogin}
                          disabled={loginLoading}
                          className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-semibold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 transition-all duration-300 disabled:opacity-50"
                        >
                          {loginLoading ? "Memproses..." : "Masuk"}
                          <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-zinc-600 mt-6">
                        Belum punya akun?{" "}
                        <button
                          onClick={() => setTab("register")}
                          className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                        >
                          Daftar
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 rounded-3xl blur-xl" />
                  <div className="relative bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800/60 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

                    <div className="p-6 sm:p-8 lg:p-10 text-center">
                      <div className="relative inline-flex mb-5">
                        <div className="absolute inset-0 bg-amber-400/20 blur-2xl rounded-full" />
                        <img
                          src="/logo-cvrl.png"
                          alt="R&amp;L"
                          className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover shadow-2xl shadow-amber-500/20 ring-1 ring-amber-500/20"
                        />
                      </div>

                      <h1 className="text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
                        Daftar Akun
                      </h1>
                      <p className="text-zinc-500 text-sm mb-7 tracking-wide">
                        Bergabung dengan R&amp;L
                      </p>

                      <form onSubmit={handleRegister} className="space-y-4 text-left">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Nama Lengkap</Label>
                          <Input
                            value={reg.name}
                            onChange={(e) => setReg({ ...reg, name: e.target.value })}
                            placeholder="Nama anda"
                            required
                            className="h-11 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 rounded-xl focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                              value={reg.password}
                              onChange={(e) => setReg({ ...reg, password: e.target.value })}
                              type="password"
                              placeholder="Minimal 4 karakter"
                              required
                              className="h-11 pl-10 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 rounded-xl focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Konfirmasi Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                              value={reg.confirm}
                              onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
                              type="password"
                              placeholder="Ulangi password"
                              required
                              className="h-11 pl-10 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-600 rounded-xl focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-11 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-semibold rounded-xl shadow-lg shadow-amber-500/20 hover:shadow-amber-400/30 transition-all duration-300"
                          disabled={regLoading}
                        >
                          {regLoading ? "Mendaftar..." : "Daftar"}
                          <ChevronRight className="ml-1.5 h-4 w-4" />
                        </Button>
                      </form>

                      <p className="text-sm text-zinc-600 mt-6">
                        Sudah punya akun?{" "}
                        <button
                          onClick={() => setTab("login")}
                          className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                        >
                          Masuk
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
