"use client"

import { useState, useEffect, useRef } from "react"

interface MediaItem {
  src: string
  type: "image" | "video"
  duration?: number
}

interface BackgroundCarouselProps {
  items: MediaItem[]
  className?: string
  defaultDuration?: number
}

export function BackgroundCarousel({
  items,
  className = "",
  defaultDuration = 6,
}: BackgroundCarouselProps) {
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const current = items[index]
  const nextIndex = (index + 1) % items.length

  useEffect(() => {
    if (current.type === "image") {
      const timer = setTimeout(() => {
        setIndex(nextIndex)
      }, (current.duration || defaultDuration) * 1000)
      return () => clearTimeout(timer)
    }
  }, [index, current, nextIndex, defaultDuration])

  useEffect(() => {
    setLoaded(true)
  }, [])

  function handleVideoEnd() {
    setIndex(nextIndex)
  }

  if (!loaded || items.length === 0) return null

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {items.map((item, i) => {
        const isActive = i === index
        const isLeaving = i === (index - 1 + items.length) % items.length
        return (
          <div
            key={item.src + i}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              isActive ? "opacity-100 z-10" : isLeaving ? "opacity-0 z-0" : "opacity-0 z-0"
            }`}
          >
            {item.type === "image" ? (
              <img
                src={item.src}
                alt=""
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <video
                ref={isActive ? videoRef : undefined}
                src={item.src}
                className="w-full h-full object-cover"
                autoPlay={isActive}
                muted
                loop={false}
                playsInline
                onEnded={isActive ? handleVideoEnd : undefined}
                draggable={false}
              />
            )}
          </div>
        )
      })}
      <div className="absolute inset-0 bg-black/20 z-10" />
    </div>
  )
}
