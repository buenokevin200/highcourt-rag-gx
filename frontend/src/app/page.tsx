'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { sendChat, getMe } from '@/lib/api-client'
import { Send, Scale, LogOut, Menu, FileText, Settings, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sources?: { filename: string; case_number?: string; court?: string; score?: number }[]
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [user, setUser] = useState<{ username: string; is_admin: boolean } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    getMe().then(setUser).catch(() => {
      localStorage.removeItem('token')
      router.push('/login')
    })
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim() || loading) return

    const userMsg: Message = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      const data = await sendChat(query, conversationId)
      setConversationId(data.conversation_id)
      const assistantMsg: Message = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (err: unknown) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Error al procesar la consulta',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-gray-900">HighCourt RAG</span>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
            <MessageSquare className="w-5 h-5" />
            Consultas
          </a>
          <a href="/documents" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
            <FileText className="w-5 h-5" />
            Documentos
          </a>
          {user?.is_admin && (
            <a href="/admin" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              Admin Settings
            </a>
          )}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 truncate">{user?.username}</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600">
            <Menu className="w-5 h-5" />
          </button>
          <Scale className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-gray-900">HighCourt RAG</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
              <Scale className="w-16 h-16 mb-4 text-blue-200" />
              <h2 className="text-xl font-semibold text-gray-600 mb-2">HighCourt RAG</h2>
              <p className="max-w-md">
                Sistema de consulta inteligente de jurisprudencia.
                Haz una pregunta sobre las sentencias disponibles en la base de conocimiento.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex",
              msg.role === 'user' ? "justify-end" : "justify-start"
            )}>
              <div className={cn(
                "max-w-2xl rounded-2xl px-4 py-3",
                msg.role === 'user'
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              )}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1.5">Fuentes:</p>
                    <div className="space-y-1">
                      {msg.sources.map((src, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-gray-500">
                          <FileText className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{src.filename}</span>
                          {src.score && (
                            <span className="text-gray-400 ml-auto">{Math.round(src.score * 100)}%</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Haz una pregunta sobre las sentencias..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
