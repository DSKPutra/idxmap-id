import { Map } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'

const DOCS_URL = import.meta.env.VITE_DOCS_URL || 'https://docs.idxmap.id'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-border">
      <div className="container grid gap-8 py-12 md:grid-cols-4">
        <div>
          <div className="mb-3 flex items-center gap-2 font-bold">
            <Map className="h-5 w-5 text-primary" />
            IDXMap.ID
          </div>
          <p className="text-sm text-muted-foreground">{t('footer.disclaimer')}</p>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Produk</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/konglomerasi" className="hover:text-foreground">
                {t('nav.conglomerates')}
              </Link>
            </li>
            <li>
              <Link to="/jaringan" className="hover:text-foreground">
                {t('nav.network')}
              </Link>
            </li>
            <li>
              <Link to="/float-screener" className="hover:text-foreground">
                {t('nav.floatScreener')}
              </Link>
            </li>
            <li>
              <Link to="/heatmap" className="hover:text-foreground">
                {t('nav.heatmap')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Sumber Daya</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a href={DOCS_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">
                {t('footer.docs')}
              </a>
            </li>
            <li>
              <Link to="/harga" className="hover:text-foreground">
                {t('nav.pricing')}
              </Link>
            </li>
            <li>
              <a href="#affiliate" className="hover:text-foreground">
                {t('footer.affiliate')}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-semibold">Data</h4>
          <p className="text-sm text-muted-foreground">
            Sumber: laporan publik KSEI "Pemegang Saham di atas 1%". IDXMap.ID tidak mengambil data
            dari situs pihak ketiga selain KSEI/IDX.
          </p>
        </div>
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} IDXMap.ID. Semua data bersifat informasional, bukan nasihat
        investasi.
      </div>
    </footer>
  )
}
