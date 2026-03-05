[README.md](https://github.com/user-attachments/files/25771360/README.md)
# 🔍 TalentLens

> **Advanced Football Scouting & Player Analytics Platform**  
> Building smarter scouting through data — inspired by NBA/NFL analytics, applied to football.

---

## 🎯 What is TalentLens?

TalentLens is an open-source football scouting tool that goes beyond traditional stats.  
Inspired by advanced NBA metrics like **Usage Rate**, **True Shooting %**, and **PER**, TalentLens translates this analytical mindset into football — scraping data, storing it in a database, and surfacing intelligent player recommendations through a clean web interface.

---

## ⚡ Core Features

- 📥 **Data Scraping** — Automatically pull player stats from football data sources
- 🗄️ **Database Storage** — Structured storage of raw + processed stats
- 📊 **Advanced Metrics** — Custom football metrics inspired by basketball analytics
- 👤 **Player Profiles** — Visual profiles with stats, ratings, and comparisons
- 🤖 **Player Recommendations** — Find similar players or suggest fits based on a profile
- 🌐 **Web Interface** — Clean, modern frontend to explore and manage scouting data

---

## 📐 Advanced Metrics (TalentLens Custom)

| Metric | Description | Inspired By |
|--------|-------------|-------------|
| **Shot Quality Score (SQS)** | xG per shot — how dangerous are a player's attempts? | True Shooting % |
| **Touch Rate** | Player's share of team ball contacts | Usage Rate |
| **Player Impact Rating (PIR)** | Combined attacking + defensive contribution score | PER |
| **Goal Contribution Value (GCV)** | Goals + Assists weighted by match difficulty | Win Shares |
| **On/Off Field Rating** | Team performance delta when player is on vs off the pitch | Net Rating (+/-) |
| **Progressive Action Rate** | Progressive passes + carries per 90 min | Ball Movement IQ |

---

## 🏗️ Project Structure

```
TalentLens/
├── frontend/       # React + TailwindCSS — Player profiles & UI
├── backend/        # Python FastAPI — REST API & business logic
├── scraper/        # Python scripts — Data collection from sources
├── database/       # PostgreSQL schemas & migrations
└── docs/           # Architecture decisions & metric definitions
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React, TailwindCSS |
| **Backend** | Python, FastAPI |
| **Database** | PostgreSQL |
| **Scraping** | BeautifulSoup, Playwright |
| **Matching / Recommendations** | Python, scikit-learn |
| **Hosting** | Railway / Render |

---

## 🚀 Getting Started

> Setup guide coming soon — project is in early development.

```bash
# Clone the repo
git clone https://github.com/Dario2123/TalentLens.git
cd TalentLens
```

---

## 📍 Roadmap

- [x] Project structure setup
- [ ] Scraper: Basic player stats (goals, assists, minutes)
- [ ] Database schema: Players, matches, stats
- [ ] Advanced metrics calculation engine
- [ ] Player profile page (frontend)
- [ ] Player recommendation engine
- [ ] Search & filter interface

---

## 👤 Author

**Dario** — [@Dario2123](https://github.com/Dario2123)

---

## 📄 License

MIT License — free to use, modify, and build on.
