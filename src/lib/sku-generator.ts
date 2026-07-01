export const SIZE_CODE: Record<string, string> = {
  "S": "1",
  "M": "2",
  "L": "4",
  "XL": "6",
  "XXL": "8",
  "XXXL": "10",
}

export const CODE_SIZE: Record<string, string> = {
  "1": "S",
  "2": "M",
  "4": "L",
  "6": "XL",
  "8": "XXL",
  "10": "XXXL",
}

export function generateSKU(kode: string, size: string): string {
  const code = SIZE_CODE[size] || size
  return `${kode}${code}`
}

export function generateVariantSKU(kode: string, warna: string, size: string): string {
  const code = SIZE_CODE[size] || size
  return `${kode}${code}-${warna.toLowerCase()}-${size.toLowerCase()}`
}