import { Guess, LeaderboardEntry } from './types';

/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance; // Returns distance in km
}

/**
 * Calculates GeoGuessr score up to 5000 points.
 * Perfect match (0m - 25m) yields 5000 points.
 * Score decays exponentially with scaling.
 */
export function calculateScore(distanceKm: number, type: string): number {
  if (distanceKm < 0.05) return 5000; // Under 50m is perfect

  // Map-appropriate scaling
  let k = 1800; // Default globe span
  
  if (type === 'turkey' || type.startsWith('country-')) {
    k = 220; // Country-level precision scale
  } else if (type === 'europe_region' || type === 'asia_region') {
    k = 1000; // Continent-level precision scale
  }

  const score = Math.round(5000 * Math.exp(-distanceKm / k));
  return Math.max(0, Math.min(5000, score));
}

/**
 * Returns a friendly accuracy feedback comment based on distance and score.
 */
export function getAccuracyFeedback(score: number): {
  title: string;
  twColor: string;
  bgClass: string;
} {
  if (score >= 4800) {
    return { title: 'Mükemmel Nokta Atışı!', twColor: 'text-emerald-500', bgClass: 'bg-emerald-500/10 border-emerald-500/30' };
  } else if (score >= 4000) {
    return { title: 'Harika Tahmin!', twColor: 'text-green-500', bgClass: 'bg-green-500/10 border-green-500/30' };
  } else if (score >= 2500) {
    return { title: 'Çok İyi, Yaklaştın!', twColor: 'text-amber-500', bgClass: 'bg-amber-500/10 border-amber-500/30' };
  } else if (score >= 1000) {
    return { title: 'Eh, Fena Değil.', twColor: 'text-yellow-500', bgClass: 'bg-yellow-500/10 border-yellow-500/30' };
  } else if (score >= 200) {
    return { title: 'Oldukça Uzaksın...', twColor: 'text-orange-500', bgClass: 'bg-orange-500/10 border-orange-500/30' };
  } else {
    return { title: 'Başka Bir Kıta Sanırım!', twColor: 'text-red-500', bgClass: 'bg-red-500/10 border-red-500/30' };
  }
}

/**
 * Multi-round summary feedback generator
 */
export function getFinalGameFeedback(totalScore: number): string {
  if (totalScore >= 24000) return 'Sen gerçek bir coğrafya dehasısın! Google Haritalar uzmanı ilan edildin. 🏆';
  if (totalScore >= 20000) return 'Harika bir performans! Detayları harika analiz ediyorsun. 🌟';
  if (totalScore >= 15000) return 'Çok iyi! Dünya ve Türkiye coğrafyasını gayet iyi biliyorsun. 👍';
  if (totalScore >= 8000) return 'Geliştirilebilir ama hiç de fena değil! Bir tur daha oyna! 🚀';
  return 'Haritaya biraz daha yakından baksan iyi olur! Tekrar dene. 🗺️';
}

/**
 * Leaderboard save/load helpers
 */
export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem('geoguessr_leaderboard');
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

export function saveLeaderboardEntry(entry: LeaderboardEntry): LeaderboardEntry[] {
  const current = getLeaderboard();
  current.push(entry);
  current.sort((a, b) => b.score - a.score);
  const trimmed = current.slice(0, 10); // Keep top 10
  localStorage.setItem('geoguessr_leaderboard', JSON.stringify(trimmed));
  return trimmed;
}
