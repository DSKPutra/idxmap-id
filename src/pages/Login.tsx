import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'

export function Login() {
  const { t } = useI18n()
  const { user, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('sending')
    const { error } = await signInWithMagicLink(email)
    if (error) {
      setErrorMsg(error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('auth.magicLinkTitle')}</CardTitle>
          <CardDescription>{t('auth.magicLinkDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'sent' ? (
            <p className="rounded-md bg-secondary p-3 text-sm">{t('auth.linkSent')}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                required
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" className="w-full" disabled={status === 'sending'}>
                {status === 'sending' ? t('common.loading') : t('auth.sendLink')}
              </Button>
              {status === 'error' && <p className="text-sm text-destructive">{errorMsg}</p>}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
