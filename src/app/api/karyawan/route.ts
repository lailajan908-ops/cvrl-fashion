import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: Request) {
  try {
    await requireApiRole("Owner")

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const where = status ? { status } : {}

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })

    return Response.json(users)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireApiRole("Owner")

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
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PUT(req: NextRequest) {
  try {
    await requireApiRole("Owner")

    const body = await req.json()
    const { id, email, name, password, role, isActive, noHp, alamat, tanggalMasuk, payrollType, dailyRate, monthlySalary, pieceRate } = body

    if (!id) return Response.json({ error: "ID required" }, { status: 400 })

    const data: any = { email, name, role, isActive, noHp, alamat, payrollType, dailyRate, monthlySalary, pieceRate }
    if (tanggalMasuk) data.tanggalMasuk = new Date(tanggalMasuk)
    if (password) data.password = await bcrypt.hash(password, 10)

    const user = await prisma.user.update({ where: { id }, data })
    return Response.json({ id: user.id, email: user.email, name: user.name, role: user.role })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
