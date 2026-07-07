"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/lib/language-context"
import { locales } from "@/lib/i18n"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const current = locales.find((l) => l.value === locale)!

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800/40 hover:border-amber-800/30 hover:bg-amber-950/10 transition-all text-xs text-zinc-500 hover:text-amber-500 tracking-wider uppercase"
      >
        <Globe className="h-3 w-3" />
        <span>{current.label}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-36 bg-[#0d0a08] border border-zinc-800/40 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {locales.map((l) => {
            const active = l.value === locale
            return (
              <button
                key={l.value}
                onClick={() => { setLocale(l.value); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs transition-colors ${
                  active
                    ? "text-amber-400 bg-amber-500/5"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
                }`}
                style={l.dir === "rtl" ? { fontFamily: "system-ui, sans-serif" } : undefined}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-amber-500" : "bg-zinc-800"}`} />
                {l.label} {active && "✓"}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
