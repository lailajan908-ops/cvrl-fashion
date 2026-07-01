import { prisma } from "../src/lib/db"

async function main() {
  const kategoriId = "cmqzq2chh000e0cbd9kzqq7bd" // Koko

  const kode = "KOKO-BINLADEN-001"

  const colors = [
    { label: "Hitam", path: "hitam" },
    { label: "Putih", path: "putih" },
    { label: "Navy", path: "navy" },
    { label: "Army", path: "army" },
    { label: "Maroon", path: "-3" },
    { label: "Grey", path: "-4" },
    { label: "Coklat", path: "-5" },
    { label: "Burgundy", path: "-6" },
    { label: "Mustard", path: "-7" },
    { label: "Tosca", path: "-8" },
    { label: "Cream", path: "-9" },
  ]

  const sizes = ["M", "L", "XL", "2XL", "XXXL"]

  const images = [
    "https://img.lazcdn.com/g/p/fbe75ee57704c51089b0953a1d56d279.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/9c7644615905f60108748a6fc40cac4e.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/85ca7505508bf3cc9628c1474cd6a32f.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/7d2e1a45c52a5f5a65756acd14f8d0a1.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/04e79a214609b5709f94fd2259539160.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/a68b84467d74672dc10786cc567ef329.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/7040fd84de7848f79487598fc3983dcc.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/a89b21b9aa308107fca3f86453b343fb.png_720x720q80.png_.webp",
    "https://img.lazcdn.com/g/p/7d2e1a45c52a5f5a65756acd14f8d0a1.png_720x720q80.png_.webp",
  ]

  const descHtml = `
Bahan Katun Madinah Premium
(Lembut, Halus, Nyaman dan Tidak Panas)

Ukuran :
M = Lingkar Dada 102 cm, Panjang Baju 81 cm, Panjang Lengan 40 cm
L = Lingkar Dada 104 cm, Panjang Baju 82 cm, Panjang Lengan 41 cm
XL = Lingkar Dada 112 cm, Panjang Baju 83 cm, Panjang Lengan 42 cm
2XL = Lingkar Dada 116 cm, Panjang Baju 84 cm, Panjang Lengan 43 cm
3XL = Lingkar Dada 120 cm, Panjang Baju 85 cm, Panjang Lengan 44 cm
Toleransi Ukuran -+ 2cm

Kancing Mewah Aktif

CATATAN! MOHON PERHATIANNYA!
PROSES RETUR DAPAT KAMI BANTU DENGAN SYARAT:
1. ADA VIDEO UNING SAAT PAKET BARU DITERIMA (BUKAN SESUDAH DIBUKA DAN DIVIDEOKAN ULANG)
2. JIKA MEMANG KESALAHAN DARI PIHAK KAMI, MAKA AKAN KAMI BANTU PROSES RETUR BARANG MAUPUN UANG
3. JIKA SUDAH MEMBERIKAN ULASAN/RATING PRODUK BURUK MAKA PROSES PENGAJUAN RETUR TIDAK DAPAT DIBANTU
4. KESALAHAN DARI PIHAK PEMBELI TIDAK DAPAT DITERIMA SEPERTI BERUBAH PIKIRAN, KEKECILAN, KEBESARAN ATAU TIDAK SESUAI SELERA (HARAP BACA DETAIL PRODUK TERLEBIH DAHULU AGAR TIDAK SALAH)
5. HARAP MENGHUBUNGI PENJUAL MELALUI FITUR CHAT
HAPPY SHOPPING!!!!!!!
`.trim()

  const existing = await prisma.produk.findUnique({ where: { kode } })
  if (existing) {
    console.log(`Produk dengan kode ${kode} sudah ada, skipping.`)
    await prisma.$disconnect()
    return
  }

  const variasi = []
  for (const c of colors) {
    for (const s of sizes) {
      variasi.push({
        size: s,
        warna: c.label,
        sku: `${kode}-${c.label.toUpperCase()}-${s}`,
        price: 135000,
        stock: 0,
        isActive: true,
      })
    }
  }

  const produk = await prisma.produk.create({
    data: {
      kode,
      nama: "BAJU KOKO BIN LADEN - BAHAN KATUN MADINAH PREMIUM",
      deskripsi: "Polos Biasa Kasual 100% Katun. Bahan Katun Madinah Premium, lembut, halus, nyaman dan tidak panas.",
      kategoriId,
      brand: "No Brand",
      material: "Katun Madinah Premium (100% Katun)",
      style: "Kasual",
      descHtml,
      weight: 300,
      length: 35,
      width: 25,
      height: 3,
      variasi: {
        create: variasi,
      },
      images: {
        create: images.map((url, i) => ({
          url,
          isPrimary: i === 0,
          order: i,
        })),
      },
    },
    include: { variasi: true, images: true },
  })

  console.log(`Produk created: ${produk.nama} (${produk.kode})`)
  console.log(`  ID: ${produk.id}`)
  console.log(`  Variasi: ${produk.variasi.length}`)
  console.log(`  Images: ${produk.images.length}`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
