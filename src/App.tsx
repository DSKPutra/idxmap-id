import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { Landing } from '@/pages/Landing'

const TickerDetail = lazy(() =>
  import('@/pages/TickerDetail').then((m) => ({ default: m.TickerDetail })),
)
const InvestorDetail = lazy(() =>
  import('@/pages/InvestorDetail').then((m) => ({ default: m.InvestorDetail })),
)
const Conglomerates = lazy(() =>
  import('@/pages/Conglomerates').then((m) => ({ default: m.Conglomerates })),
)
const ConglomerateDetail = lazy(() =>
  import('@/pages/ConglomerateDetail').then((m) => ({ default: m.ConglomerateDetail })),
)
const NetworkGraphPage = lazy(() =>
  import('@/pages/NetworkGraphPage').then((m) => ({ default: m.NetworkGraphPage })),
)
const LocalForeign = lazy(() =>
  import('@/pages/LocalForeign').then((m) => ({ default: m.LocalForeign })),
)
const MutualFunds = lazy(() =>
  import('@/pages/MutualFunds').then((m) => ({ default: m.MutualFunds })),
)
const FloatScreener = lazy(() =>
  import('@/pages/FloatScreener').then((m) => ({ default: m.FloatScreener })),
)
const Heatmap = lazy(() => import('@/pages/Heatmap').then((m) => ({ default: m.Heatmap })))
const AiQa = lazy(() => import('@/pages/AiQa').then((m) => ({ default: m.AiQa })))
const Pricing = lazy(() => import('@/pages/Pricing').then((m) => ({ default: m.Pricing })))
const Login = lazy(() => import('@/pages/Login').then((m) => ({ default: m.Login })))
const NotFound = lazy(() => import('@/pages/NotFound').then((m) => ({ default: m.NotFound })))

function PageFallback() {
  return <div className="container py-24 text-center text-muted-foreground">Memuat...</div>
}

export function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="ticker/:code" element={<TickerDetail />} />
          <Route path="investor/:id" element={<InvestorDetail />} />
          <Route path="konglomerasi" element={<Conglomerates />} />
          <Route path="konglomerasi/:slug" element={<ConglomerateDetail />} />
          <Route path="jaringan" element={<NetworkGraphPage />} />
          <Route path="lokal-asing" element={<LocalForeign />} />
          <Route path="reksa-dana" element={<MutualFunds />} />
          <Route path="float-screener" element={<FloatScreener />} />
          <Route path="heatmap" element={<Heatmap />} />
          <Route path="tanya" element={<AiQa />} />
          <Route path="harga" element={<Pricing />} />
          <Route path="masuk" element={<Login />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
