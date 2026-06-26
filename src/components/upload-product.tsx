"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAIImageProcessor } from "@/lib/ai-image-processor"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Camera, Check, RotateCcw, X } from "lucide-react"

interface QuickProductUploadProps {
  onClose: () => void
}

export function QuickProductUpload({ onClose }: QuickProductUploadProps) {
  const router = useRouter()
  const [productCode, setProductCode] = useState("")
  const [step, setStep] = useState<"form" | "upload" | "review">("form")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editedColor, setEditedColor] = useState("")
  const [editedSize, setEditedSize] = useState("")

  const {
    isProcessing,
    detectedAttributes,
    error: aiError,
    progress,
    handleFileSelect,
    triggerFileUpload,
    fileInputRef,
  } = useAIImageProcessor({
    onProgress: undefined,
  })

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
      queueMicrotask(() => {
        setEditedColor(detectedAttributes.color)
        setEditedSize(detectedAttributes.size)
        setStep("review")
      })
    }
  }, [detectedAttributes, isProcessing])

  async function handleConfirm() {
    if (!productCode || !selectedFile) {
      toast.error("Lengkapi data produk")
      return
    }

    setIsSaving(true)
    try {
      const sku = `${productCode}-${editedSize}-${editedColor}`.toUpperCase()

      let fotoUrl = ""
      let fotoPath = ""
      if (selectedFile) {
        const formData = new FormData()
        formData.append("foto", selectedFile)
        formData.append("produkId", productCode)
        formData.append("size", editedSize)
        formData.append("warna", editedColor)

        const uploadRes = await fetch("/api/upload-produk-foto", { method: "POST", body: formData })
        if (!uploadRes.ok) throw new Error("Gagal upload foto")
        const uploadData = await uploadRes.json()
        fotoUrl = uploadData.fotoUrl
        fotoPath = uploadData.fotoUrl.split("/").pop()
      }

      const res = await fetch("/api/master/produk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: productCode,
          nama: productCode,
          fotoUrl,
          variasi: [{
            size: editedSize,
            warna: editedColor,
            sku,
            fotoUrl,
            fotoPath,
            namaFoto: selectedFile.name,
          }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Gagal menyimpan")
      }

      toast.success("Produk berhasil ditambahkan")
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
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="px-6 pt-6 pb-4 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-heading font-semibold text-amber-400">Konfirmasi Hasil AI</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {previewUrl && (
              <div className="relative rounded-xl overflow-hidden border border-zinc-700">
                <img src={previewUrl} alt="Preview" className="w-full h-56 object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 to-transparent" />
                <div className="absolute bottom-3 left-3 text-xs text-zinc-400 font-mono">
                  {productCode}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Detected Color</label>
                <select
                  value={editedColor}
                  onChange={(e) => setEditedColor(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                >
                  {["Black","White","Gray","Red","Maroon","Burgundy","Blue","Navy","Royal Blue","Light Blue","Sky Blue","Green","Olive","Dark Green","Lime","Teal","Cyan","Yellow","Gold","Orange","Dark Orange","Coral","Pink","Hot Pink","Magenta","Purple","Lavender","Violet","Indigo","Brown","Chocolate","Tan","Beige","Cream","Ivory","Silver","Charcoal","Slate","Mint","Peach","Salmon","Turquoise","Khaki","Camel"].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Detected Size</label>
                <select
                  value={editedSize}
                  onChange={(e) => setEditedSize(e.target.value)}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                >
                  {["XS","S","M","L","XL","XXL","XXXL"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
              <span className="text-xs text-zinc-500 uppercase tracking-wider">Confidence</span>
              <p className="text-emerald-400 font-medium mt-1">85%</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={resetToUpload}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Retry
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold text-sm transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {isSaving ? "Menyimpan..." : "Confirm & Save"}
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
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value.toUpperCase())}
              placeholder="Contoh: A028"
              className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Upload Foto Produk</label>
            <div
              onClick={triggerFileUpload}
              className="relative border-2 border-dashed border-zinc-700 rounded-xl p-8 text-center cursor-pointer hover:border-amber-500/50 transition-all bg-zinc-800/30 group"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                  <Camera className="h-6 w-6 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-zinc-300 text-sm font-medium">Drop photo here or click to browse</p>
                  <p className="text-zinc-600 text-xs mt-1">JPG, PNG — max 5MB</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFilePick}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all"
            >
              Cancel
            </button>
            <button
              disabled={!productCode}
              onClick={triggerFileUpload}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black disabled:text-zinc-500 font-semibold text-sm transition-all disabled:cursor-not-allowed"
            >
              Upload & AI Detect
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
