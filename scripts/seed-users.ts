import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })

  const emails = ["adminpenjualan@cvrl.com", "admingudang@cvrl.com", "managerproduksi@cvrl.com"]

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      await prisma.user.delete({ where: { email } })
      console.log(`Deleted: ${email}`)
    }
  }

  console.log("Done!")
  await prisma.$disconnect()
}

main()
