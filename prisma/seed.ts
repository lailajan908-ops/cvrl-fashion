import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const DEFAULT_LABELS = [
  { nama: "Premium", icon: "⭐", color: "#FFD700", otomatis: false, order: 1 },
  { nama: "QC Passed", icon: "✅", color: "#22C55E", otomatis: true, order: 2 },
  { nama: "Jahitan Rapi", icon: "🧵", color: "#3B82F6", otomatis: true, order: 3 },
  { nama: "New Arrival", icon: "🆕", color: "#A855F7", otomatis: true, order: 4 },
  { nama: "Limited Color", icon: "🎨", color: "#F97316", otomatis: false, order: 5 },
  { nama: "Stok Terbatas", icon: "⚠️", color: "#EF4444", otomatis: true, order: 6 },
  { nama: "Best Seller", icon: "🏆", color: "#EAB308", otomatis: false, order: 7 },
]

async function main() {
  const ownerEmail = "owner@cvrl.com"
  const existing = await prisma.user.findUnique({ where: { email: ownerEmail } })

  if (!existing) {
    const hashed = await bcrypt.hash("admin123", 12)
    await prisma.user.create({
      data: {
        email: ownerEmail,
        name: "Owner",
        password: hashed,
        role: "Owner",
      },
    })
    console.log("Owner user created: owner@cvrl.com / admin123")
  } else {
    console.log("Owner user already exists")
  }

  // Seed default PROM labels
  for (const label of DEFAULT_LABELS) {
    const existingLabel = await prisma.promoLabel.findUnique({ where: { nama: label.nama } })
    if (!existingLabel) {
      await prisma.promoLabel.create({ data: label })
      console.log(`Label created: ${label.nama}`)
    } else {
      console.log(`Label already exists: ${label.nama}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
