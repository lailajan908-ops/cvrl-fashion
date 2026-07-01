import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"

const publicPaths = ["/login", "/api/auth"]

const rolePermissions: Record<string, string[]> = {
  "/chat": ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC", "AdminPenjualan", "Karyawan"],
  "/master/bahan": ["Owner", "ManagerProduksi", "AdminGudang"],
  "/master/produk": ["Owner", "ManagerProduksi", "AdminGudang"],
  "/master/sewing-partner": ["Owner", "ManagerProduksi"],
  "/po-produksi": ["Owner", "ManagerProduksi"],
  "/potong-bahan": ["Owner", "ManagerProduksi", "AdminGudang"],
  "/sewing": ["Owner", "ManagerProduksi", "AdminQC"],
  "/buttonhole": ["Owner", "ManagerProduksi", "AdminQC"],
  "/scan": ["Owner", "ManagerProduksi", "AdminGudang", "AdminQC"],
  "/qc": ["Owner", "AdminQC"],
  "/retur": ["Owner", "AdminQC"],
  "/packing": ["Owner", "AdminGudang", "ManagerProduksi"],
  "/inventory": ["Owner", "AdminGudang", "AdminPenjualan"],
  "/pos": ["Owner", "AdminPenjualan"],
  "/payments": ["Owner", "AdminPenjualan"],
  "/marketplace-upload": ["Owner", "AdminPenjualan"],
  "/promo": ["Owner", "ManagerProduksi", "AdminGudang", "AdminPenjualan"],
  "/karyawan": ["Owner"],
  "/labels": ["Owner"],
}

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl

    if (publicPaths.some((p) => pathname.startsWith(p))) return NextResponse.next()
    if (pathname === "/" || pathname === "") return NextResponse.next()
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/images") || pathname.startsWith("/cvrl") || pathname.startsWith("/manifest") || pathname.startsWith("/icon") || pathname.startsWith("/api/")) return NextResponse.next()

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const login = new URL("/login", req.url)
      login.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(login)
    }

    const role = token.role as string
    if (role === "Owner") return NextResponse.next()

    const matching = Object.entries(rolePermissions).find(([prefix]) =>
      pathname === prefix || pathname.startsWith(prefix + "/")
    )

    if (matching) {
      const allowed = matching[1]
      if (!allowed.includes(role)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url))
      }
    }

    return NextResponse.next()
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
