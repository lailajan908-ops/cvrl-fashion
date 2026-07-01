"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, Volume2, VolumeX, ShoppingBag, Heart, Star, ArrowRight } from "lucide-react"

export default function StorePage() {
  const [showWelcome, setShowWelcome] = useState(true)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Auto-hide welcome video after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcome(false)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  // Handle background music
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.muted = true
      } else {
        audioRef.current.muted = false
        if (isPlaying) {
          audioRef.current.play().catch(() => {})
        }
      }
    }
  }, [isMuted, isPlaying])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(() => {})
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background Music - Add your own background-music.mp3 to public folder */}
      <audio ref={audioRef} loop>
        <source src="/background-music.mp3" type="audio/mp3" />
      </audio>

      {/* Welcome Video Overlay */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
          >
            <video
              autoPlay
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover"
              onEnded={() => setShowWelcome(false)}
            >
              <source src="/welcome.mp4" type="video/mp4" />
            </video>
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute bottom-8 right-8 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/30 transition-colors"
            >
              Skip
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      >
        <source src="/splash.mp4" type="video/mp4" />
      </video>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black/80" />

      {/* Store Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-cvrl.png" alt="R&L" className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <h1 className="text-xl font-bold text-white">R&L Fashion</h1>
              <p className="text-xs text-amber-400">Premium Fashion Manufacturer</p>
            </div>
          </div>

          {/* Music Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>
            <button
              onClick={toggleMute}
              className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Welcome to <span className="text-amber-400">R&L Fashion</span>
            </h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Premium fashion manufacturer with high-quality products for your business
            </p>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12"
          >
            {[
              { name: "Baju", icon: "👕", color: "from-amber-500 to-amber-600" },
              { name: "Celana", icon: "👖", color: "from-zinc-500 to-zinc-600" },
              { name: "Rok", icon: "👗", color: "from-pink-500 to-pink-600" },
              { name: "Jaket", icon: "🧥", color: "from-blue-500 to-blue-600" },
            ].map((category, i) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-white font-medium">{category.name}</h3>
                <div className={`mt-2 h-1 bg-gradient-to-r ${category.color} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform`} />
              </motion.div>
            ))}
          </motion.div>

          {/* Featured Products */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Featured Products</h3>
              <button className="flex items-center gap-1 text-amber-400 text-sm hover:text-amber-300 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-amber-500/50 transition-all cursor-pointer group"
                >
                  <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
                      {["👕", "👖", "👗", "🧥"][i - 1]}
                    </div>
                    <button className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                      <Heart className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="text-white font-medium text-sm mb-1">Product {i}</h4>
                    <div className="flex items-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">(24)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400 font-bold">Rp 150.000</span>
                      <button className="p-2 bg-amber-500 rounded-full hover:bg-amber-400 transition-colors">
                        <ShoppingBag className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </main>

        {/* Bottom Navigation */}
        <nav className="p-4 bg-black/80 backdrop-blur-lg border-t border-white/10">
          <div className="flex justify-around">
            {[
              { name: "Home", icon: "🏠", active: true },
              { name: "Categories", icon: "📂", active: false },
              { name: "Cart", icon: "🛒", active: false },
              { name: "Profile", icon: "👤", active: false },
            ].map((item) => (
              <button
                key={item.name}
                className={`flex flex-col items-center gap-1 p-2 ${
                  item.active ? "text-amber-400" : "text-gray-500"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.name}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}