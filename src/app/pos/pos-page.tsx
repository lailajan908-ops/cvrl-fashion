"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function POSPage() {
  const router = useRouter()
  const [sales, setSales] = useState<any[]>([])

  const [barcode, setBarcode] = useState("")
  const [cart, setCart] = useState<any[]>([])
  const [customerName, setCustomerName] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const scanRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/pos").then((r) => r.json()).then(setSales).catch(() => {})
  }, [])

  async function addToCart() {
    const code = barcode.trim()
    if (!code) return
    if (cart.find((c) => c.barcode === code)) { toast.error("Barcode sudah di keranjang"); setBarcode(""); return }

    // Lookup barcode info
    const res = await fetch(`/api/barcode/generate?barcode=${encodeURIComponent(code)}`)
    if (!res.ok) { toast.error("Barcode tidak ditemukan"); setBarcode(""); return }
    const piece = await res.json()

    if (piece.currentStage !== "Packed") {
      toast.error(`Barang belum siap jual (stage: ${piece.currentStage})`)
      setBarcode("")
      return
    }

    setCart([...cart, { barcode: code, produk: `${piece.produk?.kode} ${piece.size}/${piece.color}`, price: 0 }])
    setBarcode("")
    scanRef.current?.focus()
  }

  function removeFromCart(idx: number) { setCart(cart.filter((_, i) => i !== idx)) }

  function updatePrice(idx: number, price: number) {
    const updated = [...cart]
    updated[idx] = { ...updated[idx], price }
    setCart(updated)
  }

  function handleBarcodeKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); addToCart() }
  }

  const total = cart.reduce((s, c) => s + c.price, 0)

  async function handleCheckout() {
    if (cart.length === 0) { toast.error("Keranjang kosong"); return }

    setSaving(true)
    const res = await fetch("/api/pos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((c) => ({ barcode: c.barcode, price: c.price })),
        customerName: customerName || null,
        notes: notes || null,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Gagal" }))
      toast.error(err.error || "Gagal")
      setSaving(false)
      return
    }

    toast.success(`Penjualan ${cart.length} item berhasil`)
    setCart([])
    setCustomerName("")
    setNotes("")
    setSaving(false)
    router.refresh()
    fetch("/api/pos").then((r) => r.json()).then(setSales)
    scanRef.current?.focus()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* POS Terminal */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>POS Terminal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                ref={scanRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="Scan barcode barang"
                className="text-lg font-mono"
                autoFocus
              />
              <Button onClick={addToCart}><Plus className="h-4 w-4 mr-2" /> Tambah</Button>
            </div>

            <div className="space-y-2">
              <Label>Nama Pelanggan (opsional)</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Nama pelanggan" />
            </div>

            {cart.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead className="w-32">Harga (Rp)</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{c.barcode}</TableCell>
                        <TableCell className="text-xs">{c.produk}</TableCell>
                        <TableCell>
                          <Input type="number" value={c.price || ""} onChange={(e) => updatePrice(i, parseInt(e.target.value) || 0)} className="h-8" />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeFromCart(i)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="p-4 border-t flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{cart.length} item</p>
                    <Label>Catatan</Label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan (opsional)" className="mt-1" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">Rp {total.toLocaleString()}</p>
                    <Button size="lg" className="mt-2" onClick={handleCheckout} disabled={saving}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {saving ? "Memproses..." : "Bayar"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {cart.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Scan barcode untuk memulai transaksi</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Penjualan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">Belum ada penjualan</TableCell></TableRow>
                )}
                {sales.slice(0, 20).map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">{(s as any)._count?.items ?? 0} item</TableCell>
                    <TableCell className="text-xs font-medium">Rp {s.totalAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{new Date(s.saleDate).toLocaleDateString("id-ID")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
