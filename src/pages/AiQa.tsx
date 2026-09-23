import { Bot, Send, User as UserIcon } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

export function AiQa() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const question = input.trim()
    if (!question || loading) return

    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const { data, error: fnError } = await supabase.functions.invoke('ai-qa', {
        body: { question, lang },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
      if (fnError) throw fnError
      if (data?.error) throw new Error(data.error)
      setMessages((m) => [...m, { role: 'assistant', text: data.answer }])
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'))
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  return (
    <div className="container flex max-w-3xl flex-col py-10">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold">{t('ai.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('ai.subtitle')}</p>
      </div>

      <Card className="flex-1">
        <CardContent className="flex min-h-[50vh] flex-col gap-4 p-6">
          <div className="flex-1 space-y-4 overflow-y-auto">
            {messages.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t('ai.placeholder')}
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                  {m.role === 'user' ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {error && <p className="text-center text-sm text-destructive">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('ai.placeholder')}
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <div className="rounded-md border border-dashed border-border p-4 text-center">
              <p className="mb-2 text-sm text-muted-foreground">{t('ai.loginRequired')}</p>
              <Button asChild size="sm">
                <Link to="/masuk">{t('nav.login')}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="mt-4 text-center text-xs text-muted-foreground">{t('ai.disclaimer')}</p>
    </div>
  )
}
