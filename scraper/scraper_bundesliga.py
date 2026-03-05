import requests
import pandas as pd

# ─────────────────────────────────────────
# TalentLens — Bundesliga Scraper v2.0
# Quelle: football-data.org API
# Daten: Spieler Basisdaten (Name, Position, Nation, Alter)
# ─────────────────────────────────────────

API_KEY = "aacae5e2d76d414383ce52548763c4a8"
BASE_URL = "https://api.football-data.org/v4"

HEADERS = {
    "X-Auth-Token": API_KEY
}

def get_bundesliga_teams():
    print("🔍 TalentLens — Starte Bundesliga Scraper v2.0...")
    print("📡 Verbinde mit football-data.org API\n")

    url = f"{BASE_URL}/competitions/BL1/teams"

    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
    except Exception as e:
        print(f"❌ Fehler: {e}")
        return None

    data = response.json()
    teams = data.get("teams", [])
    print(f"✅ {len(teams)} Teams gefunden\n")
    return teams


def scrape_bundesliga_players():
    teams = get_bundesliga_teams()
    if not teams:
        return

    all_players = []

    for team in teams:
        team_name = team.get("name", "N/A")
        squad = team.get("squad", [])

        print(f"📋 {team_name}: {len(squad)} Spieler")

        for player in squad:
            all_players.append({
                "Name":         player.get("name", "N/A"),
                "Position":     player.get("position", "N/A"),
                "Nationalität": player.get("nationality", "N/A"),
                "Geburtsdatum": player.get("dateOfBirth", "N/A"),
                "Team":         team_name,
            })

    if not all_players:
        print("\n⚠️ Keine Spieler gefunden.")
        return

    df = pd.DataFrame(all_players)

    # Alter berechnen
    df["Geburtsdatum"] = pd.to_datetime(df["Geburtsdatum"], errors="coerce")
    today = pd.Timestamp.today()
    df["Alter"] = ((today - df["Geburtsdatum"]).dt.days / 365.25).fillna(0).astype(int)
    df["Geburtsdatum"] = df["Geburtsdatum"].dt.strftime("%d.%m.%Y")

    # Speichern
    output_file = "scraper/bundesliga_players.csv"
    df.to_csv(output_file, index=False, encoding="utf-8-sig")

    print(f"\n✅ {len(df)} Spieler gespeichert!")
    print(f"💾 Datei: {output_file}\n")
    print("── Vorschau (erste 10 Spieler) ─────────────────────────")
    print(df.head(10).to_string(index=False))
    print("─────────────────────────────────────────────────────────")


if __name__ == "__main__":
    scrape_bundesliga_players()