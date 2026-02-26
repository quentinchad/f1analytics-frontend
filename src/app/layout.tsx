import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'F1 Analytics',
  description: 'Formula 1 analytics powered by FastF1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-f1dark text-f1text min-h-screen">
        <nav className="bg-f1mid border-b border-f1border px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="/" className="text-f1red font-bold text-lg md:text-xl tracking-widest flex-shrink-0">
              F1 ANALYTICS
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex gap-4 text-sm text-f1muted">
              <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
              <a href="/seasons"   className="hover:text-white transition-colors">Seasons</a>
              <a href="/drivers"   className="hover:text-white transition-colors">Drivers</a>
              <a href="/teams"     className="hover:text-white transition-colors">Teams</a>
              <a href="/circuits"  className="hover:text-white transition-colors">Circuits</a>
              <a href="/compare"   className="hover:text-white transition-colors">Compare</a>
            </div>

            {/* Mobile hamburger — pure CSS, no JS */}
            <label htmlFor="nav-toggle" className="md:hidden cursor-pointer p-1 text-f1muted hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
          </div>

          {/* Mobile menu toggled via hidden checkbox */}
          <input type="checkbox" id="nav-toggle" className="hidden peer" />
          <div className="peer-checked:flex hidden flex-col gap-1 pt-3 pb-1 border-t border-f1border/50 mt-3 md:hidden">
            <a href="/dashboard" className="px-2 py-2 text-sm text-f1muted hover:text-white hover:bg-f1border/40 rounded-lg transition-colors">Dashboard</a>
            <a href="/seasons"   className="px-2 py-2 text-sm text-f1muted hover:text-white hover:bg-f1border/40 rounded-lg transition-colors">Seasons</a>
            <a href="/drivers"   className="px-2 py-2 text-sm text-f1muted hover:text-white hover:bg-f1border/40 rounded-lg transition-colors">Drivers</a>
            <a href="/teams"     className="px-2 py-2 text-sm text-f1muted hover:text-white hover:bg-f1border/40 rounded-lg transition-colors">Teams</a>
            <a href="/circuits"  className="px-2 py-2 text-sm text-f1muted hover:text-white hover:bg-f1border/40 rounded-lg transition-colors">Circuits</a>
            <a href="/compare"   className="px-2 py-2 text-sm text-f1muted hover:text-white hover:bg-f1border/40 rounded-lg transition-colors">Compare</a>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
