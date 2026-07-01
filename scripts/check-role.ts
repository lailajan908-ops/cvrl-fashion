import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function check() {
  const user = await prisma.user.findUnique({ where: { email: "owner@cvrl.com" } });
  console.log("Role:", user?.role, "| isActive:", user?.isActive, "| Name:", user?.name);
  const count = await prisma.user.count();
  console.log("Total users:", count);
  const all = await prisma.user.findMany({ select: { email: true, role: true, isActive: true } });
  console.log("All users:", JSON.stringify(all, null, 2));
  await prisma.$disconnect();
}
check().then(() => process.exit(0));
