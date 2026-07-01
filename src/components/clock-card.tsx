"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, Camera, Check, X } from "lucide-react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

export function ClockCard() {
  const [status, setStatus] = useState<any>(null)
  const [capturing, setCapturing] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [showCamera, setShowCamera] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [clocking, setClocking] = useState(false)

  useEffect(() => {
    fetchToday()
  }, [])

  async function fetchToday() {
    const today = new Date().toISOString().slice(0, 10)
    const res = await fetch(`/api/attendance?tanggal=${today}`)
    if (res.ok) {
      const data = await res.json()
      setStatus(data[0] || null)
    }
  }

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } })
      streamRef.current = stream
      setShowCamera(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch {
      toast.error("Kamera tidak tersedia")
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setShowCamera(false)
    setPhoto(null)
  }

  function capturePhoto() {
    if (!videoRef.current) return
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth || 320
    canvas.height = videoRef.current.videoHeight || 240
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(videoRef.current, 0, 0)
    setPhoto(canvas.toDataURL("image/jpeg", 0.8))
    stopCamera()
  }

  async function handleClock(action: "clockIn" | "clockOut") {
    if (action === "clockIn" && !photo) {
      setCapturing(true)
      await startCamera()
      return
    }

    setClocking(true)
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Gagal")
        return
      }
      toast.success(action === "clockIn" ? "Clock-in berhasil" : "Clock-out berhasil")
      setPhoto(null)
      setCapturing(false)
      fetchToday()
    } catch {
      toast.error("Gagal")
    } finally {
      setClocking(false)
    }
  }

  return (
    <div className="card-luxury overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <span className="text-sm font-medium text-zinc-200">Absensi Hari Ini</span>
          </div>
          {status?.clockIn && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${status?.clockOut ? "bg-zinc-800 text-zinc-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"}`}>
              {status?.clockOut ? "Selesai" : "Sedang kerja"}
            </span>
          )}
        </div>

        <AnimatePresence>
          {capturing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-3"
            >
              {showCamera ? (
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-40 object-cover" />
                  {photo ? (
                    <div className="relative">
                      <img src={photo} alt="Capture" className="w-full h-40 object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/40">
                        <button onClick={() => setPhoto(null)} className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white">
                          <X className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleClock("clockIn")} className="p-2 rounded-full bg-green-500/80 hover:bg-green-500 text-white">
                          <Check className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button onClick={capturePhoto} className="p-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black transition-all">
                        <Camera className="h-6 w-6" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 text-center py-2">Mengakses kamera...</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2">
          {status?.clockIn && !status?.clockOut ? (
            <Button
              onClick={() => handleClock("clockOut")}
              disabled={clocking}
              className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm"
            >
              {clocking ? "Memproses..." : "Clock Out"}
            </Button>
          ) : !status?.clockIn ? (
            <Button
              onClick={() => handleClock("clockIn")}
              disabled={clocking}
              className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-semibold text-sm"
            >
              {clocking ? "Memproses..." : capturing ? "Ambil Foto" : "Clock In + Foto"}
            </Button>
          ) : (
            <p className="flex-1 text-center text-xs text-zinc-500 py-2">Sudah absen hari ini</p>
          )}
        </div>

        {status && (
          <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1 text-xs text-zinc-500">
            {status.clockIn && (
              <p>Clock In: <span className="text-zinc-300">{new Date(status.clockIn).toLocaleTimeString("id-ID")}</span></p>
            )}
            {status.clockOut && (
              <p>Clock Out: <span className="text-zinc-300">{new Date(status.clockOut).toLocaleTimeString("id-ID")}</span></p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
