'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Nav />
          <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

function Nav() {
  const path = usePathname()

  return (
    <nav style={{
      background: 'var(--pitch-900)',
      borderBottom: '1px solid rgba(0,255,135,0.1)',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginRight: '24px' }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.1rem',
          letterSpacing: '0.05em',
          color: 'var(--accent-green)',
        }}>
          TALENT<span style={{ color: 'rgba(255,255,255,0.9)' }}>LENS</span>
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.55)',
          marginLeft: '8px',
          letterSpacing: '0.1em',
          fontWeight: 600,
        }}>
          BUNDESLIGA 25/26
        </span>
      </Link>

      <NavLink href="/raw-stats" active={path === '/raw-stats'} label="Raw Stats" />
      <NavLink href="/moneyball" active={path === '/moneyball'} label="Moneyball" />
      <NavLink href="/talentlens-plus" active={path === '/talentlens-plus'} label="TalentLens+" badge />
      <NavLink href="/about" active={path === '/about'} label="About" />

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.05em',
          fontWeight: 600,
        }}>
          430 SPIELER · SAISON 25/26
        </span>
        <div style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--accent-green)',
          boxShadow: '0 0 8px var(--accent-green)',
        }} />
      </div>
    </nav>
  )
}

function NavLink({ href, active, label, badge }: { href: string; active: boolean; label: string; badge?: boolean }) {
  return (
    <Link href={href} className={`nav-link ${active ? 'active' : ''}`} style={{ position: 'relative' }}>
      {label}
      {badge && (
        <span style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: 'var(--accent-green)',
          boxShadow: '0 0 6px var(--accent-green)',
        }} />
      )}
    </Link>
  )
}
