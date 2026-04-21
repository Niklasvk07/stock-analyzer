import Anthropic from '@anthropic-ai/sdk';
import type { ScreenedStock, NewsItem } from './types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateStockAnalysis(
  stock: ScreenedStock,
  news: NewsItem[]
): Promise<string> {
  const newsSnippets = news
    .slice(0, 5)
    .map((n) => `- ${n.headline} (${n.source})`)
    .join('\n');

  const prompt = `Du bist ein erfahrener Aktienanalyst mit Fokus auf kurzfristige Kursbewegungen (1-14 Tage). Analysiere diese Aktie präzise und knapp auf Deutsch.

**Aktie:** ${stock.name} (${stock.ticker})
**Sektor:** ${stock.sector} / ${stock.industry}
**Aktueller Kurs:** $${stock.price.toFixed(2)}
**Performance:** +${stock.change1d.toFixed(1)}% heute | +${stock.change5d.toFixed(1)}% (5 Tage) | +${stock.change20d.toFixed(1)}% (20 Tage)
**Volumen:** ${(stock.volumeRatio).toFixed(1)}x über Durchschnitt (starkes Interesse!)
**Marktkapitalisierung:** $${(stock.marketCap / 1e9).toFixed(1)}B
**Katalysator-Typ:** ${stock.catalystType}
**Score:** ${stock.score.total}/100 (Signal: ${stock.signal})

**Aktuelle News:**
${newsSnippets || 'Keine spezifischen News verfügbar.'}

Schreibe eine prägnante Analyse (3-4 Absätze) mit:
1. **Warum diese Aktie jetzt?** — Was treibt die aktuelle Bewegung an?
2. **Das Chance/Risiko-Profil** — Realistisches Upside-Potenzial und was schiefgehen könnte
3. **Kurzfristiger Ausblick (1-14 Tage)** — Konkrete Einschätzung
4. **Aehr-Ähnlichkeit** — Inwiefern ähnelt dieses Muster dem Aehr Test Systems Lauf (kleines/mittleres Unternehmen, Sektor-Momentum, Katalysator-Event)?

Schreibe direkt, ohne Disclaimer. Keine übertriebenen Warntexte — der Nutzer ist sich bewusst, dass dies keine Garantien sind.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  return content.type === 'text' ? content.text : 'Analyse nicht verfügbar.';
}

export async function generateBriefSummary(stock: ScreenedStock): Promise<string> {
  const prompt = `Schreibe in maximal 2 Sätzen (auf Deutsch) warum ${stock.name} (${stock.ticker}) gerade interessant ist.
Kontext: ${stock.change1d.toFixed(1)}% heute, ${(stock.volumeRatio).toFixed(1)}x Volumen, Sektor: ${stock.sector}, Katalysator: ${stock.catalystType}.
Nur die Kernaussage, kein Disclaimer.`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  return content.type === 'text' ? content.text : stock.catalystType;
}
