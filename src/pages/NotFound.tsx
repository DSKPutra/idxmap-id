import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-6xl font-extrabold text-primary">404</h1>
      <p className="text-muted-foreground">Halaman tidak ditemukan.</p>
      <Button asChild>
        <Link to="/">Kembali ke Beranda</Link>
      </Button>
    </div>
  )
}
