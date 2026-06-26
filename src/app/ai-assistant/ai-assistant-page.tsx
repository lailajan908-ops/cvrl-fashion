"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

const suggestions = [
  "Lihat stok produk",
  "Ringkasan payroll",
  "Berapa total produk?",
  "Peringatan stok bahan",
  "Penjualan 7 hari terakhir",
  "Jumlah karyawan aktif",
]

export function AiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Halo! Saya asisten AI CVRL. Saya bisa membantu cek stok, data payroll, produk, penjualan, dan informasi lainnya. Ada yang bisa saya bantu?",
    },
  ])
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(false)
  const [configured, setConfigured] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Check if API is configured
    fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ping" }),
    }).then((r) => {
      if (r.status === 503) setConfigured(false)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || loading) return

    const userMsg = text.trim()
    setText("")

    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const history = messages.slice(1).map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, history }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Gagal" }))
        if (res.status === 503) setConfigured(false)
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.error || "Gagal terhubung ke AI"}` }])
        return
      }

      const data = await res.json()
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Coba lagi." }])
    } finally {
      setLoading(false)
    }
  }

  function handleSuggestion(s: string) {
    setText(s)
  }

  if (!configured) {
    return (
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="p-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-semibold">AI Belum Dikonfigurasi</h2>
          <p className="text-sm text-muted-foreground">
            Tambahkan <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code> ke file .env untuk mengaktifkan AI Assistant.
          </p>
          <code className="block bg-muted p-3 rounded text-xs text-left">
            OPENAI_API_KEY=sk-your-key-here
          </code>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-[calc(100vh-10rem)] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${m.role === "user" ? "order-1" : "order-1"}`}>
                <div className="flex items-center gap-2 mb-1">
                  {m.role === "assistant" ? (
                    <>
                      <Bot className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-medium text-amber-500">AI Assistant</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-medium text-muted-foreground">Anda</span>
                      <User className="h-4 w-4 text-muted-foreground" />
                    </>
                  )}
                </div>
                <div
                  className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-amber-500 text-white rounded-br-md"
                      : "bg-zinc-100 dark:bg-zinc-800 rounded-bl-md"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-medium text-amber-500">AI Assistant</span>
                </div>
                <div className="rounded-2xl px-4 py-3 bg-zinc-100 dark:bg-zinc-800 rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="text-xs bg-muted hover:bg-amber-500/10 hover:text-amber-500 transition-colors px-3 py-1.5 rounded-full border border-border"
                >
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tanya sesuatu..."
            className="flex-1"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
