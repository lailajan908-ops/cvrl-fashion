import { useState, useCallback, useRef } from 'react'
import { getDominantColorFromPixelData } from './color-detector'

export interface DetectedAttributes {
  color: string
  size: string
  confidence: number
  colorCode?: string
  sizeCode?: string
}

export interface AIImageProcessorOptions {
  modelPath?: string
  autoGenerateSKU?: boolean
  onProgress?: (progress: number) => void
}

function mapColorToCode(color: string): string {
  const colorMap: Record<string, string> = {
    'Red': 'RED',
    'Maroon': 'MRN',
    'Dark Red': 'DRD',
    'Burgundy': 'BRG',
    'Blue': 'BLU',
    'Navy': 'NVY',
    'Royal Blue': 'RBL',
    'Light Blue': 'LBL',
    'Sky Blue': 'SKB',
    'Green': 'GRN',
    'Olive': 'OLV',
    'Dark Green': 'DGR',
    'Lime': 'LIM',
    'Teal': 'TEL',
    'Cyan': 'CYN',
    'Yellow': 'YEL',
    'Gold': 'GLD',
    'Orange': 'ORN',
    'Dark Orange': 'DOR',
    'Coral': 'CRL',
    'Pink': 'PNK',
    'Hot Pink': 'HPK',
    'Magenta': 'MAG',
    'Purple': 'PUR',
    'Lavender': 'LVN',
    'Violet': 'VIO',
    'Indigo': 'IND',
    'Brown': 'BRN',
    'Chocolate': 'CHO',
    'Saddle Brown': 'SBR',
    'Sandy Brown': 'SAB',
    'Tan': 'TAN',
    'Beige': 'BEG',
    'Cream': 'CRM',
    'Ivory': 'IVR',
    'Black': 'BLK',
    'White': 'WHT',
    'Gray': 'GRY',
    'Silver': 'SIL',
    'Charcoal': 'CHR',
    'Slate': 'SLT',
    'Mint': 'MNT',
    'Peach': 'PCH',
    'Salmon': 'SLM',
    'Turquoise': 'TRQ',
    'Khaki': 'KHK',
    'Camel': 'CML',
  }
  return colorMap[color] || color.substring(0, 3).toUpperCase()
}

function mapSizeToCode(size: string): string {
  const sizeMap: Record<string, string> = {
    'XS': '01',
    'S': '02',
    'M': '03',
    'L': '04',
    'XL': '05',
    'XXL': '06',
    'XXXL': '07',
  }
  return sizeMap[size] || '03'
}

function estimateSize(width: number, height: number): string {
  if (!width || !height) return 'M'
  const totalPixels = width * height
  if (totalPixels > 4000000) return 'XL'
  if (totalPixels > 2000000) return 'L'
  if (totalPixels > 1000000) return 'M'
  if (totalPixels > 500000) return 'S'
  return 'XS'
}

export function useAIImageProcessor(options: AIImageProcessorOptions = {}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedAttributes, setDetectedAttributes] = useState<DetectedAttributes | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processImage = useCallback(async (file: File): Promise<DetectedAttributes> => {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file')
    }

    setIsProcessing(true)
    setProgress(0)
    setError(null)

    try {
      const imageUrl = URL.createObjectURL(file)
      const img = new Image()

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = imageUrl
      })

      setProgress(30)

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Failed to create canvas context')

      const scale = Math.min(1, 1024 / Math.max(img.width, img.height))
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      setProgress(60)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const color = getDominantColorFromPixelData(imageData.data)
      const size = estimateSize(img.width, img.height)

      setProgress(90)

      const attributes: DetectedAttributes = {
        color,
        size,
        confidence: 0.85,
        colorCode: mapColorToCode(color),
        sizeCode: mapSizeToCode(size),
      }

      setDetectedAttributes(attributes)
      setProgress(100)
      URL.revokeObjectURL(imageUrl)

      if (options.onProgress) {
        options.onProgress(100)
      }

      return attributes
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Processing failed'
      setError(message)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [options])

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      void processImage(file)
    }
  }, [processImage])

  const triggerFileUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    isProcessing,
    detectedAttributes,
    error,
    progress,
    handleFileSelect,
    triggerFileUpload,
    processImage,
    fileInputRef,
  }
}
