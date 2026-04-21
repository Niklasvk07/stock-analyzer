# TopMover — Aktien-Scanner Setup

## Schritt 1: Node.js installieren
https://nodejs.org/en/download — LTS Version (20.x oder höher)

## Schritt 2: API-Keys besorgen (kostenlos)

### Finnhub (News + Analyst-Ratings)
1. https://finnhub.io/register — kostenlos registrieren
2. Dashboard → API-Key kopieren

### Anthropic (KI-Analyse)
1. https://console.anthropic.com — Account erstellen
2. API-Keys → "Create Key"
3. Guthaben aufladen (ca. $5 reichen für viele Analysen)

## Schritt 3: Umgebungsvariablen setzen

```bash
cp .env.example .env.local
# .env.local bearbeiten:
FINNHUB_API_KEY=dein_key_hier
ANTHROPIC_API_KEY=dein_key_hier
```

## Schritt 4: Starten

```bash
npm install
npm run dev
```

App läuft auf: http://localhost:3000

## Schritt 5: Deployment auf Vercel

```bash
npm install -g vercel
vercel
```

In Vercel Dashboard → Settings → Environment Variables:
- FINNHUB_API_KEY
- ANTHROPIC_API_KEY

## Features

| Feature | Benötigt |
|---------|----------|
| Screener (Yahoo Finance) | Kein Key nötig |
| News-Feed | Finnhub Key |
| Analysten-Ratings | Finnhub Key |
| KI-Analyse | Anthropic Key |
| Preischarts | Kein Key nötig |

## Screener-Logik

Scannt täglich Yahoo Finance nach:
- **day_gainers** — Top-Gewinner des Tages
- **most_actives** — Meistgehandelte Aktien
- **small_cap_gainers** — Small-Cap-Gewinner
- **aggressive_small_caps** — Aggressive Small Caps

**Scoring-System (0–100 Punkte):**
- Momentum (0–30): 5-Tage + 1-Tage Performance
- Volumen (0–25): Aktuelle vs. 3M-Durchschnittsvolumen
- Sektor (0–20): Attraktivität des Sektors (Tech, Halbleiter etc.)
- Fundamentals (0–15): Marktkapitalisierung, KGV
- News (0–10): Katalysator-Signal

**Signale:**
- STRONG BUY: ≥75 Punkte
- BUY: 60–74 Punkte
- WATCH: 45–59 Punkte
