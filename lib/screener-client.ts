import type { ScreenedStock } from './types';

export function buildWhyText(s: ScreenedStock): string {
  const reasons: string[] = [];

  if (s.volumeRatio >= 3) reasons.push(`${s.volumeRatio.toFixed(1)}x Volumen — starkes institutionelles Interesse`);
  else if (s.volumeRatio >= 1.8) reasons.push(`Erhöhtes Handelsvolumen (${s.volumeRatio.toFixed(1)}x Durchschnitt)`);

  if (s.change1d >= 10) reasons.push(`+${s.change1d.toFixed(1)}% heute — starker Katalysator aktiv`);
  else if (s.change1d >= 4) reasons.push(`+${s.change1d.toFixed(1)}% Tages-Momentum`);

  if (s.change5d >= 15) reasons.push(`+${s.change5d.toFixed(1)}% in 5 Tagen — laufende Bewegung`);
  else if (s.change5d >= 6) reasons.push(`Aufwärtstrend der letzten Woche (+${s.change5d.toFixed(1)}%)`);

  if (s.marketCap < 2e9) reasons.push('Small Cap — höheres Kurspotenzial bei Katalysator');
  else if (s.marketCap < 10e9) reasons.push('Mid Cap mit Wachstumspotenzial');

  if (['Technology', 'Semiconductors', 'Biotechnology'].includes(s.sector))
    reasons.push(`Sektor ${s.sector} im strukturellen Aufwind`);

  if (s.weekHigh52 && s.price >= s.weekHigh52 * 0.93)
    reasons.push('Nahe am 52-Wochen-Hoch — möglicher Breakout');

  if (reasons.length === 0) reasons.push('Technisches Momentum und Sektor-Tailwind erkannt');

  return reasons.slice(0, 3).join(' · ');
}
