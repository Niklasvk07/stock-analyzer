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
    max_tokens: 900,
    messages: [{
      role: 'user',
      content: `Du bist ein erfahrener Aktienanalyst und Kurzfrist-Trader. Analysiere diese Aktie detailliert auf Deutsch für einen Zeithorizont von 1–14 Tagen.

**AKTIE:** ${stock.name} (${stock.ticker})
**Sektor:** ${stock.sector} / ${stock.industry}
**Aktueller Kurs:** $${stock.price.toFixed(2)}
**Performance:** ${stock.change1d >= 0 ? '+' : ''}${stock.change1d.toFixed(1)}% heute | ${stock.change5d >= 0 ? '+' : ''}${stock.change5d.toFixed(1)}% (5 Tage) | ${stock.change20d >= 0 ? '+' : ''}${stock.change20d.toFixed(1)}% (20 Tage)
**Volumen:** ${stock.volumeRatio.toFixed(1)}x über Durchschnitt
**Marktkapitalisierung:** $${(stock.marketCap / 1e9).toFixed(2)}B
**Katalysator:** ${stock.catalystType}
**Score:** ${stock.score.total}/100 (Signal: ${stock.signal})

**AKTUELLE NEWS & EREIGNISSE:**
${newsText}

Erstelle eine strukturierte Analyse mit diesen 5 Abschnitten:

**1. Warum jetzt?**
Was treibt die aktuelle Bewegung? Welcher Katalysator (Earnings, Auftrag, politische Entscheidung, Sektor-Rotation) ist aktiv?

**2. Makro & Politik**
Welche politischen Entwicklungen, Regulierungen, Zinsentscheidungen oder geopolitische Faktoren beeinflussen diese Aktie und den Sektor gerade? (z.B. Chips Act, Zölle, Fed-Entscheidungen, Subventionen)

**3. Kurspotenzial (1–14 Tage)**
Konkreter Ausblick: Wo könnte der Kurs in 1 Woche und in 2 Wochen stehen? Nenne realistische Kursziele (z.B. "+8–12% realistisch, Widerstand bei $X"). Was sind die wichtigsten Trigger für weitere Kursgewinne?

**4. Risiken**
Was könnte schiefgehen? Konkrete Risiken: schlechte Earnings, Sektor-Rotation, politische Gegenwind, technische Widerstände.

**5. Aehr-Ähnlichkeit**
Wie ähnelt dieses Muster dem Aehr Test Systems Lauf (kleines/mittleres Unternehmen, Nischensektor im Aufwind, Katalysator-Event, starkes Volumen)? Bewertung von 1–10.

Sei konkret und direkt. Kein langer Disclaimer.`,
    }],
  });

  return completion.choices[0]?.message?.content ?? 'Analyse nicht verfügbar.';
}

export async function generateBriefSummary(stock: ScreenedStock): Promise<string> {
  if (!process.env.GROQ_API_KEY) return stock.catalystType;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 120,
    messages: [{
      role: 'user',
      content: `2 Sätze auf Deutsch: Warum ist ${stock.name} (${stock.ticker}) jetzt kurzfristig interessant?
Daten: ${stock.change1d.toFixed(1)}% heute, ${stock.volumeRatio.toFixed(1)}x Volumen, Sektor: ${stock.sector}, Signal: ${stock.catalystType}.
Nur Kernaussage, kein Disclaimer.`,
    }],
  });

  return completion.choices[0]?.message?.content ?? stock.catalystType;
}
