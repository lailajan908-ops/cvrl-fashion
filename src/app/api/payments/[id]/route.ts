import { NextRequest } from "next/server"
import { prisma } from "@/lib/db"
import { requireApiRole, handleApiAuthError } from "@/lib/api-auth"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    const { id } = await params
    const { status, referenceNumber, notes } = await req.json()

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(referenceNumber !== undefined && { referenceNumber }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        ecommerceSale: { select: { platform: true, orderId: true } },
        sale: { select: { customerName: true, totalAmount: true } },
        recordedBy: { select: { name: true } },
      },
    })

    return Response.json(payment)
  } catch (err) {
    return handleApiAuthError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole("Owner", "AdminPenjualan")

    const { id } = await params

    await prisma.payment.delete({ where: { id } })
    return Response.json({ success: true })
  } catch (err) {
    return handleApiAuthError(err)
  }
}
