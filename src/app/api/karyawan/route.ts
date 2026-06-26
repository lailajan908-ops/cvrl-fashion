import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const users = await prisma.user.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { attendances: true } } },
  })

  return Response.json(users)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { email, name, password, role, noHp, alamat, tanggalMasuk, payrollType, dailyRate, monthlySalary, pieceRate } = body

  if (!email || !name || !password) {
    return Response.json({ error: "Email, nama, dan password wajib diisi" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return Response.json({ error: "Email sudah ada" }, { status: 400 })

  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: role || "Karyawan",
      noHp,
      alamat,
      tanggalMasuk: tanggalMasuk ? new Date(tanggalMasuk) : null,
      payrollType: payrollType || "HarianTetap",
      dailyRate: dailyRate || 0,
      monthlySalary: monthlySalary || 0,
      pieceRate: pieceRate || 0,
    },
  })

  return Response.json({ id: user.id, email: user.email, name: user.name, role: user.role })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, email, name, password, role, isActive, noHp, alamat, tanggalMasuk, payrollType, dailyRate, monthlySalary, pieceRate } = body

  if (!id) return Response.json({ error: "ID required" }, { status: 400 })

  const data: any = { email, name, role, isActive, noHp, alamat, payrollType, dailyRate, monthlySalary, pieceRate }
  if (tanggalMasuk) data.tanggalMasuk = new Date(tanggalMasuk)
  if (password) data.password = await bcrypt.hash(password, 10)

  const user = await prisma.user.update({ where: { id }, data })
  return Response.json({ id: user.id, email: user.email, name: user.name, role: user.role })
}
