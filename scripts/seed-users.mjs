import { PrismaClient } from "../src/generated/prisma"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const users = [
  { email: "adminpenjualan@cvrl.com", name: "Admin Penjualan", password: "admin123", role: "AdminPenjualan" },
  { email: "admingudang@cvrl.com", name: "Admin Gudang", password: "admin123", role: "AdminGudang" },
  { email: "managerproduksi@cvrl.com", name: "Manager Produksi", password: "admin123", role: "ManagerProduksi" },
]

for (const u of users) {
  const existing = await prisma.user.findUnique({ where: { email: u.email } })
  if (existing) {
    console.log(`Already exists: ${u.email}`)
    continue
  }
  const hashed = await bcrypt.hash(u.password, 10)
  await prisma.user.create({
    data: { email: u.email, name: u.name, password: hashed, role: u.role, isActive: true },
  })
  console.log(`Created: ${u.email} (${u.role})`)
}

console.log("Done!")
await prisma.$disconnect()
