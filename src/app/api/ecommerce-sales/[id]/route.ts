import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    const { id } = await params

    const sale = await prisma.ecommerceSale.findUnique({
      where: { id },
      include: {
        payments: {
          include: { recordedBy: { select: { name: true } } },
          orderBy: { paymentDate: "desc" },
        },
      },
    })

    if (!sale) return Response.json({ error: "Not found" }, { status: 404 })
    return Response.json(sale)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    const { id } = await params
    const { customerName, totalAmount, shippingCost, platformFee, netAmount, status, notes } = await req.json()

    const sale = await prisma.ecommerceSale.update({
      where: { id },
      data: {
        ...(customerName !== undefined && { customerName }),
        ...(totalAmount !== undefined && { totalAmount }),
        ...(shippingCost !== undefined && { shippingCost }),
        ...(platformFee !== undefined && { platformFee }),
        ...(netAmount !== undefined && { netAmount }),
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        _count: { select: { payments: true } },
        payments: {
          select: { id: true, amount: true, status: true, paymentMethod: true, paymentDate: true },
        },
      },
    })

    return Response.json(sale)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    const { id } = await params

    await prisma.ecommerceSale.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
