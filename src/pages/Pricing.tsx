import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PriceCountdown } from '@/components/PriceCountdown'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/lib/i18n'

const MAYAR_CHECKOUT_URL =
  import.meta.env.VITE_MAYAR_CHECKOUT_URL || 'https://mayar.id/checkout/idxmap-id'

const FREE_ITEMS = [
  'Instant search ticker & investor',
  'Preview 5 pemegang saham teratas per ticker',
  'Statistik pasar & lokal vs asing',
]
const PAID_ITEMS = [
  'Tabel pemegang saham lengkap, semua ticker',
  'Network graph & peta konglomerasi penuh',
  'Float screener dengan filter lengkap',
  'Tanya IDXMap (AI Q&A)',
  'Akses selamanya, tanpa biaya bulanan',
]

export function Pricing() {
  const { t } = useI18n()
  const { user, isPaid } = useAuth()

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-extrabold sm:text-4xl">{t('pricing.title')}</h1>
        <p className="mt-3 text-muted-foreground">{t('pricing.subtitle')}</p>
        <p className="mt-6 text-sm font-medium text-accent">{t('pricing.earlyBird')}</p>
        <div className="mt-3">
          <PriceCountdown />
        </div>
      </div>

      <div className="mx-auto mt-12 grid max-w-3xl gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gratis</CardTitle>
            <CardDescription>Untuk eksplorasi awal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {FREE_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary shadow-lg">
          <CardHeader>
            <CardTitle>Lifetime</CardTitle>
            <CardDescription>Bayar sekali, akses selamanya</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {PAID_ITEMS.map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col gap-2">
            {isPaid ? (
              <p className="w-full rounded-md bg-secondary p-3 text-center text-sm font-medium">
                Akun Anda sudah memiliki akses lifetime. Terima kasih!
              </p>
            ) : (
              <Button asChild className="w-full" size="lg">
                <a href={MAYAR_CHECKOUT_URL} target="_blank" rel="noreferrer">
                  {t('pricing.cta')}
                </a>
              </Button>
            )}
            {!user && (
              <Button asChild variant="link" className="w-full">
                <Link to="/masuk">{t('paywall.loginPrompt')}</Link>
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
