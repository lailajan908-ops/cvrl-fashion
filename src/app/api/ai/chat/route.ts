import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import OpenAI from "openai"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_stock_summary",
      description: "Get overall stock summary grouped by current stage",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_stock",
      description: "Get stock for a specific product by kode or name, or list all products with stock",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Product code or name to search (optional, empty = all)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_alerts",
      description: "Get low stock alerts for bahan (materials) below minimum stock",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_payroll_summary",
      description: "Get payroll summary for a specific period or all recent payrolls",
      parameters: {
        type: "object",
        properties: {
          periode: { type: "string", description: "Period in YYYY-MM format (optional)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_product_count",
      description: "Get total count of products and variations",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_sales",
      description: "Get recent POS sales summary",
      parameters: {
        type: "object",
        properties: {
          days: { type: "number", description: "Number of days to look back (default 7)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_employee_count",
      description: "Get count of active employees by role",
      parameters: { type: "object", properties: {} },
    },
  },
]

async function executeTool(name: string, args: any): Promise<string> {
  switch (name) {
    case "get_stock_summary": {
      const stages = await prisma.garmentPiece.groupBy({
        by: ["currentStage"],
        _count: true,
      })
      const total = stages.reduce((s, g) => s + g._count, 0)
      const lines = stages.map((s) => `- ${s.currentStage}: ${s._count} pcs`).join("\n")
      return `Total: ${total} pcs\n${lines}`
    }

    case "get_product_stock": {
      const query = args.query?.toString().trim()
      if (query) {
        const produk = await prisma.produk.findFirst({
          where: {
            OR: [
              { kode: { contains: query } },
              { nama: { contains: query } },
            ],
          },
          include: {
            variasi: true,
            garmentPieces: {
              where: { currentStage: { not: "Sold" } },
              select: { size: true, color: true, currentStage: true },
            },
          },
        })
        if (!produk) return `Produk "${query}" tidak ditemukan`
        const available = produk.garmentPieces.filter((g) => g.currentStage === "Packed").length
        const inProduction = produk.garmentPieces.filter((g) => g.currentStage !== "Packed").length
        const variasiList = produk.variasi.map((v) => `${v.size}/${v.warna} (${v.sku})`).join(", ")
        return `**${produk.kode}** - ${produk.nama}\nVariasi: ${variasiList}\nSiap jual (Packed): ${available} pcs\nDalam produksi: ${inProduction} pcs`
      }

      const allProduk = await prisma.produk.findMany({
        include: {
          _count: { select: { garmentPieces: true } },
          garmentPieces: {
            where: { currentStage: "Packed" },
            select: { id: true },
          },
        },
        orderBy: { kode: "asc" },
        take: 20,
      })
      const lines = allProduk.map((p) => `- ${p.kode} ${p.nama}: ${p.garmentPieces.length} siap jual`).join("\n")
      return `Daftar produk (20 pertama):\n${lines}`
    }

    case "get_inventory_alerts": {
      const alerts = await prisma.bahan.findMany({
        where: { stok: { lte: prisma.bahan.fields.stokMinimum } },
      })
      if (alerts.length === 0) return "Semua bahan stok aman"
      return alerts.map((b) => `- ${b.nama} (${b.kode}): ${b.stok} ${b.satuan} (min: ${b.stokMinimum})`).join("\n")
    }

    case "get_payroll_summary": {
      const periode = args.periode?.toString().trim()
      const where: any = {}
      if (periode) where.periode = periode
      const payrolls = await prisma.payroll.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      })
      if (payrolls.length === 0) return "Belum ada data payroll"
      const totalPay = payrolls.reduce((s, p) => s + p.netPay, 0)
      const lines = payrolls.map(
        (p) => `- ${p.user.name}: Rp ${p.netPay.toLocaleString("id-ID")} (${p.status})`
      ).join("\n")
      return `Total: Rp ${totalPay.toLocaleString("id-ID")}\n${lines}`
    }

    case "get_product_count": {
      const produkCount = await prisma.produk.count()
      const variasiCount = await prisma.produkVariasi.count()
      const pieceCount = await prisma.garmentPiece.count()
      return `Produk: ${produkCount}\nVariasi: ${variasiCount}\nTotal unit (garment pieces): ${pieceCount}`
    }

    case "get_recent_sales": {
      const days = args.days || 7
      const since = new Date()
      since.setDate(since.getDate() - days)
      const sales = await prisma.sale.findMany({
        where: { saleDate: { gte: since } },
        include: { soldBy: { select: { name: true } }, _count: { select: { items: true } } },
        orderBy: { saleDate: "desc" },
        take: 10,
      })
      const total = sales.reduce((s, sale) => s + sale.totalAmount, 0)
      const count = sales.length
      const lines = sales.map(
        (s) => `- ${new Date(s.saleDate).toLocaleDateString("id-ID")}: Rp ${s.totalAmount.toLocaleString("id-ID")} (${s._count.items} item) oleh ${s.soldBy.name}`
      ).join("\n")
      return `${count} transaksi dalam ${days} hari terakhir\nTotal: Rp ${total.toLocaleString("id-ID")}\n${lines}`
    }

    case "get_employee_count": {
      const byRole = await prisma.user.groupBy({
        by: ["role"],
        where: { isActive: true },
        _count: true,
      })
      return byRole.map((r) => `- ${r.role}: ${r._count}`).join("\n")
    }

    default:
      return `Unknown tool: ${name}`
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY belum dikonfigurasi" }, { status: 503 })
  }

  const { message, history } = await req.json()
  if (!message?.trim()) {
    return Response.json({ error: "Pesan tidak boleh kosong" }, { status: 400 })
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  })
  const userName = (session.user as any).name || "User"
  const userRole = (session.user as any).role || "Karyawan"

  const systemPrompt = `Kamu adalah asisten AI untuk aplikasi manajemen produksi fashion CVRL. 
Bahasa utama: Bahasa Indonesia.
Kamu membantu user yang bernama ${userName} (role: ${userRole}).

Fitur yang tersedia:
1. Cek stok produk dan bahan baku
2. Data payroll / penggajian karyawan
3. Informasi produk dan variasi
4. Data penjualan (POS)
5. Informasi karyawan

Gunakan tools yang tersedia untuk menjawab pertanyaan user secara akurat.
Jika user ingin upload produk baru, arahkan ke menu Master Produk > Quick Entry AI.
Jika user butuh info lebih detail, arahkan ke halaman terkait di aplikasi.
Jawab dengan ramah dan informatif.`

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...(history || []),
    { role: "user", content: message },
  ]

  try {
      const model = process.env.OPENAI_MODEL || "openai/gpt-4o-mini"
      let response = await openai.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: "auto",
      max_tokens: 1024,
    })

    const choice = response.choices[0]
    let reply = choice.message

    // Handle tool calls
    if (reply.tool_calls) {
      messages.push(reply)
      for (const toolCall of reply.tool_calls) {
        if (toolCall.type !== "function") continue
        const name = toolCall.function.name
        const args = JSON.parse(toolCall.function.arguments)
        const result = await executeTool(name, args)
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        })
      }

      const finalResponse = await openai.chat.completions.create({
        model,
        messages,
        max_tokens: 1024,
      })

      reply = finalResponse.choices[0].message
    }

    return Response.json({
      reply: reply.content || "",
    })
  } catch (err: any) {
    return Response.json({ error: err.message || "Gagal memproses" }, { status: 500 })
  }
}
