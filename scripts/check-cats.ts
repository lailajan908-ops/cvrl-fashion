import { prisma } from "../src/lib/db"

async function main() {
  const cats = await prisma.kategori.findMany({ orderBy: { nama: "asc" } })
  console.log(JSON.stringify(cats, null, 2))
  await prisma.$disconnect()
}
main()
