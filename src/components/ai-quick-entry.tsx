"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAIImageProcessor } from "@/lib/ai-image-processor"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Search, Globe, ShoppingBag, Camera, Check, RotateCcw, X, Sparkles } from "lucide-react"

const ALL_COLORS = ["HITAM", "PUTIH", "NAVY", "ARMY", "MAROON", "COKSU", "TOSKA", "MINT", "SAGE", "ABU", "KUNIT", "PINK", "UNGU", "MERAH", "HIJAU", "BIRU", "COKLAT", "KREM", "CORAL", "SALEM", "BROKEN WHITE", "CHARCOAL", "IVORY", "BEIGE", "BURGUNDY", "OLIVE", "TEAL", "ROSE", "LAVENDER", "PEACH", "DARK GREEN", "LIME", "PLUM", "GOLD", "SILVER", "BRONZE", "COPPER", "RUST", "TERRA", "MAUVE", "BLUSH", "CHAMPAGNE"]

const COLOR_HEX: Record<string, string> = {
  HITAM: "#1a1a1a", PUTIH: "#f5f5f0", NAVY: "#1b2a4a", ARMY: "#4b5e3a",
  MAROON: "#5e2e3a", COKSU: "#a08060", TOSKA: "#2e8b7a", MINT: "#98d8c8",
  SAGE: "#8a9a7a", ABU: "#8a8a8a", KUNIT: "#e8c84a", PINK: "#e8a0b0",
  UNGU: "#6a3a6a", MERAH: "#c03030", HIJAU: "#2a7a3a", BIRU: "#2a5a8a",
  COKLAT: "#8a5a2a", KREM: "#f5e8d0", CORAL: "#e87860", SALEM: "#d89080",
  "BROKEN WHITE": "#f0ece0", CHARCOAL: "#3a3a3a", IVORY: "#f8f0e0",
  BEIGE: "#d8c8a8", BURGUNDY: "#6a2030", OLIVE: "#6a7a3a", TEAL: "#1a7a6a",
  ROSE: "#e8b0b8", LAVENDER: "#c0a0d0", PEACH: "#f0c8a0",
  "DARK GREEN": "#1a4a2a", LIME: "#8ae84a", PLUM: "#5a2a5a",
  GOLD: "#d4a030", SILVER: "#c0c0c0", BRONZE: "#b08040",
  COPPER: "#c07040", RUST: "#8a4020", TERRA: "#a06040",
  MAUVE: "#a0809a", BLUSH: "#e8b0a0", CHAMPAGNE: "#e8d8b0",
}

const ALL_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"]

const MARKETPLACE_COLORS: Record<string, string> = {
  Shopee: "#EE4D2D",
  Lazada: "#0F146D",
  Google: "#4285F4",
}

const PLATFORMS = [
  { id: "Shopee", icon: "🛒" },
  { id: "Lazada", icon: "📦" },
  { id: "Google", icon: "🔍" },
]

function generateKode(): string {
  return `AI${Date.now().toString(36).slice(-4).toUpperCase()}`
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function generateColorImage(imgSrc: string, targetHex: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Canvas failed")); return }

      // Draw original
      ctx.drawImage(img, 0, 0)

      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      const { r: tr, g: tg, b: tb } = hexToRgb(targetHex)

      // Recolor: blend each pixel toward target color while preserving luminance
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255
        const blend = 0.6 + lum * 0.3
        data[i] = Math.min(255, Math.round(r + (tr - r) * blend * 0.5))
        data[i + 1] = Math.min(255, Math.round(g + (tg - g) * blend * 0.5))
        data[i + 2] = Math.min(255, Math.round(b + (tb - b) * blend * 0.5))
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(canvas.toDataURL("image/jpeg", 0.92))
    }
    img.onerror = () => reject(new Error("Image load failed"))
    img.src = imgSrc
  })
}

