'use client'

import { useEffect, useRef, useState } from 'react'
import { X, Send, Bot } from 'lucide-react'
import { useChatBot } from '@/hooks/use-api'
import ReactMarkdown from 'react-markdown'

type ChatMessage = {
  role: 'user' | 'bot'
  content: string
}

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  const mutation = useChatBot({
    onAnswer: (answer) => {
      console.log('🚀 ~ ChatBot ~ answer:', answer)
      setMessages((prev) => [...prev, { role: 'bot', content: answer }])
    },
  })

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, mutation.isPending])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed || mutation.isPending) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    mutation.mutate(trimmed)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-3 flex h-[480px] w-[340px] flex-col overflow-hidden rounded-2xl border bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-600 px-4 py-3">
            <span className="text-sm font-semibold text-white">Assistant</span>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white/90 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-3 py-4"
          >
            {messages.length === 0 && (
              <p className="mt-4 text-center text-sm text-gray-400">
                Ask me anything about your HR data.
              </p>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border'
                  }`}
                >
                  {msg.role === 'bot' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-1 prose-ul:my-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl border bg-white px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 border-t bg-white p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 rounded-full border px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || mutation.isPending}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 shadow-lg transition hover:bg-blue-200"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-blue-600" />
        ) : (
          <Bot className="h-6 w-6 text-blue-600" />
        )}
      </button>
    </div>
  )
}
