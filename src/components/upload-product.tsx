"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAIImageProcessor } from "@/lib/ai-image-processor"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Camera, Check, RotateCcw, X, Sparkles } from "lucide-react"

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

interface QuickProductUploadProps {
  onClose: () => void
}

export function QuickProductUpload({ onClose }: QuickProductUploadProps) {
  const router = useRouter()
  const [productCode, setProductCode] = useState("")
  const [productName, setProductName] = useState("")
  const [step, setStep] = useState<"form" | "upload" | "review">("form")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>(["M", "L", "XL"])

  const {
    isProcessing,
    detectedAttributes,
    error: aiError,
    progress,
    handleFileSelect,
    triggerFileUpload,
    fileInputRef,
  } = useAIImageProcessor({ onProgress: undefined })

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) { toast.error("File harus berupa gambar"); return }
    if (file.size > 5 * 1024 * 1024) { toast.error("File tidak boleh lebih dari 5MB"); return }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setStep("upload")
    handleFileSelect(e)
  }

  useEffect(() => {
    if (detectedAttributes && !isProcessing) {
      const normalized = normalizeColor(detectedAttributes.color)
      if (!selectedColors.includes(normalized)) {
        setSelectedColors(prev => [normalized, ...prev.filter(c => c !== normalized)])
      }
      queueMicrotask(() => {
        setStep("review")
      })
    }
  }, [detectedAttributes, isProcessing])

  function toggleColor(c: string) {
    setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function toggleSize(s: string) {
    setSelectedSizes(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function handleConfirm() {
    if (!productCode || !selectedFile || selectedColors.length === 0) {
      toast.error("Lengkapi data produk dan pilih minimal 1 warna")
      return
    }

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.append("foto", selectedFile)
      formData.append("produkId", productCode)
      formData.append("size", selectedSizes[0])
      formData.append("warna", selectedColors[0])

      const uploadRes = await fetch("/api/upload-produk-foto", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Gagal upload foto")
      const uploadData = await uploadRes.json()
      const fotoUrl = uploadData.fotoUrl

      const images = [{ url: fotoUrl, warna: selectedColors[0], isPrimary: true, order: 0 }]
      const variasi: any[] = []

      for (const warna of selectedColors) {
        for (const size of selectedSizes) {
          const sku = `${productCode}${size === "S" ? "1" : size === "M" ? "2" : size === "L" ? "4" : size === "XL" ? "6" : size === "XXL" ? "8" : "10"}-${warna.toLowerCase()}-${size.toLowerCase()}`
          variasi.push({
            size, warna, sku: sku.toUpperCase(),
            hargaProduksi: 0, price: 0, stock: 0, isActive: true,
            fotoUrl, namaFoto: selectedFile.name,
          })
        }
      }

      const res = await fetch("/api/master/produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: productCode,
          nama: productName || productCode,
          images,
          variasi,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Gagal menyimpan")
      }

      toast.success(`Produk ${productCode} (${selectedColors.length} warna × ${selectedSizes.length} ukuran)`)
      router.refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan produk")
    } finally {
      setIsSaving(false)
    }
  }

  function resetToUpload() {
    setSelectedFile(null)
    setPreviewUrl(null)
    setStep("form")
  }

  if (step === "review" && detectedAttributes) {
    const totalVariants = selectedColors.length * selectedSizes.length
    const detectedNormalized = normalizeColor(detectedAttributes.color)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl bg-zinc-900 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-amber-400">Konfirmasi Produk</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs text-zinc-400 font-mono">{productCode}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Nama Produk</label>
                <input
                  type="text" value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-400">Kode Produk</label>
                <div className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-amber-400 text-sm font-mono">{productCode}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                Warna ({selectedColors.length} dipilih)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_COLORS.map(c => {
                  const active = selectedColors.includes(c)
                  const isDetected = c === detectedNormalized
                  return (
                    <button key={c} onClick={() => toggleColor(c)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        active ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                      } ${isDetected ? "ring-1 ring-amber-400/50" : ""}`}
                    >
                      <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{backgroundColor: COLOR_HEX[c] || "#888"}} />
                      {c}{isDetected && <span className="ml-1 text-[9px] opacity-70">AI</span>}{active && " ✓"}
                    </button>
                  )
                })}
              </div>
            </div>

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

            <div className="space-y-2">
              <label className="text-xs font-medium text-amber-400 uppercase tracking-wider">Ukuran ({selectedSizes.length} dipilih)</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_SIZES.map(s => (
                  <button key={s} onClick={() => toggleSize(s)}
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                      selectedSizes.includes(s) ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-600"
                    }`}
                  >{s} {selectedSizes.includes(s) && "✓"}</button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl p-4 text-center">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Total Varian</span>
              <p className="text-amber-400 font-semibold text-lg mt-1">{totalVariants} varian</p>
              <p className="text-[10px] text-zinc-600">{selectedColors.length} warna × {selectedSizes.length} ukuran</p>
            </div>

            <div className="flex gap-3">
              <button onClick={resetToUpload} disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all disabled:opacity-50">
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <button onClick={handleConfirm} disabled={isSaving || selectedColors.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold text-sm transition-all disabled:opacity-50">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isSaving ? "Menyimpan..." : `Simpan ${totalVariants} Varian`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  if (step === "upload") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-amber-400">AI Processing</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Menganalisis gambar...</span>
                <span className="text-amber-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <p className="text-xs text-zinc-500 text-center">
                {progress < 30 ? "Loading image..." :
                 progress < 60 ? "Analyzing colors & dimensions..." :
                 progress < 90 ? "Detecting attributes..." :
                 "Finalizing..."}
              </p>
            </div>

            {aiError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
                <p className="text-red-400 text-sm">{aiError}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-xl font-heading font-semibold text-amber-400">Quick Product Entry</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Kode Produk</label>
            <input type="text" value={productCode} onChange={(e) => setProductCode(e.target.value.toUpperCase())}
              placeholder="Contoh: A028"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Upload Foto Produk</label>
            <div onClick={triggerFileUpload}
              className="relative border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-all bg-zinc-800/30 group"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                  <Camera className="h-6 w-6 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-zinc-300 text-sm font-medium">Drop photo here or click to browse</p>
                  <p className="text-zinc-600 text-xs mt-1">AI akan generate semua varian warna & ukuran</p>
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFilePick} className="hidden" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all"
            >Cancel</button>
            <button disabled={!productCode} onClick={triggerFileUpload}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black disabled:text-zinc-500 font-semibold text-sm transition-all disabled:cursor-not-allowed"
            >Upload & AI Detect</button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
