import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.payment.delete({ where: { id } })
  return Response.json({ success: true })
}
