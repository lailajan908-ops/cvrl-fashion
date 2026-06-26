import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import bcrypt from "bcryptjs"

const adapter = new PrismaLibSql({
  url: "file:./dev.db",
})

const prisma = new PrismaClient({ adapter })

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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