function normalizeColor(name: string): string {
  const map: Record<string, string> = {
    merah: "MERAH", "merah hati": "MAROON", "merah marun": "MAROON", burgundy: "BURGUNDY",
    hitam: "HITAM", black: "HITAM",
    putih: "PUTIH", white: "PUTIH",
    navy: "NAVY", "biru tua": "NAVY", "biru navy": "NAVY",
    army: "ARMY", "hijau army": "ARMY", olive: "OLIVE",
    coksu: "COKSU", "coklat susu": "COKSU",
    coklat: "COKLAT", cokelat: "COKLAT", brown: "COKLAT", chocolate: "COKLAT",
    toska: "TOSKA", teal: "TEAL", turquoise: "TOSKA", "hijau toska": "TOSKA",
    mint: "MINT", "hijau mint": "MINT",
    sage: "SAGE", "hijau sage": "SAGE",
    abu: "ABU", "abu abu": "ABU", grey: "ABU", gray: "ABU",
    kuning: "KUNIT", yellow: "KUNIT", kunir: "KUNIT",
    pink: "PINK", "merah muda": "PINK", rose: "ROSE", blush: "BLUSH",
    ungu: "UNGU", purple: "UNGU", violet: "UNGU", mauve: "MAUVE", plum: "PLUM", lavender: "LAVENDER",
    biru: "BIRU", blue: "BIRU", "light blue": "BIRU", "sky blue": "BIRU",
    hijau: "HIJAU", green: "HIJAU", "dark green": "DARK GREEN",
    krem: "KREM", cream: "KREM", ivory: "IVORY",
    coral: "CORAL",
    salem: "SALEM", salmon: "SALEM",
    "broken white": "BROKEN WHITE", "off white": "BROKEN WHITE",
    charcoal: "CHARCOAL",
    beige: "BEIGE",
    peach: "PEACH",
    lime: "LIME",
    gold: "GOLD", emas: "GOLD",
    silver: "SILVER", perak: "SILVER",
    bronze: "BRONZE",
    copper: "COPPER", tembaga: "COPPER",
    rust: "RUST", karat: "RUST",
    terra: "TERRA",
    champagne: "CHAMPAGNE",
  }
  return map[name.toLowerCase().trim()] || name.toUpperCase()
}

interface AIQuickEntryProps {
  onClose: () => void
}

