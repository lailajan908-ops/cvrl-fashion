"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Locale } from "./i18n"

const STORAGE_KEY = "cvrl-locale"

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "id",
  setLocale: () => {},
  dir: "ltr",
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id")

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && ["id", "en", "fa"].includes(stored)) {
      setLocaleState(stored)
    }
  }, [])

  function setLocale(locale: Locale) {
    setLocaleState(locale)
    localStorage.setItem(STORAGE_KEY, locale)
  }

  const dir = locale === "fa" ? "rtl" : "ltr"

  return (
    <LanguageContext.Provider value={{ locale, setLocale, dir }}>
      <div dir={dir}>{children}</div>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
