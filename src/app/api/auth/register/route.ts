import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { email, name, password } = await req.json()

    if (!email || !name || !password) {
      return Response.json({ error: "Email, nama, dan password wajib diisi" }, { status: 400 })
    }

    if (password.length < 6) {
      return Response.json({ error: "Password minimal 6 karakter" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return Response.json({ error: "Email sudah terdaftar" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        role: "Karyawan",
        isActive: false,
      },
    })

    return Response.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
  } catch (e) {
    return Response.json({ error: "Gagal mendaftar" }, { status: 500 })
  }
}
