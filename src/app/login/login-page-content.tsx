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
import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

export function LoginPageContent() {
  const { locale } = useLanguage()
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
      toast.error(t(locale, "login.error.credentials"))
    }
  }, [searchParams, locale])

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
        toast.error(t(locale, "login.error.credentials"))
      }
    } catch (err) {
      toast.error(t(locale, "login.error.generic") + ": " + (err instanceof Error ? err.message : "unknown"))
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!reg.name || !reg.password) {
      toast.error(t(locale, "register.error.required"))
      return
    }
    if (reg.password.length < 4) {
      toast.error(t(locale, "register.error.password.length"))
      return
    }
    if (reg.password !== reg.confirm) {
      toast.error(t(locale, "register.error.password.match"))
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
        throw new Error(err.error || t(locale, "register.error.generic"))
      }
      const data = await res.json()
      toast.success(t(locale, "register.success"))
      setTab("login")
      setReg({ name: "", password: "", confirm: "" })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t(locale, "register.error.generic"))
    } finally {
      setRegLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0806] selection:bg-amber-500/30">
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/poto background.png"
      >
        <source src="/splash.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1410]/90 via-[#0d0a08]/80 to-black/90" />
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/30 via-transparent to-amber-950/20" />

      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="luxury-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 60" stroke="currentColor" className="text-amber-400" strokeWidth="0.5" />
            <path d="M 0 0 L 60 60" stroke="currentColor" className="text-amber-400" strokeWidth="0.5" />
          </pattern>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.8" fill="currentColor" className="text-amber-400" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#luxury-grid)" />
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-amber-500/8 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/30 to-transparent" />

      <div className="absolute top-8 left-8 w-16 h-px bg-gradient-to-r from-amber-500/40 to-transparent" />
      <div className="absolute top-8 left-8 w-px h-16 bg-gradient-to-b from-amber-500/40 to-transparent" />
      <div className="absolute top-8 right-8 w-16 h-px bg-gradient-to-l from-amber-500/40 to-transparent" />
      <div className="absolute top-8 right-8 w-px h-16 bg-gradient-to-b from-amber-500/40 to-transparent" />
      <div className="absolute bottom-8 left-8 w-16 h-px bg-gradient-to-r from-amber-500/40 to-transparent" />
      <div className="absolute bottom-8 left-8 w-px h-16 bg-gradient-to-t from-amber-500/40 to-transparent" />
      <div className="absolute bottom-8 right-8 w-16 h-px bg-gradient-to-l from-amber-500/40 to-transparent" />
      <div className="absolute bottom-8 right-8 w-px h-16 bg-gradient-to-t from-amber-500/40 to-transparent" />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[420px]">
          {/* Language selector */}
          <div className="flex justify-end mb-3">
            <LanguageSwitcher />
          </div>

          <div className="flex mb-8 bg-black/40 backdrop-blur-2xl rounded-full p-1 border border-amber-900/30 shadow-xl">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-500 ${
                tab === "login"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20 tracking-wider"
                  : "text-zinc-600 hover:text-zinc-400 tracking-wider"
              }`}
            >
              {t(locale, "login.tab")}
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-full transition-all duration-500 ${
                tab === "register"
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/20 tracking-wider"
                  : "text-zinc-600 hover:text-zinc-400 tracking-wider"
              }`}
            >
              {t(locale, "register.tab")}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative">
                  <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-600/30 via-amber-500/10 to-amber-600/30 rounded-3xl" />
                  <div className="relative bg-[#0d0a08]/95 backdrop-blur-2xl border border-amber-900/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    <div className="p-8 sm:p-10 lg:p-12 text-center">
                      <div className="mb-6">
                        <div className="relative inline-flex mb-4">
                          <motion.div
                            className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <img
                            src="/logo-cvrl.png"
                            alt="R&L"
                            className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-amber-500/10 ring-1 ring-amber-600/20"
                          />
                        </div>

                        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide">
                          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                            {t(locale, "app.name")}
                          </span>
                        </h1>
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto my-3" />
                        <p className="text-zinc-500 text-sm font-light tracking-[0.15em] uppercase">
                          {t(locale, "app.tagline.short")}
                        </p>
                      </div>

                      <div className="space-y-5 text-left">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">{t(locale, "login.email")}</Label>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                            <Input
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              type="email"
                              required
                              placeholder="email@example.com"
                              className="h-11 pl-10 bg-zinc-900/60 border-zinc-800/60 text-zinc-200 placeholder:text-zinc-700 rounded-xl focus:border-amber-600/50 focus:ring-1 focus:ring-amber-500/10 transition-all text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">{t(locale, "login.password")}</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                            <Input
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              type={showPassword ? "text" : "password"}
                              required
                              placeholder="••••••••"
                              className="h-11 pl-10 pr-10 bg-zinc-900/60 border-zinc-800/60 text-zinc-200 placeholder:text-zinc-700 rounded-xl focus:border-amber-600/50 focus:ring-1 focus:ring-amber-500/10 transition-all text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>

                        <Button
                          onClick={handleLogin}
                          disabled={loginLoading}
                          className="w-full h-11 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-400/25 transition-all duration-300 disabled:opacity-50 tracking-wider text-sm"
                        >
                          {loginLoading ? t(locale, "login.loading") : t(locale, "login.submit")}
                        </Button>
                      </div>

                      <p className="text-xs text-zinc-700 mt-6 tracking-wide">
                        {t(locale, "login.no.account")}{" "}
                        <button
                          onClick={() => setTab("register")}
                          className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                        >
                          {t(locale, "login.link.register")}
                        </button>
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative">
                  <div className="absolute -inset-[1px] bg-gradient-to-b from-amber-600/30 via-amber-500/10 to-amber-600/30 rounded-3xl" />
                  <div className="relative bg-[#0d0a08]/95 backdrop-blur-2xl border border-amber-900/20 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

                    <div className="p-8 sm:p-10 lg:p-12 text-center">
                      <div className="mb-6">
                        <div className="relative inline-flex mb-4">
                          <motion.div
                            className="absolute inset-0 bg-amber-500/10 blur-3xl rounded-full"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          />
                          <img
                            src="/logo-cvrl.png"
                            alt="R&L"
                            className="w-20 h-20 rounded-2xl object-cover shadow-2xl shadow-amber-500/10 ring-1 ring-amber-600/20"
                          />
                        </div>

                        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-wide">
                          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                            {t(locale, "register.title")}
                          </span>
                        </h1>
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto my-3" />
                        <p className="text-zinc-500 text-sm font-light tracking-[0.15em] uppercase">
                          {t(locale, "login.have.account")}
                        </p>
                      </div>

                      <form onSubmit={handleRegister} className="space-y-5 text-left">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">{t(locale, "register.name")}</Label>
                          <div className="relative">
                            <Input
                              value={reg.name}
                              onChange={(e) => setReg({ ...reg, name: e.target.value })}
                              placeholder={t(locale, "register.placeholder.name")}
                              required
                              className="h-11 bg-zinc-900/60 border-zinc-800/60 text-zinc-200 placeholder:text-zinc-700 rounded-xl focus:border-amber-600/50 focus:ring-1 focus:ring-amber-500/10 transition-all text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">{t(locale, "register.password")}</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                            <Input
                              value={reg.password}
                              onChange={(e) => setReg({ ...reg, password: e.target.value })}
                              type="password"
                              placeholder={t(locale, "register.placeholder.password")}
                              required
                              className="h-11 pl-10 bg-zinc-900/60 border-zinc-800/60 text-zinc-200 placeholder:text-zinc-700 rounded-xl focus:border-amber-600/50 focus:ring-1 focus:ring-amber-500/10 transition-all text-sm"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em]">{t(locale, "register.confirm")}</Label>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
                            <Input
                              value={reg.confirm}
                              onChange={(e) => setReg({ ...reg, confirm: e.target.value })}
                              type="password"
                              placeholder={t(locale, "register.placeholder.confirm")}
                              required
                              className="h-11 pl-10 bg-zinc-900/60 border-zinc-800/60 text-zinc-200 placeholder:text-zinc-700 rounded-xl focus:border-amber-600/50 focus:ring-1 focus:ring-amber-500/10 transition-all text-sm"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-11 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-medium rounded-xl shadow-lg shadow-amber-500/15 hover:shadow-amber-400/25 transition-all duration-300 tracking-wider text-sm"
                          disabled={regLoading}
                        >
                          {regLoading ? t(locale, "register.loading") : t(locale, "register.submit")}
                        </Button>
                      </form>

                      <p className="text-xs text-zinc-700 mt-6 tracking-wide">
                        {t(locale, "login.have.account")}{" "}
                        <button
                          onClick={() => setTab("login")}
                          className="text-amber-500 hover:text-amber-400 font-medium transition-colors"
                        >
                          {t(locale, "login.link.login")}
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
