const COLOR_PALETTE: { name: string; hex: string; threshold: number }[] = [
  { name: 'Black', hex: '#000000', threshold: 50 },
  { name: 'White', hex: '#FFFFFF', threshold: 50 },
  { name: 'Gray', hex: '#808080', threshold: 40 },
  { name: 'Red', hex: '#FF0000', threshold: 80 },
  { name: 'Maroon', hex: '#800000', threshold: 60 },
  { name: 'Dark Red', hex: '#8B0000', threshold: 60 },
  { name: 'Burgundy', hex: '#800020', threshold: 60 },
  { name: 'Blue', hex: '#0000FF', threshold: 80 },
  { name: 'Navy', hex: '#000080', threshold: 60 },
  { name: 'Royal Blue', hex: '#4169E1', threshold: 60 },
  { name: 'Light Blue', hex: '#ADD8E6', threshold: 60 },
  { name: 'Sky Blue', hex: '#87CEEB', threshold: 60 },
  { name: 'Green', hex: '#008000', threshold: 80 },
  { name: 'Olive', hex: '#808000', threshold: 60 },
  { name: 'Dark Green', hex: '#006400', threshold: 60 },
  { name: 'Lime', hex: '#00FF00', threshold: 80 },
  { name: 'Teal', hex: '#008080', threshold: 60 },
  { name: 'Cyan', hex: '#00FFFF', threshold: 70 },
  { name: 'Yellow', hex: '#FFFF00', threshold: 80 },
  { name: 'Gold', hex: '#FFD700', threshold: 70 },
  { name: 'Orange', hex: '#FFA500', threshold: 70 },
  { name: 'Dark Orange', hex: '#FF8C00', threshold: 60 },
  { name: 'Coral', hex: '#FF7F50', threshold: 60 },
  { name: 'Pink', hex: '#FFC0CB', threshold: 60 },
  { name: 'Hot Pink', hex: '#FF69B4', threshold: 60 },
  { name: 'Magenta', hex: '#FF00FF', threshold: 70 },
  { name: 'Purple', hex: '#800080', threshold: 60 },
  { name: 'Lavender', hex: '#E6E6FA', threshold: 50 },
  { name: 'Violet', hex: '#EE82EE', threshold: 60 },
  { name: 'Indigo', hex: '#4B0082', threshold: 60 },
  { name: 'Brown', hex: '#A52A2A', threshold: 60 },
  { name: 'Chocolate', hex: '#D2691E', threshold: 60 },
  { name: 'Saddle Brown', hex: '#8B4513', threshold: 60 },
  { name: 'Sandy Brown', hex: '#F4A460', threshold: 50 },
  { name: 'Tan', hex: '#D2B48C', threshold: 50 },
  { name: 'Beige', hex: '#F5F5DC', threshold: 50 },
  { name: 'Cream', hex: '#FFFDD0', threshold: 50 },
  { name: 'Ivory', hex: '#FFFFF0', threshold: 40 },
  { name: 'Silver', hex: '#C0C0C0', threshold: 50 },
  { name: 'Charcoal', hex: '#36454F', threshold: 50 },
  { name: 'Slate', hex: '#708090', threshold: 50 },
  { name: 'Mint', hex: '#98FB98', threshold: 60 },
  { name: 'Peach', hex: '#FFDAB9', threshold: 50 },
  { name: 'Salmon', hex: '#FA8072', threshold: 50 },
  { name: 'Turquoise', hex: '#40E0D0', threshold: 60 },
  { name: 'Khaki', hex: '#C3B091', threshold: 50 },
  { name: 'Camel', hex: '#C19A6B', threshold: 50 },
]

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

function colorDistance(c1: { r: number; g: number; b: number }, c2: { r: number; g: number; b: number }): number {
  return Math.sqrt((c1.r - c2.r) ** 2 + (c1.g - c2.g) ** 2 + (c1.b - c2.b) ** 2)
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

export function findClosestColorName(hex: string): string {
  const inputRgb = hexToRgb(hex)
  let closest = COLOR_PALETTE[0]
  let minDistance = Infinity

  for (const color of COLOR_PALETTE) {
    const paletteRgb = hexToRgb(color.hex)
    const distance = colorDistance(inputRgb, paletteRgb)
    if (distance < minDistance) {
      minDistance = distance
      closest = color
    }
  }

  if (minDistance > 200) {
    const r = inputRgb.r
    const g = inputRgb.g
    const b = inputRgb.b
    if (r > 200 && g > 200 && b > 200) return 'White'
    if (r < 60 && g < 60 && b < 60) return 'Black'
    if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) return 'Gray'
    if (r > 150 && g < 100 && b < 100) return 'Red'
    if (r < 100 && g < 100 && b > 150) return 'Blue'
    if (r < 100 && g > 150 && b < 100) return 'Green'
    if (r > 150 && g > 150 && b < 100) return 'Yellow'
  }

  return closest.name
}

export function getDominantColorFromPixelData(data: Uint8ClampedArray): string {
  const colorBuckets: Record<string, { count: number; r: number; g: number; b: number }> = {}
  const step = 4

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const a = data[i + 3]
    if (a < 128) continue

    const bucketKey = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`
    if (!colorBuckets[bucketKey]) {
      colorBuckets[bucketKey] = { count: 0, r, g, b }
    }
    colorBuckets[bucketKey].count++
  }

  let maxCount = 0
  let dominantR = 0
  let dominantG = 0
  let dominantB = 0

  for (const key in colorBuckets) {
    const bucket = colorBuckets[key]
    if (bucket.count > maxCount) {
      maxCount = bucket.count
      dominantR = bucket.r
      dominantG = bucket.g
      dominantB = bucket.b
    }
  }

  const hex = rgbToHex(dominantR, dominantG, dominantB)
  return findClosestColorName(hex)
}
