import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="max-w-sm w-full bg-zinc-900/90 border-zinc-800 text-center">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Akses Ditolak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg h-8 px-2.5 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-black transition-colors"
          >
            Kembali ke Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
