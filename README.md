# 🔍 TalentLens

> **Advanced Football Scouting & Player Analytics Platform**  
> Datengetriebenes Scouting — NBA-Analytik auf Fussball angewendet.

---

## 🎯 Was ist TalentLens?

TalentLens ist ein Football Scouting Tool das über traditionelle Statistiken hinausgeht.  
Inspiriert von NBA Advanced Metrics wie **True Shooting %**, **PER** und **Net Rating** überträgt TalentLens diese Analytik auf Fussball — mit eigenem Scraper, Supabase-Datenbank und drei spezialisierten Analyse-Modulen.

**Aktueller Stand:** Bundesliga 25/26 · 430 Spieler · 50+ Metriken

---

## ⚡ Module

### 📊 Raw Stats Explorer
Vollständige Rohdaten aller Bundesliga-Spieler. Sortierbar nach xG, xA, Tackles, Pässen, Dribbles und mehr — mit automatischer **Per-90-Normalisierung**.

### 🎯 Moneyball Scout
Definiere dein Spielerprofil und filtere gleichzeitig nach:
- Alter, Körpergröße, Marktwert
- xG/90, Assists/90, Final Third Passes/90
- Tackles/90, Dribbles/90, Rating

### 🧠 TalentLens+
Proprietäre Composite Metrics — inspiriert von NBA Advanced Stats:

| Metric | Beschreibung | NBA-Analogie |
|--------|-------------|--------------|
| **Goal Threat Score (GTS)** | xG/90 + Shot Accuracy + Conversion Rate | True Shooting % |
| **Creative Output Rating (COR)** | xA/90 + Key Passes + Big Chances Created | Assist Rate |
| **Defensive Impact Score (DIS)** | Tackles Won + Interceptions + Clearances + Ball Recovery per 90 | Defensive Rating |
| **Progressive Ball Carrier (PBC)** | Dribbles + Final Third Passes per 90 | Ball Movement IQ |
| **TalentLens Score (TLS)** | Positionsgewichteter Gesamtscore | PER |

---

## 🏗️ Projektstruktur

```
TalentLens/
├── frontend/           # Next.js + TailwindCSS — Scouting Interface
│   └── src/
│       ├── app/
│       │   ├── raw-stats/      # Raw Stats Explorer
│       │   ├── moneyball/      # Moneyball Scout
│       │   └── talentlens-plus/ # Composite Metrics
│       └── lib/
│           ├── supabase.ts     # DB Client + Types
│           └── metrics.ts      # TalentLens+ Berechnungen
├── scraper/            # Python — Sofascore via RapidAPI
│   ├── scraper_sofascore.py       # Spieler-Stammdaten (10 Ligen)
│   └── scraper_sofascore_stats.py # Saisonstatistiken
├── database/           # Schema & Migrations
├── backend/            # (geplant)
└── docs/               # Architektur & Metric-Definitionen
```

---

## 🛠️ Tech Stack

| Layer | Technologie |
|-------|-------------|
| **Frontend** | Next.js 14, React, TailwindCSS |
| **Database** | Supabase (PostgreSQL) |
| **Scraping** | Python, RapidAPI (Sofascore) |
| **Hosting** | Vercel (geplant) |

---

## 🚀 Setup

```bash
git clone https://github.com/Dario2123/TalentLens.git
cd TalentLens
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

**.env.local** im frontend/ Ordner:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Scraper:**
```bash
cd scraper
python scraper_sofascore.py       # Stammdaten
python scraper_sofascore_stats.py # Statistiken
```

**.env** im Root:
```
RAPIDAPI_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_KEY=your_service_role_key
```

---

## 📍 Roadmap

- [x] Scraper: 10 Ligen, 5.378 Spieler
- [x] Statistiken: 50+ Felder via Sofascore API
- [x] Datenbank: Supabase PostgreSQL
- [x] Raw Stats Explorer mit Per-90-Toggle
- [x] Moneyball Scout mit Multi-Filter
- [x] TalentLens+ Composite Metrics
- [ ] Alle 10 Ligen im Frontend
- [ ] Spielerprofil-Seite
- [ ] Ligaübergreifende Vergleiche
- [ ] Vercel Deployment

---

## 👤 Author

**Dario** — [@Dario2123](https://github.com/Dario2123)

---

## 📄 License

MIT License
