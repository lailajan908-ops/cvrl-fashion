/**
 * Master Produk (contoh)
 * - Banyak warna (contoh 14)
 * - Banyak size (contoh 5)
 * - Harga per varian
 * - Status stok
 */
const masterProduk = [
  {
    id: "RL-001",
    nama: "RL Minimal Knit Set",
    kategori: "Set",
    bestSeller: true,
    unggulan: true,
    skuPrefix: "RL-001",
    images: ["rl-001"],
    variants: [
      // colors: GOLD_BLACK, BLACK_GOLD, TITANIUM, CHAMPAGNE, EMERALD, NAVY, WINE, ROYAL_BLUE, CREAM, STONE, SMOKE, GRAPHITE, OLIVE, BRONZE
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "S", harga: 189000, stok: 12 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "M", harga: 189000, stok: 7 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "L", harga: 199000, stok: 0 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "XL", harga: 209000, stok: 3 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "XXL", harga: 219000, stok: 1 },

      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "S", harga: 189000, stok: 6 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "M", harga: 199000, stok: 2 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "L", harga: 199000, stok: 0 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "XL", harga: 209000, stok: 4 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "XXL", harga: 219000, stok: 2 },

      { warna: "TITANIUM", warnaLabel: "Titanium", size: "S", harga: 179000, stok: 10 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "M", harga: 189000, stok: 5 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "L", harga: 199000, stok: 1 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "XL", harga: 209000, stok: 0 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "XXL", harga: 219000, stok: 0 },

      { warna: "CHAMPAGNE", warnaLabel: "Champagne", size: "S", harga: 189000, stok: 8 },
      { warna: "CHAMPAGNE", warnaLabel: "Champagne", size: "M", harga: 189000, stok: 3 },
      { warna: "CHAMPAGNE", warnaLabel: "Champagne", size: "L", harga: 199000, stok: 2 },
      { warna: "CHAMPAGNE", warnaLabel: "Champagne", size: "XL", harga: 209000, stok: 1 },
      { warna: "CHAMPAGNE", warnaLabel: "Champagne", size: "XXL", harga: 219000, stok: 0 },

      { warna: "EMERALD", warnaLabel: "Emerald", size: "S", harga: 199000, stok: 9 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "M", harga: 199000, stok: 4 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "L", harga: 209000, stok: 0 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "XL", harga: 219000, stok: 2 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "XXL", harga: 229000, stok: 1 },

      { warna: "NAVY", warnaLabel: "Navy", size: "S", harga: 179000, stok: 6 },
      { warna: "NAVY", warnaLabel: "Navy", size: "M", harga: 189000, stok: 1 },
      { warna: "NAVY", warnaLabel: "Navy", size: "L", harga: 199000, stok: 2 },
      { warna: "NAVY", warnaLabel: "Navy", size: "XL", harga: 209000, stok: 0 },
      { warna: "NAVY", warnaLabel: "Navy", size: "XXL", harga: 219000, stok: 0 },

      { warna: "WINE", warnaLabel: "Wine", size: "S", harga: 189000, stok: 3 },
      { warna: "WINE", warnaLabel: "Wine", size: "M", harga: 189000, stok: 0 },
      { warna: "WINE", warnaLabel: "Wine", size: "L", harga: 199000, stok: 1 },
      { warna: "WINE", warnaLabel: "Wine", size: "XL", harga: 209000, stok: 2 },
      { warna: "WINE", warnaLabel: "Wine", size: "XXL", harga: 219000, stok: 1 },

      { warna: "ROYAL_BLUE", warnaLabel: "Royal Blue", size: "S", harga: 199000, stok: 7 },
      { warna: "ROYAL_BLUE", warnaLabel: "Royal Blue", size: "M", harga: 199000, stok: 2 },
      { warna: "ROYAL_BLUE", warnaLabel: "Royal Blue", size: "L", harga: 209000, stok: 1 },
      { warna: "ROYAL_BLUE", warnaLabel: "Royal Blue", size: "XL", harga: 219000, stok: 0 },
      { warna: "ROYAL_BLUE", warnaLabel: "Royal Blue", size: "XXL", harga: 229000, stok: 0 },

      { warna: "CREAM", warnaLabel: "Cream", size: "S", harga: 179000, stok: 8 },
      { warna: "CREAM", warnaLabel: "Cream", size: "M", harga: 189000, stok: 3 },
      { warna: "CREAM", warnaLabel: "Cream", size: "L", harga: 199000, stok: 2 },
      { warna: "CREAM", warnaLabel: "Cream", size: "XL", harga: 209000, stok: 1 },
      { warna: "CREAM", warnaLabel: "Cream", size: "XXL", harga: 219000, stok: 0 },

      { warna: "STONE", warnaLabel: "Stone", size: "S", harga: 179000, stok: 6 },
      { warna: "STONE", warnaLabel: "Stone", size: "M", harga: 189000, stok: 2 },
      { warna: "STONE", warnaLabel: "Stone", size: "L", harga: 199000, stok: 0 },
      { warna: "STONE", warnaLabel: "Stone", size: "XL", harga: 209000, stok: 3 },
      { warna: "STONE", warnaLabel: "Stone", size: "XXL", harga: 219000, stok: 1 },

      { warna: "SMOKE", warnaLabel: "Smoke", size: "S", harga: 179000, stok: 4 },
      { warna: "SMOKE", warnaLabel: "Smoke", size: "M", harga: 189000, stok: 1 },
      { warna: "SMOKE", warnaLabel: "Smoke", size: "L", harga: 199000, stok: 1 },
      { warna: "SMOKE", warnaLabel: "Smoke", size: "XL", harga: 209000, stok: 0 },
      { warna: "SMOKE", warnaLabel: "Smoke", size: "XXL", harga: 219000, stok: 0 },

      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "S", harga: 189000, stok: 5 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "M", harga: 189000, stok: 2 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "L", harga: 199000, stok: 2 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "XL", harga: 209000, stok: 1 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "XXL", harga: 219000, stok: 0 },

      { warna: "OLIVE", warnaLabel: "Olive", size: "S", harga: 199000, stok: 3 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "M", harga: 199000, stok: 0 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "L", harga: 209000, stok: 2 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "XL", harga: 219000, stok: 2 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "XXL", harga: 229000, stok: 1 },

      { warna: "BRONZE", warnaLabel: "Bronze", size: "S", harga: 189000, stok: 6 },
      { warna: "BRONZE", warnaLabel: "Bronze", size: "M", harga: 199000, stok: 2 },
      { warna: "BRONZE", warnaLabel: "Bronze", size: "L", harga: 199000, stok: 1 },
      { warna: "BRONZE", warnaLabel: "Bronze", size: "XL", harga: 209000, stok: 0 },
      { warna: "BRONZE", warnaLabel: "Bronze", size: "XXL", harga: 219000, stok: 0 }
    ]
  },

  {
    id: "RL-007",
    nama: "RL Premium Overshirt",
    kategori: "Outer",
    bestSeller: true,
    unggulan: false,
    skuPrefix: "RL-007",
    images: ["rl-007"],
    variants: [
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "S", harga: 239000, stok: 2 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "M", harga: 239000, stok: 6 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "L", harga: 249000, stok: 4 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "XL", harga: 259000, stok: 0 },
      { warna: "GOLD_BLACK", warnaLabel: "Gold Black", size: "XXL", harga: 269000, stok: 1 },

      { warna: "TITANIUM", warnaLabel: "Titanium", size: "S", harga: 229000, stok: 4 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "M", harga: 239000, stok: 2 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "L", harga: 249000, stok: 1 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "XL", harga: 259000, stok: 1 },
      { warna: "TITANIUM", warnaLabel: "Titanium", size: "XXL", harga: 269000, stok: 0 },

      { warna: "EMERALD", warnaLabel: "Emerald", size: "S", harga: 239000, stok: 3 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "M", harga: 239000, stok: 0 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "L", harga: 249000, stok: 2 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "XL", harga: 259000, stok: 2 },
      { warna: "EMERALD", warnaLabel: "Emerald", size: "XXL", harga: 269000, stok: 0 },

      { warna: "NAVY", warnaLabel: "Navy", size: "S", harga: 229000, stok: 6 },
      { warna: "NAVY", warnaLabel: "Navy", size: "M", harga: 239000, stok: 4 },
      { warna: "NAVY", warnaLabel: "Navy", size: "L", harga: 249000, stok: 2 },
      { warna: "NAVY", warnaLabel: "Navy", size: "XL", harga: 259000, stok: 1 },
      { warna: "NAVY", warnaLabel: "Navy", size: "XXL", harga: 269000, stok: 0 },

      { warna: "CREAM", warnaLabel: "Cream", size: "S", harga: 229000, stok: 1 },
      { warna: "CREAM", warnaLabel: "Cream", size: "M", harga: 239000, stok: 2 },
      { warna: "CREAM", warnaLabel: "Cream", size: "L", harga: 249000, stok: 0 },
      { warna: "CREAM", warnaLabel: "Cream", size: "XL", harga: 259000, stok: 2 },
      { warna: "CREAM", warnaLabel: "Cream", size: "XXL", harga: 269000, stok: 1 }
    ]
  },

  {
    id: "RL-013",
    nama: "RL Luxe Trousers",
    kategori: "Pants",
    bestSeller: false,
    unggulan: true,
    skuPrefix: "RL-013",
    images: ["rl-013"],
    variants: [
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "S", harga: 159000, stok: 5 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "M", harga: 169000, stok: 2 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "L", harga: 179000, stok: 1 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "XL", harga: 189000, stok: 0 },
      { warna: "BLACK_GOLD", warnaLabel: "Black Gold", size: "XXL", harga: 199000, stok: 1 },

      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "S", harga: 159000, stok: 4 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "M", harga: 169000, stok: 1 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "L", harga: 179000, stok: 2 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "XL", harga: 189000, stok: 1 },
      { warna: "GRAPHITE", warnaLabel: "Graphite", size: "XXL", harga: 199000, stok: 0 },

      { warna: "OLIVE", warnaLabel: "Olive", size: "S", harga: 159000, stok: 2 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "M", harga: 169000, stok: 0 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "L", harga: 179000, stok: 2 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "XL", harga: 189000, stok: 1 },
      { warna: "OLIVE", warnaLabel: "Olive", size: "XXL", harga: 199000, stok: 1 }
    ]
  }
];

