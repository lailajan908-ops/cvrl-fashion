"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, MessageCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export function ChatPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastFetch = useRef<string>("")

  async function fetchMessages() {
    try {
      const params = lastFetch.current ? `?after=${encodeURIComponent(lastFetch.current)}` : ""
      const res = await fetch(`/api/chat${params}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.length > 0) {
        setMessages((prev) => {
          const existing = new Map(prev.map((m: any) => [m.id, m]))
          for (const m of data) existing.set(m.id, m)
          return [...existing.values()]
        })
        lastFetch.current = data[data.length - 1].createdAt
      }
    } catch {}
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      })
      if (!res.ok) { toast.error("Gagal kirim"); return }
      setText("")
      await fetchMessages()
      inputRef.current?.focus()
    } catch { toast.error("Gagal kirim") }
    finally { setSending(false) }
  }

  const userId = (session?.user as any)?.id
  const today = new Date().toDateString()

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }

  function isToday(dateStr: string) {
    return new Date(dateStr).toDateString() === today
  }

  function isYesterday(dateStr: string) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return new Date(dateStr).toDateString() === yesterday.toDateString()
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    if (isToday(dateStr)) return "Hari ini"
    if (isYesterday(dateStr)) return "Kemarin"
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
  }

  // Group messages by date
  const grouped: { date: string; messages: any[] }[] = []
  let currentDate = ""
  for (const m of messages) {
    const d = new Date(m.createdAt).toDateString()
    if (d !== currentDate) {
      currentDate = d
      grouped.push({ date: m.createdAt, messages: [m] })
    } else {
      grouped[grouped.length - 1].messages.push(m)
    }
  }

  return (
    <Card className="h-[calc(100dvh-10rem)] flex flex-col">
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {grouped.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
              <p className="text-sm">Belum ada pesan. Mulai percakapan!</p>
            </div>
          )}
          {grouped.map((g) => (
            <div key={g.date}>
              <div className="flex justify-center mb-4">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  {formatDate(g.date)}
                </span>
              </div>
              {g.messages.map((m: any) => {
                const isMe = m.sender.id === userId
                return (
                  <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"} mb-2`}>
                    <div className={`max-w-[75%] ${isMe ? "order-1" : "order-1"}`}>
                      {!isMe && (
                        <p className="text-xs text-muted-foreground mb-1 ml-1">
                          {m.sender.name || "Unknown"} · {m.sender.role}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm ${
                          isMe
                            ? "bg-amber-500 text-white rounded-br-md"
                            : "bg-zinc-100 dark:bg-zinc-800 rounded-bl-md"
                        }`}
                      >
                        {m.message}
                      </div>
                      <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="border-t p-4 flex gap-2">
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1"
            disabled={sending}
          />
          <Button type="submit" size="icon" disabled={sending || !text.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
