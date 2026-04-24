import Groq from 'groq-sdk';
import type { ScreenedStock, NewsItem } from './types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateStockAnalysis(
  stock: ScreenedStock,
  news: NewsItem[]
): Promise<string> {
  if (!process.env.GROQ_API_KEY) return 'Kein GROQ_API_KEY konfiguriert.';

  const newsText = news.length > 0
    ? news.slice(0, 6).map((n) => `• ${n.headline} (${n.source}, ${new Date(n.datetime * 1000).toLocaleDateString('de-DE')})`).join('\n')
    : 'Keine spezifischen News verfügbar.';

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Du bist ein unabhängiger, kritischer Finanzanalyst. Deine Aufgabe ist eine EHRLICHE, DATENBASIERTE Analyse — KEINE Werbung, KEINE Schönfärberei. Wenn die Daten negativ sind, sage es klar. Du verdienst kein Geld daran, ob jemand kauft oder nicht.

**AKTIE:** ${stock.name} (${stock.ticker})
**Sektor:** ${stock.sector} / ${stock.industry}
**Kurs:** $${stock.price.toFixed(2)}
**Performance:** ${stock.change1d >= 0 ? '+' : ''}${stock.change1d.toFixed(1)}% (heute) | ${stock.change5d >= 0 ? '+' : ''}${stock.change5d.toFixed(1)}% (5T) | ${stock.change20d >= 0 ? '+' : ''}${stock.change20d.toFixed(1)}% (20T)
**Volumen:** ${stock.volumeRatio.toFixed(1)}x über Durchschnitt
**Marktkapitalisierung:** $${(stock.marketCap / 1e9).toFixed(2)}B
**Score:** ${stock.score.total}/100 | Signal: ${stock.signal}

**NEWS:**
${newsText}

Erstelle eine strukturierte Analyse auf Deutsch:

**1. Was treibt die Bewegung?**
Ehrliche Einschätzung: Echter Katalysator (Earnings, Vertrag, Produkt) oder nur Spekulation/Hype? Wie nachhaltig ist das?

**2. Makroumfeld**
Welche externen Faktoren (Zinsen, Zölle, Regulierung, Geopolitik) beeinflussen diese Aktie positiv oder negativ?

**3. Kursprognose 1–14 Tage (3 Szenarien)**
- **Bullish (~X% Wahrscheinlichkeit):** Kurs könnte auf $X steigen, wenn...
- **Neutral (~X% Wahrscheinlichkeit):** Seitwärts bei $X–$X, weil...
- **Bearish (~X% Wahrscheinlichkeit):** Kurs könnte auf $X fallen, wenn...
Wahrscheinlichkeiten müssen zusammen 100% ergeben. Sei realistisch.

**4. Kritische Risiken**
Was könnte GEGEN einen Kauf sprechen? Überbewertung? Schwache Fundamentaldaten? Technischer Widerstand? Sei hier besonders kritisch.

**5. Fazit & klare Empfehlung**
**KAUFEN / HALTEN / NICHT KAUFEN** — mit 2–3 Sätzen Begründung. Wenn du nicht kaufen würdest, sage es direkt.`,
    }],
  });

  return completion.choices[0]?.message?.content ?? 'Analyse nicht verfügbar.';
}

export async function generateBriefSummary(stock: ScreenedStock): Promise<string> {
  if (!process.env.GROQ_API_KEY) return stock.catalystType;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Neutrale 1-Satz-Einschätzung auf Deutsch für ${stock.name} (${stock.ticker}).
Daten: ${stock.change1d.toFixed(1)}% heute, ${stock.volumeRatio.toFixed(1)}x Volumen, ${stock.sector}, Score ${stock.score.total}/100.
Kein Hype, keine Empfehlung — nur sachliche Beobachtung. Maximal 20 Wörter.`,
    }],
  });

  return completion.choices[0]?.message?.content ?? stock.catalystType;
}
