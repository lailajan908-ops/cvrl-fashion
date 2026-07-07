"use client"

import { BackgroundCarousel } from "@/components/background-carousel"

interface MediaItem {
  src: string
  type: "image" | "video"
  duration?: number
}

export function BackgroundCarouselClient({ items }: { items: MediaItem[] }) {
  return <BackgroundCarousel items={items} />
}
