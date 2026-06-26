export interface SKUConfig {
  prefix: string;
  separator: string;
  colorMap: Record<string, string>;
  sizeMap: Record<string, string>;
  timestampLength: number;
}

export const defaultSKUConfig: SKUConfig = {
  prefix: 'PROD',
  separator: '-',
  colorMap: {
    'Red': 'RED',
    'Blue': 'BLUE',
    'Green': 'GRN',
    'Black': 'BLK',
    'White': 'WHT',
    'Yellow': 'YEL',
    'Purple': 'PUR',
    'Orange': 'ORA',
    'Brown': 'BRN',
    'Pink': 'PINK',
    'Gray': 'GRY',
    'Beige': 'BEG',
    'Navy': 'NVY',
    'Teal': 'TLA',
    'Maroon': 'MRN',
    'Olive': 'OLV',
  },
  sizeMap: {
    'XS': '01',
    'S': '02',
    'M': '03',
    'L': '04',
    'XL': '05',
    'XXL': '06',
    'XXXL': '07',
  },
  timestampLength: 4,
};

export function generateSKU(
  color: string,
  size: string,
  config: SKUConfig = defaultSKUConfig
): string {
  const colorCode = config.colorMap[color] || config.colorMap['Unknown'] || 'UNK';
  const sizeCode = config.sizeMap[size] || config.sizeMap['M'] || '03';
  const timestamp = Date.now().toString(36).slice(-config.timestampLength);

  return `${config.prefix}${config.separator}${colorCode}${config.separator}${sizeCode}${config.separator}${timestamp}`;
}

export function parseSKU(sku: string, config: SKUConfig = defaultSKUConfig): {
  prefix: string;
  colorCode: string;
  sizeCode: string;
  timestamp: string;
  isValid: boolean;
} | null {
  const parts = sku.split(config.separator);

  if (parts.length < 4) return null;

  return {
    prefix: parts[0],
    colorCode: parts[1],
    sizeCode: parts[2],
    timestamp: parts[3],
    isValid: !!(parts[0] === config.prefix && config.colorMap[parts[1]] && config.sizeMap[parts[2]]),
  };
}

export function getColorFromCode(code: string, config: SKUConfig = defaultSKUConfig): string {
  const entries = Object.entries(config.colorMap);
  return entries.find(([_, value]) => value === code)?.[0] || code;
}

export function getSizeFromCode(code: string, config: SKUConfig = defaultSKUConfig): string {
  const entries = Object.entries(config.sizeMap);
  return entries.find(([_, value]) => value === code)?.[0] || code;
}

export function validateSKU(sku: string, config: SKUConfig = defaultSKUConfig): boolean {
  const parsed = parseSKU(sku, config);
  return parsed?.isValid ?? false;
}

export function generateBulkSKUs(
  colors: string[],
  sizes: string[],
  count: number = 1,
  config: SKUConfig = defaultSKUConfig
): string[] {
  const skus: string[] = [];

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = sizes[Math.floor(Math.random() * sizes.length)];
    skus.push(generateSKU(color, size, config));
  }

  return skus;
}

export function createSKUConfig(
  prefix?: string,
  colorMap?: Record<string, string>,
  sizeMap?: Record<string, string>
): SKUConfig {
  return {
    ...defaultSKUConfig,
    ...(prefix && { prefix }),
    ...(colorMap && { colorMap: { ...defaultSKUConfig.colorMap, ...colorMap } }),
    ...(sizeMap && { sizeMap: { ...defaultSKUConfig.sizeMap, ...sizeMap } }),
  };
}