import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, password } = body

    // Validasi
    if (!name || !password) {
      return Response.json({ error: "Nama dan password wajib diisi" }, { status: 400 })
    }

    if (password.length < 4) {
      return Response.json({ error: "Password minimal 4 karakter" }, { status: 400 })
    }

    // Cek apakah nama sudah ada
    const existing = await prisma.user.findFirst({ 
      where: { name, isActive: false, status: "PENDING" } 
    })
    
    // Jika nama sudah ada dan aktif, berarti sudah terdaftar
    const existingActive = await prisma.user.findFirst({ 
      where: { name, isActive: true } 
    })
    
    if (existingActive) {
      return Response.json({ error: "Nama sudah terdaftar, silakan hubungi Owner untuk aktivasi" }, { status: 400 })
    }

    // Jika belum ada, buat user baru dengan status PENDING
    if (!existing) {
      const hashed = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: {
          name,
          password: hashed,
          role: "Karyawan",
          status: "PENDING",
          isActive: false,
        },
      })

      return Response.json({ 
        success: true, 
        message: "Pendaftaran berhasil! Menunggu persetujuan Owner.",
        id: user.id 
      })
    }

    // Jika sudah ada tapi pending, update password
    const hashed = await bcrypt.hash(password, 10)
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed },
    })

    return Response.json({ 
      success: true, 
      message: "Password berhasil diupdate! Menunggu persetujuan Owner.",
      id: updated.id 
    })

  } catch (err) {
    console.error("Register error:", err)
    return Response.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}