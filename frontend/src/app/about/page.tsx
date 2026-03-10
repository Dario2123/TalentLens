export default function About() {
  return (
    <div style={{ minHeight: '100vh', padding: '40px 24px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>
          ABOUT
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3rem', letterSpacing: '0.02em', color: '#fff', lineHeight: 1 }}>
          TALENT<span style={{ color: '#00FF87' }}>LENS</span>
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', marginTop: '12px' }}>
          Advanced Football Scouting & Player Analytics Platform
        </p>
      </div>

      {/* What is TalentLens */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.1em', color: '#00FF87', marginBottom: '16px' }}>
          WAS IST TALENTLENS?
        </h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
          TalentLens ist ein datengetriebenes Scouting-Tool das über traditionelle Fußballstatistiken hinausgeht.
          Inspiriert von NBA Advanced Metrics wie <span style={{ color: '#fff' }}>True Shooting %</span>, <span style={{ color: '#fff' }}>PER</span> und <span style={{ color: '#fff' }}>Usage Rate</span> überträgt TalentLens diese analytische Denkweise auf Fußball —
          mit eigenem Scraper, Supabase-Datenbank und drei spezialisierten Analyse-Modulen.
        </p>
      </section>

      {/* Modules */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.1em', color: '#00FF87', marginBottom: '16px' }}>
          DIE MODULE
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            {
              title: 'RAW STATS EXPLORER',
              desc: 'Vollständige Rohdaten aller Bundesliga-Spieler. Sortierbar nach 50+ Metriken mit automatischer Per-90-Normalisierung.'
            },
            {
              title: 'MONEYBALL SCOUT',
              desc: 'Definiere dein Wunschprofil und filtere gleichzeitig nach Alter, Marktwert, xG/90, Tackles/90 und mehr — für smarte Transfers.'
            },
            {
              title: 'TALENTLENS+',
              desc: 'Proprietäre Composite Metrics inspiriert von NBA Advanced Stats: Goal Threat Score, Creative Output Rating, Defensive Impact Score, Progressive Ball Carrier, Offensive Usage Rate und TalentLens Score.'
            },
          ].map(m => (
            <div key={m.title} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px', padding: '20px'
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', color: '#fff', marginBottom: '8px' }}>
                {m.title}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
                {m.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.1em', color: '#00FF87', marginBottom: '16px' }}>
          TECH STACK
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            ['Frontend', 'Next.js 14, React, TailwindCSS'],
            ['Datenbank', 'Supabase (PostgreSQL)'],
            ['Scraping', 'Python, RapidAPI (Sofascore)'],
            ['Hosting', 'Vercel'],
            ['Daten', 'Bundesliga 25/26 · 430 Spieler · 50+ Metriken'],
            ['Metriken', 'NBA-inspirierte Composite Scores'],
          ].map(([label, value]) => (
            <div key={label} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '6px', padding: '14px'
            }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginBottom: '4px' }}>
                {label.toUpperCase()}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* GitHub */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.1em', color: '#00FF87', marginBottom: '16px' }}>
          OPEN SOURCE
        </h2>
        <div style={{
          background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.2)',
          borderRadius: '8px', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px'
        }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              TalentLens ist Open Source. Der vollständige Code — Scraper, Datenbank-Setup und Frontend — ist auf GitHub verfügbar.
            </p>
          </div>
          <a
            href="https://github.com/Dario2123/TalentLens"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.75rem',
              letterSpacing: '0.1em', padding: '10px 20px', borderRadius: '6px',
              background: '#00FF87', color: '#040A0F', textDecoration: 'none',
              whiteSpace: 'nowrap', flexShrink: 0
            }}
          >
            GITHUB →
          </a>
        </div>
      </section>

      {/* Roadmap */}
      <section>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.1em', color: '#00FF87', marginBottom: '16px' }}>
          ROADMAP
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { done: true, text: 'Scraper: 10 Ligen, 5.378 Spieler' },
            { done: true, text: 'Statistiken: 50+ Felder via Sofascore API' },
            { done: true, text: 'Raw Stats Explorer mit Per-90-Toggle' },
            { done: true, text: 'Moneyball Scout mit Multi-Filter' },
            { done: true, text: 'TalentLens+ Composite Metrics inkl. Offensive Usage Rate' },
            { done: false, text: 'Alle 10 Ligen im Frontend' },
            { done: false, text: 'Spielerprofil-Seite mit Radar Chart' },
            { done: false, text: 'Ligaübergreifende Vergleiche' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: item.done ? '#00FF87' : 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                {item.done ? '✓' : '○'}
              </span>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: item.done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  )
}
