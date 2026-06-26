"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAIImageProcessor } from "@/lib/ai-image-processor"
import { Camera, Check, RotateCcw, X } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const COLOR_NAMES: Record<string, string> = {
  Red: "#FF0000",
  Blue: "#0000FF",
  Green: "#008000",
  Black: "#000000",
  White: "#FFFFFF",
  Yellow: "#FFFF00",
  Purple: "#800080",
  Orange: "#FFA500",
  Brown: "#A52A2A",
  Pink: "#FFC0CB",
  Gray: "#808080",
  Beige: "#F5F5DC",
  Navy: "#000080",
  Teal: "#008080",
  Maroon: "#800000",
  Olive: "#808000",
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function colorDistance(hex1: string, hex2: string) {
  const a = hexToRgb(hex1)
  const b = hexToRgb(hex2)
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function nearestColorName(hex: string): string {
  let closest = "Black"
  let minDist = Infinity
  for (const [name, colorHex] of Object.entries(COLOR_NAMES)) {
    const dist = colorDistance(hex, colorHex)
    if (dist < minDist) {
      minDist = dist
      closest = name
    }
  }
  return closest
}

function generateKode(): string {
  const prefix = "AI"
  const timestamp = Date.now().toString(36).slice(-4).toUpperCase()
  return `${prefix}${timestamp}`
}

interface AIQuickEntryProps {
  onClose: () => void
}

export function AIQuickEntry({ onClose }: AIQuickEntryProps) {
  const router = useRouter()
  const [productName, setProductName] = useState("")
  const [step, setStep] = useState<"upload" | "review" | "saving">("upload")
  const [confirmedData, setConfirmedData] = useState<{
    kode: string
    nama: string
    color: string
    size: string
    sku: string
    imageUrl: string
    file: File
  } | null>(null)

  const {
    isProcessing,
    detectedAttributes,
    error,
    progress,
    handleFileSelect,
    triggerFileUpload,
    fileInputRef,
  } = useAIImageProcessor({
    autoGenerateSKU: false,
    onProgress: () => {},
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>)
    }
  }

  const detectedColor = detectedAttributes ? nearestColorName(detectedAttributes.color) : null

  const kode = generateKode()
  const sku = detectedColor && detectedAttributes
    ? `${kode}-${detectedAttributes.size}-${detectedColor}`.toUpperCase()
    : ""

  const handleConfirm = async () => {
    if (!detectedAttributes || !detectedColor || !fileInputRef.current?.files?.[0]) return

    const file = fileInputRef.current.files[0]
    setStep("saving")

    try {
      const formData = new FormData()
      formData.append("foto", file)
      formData.append("produkId", kode)
      formData.append("size", detectedAttributes.size)
      formData.append("warna", detectedColor)

      const photoRes = await fetch("/api/upload-produk-foto", { method: "POST", body: formData })
      if (!photoRes.ok) throw new Error("Gagal mengupload foto")
      const photoData = await photoRes.json()

      const res = await fetch("/api/master/produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode,
          nama: productName,
          variasi: [{
            size: detectedAttributes.size,
            warna: detectedColor,
            sku,
            fotoUrl: photoData.fotoUrl,
            namaFoto: photoData.filename,
            fotoPath: photoData.fotoUrl.split("/").pop(),
          }],
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Gagal menyimpan produk")
      }

      toast.success(`Produk ${kode} - ${productName} berhasil ditambahkan`)
      router.refresh()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan")
      setStep("review")
    }
  }

  const handleRetry = () => {
    setConfirmedData(null)
    setStep("upload")
  }

  const handleSkipReview = () => {
    if (!detectedAttributes || !detectedColor || !fileInputRef.current?.files?.[0]) return
    const file = fileInputRef.current.files[0]
    setConfirmedData({
      kode,
      nama: productName,
      color: detectedColor,
      size: detectedAttributes.size,
      sku,
      imageUrl: URL.createObjectURL(file),
      file,
    })
    setStep("review")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#FFD700]/20"
        style={{
          background: "linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,215,0,0.1)",
        }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-[#FFD700]/30 to-transparent" />
        </div>

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold" style={{ fontFamily: "'Playfair Display', serif", color: "#FFD700" }}>
                Quick Entry AI
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "#CCCCCC" }}>
                Upload foto, AI akan mendeteksi otomatis
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 transition-colors hover:bg-white/10"
              style={{ color: "#CCCCCC" }}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#FFD700" }}>
                    Nama Produk
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Contoh: Kaos Premium Cotton"
                    className="w-full rounded-lg border px-4 py-2.5 text-sm transition-colors placeholder:text-gray-500 focus:outline-none"
                    style={{
                      backgroundColor: "#1A1A1A",
                      borderColor: "#333333",
                      color: "#FFFFFF",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#FFD700")}
                    onBlur={(e) => (e.target.style.borderColor = "#333333")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "#FFD700" }}>
                    Upload Foto Produk
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={triggerFileUpload}
                    className="relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all hover:border-[#FFD700]/50"
                    style={{
                      borderColor: "#333333",
                      backgroundColor: "rgba(26,26,26,0.5)",
                    }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="rounded-full p-3"
                        style={{ backgroundColor: "rgba(255,215,0,0.1)" }}
                      >
                        <Camera className="h-6 w-6" style={{ color: "#FFD700" }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>
                          Drop foto di sini
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: "#888888" }}>
                          atau klik untuk browse
                        </p>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span style={{ color: "#FFD700" }}>AI Menganalisis...</span>
                        <span style={{ color: "#FFD700" }}>{progress}%</span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full"
                        style={{ backgroundColor: "#1A1A1A" }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: "linear-gradient(90deg, #FFD700, #B8860B)",
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      {detectedAttributes && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3 rounded-lg p-3"
                          style={{ backgroundColor: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.15)" }}
                        >
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-xs" style={{ color: "#888888" }}>Warna</span>
                              <p className="font-medium" style={{ color: "#FFD700" }}>{detectedColor}</p>
                            </div>
                            <div>
                              <span className="text-xs" style={{ color: "#888888" }}>Ukuran</span>
                              <p className="font-medium" style={{ color: "#FFD700" }}>{detectedAttributes.size}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="text-xs" style={{ color: "#888888" }}>SKU</span>
                              <p className="font-mono text-xs font-medium" style={{ color: "#FFFFFF" }}>{sku || "-"}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div
                    className="rounded-lg border p-3 text-sm"
                    style={{
                      backgroundColor: "rgba(244,67,54,0.1)",
                      borderColor: "rgba(244,67,54,0.3)",
                      color: "#F44336",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: "#1A1A1A",
                      border: "1px solid #333333",
                      color: "#CCCCCC",
                    }}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSkipReview}
                    disabled={!detectedAttributes || !productName}
                    className="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-40"
                    style={{
                      background: detectedAttributes && productName
                        ? "linear-gradient(135deg, #FFD700, #B8860B)"
                        : "#333333",
                      color: detectedAttributes && productName ? "#0A0A0A" : "#888888",
                    }}
                  >
                    Lanjutkan
                  </button>
                </div>
              </motion.div>
            )}

            {step === "review" && confirmedData && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <div
                  className="overflow-hidden rounded-xl"
                  style={{ border: "1px solid #333333" }}
                >
                  <img
                    src={confirmedData.imageUrl}
                    alt={confirmedData.nama}
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-xs" style={{ color: "#888888" }}>Kode Produk</span>
                      <p className="font-medium" style={{ color: "#FFFFFF" }}>{confirmedData.kode}</p>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: "#888888" }}>Nama Produk</span>
                      <p className="font-medium" style={{ color: "#FFFFFF" }}>{confirmedData.nama}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs" style={{ color: "#888888" }}>Warna</span>
                        <p className="font-medium" style={{ color: "#FFD700" }}>{confirmedData.color}</p>
                      </div>
                      <div>
                        <span className="text-xs" style={{ color: "#888888" }}>Ukuran</span>
                        <p className="font-medium" style={{ color: "#FFD700" }}>{confirmedData.size}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs" style={{ color: "#888888" }}>SKU</span>
                      <p className="font-mono text-sm font-medium" style={{ color: "#FFFFFF" }}>{confirmedData.sku}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleRetry}
                    className="flex items-center justify-center gap-2 flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: "rgba(255,215,0,0.1)",
                      border: "1px solid rgba(255,215,0,0.3)",
                      color: "#FFD700",
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Ulang AI
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={false}
                    className="flex items-center justify-center gap-2 flex-1 rounded-lg py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #FFD700, #B8860B)",
                      color: "#0A0A0A",
                    }}
                  >
                    <Check className="h-4 w-4" />
                    Konfirmasi & Simpan
                  </button>
                </div>
              </motion.div>
            )}


          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
