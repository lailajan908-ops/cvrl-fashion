"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ProductPhotoUploadProps {
  produkId: string
  ukuran: string
  warna: string
  existingFotoUrl?: string
  onFotoUploaded?: (fotoUrl: string, filename: string) => void
}

export function ProductPhotoUpload({
  produkId,
  ukuran,
  warna,
  existingFotoUrl,
  onFotoUploaded,
}: ProductPhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingFotoUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.includes("image/")) {
      alert("File harus berupa gambar")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File foto tidak boleh lebih dari 5MB")
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("foto", selectedFile)
      formData.append("produkId", produkId)
      formData.append("size", ukuran)
      formData.append("warna", warna)

      const response = await fetch("/api/upload-produk-foto", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Gagal mengupload foto")
      }

      const data = await response.json()

      if (onFotoUploaded) {
        onFotoUploaded(data.fotoUrl, data.filename)
      }

      setSelectedFile(null)
      setPreviewUrl(data.fotoUrl)
      alert("Foto berhasil diupload!")
    } catch (error) {
      alert("Error: " + (error as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!previewUrl || previewUrl === existingFotoUrl) {
      return
    }

    setIsRemoving(true)
    try {
      const filename = previewUrl.split("/").pop()
      const response = await fetch(
        `/api/upload-produk-foto?filename=${filename}`, 
        { method: "DELETE" }
      )

      if (!response.ok) {
        throw new Error("Gagal menghapus foto")
      }

      if (onFotoUploaded) {
        onFotoUploaded("", "")
      }

      setPreviewUrl(null)
      alert("Foto berhasil dihapus!")
    } catch (error) {
      alert("Error: " + (error as Error).message)
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg">
      <div className="flex-1">
        <Label className="block mb-2 text-sm font-medium">
          Foto - {ukuran}/{warna}
        </Label>
        <Input
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={isUploading || isRemoving}
          className="text-sm"
        />
        <div className="text-xs text-gray-500 mt-1">
          JPG, PNG (max 5MB)
        </div>
      </div>

      {(previewUrl || selectedFile) && (
        <div className="relative">
          <img
            src={previewUrl || URL.createObjectURL(selectedFile!)}
            alt="Preview"
            className="w-20 h-20 object-cover rounded-lg border"
          />
          <div className="absolute -top-2 -right-2 flex gap-1">
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-green-500 text-white rounded-full p-1 hover:bg-green-600 disabled:bg-gray-400"
              >
                ✓
              </button>
            )}
            <button
              onClick={() => {
                if (previewUrl?.startsWith("blob:")) {
                  URL.revokeObjectURL(previewUrl)
                }
                setSelectedFile(null)
                if (previewUrl === existingFotoUrl) {
                  setPreviewUrl(null)
                }
              }}
              className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {selectedFile && (
        <button
          onClick={() => {
            setSelectedFile(null)
            if (previewUrl?.startsWith("blob:")) {
              URL.revokeObjectURL(previewUrl)
              setPreviewUrl(null)
            }
          }}
          className="text-gray-500 hover:text-gray-700 text-sm"
        >
          Batal
        </button>
      )}
    </div>
  )
}
