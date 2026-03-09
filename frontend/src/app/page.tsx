'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <div style={{ paddingTop: '60px' }}>
      {/* Hero */}
      <div style={{ marginBottom: '64px', textAlign: 'center' }}>
        <p className="section-label" style={{ marginBottom: '16px' }}>
          Bundesliga Scouting Platform
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(3rem, 8vw, 6rem)',
          lineHeight: 0.9,
          letterSpacing: '-0.02em',
          color: '#fff',
          marginBottom: '24px',
        }}>
          FIND THE<br />
          <span style={{ color: 'var(--accent-green)' }} className="accent-glow">
            NEXT TALENT
          </span>
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'rgba(255,255,255,0.4)',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Datengetriebenes Scouting für die Bundesliga. 430 Spieler,
          50+ Metriken, eigene Composite-Scores.
        </p>
      </div>

      {/* Module cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        maxWidth: '960px',
        margin: '0 auto',
      }}>
        <ModuleCard
          href="/raw-stats"
          tag="01"
          title="RAW STATS"
          desc="Rohdaten explorer. Sortiere nach xG, xA, Tackles, Pässen — mit automatischer Per-90-Normalisierung."
          metric="430 Spieler · 50+ Felder"
        />
        <ModuleCard
          href="/moneyball"
          tag="02"
          title="MONEYBALL"
          desc="Definiere dein Spielerprofil. Filtere nach Alter, Marktwert, Körpergröße und Performance-Metriken."
          metric="Multi-Filter Scouting"
        />
        <ModuleCard
          href="/talentlens-plus"
          tag="03"
          title="TALENTLENS+"
          desc="Proprietary composite metrics. Goal Threat Score, Creative Output Rating, Defensive Impact — inspiriert von NBA Advanced Stats."
          metric="4 Composite Scores"
          highlight
        />
      </div>
    </div>
  )
}

function ModuleCard({ href, tag, title, desc, metric, highlight }: {
  href: string; tag: string; title: string; desc: string; metric: string; highlight?: boolean
}) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div className="tl-card" style={{
        padding: '28px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderColor: highlight ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(0,255,135,0.3)'
          el.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = highlight ? 'rgba(0,255,135,0.2)' : 'rgba(255,255,255,0.06)'
          el.style.transform = 'translateY(0)'
        }}
      >
        {highlight && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
            background: 'linear-gradient(90deg, var(--accent-green), transparent)',
          }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '2rem',
            color: 'rgba(255,255,255,0.08)',
            lineHeight: 1,
          }}>{tag}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--accent-green)',
            opacity: 0.7,
            letterSpacing: '0.1em',
          }}>{metric}</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.4rem',
          letterSpacing: '0.05em',
          color: '#fff',
          marginBottom: '12px',
        }}>{title}</h2>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.7,
        }}>{desc}</p>
      </div>
    </Link>
  )
}
