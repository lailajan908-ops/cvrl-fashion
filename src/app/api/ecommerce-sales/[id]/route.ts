import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

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
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.ecommerceSale.delete({ where: { id } })
  return Response.json({ success: true })
}
