import { useQuery } from '@tanstack/react-query'
import {
  Bot,
  Flame as FlameIcon,
  Network,
  PieChart,
  Search as SearchIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { HotSearches } from '@/components/HotSearches'
import { PriceCountdown } from '@/components/PriceCountdown'
import { SearchBar } from '@/components/SearchBar'
import { StatCounter } from '@/components/StatCounter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

const FEATURES = [
  { icon: SearchIcon, titleKey: 'features.search.title', descKey: 'features.search.desc' } as const,
  { icon: Network, titleKey: 'features.network.title', descKey: 'features.network.desc' } as const,
  {
    icon: ShieldCheck,
    titleKey: 'features.conglomerate.title',
    descKey: 'features.conglomerate.desc',
  } as const,
  { icon: Bot, titleKey: 'features.ai.title', descKey: 'features.ai.desc' } as const,
  { icon: PieChart, titleKey: 'features.float.title', descKey: 'features.float.desc' } as const,
  {
    icon: FlameIcon,
    titleKey: 'features.heatmap.title',
    descKey: 'features.heatmap.desc',
  } as const,
]

const FAQ_ID = [
  {
    q: 'Dari mana sumber data IDXMap.ID?',
    a: 'Seluruh data pemegang saham bersumber dari laporan publik KSEI "Pemegang Saham di atas 1%" yang diterbitkan setiap bulan.',
  },
  {
    q: 'Apakah ini rekomendasi investasi?',
    a: 'Tidak. IDXMap.ID adalah alat riset dan transparansi kepemilikan, bukan nasihat atau rekomendasi jual/beli saham.',
  },
  {
    q: 'Apa yang didapat dari akses lifetime?',
    a: 'Akses lifetime membuka tabel pemegang saham lengkap, network graph, float screener, dan Tanya IDXMap (AI) tanpa batas waktu.',
  },
  {
    q: 'Bagaimana cara pembayaran?',
    a: 'Pembayaran diproses melalui Mayar.id. Setelah pembayaran berhasil, akses aktif otomatis ke email yang Anda gunakan.',
  },
]

export function Landing() {
  const { t } = useI18n()

  const { data: stats } = useQuery({
    queryKey: ['market-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_market_stats').select('*').single()
      if (error) throw error
      return data
    },
  })

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-secondary/60 to-background">
        <div className="container flex flex-col items-center gap-6 py-20 text-center">
          <Badge variant="outline" className="gap-1">
            <Sparkles className="h-3 w-3" /> Sumber data: laporan resmi KSEI
          </Badge>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">{t('hero.subtitle')}</p>

          <div className="w-full max-w-lg">
            <SearchBar />
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/float-screener">{t('hero.ctaPrimary')}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/ticker/QRST">{t('hero.ctaSecondary')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {stats && (
        <section className="border-b border-border">
          <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
            <StatCounter value={stats.ticker_count} label={t('stats.tickers')} />
            <StatCounter value={stats.investor_count} label={t('stats.investors')} />
            <StatCounter value={stats.conglomerate_count} label={t('stats.conglomerates')} />
            <StatCounter value={stats.investor_type_count} label={t('stats.investorTypes')} />
          </div>
        </section>
      )}

      <section className="container py-20">
        <h2 className="mb-10 text-center text-3xl font-bold">{t('features.title')}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.titleKey}>
              <CardHeader>
                <f.icon className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>{t(f.titleKey)}</CardTitle>
                <CardDescription>{t(f.descKey)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-20">
        <div className="container">
          <HotSearches />
        </div>
      </section>

      <section id="harga" className="container py-20 text-center">
        <h2 className="text-3xl font-bold">{t('pricing.title')}</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t('pricing.subtitle')}</p>
        <p className="mt-6 text-sm font-medium text-accent">{t('pricing.earlyBird')}</p>
        <div className="mt-3">
          <PriceCountdown />
        </div>
        <div className="mx-auto mt-8 flex max-w-md flex-col gap-4">
          <p className="text-sm text-muted-foreground">{t('pricing.freeFeatures')}</p>
          <p className="text-sm text-muted-foreground">{t('pricing.paidFeatures')}</p>
          <Button asChild size="lg">
            <Link to="/harga">{t('pricing.cta')}</Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="container max-w-2xl">
          <h2 className="mb-8 text-center text-3xl font-bold">{t('faq.title')}</h2>
          <div className="space-y-4">
            {FAQ_ID.map((item) => (
              <Card key={item.q}>
                <CardHeader>
                  <CardTitle className="text-base">{item.q}</CardTitle>
                  <CardDescription>{item.a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="affiliate" className="border-t border-border bg-primary text-primary-foreground">
        <div className="container flex flex-col items-center gap-3 py-10 text-center">
          <h3 className="text-xl font-bold">Program Afiliasi IDXMap.ID</h3>
          <p className="max-w-lg text-sm opacity-90">
            Bagikan IDXMap.ID ke komunitas investor Anda dan dapatkan komisi dari setiap pembelian
            akses lifetime.
          </p>
          <Button asChild variant="secondary">
            <a href="mailto:partner@idxmap.id">Gabung Program Afiliasi</a>
          </Button>
        </div>
      </section>
    </div>
  )
}
