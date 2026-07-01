import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  const produk = await prisma.produk.findMany({ take: 5, include: { variasi: true } })
  for (const p of produk) {
    console.log(`${p.nama} (${p.kode})`)
    console.log(`  Variasi count: ${p.variasi.length}`)
    for (const v of p.variasi) {
      console.log(`    - ${v.warna} / ${v.size} / stock: ${v.stock} / isActive: ${v.isActive} / price: ${v.price}`)
    }
  }

  await prisma.$disconnect()
}

main()
