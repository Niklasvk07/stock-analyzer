import Groq from 'groq-sdk';
import type { ScreenedStock, NewsItem } from './types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function generateStockAnalysis(
  stock: ScreenedStock,
  news: NewsItem[]
): Promise<string> {
  if (!process.env.GROQ_API_KEY) return 'Kein GROQ_API_KEY konfiguriert.';

  const newsSnippets = news
    .slice(0, 5)
    .map((n) => `- ${n.headline} (${n.source})`)
    .join('\n');

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `Du bist ein erfahrener Aktienanalyst mit Fokus auf kurzfristige Kursbewegungen (1–14 Tage). Analysiere diese Aktie präzise auf Deutsch.

**Aktie:** ${stock.name} (${stock.ticker})
**Sektor:** ${stock.sector} / ${stock.industry}
**Kurs:** $${stock.price.toFixed(2)}
**Performance:** ${stock.change1d.toFixed(1)}% heute | ${stock.change5d.toFixed(1)}% (5 Tage) | ${stock.change20d.toFixed(1)}% (20 Tage)
**Volumen:** ${stock.volumeRatio.toFixed(1)}x über Durchschnitt
**Marktkapitalisierung:** $${(stock.marketCap / 1e9).toFixed(1)}B
**Katalysator:** ${stock.catalystType}
**Score:** ${stock.score.total}/100

**Aktuelle News:**
${newsSnippets || 'Keine spezifischen News verfügbar.'}

Schreibe 3–4 Absätze:
1. **Warum diese Aktie jetzt?** Was treibt die Bewegung?
2. **Chance/Risiko** – realistisches Upside und was schiefgehen könnte
3. **Kurzfristiger Ausblick (1–14 Tage)**
4. **Aehr-Ähnlichkeit** – Vergleich mit dem Aehr Test Systems Muster

Direkt und konkret. Kein langer Disclaimer.`,
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? 'Analyse nicht verfügbar.';
}

export async function generateBriefSummary(stock: ScreenedStock): Promise<string> {
  if (!process.env.GROQ_API_KEY) return stock.catalystType;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 120,
    messages: [
      {
        role: 'user',
        content: `Schreibe maximal 2 Sätze auf Deutsch warum ${stock.name} (${stock.ticker}) gerade interessant ist.
Kontext: ${stock.change1d.toFixed(1)}% heute, ${stock.volumeRatio.toFixed(1)}x Volumen, Sektor: ${stock.sector}, Katalysator: ${stock.catalystType}.
Nur die Kernaussage, kein Disclaimer.`,
      },
    ],
  });

  return completion.choices[0]?.message?.content ?? stock.catalystType;
}