const colorMeta = {
  GOLD_BLACK: { label: "Gold Black" },
  BLACK_GOLD: { label: "Black Gold" },
  TITANIUM: { label: "Titanium" },
  CHAMPAGNE: { label: "Champagne" },
  EMERALD: { label: "Emerald" },
  NAVY: { label: "Navy" },
  WINE: { label: "Wine" },
  ROYAL_BLUE: { label: "Royal Blue" },
  CREAM: { label: "Cream" },
  STONE: { label: "Stone" },
  SMOKE: { label: "Smoke" },
  GRAPHITE: { label: "Graphite" },
  OLIVE: { label: "Olive" },
  BRONZE: { label: "Bronze" }
};

const categories = ["Set", "Outer", "Pants"];

const paymentMethods = [
  { id: "cod", name: "COD", desc: "Bayar di Tempat" },
  { id: "transfer", name: "Transfer Bank", desc: "Virtual account (demo)" },
  { id: "ewallet", name: "E-Wallet", desc: "GoPay / OVO / Dana (demo)" },
  { id: "qris", name: "QRIS", desc: "Scan QR untuk bayar (demo)" },
  { id: "card", name: "Kartu Debit / Kredit", desc: "Kartu ATM / Visa / Mastercard (demo)" }
];

function formatIDR(n){
  return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(n);
}

function getVariantStockLabel(stok){
  return stok > 0 ? "In Stock" : "Out of Stock";
}

function pickDefaultVariant(variants){
  // pilih varian pertama yang stok > 0, kalau tidak ada stok ambil pertama
  const inStock = variants.find(v => v.stok > 0);
  return inStock || variants[0];
}