export function AIQuickEntry({ onClose }: AIQuickEntryProps) {
  const router = useRouter()
  const [productName, setProductName] = useState("")
  const [step, setStep] = useState<"upload" | "review" | "saving">("upload")
  const [tab, setTab] = useState<"photo" | "marketplace">("photo")

  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["M", "L", "XL"])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [mpQuery, setMpQuery] = useState("")
  const [mpPlatform, setMpPlatform] = useState("Shopee")
  const [mpSearching, setMpSearching] = useState(false)
  const [mpResult, setMpResult] = useState<{ name: string; description: string; category: string; price: number; colors: string[]; sizes: string[] } | null>(null)

  const {
    isProcessing,
    detectedAttributes,
    error,
    progress,
    handleFileSelect,
    triggerFileUpload,
    fileInputRef,
  } = useAIImageProcessor({ autoGenerateSKU: false, onProgress: () => {} })

  const detectedColorName = detectedAttributes?.color || ""
  const kode = generateKode()

  function toggleColor(c: string) {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function toggleSize(s: string) {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    handleFileSelect(e)
    setTab("photo")
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      handleFileSelect({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>)
    }
  }

  // Auto-select detected color
  const prevDetected = useRef("")
  if (detectedAttributes && detectedColorName !== prevDetected.current) {
    prevDetected.current = detectedColorName
    const normalized = normalizeColor(detectedColorName)
    if (ALL_COLORS.includes(normalized) && !selectedColors.includes(normalized)) {
      setSelectedColors(prev => [normalized, ...prev.filter(c => c !== normalized)])
    }
  }

  async function handleMarketplaceSearch() {
    if (!mpQuery.trim()) { toast.error("Masukkan nama produk"); return }
    setMpSearching(true)
    setMpResult(null)
    try {
      const res = await fetch("/api/marketplace/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: mpQuery, platform: mpPlatform }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMpResult(data)
      setProductName(data.name)
      setSelectedSizes(data.sizes.length ? data.sizes : ["M", "L", "XL"])
      setSelectedColors(data.colors.length ? data.colors : [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mencari")
    } finally {
      setMpSearching(false)
    }
  }

  const canSave = productName && selectedColors.length > 0 && selectedSizes.length > 0

  async function handleConfirm() {
    if (!canSave) { toast.error("Lengkapi nama, warna, dan ukuran"); return }
    setStep("saving")

    try {
      const previewUrl = selectedFile ? URL.createObjectURL(selectedFile) : ""
      const colorImages: Record<string, string> = {}

      // Generate recolored image for each selected color
      if (previewUrl) {
        const colorEntries = await Promise.all(
          selectedColors.map(async (warna) => {
            const hex = COLOR_HEX[warna] || "#888"
            try {
              const dataUrl = await generateColorImage(previewUrl, hex)
              // Upload the generated image
              const blob = await fetch(dataUrl).then(r => r.blob())
              const file = new File([blob], `${kode}-${warna.toLowerCase()}.jpg`, { type: "image/jpeg" })
              const formData = new FormData()
              formData.append("foto", file)
              formData.append("produkId", kode)
              formData.append("size", selectedSizes[0])
              formData.append("warna", warna)
              const res = await fetch("/api/upload-produk-foto", { method: "POST", body: formData })
              if (res.ok) {
                const data = await res.json()
                return [warna, data.fotoUrl] as const
              }
            } catch {}
            // Fallback: use same image
            return [warna, ""] as const
          })
        )
        for (const [w, url] of colorEntries) {
          if (url) colorImages[w] = url
        }
      }

      const fallbackUrl = colorImages[selectedColors[0]] || ""
      const images = selectedColors.map((w, i) => ({
        url: colorImages[w] || fallbackUrl, warna: w, isPrimary: i === 0, order: i,
      }))

      const variasi: any[] = []
      for (const warna of selectedColors) {
        const fotoUrl = colorImages[warna] || fallbackUrl
        for (const size of selectedSizes) {
          const sku = `${kode}${size === "S" ? "1" : size === "M" ? "2" : size === "L" ? "4" : size === "XL" ? "6" : size === "XXL" ? "8" : "10"}-${warna.toLowerCase()}-${size.toLowerCase()}`
          variasi.push({
            size, warna, sku: sku.toUpperCase(),
            hargaProduksi: 0, price: 0, stock: 0, isActive: true,
            fotoUrl: fotoUrl || undefined,
          })
        }
      }

      const payload: any = { kode, nama: productName, images, variasi }

      const res = await fetch("/api/master/produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Gagal menyimpan produk")
      }

      toast.success(`${kode} - ${productName} (${selectedColors.length} warna × ${selectedSizes.length} ukuran)`)
      router.refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
      setStep("review")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-[#FFD700]/20 bg-zinc-950 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 pb-4 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h2 className="text-xl font-semibold text-amber-400">Quick Entry AI</h2>
            <p className="text-sm text-zinc-400">Upload foto atau cari dari marketplace</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {step === "saving" ? (
          <div className="p-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mx-auto mb-3" />
            <p className="text-zinc-400">Menyimpan {selectedColors.length} warna × {selectedSizes.length} ukuran...</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Nama Produk */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-amber-400 uppercase tracking-wider">Nama Produk</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: Kemeja Premium Oxford"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg bg-zinc-800/50 p-1">
              <button
                onClick={() => setTab("photo")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-all ${
                  tab === "photo" ? "bg-amber-500/20 text-amber-400 font-medium" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Camera className="h-4 w-4" /> Upload Foto
              </button>
              <button
                onClick={() => setTab("marketplace")}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-all ${
                  tab === "marketplace" ? "bg-amber-500/20 text-amber-400 font-medium" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Search className="h-4 w-4" /> Cari Marketplace
              </button>
            </div>

            {/* Photo Upload Tab */}
            {tab === "photo" && (
              <div className="space-y-4">
                {!previewUrl ? (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={triggerFileUpload}
                    className="border-2 border-dashed border-zinc-700 rounded-xl p-10 text-center cursor-pointer hover:border-amber-500/50 transition-all bg-zinc-800/30"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Camera className="h-6 w-6 text-zinc-500 group-hover:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-zinc-300 text-sm font-medium">Drop photo here or click to browse</p>
                        <p className="text-zinc-600 text-xs mt-1">AI akan mendeteksi warna otomatis</p>
                      </div>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFilePick} className="hidden" />
                  </div>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => { setPreviewUrl(null); setSelectedFile(null); prevDetected.current = "" }}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-amber-400">AI Menganalisis...</span>
                      <span className="text-amber-400 font-mono">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    {detectedAttributes && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm">
                        <span className="text-zinc-400">Warna terdeteksi: </span>
                        <span className="text-amber-400 font-semibold">{detectedColorName}</span>
                        <span className="text-zinc-500 ml-2">→ {normalizeColor(detectedColorName)}</span>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">{error}</div>
                )}
              </div>
            )}

            {/* Marketplace Search Tab */}
            {tab === "marketplace" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setMpPlatform(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        mpPlatform === p.id
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                      }`}
                    >
                      <span>{p.icon}</span> {p.id}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      value={mpQuery}
                      onChange={(e) => setMpQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleMarketplaceSearch()}
                      placeholder={`Cari produk di ${mpPlatform}...`}
                      className="w-full pl-9 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    onClick={handleMarketplaceSearch}
                    disabled={mpSearching || !mpQuery.trim()}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black disabled:text-zinc-500 font-semibold text-sm rounded-lg transition-all"
                  >
                    {mpSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                </div>

                {mpResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{mpResult.name}</p>
                        <p className="text-xs text-zinc-400 mt-0.5">{mpResult.category}</p>
                      </div>
                      <Check className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-xs text-zinc-500">{mpResult.description}</p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-amber-400 font-semibold">Rp{mpResult.price.toLocaleString("id-ID")}</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-400">{mpResult.colors.length} warna</span>
                      <span className="text-zinc-600">|</span>
                      <span className="text-zinc-400">{mpResult.sizes.length} ukuran</span>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

                {/* Color Selection & Preview */}
            {tab === "photo" && previewUrl ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    Warna Tersedia <span className="text-zinc-500 font-normal normal-case">({selectedColors.length} dipilih)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_COLORS.map(c => {
                      const active = selectedColors.includes(c)
                      const isDetected = normalizeColor(detectedColorName) === c
                      return (
                        <button
                          key={c}
                          onClick={() => toggleColor(c)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                            active
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          } ${isDetected ? "ring-1 ring-amber-400/50" : ""}`}
                        >
                          <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ backgroundColor: COLOR_HEX[c] || "#888" }} />
                          {c}
                          {isDetected && <span className="ml-1 text-[9px] opacity-70">AI</span>}
                          {active && <span className="ml-1">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                  {detectedAttributes && (
                    <p className="text-[10px] text-zinc-500">
                      AI mendeteksi: <span className="text-amber-400">{detectedColorName}</span>
                    </p>
                  )}
                </div>

                {/* Color Preview Thumbnails */}
                {selectedColors.length > 0 && previewUrl && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-amber-400 uppercase tracking-wider">Preview Warna</label>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {selectedColors.map(c => (
                        <div key={c} className="flex-shrink-0 w-20 space-y-1">
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700">
                            <img src={previewUrl} alt={c} className="w-full h-full object-cover" />
                            <div className="absolute inset-0" style={{ backgroundColor: COLOR_HEX[c] || "#888", mixBlendMode: "multiply", opacity: 0.6 }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <span className="absolute bottom-1 left-1 text-[8px] text-white font-medium drop-shadow-md">{c}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    Ukuran <span className="text-zinc-500 font-normal normal-case">({selectedSizes.length} dipilih)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SIZES.map(s => {
                      const active = selectedSizes.includes(s)
                      return (
                        <button
                          key={s}
                          onClick={() => toggleSize(s)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                            active
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          }`}
                        >
                          {s} {active && "✓"}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            ) : tab === "marketplace" && mpResult ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    Warna ({selectedColors.length} dipilih)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_COLORS.map(c => {
                      const active = selectedColors.includes(c)
                      const suggested = mpResult.colors.includes(c)
                      return (
                        <button
                          key={c}
                          onClick={() => toggleColor(c)}
                          className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                            active
                              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                              : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                          } ${suggested && !active ? "ring-1 ring-zinc-500/30" : ""}`}
                        >
                          <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ backgroundColor: COLOR_HEX[c] || "#888" }} />
                          {c}
                          {active && " ✓"}
                          {suggested && !active && <span className="ml-1 text-[9px] text-zinc-600">saran</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-amber-400 uppercase tracking-wider">Ukuran ({selectedSizes.length} dipilih)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {ALL_SIZES.map(s => (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          selectedSizes.includes(s)
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                            : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                        }`}
                      >{s} {selectedSizes.includes(s) && "✓"}</button>
                    ))}
                  </div>
                </div>
              </>
            ) : null}

            {/* Summary */}
            {(selectedColors.length > 0 && selectedSizes.length > 0) && (
              <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Akan dibuat:</span>
                  <span className="text-amber-400 font-semibold">
                    {selectedColors.length} warna × {selectedSizes.length} ukuran = {selectedColors.length * selectedSizes.length} varian
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedColors.map(c => (
                    <span key={c} className="text-[10px] bg-zinc-700/50 text-zinc-300 px-1.5 py-0.5 rounded">{c}</span>
                  ))}
                  <span className="text-zinc-600 text-[10px]">×</span>
                  {selectedSizes.map(s => (
                    <span key={s} className="text-[10px] bg-zinc-700/50 text-zinc-300 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">Kode: {kode}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all">Batal</button>
              <button
                onClick={handleConfirm}
                disabled={!canSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black disabled:text-zinc-500 font-semibold text-sm transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Simpan {selectedColors.length * selectedSizes.length} Varian
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
