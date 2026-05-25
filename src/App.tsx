import React, { useState, useEffect, useRef } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  MapPin,
  Trophy,
  Info,
  Play,
  RotateCcw,
  ArrowRight,
  User,
  Settings,
  X,
  Compass,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Eye,
  ShieldAlert,
  Map,
  Milestone,
  Sparkles,
  Sun,
  Trees,
  Languages,
  Clock,
  Share2,
  Check
} from 'lucide-react';

import { LocationData, Guess, LeaderboardEntry } from './types';
import { LOCATIONS } from './locations';
import { calculateDistance, calculateScore, getAccuracyFeedback, getFinalGameFeedback, saveLeaderboardEntry } from './utils';

// Import our custom sub-components
import InteractiveStreetView from './components/InteractiveStreetView';
import GuessingMap from './components/GuessingMap';
import ApiInfo from './components/ApiInfo';
import StatsDashboard from './components/StatsDashboard';
import { AnimatedCounter } from './components/AnimatedCounter';

// Custom environment api key lookup
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

// Robust, bias-free Fisher-Yates array shuffling algorithm
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
  return arr;
}

interface CountryMap {
  id: string;
  title: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  imageUrl: string;
  desc: string;
}

const COUNTRY_MAPS: CountryMap[] = [
  { id: 'world', title: 'Famous Places', difficulty: 'Zor', imageUrl: 'https://images.unsplash.com/photo-1508849789987-4e5333c12b78?auto=format&fit=crop&w=500&q=80', desc: 'Dünya çapında en ünlü anıtlar, tarihi tapınaklar ve ikonik simge noktaları.' },
  { id: 'turkey', title: 'Türkiye', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=500&q=80', desc: 'Sultanahmet Camii, Efes, Kapadokya ve daha nice Anadolu cennetleri.' },
  { id: 'asia_region', title: 'Asia', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=500&q=80', desc: 'Kamboçya\'dan Malezya\'ya, Çin ve Japonya kapılarına mistik yolculuklar.' },
  { id: 'country-us', title: 'United States', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=500&q=80', desc: 'New York, San Francisco ve Nevada caddelerinde Amerikan rüyası.' },
  { id: 'country-jp', title: 'Japan', difficulty: 'Kolay', imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=500&q=80', desc: 'Tokyo Shibuya geçidi, Kyoto sükuneti ve Fuji dağı etekleri.' },
  { id: 'country-uk', title: 'United Kingdom', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=500&q=80', desc: 'Londra Thames rıhtımı, Iskoç kaleleri ve kadim Stonehenge dairesi.' },
  { id: 'country-fr', title: 'France', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=80', desc: 'Paris Eyfel kulesi, Louvre Müzesi ve Nice sahil kordonları.' },
  { id: 'country-es', title: 'Spain', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?auto=format&fit=crop&w=500&q=80', desc: 'Barcelona Sagrada Familia, Sevilla meydanı ve Endülüs esintileri.' },
  { id: 'country-de', title: 'Germany', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=500&q=80', desc: 'Berlin Brandenburg Kapısı, Münih ve Alplerin yamacındaki şatolar.' },
  { id: 'country-ca', title: 'Canada', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=500&q=80', desc: 'Niagara şelalesi, Vancouver limanı ve turkuaz buzul gölleri.' },
  { id: 'country-pl', title: 'Poland', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=500&q=80', desc: 'Krakow tarihi meydanı, Gdansk rıhtımı ve Varşova eski şehri.' },
  { id: 'country-it', title: 'Italy', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1529243856184-fd5465488984?auto=format&fit=crop&w=500&q=80', desc: 'Roma Kolezyumu, Venedik kanalları ve rüya gibi Positano yamaçları.' },
  { id: 'country-ru', title: 'Russia', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?auto=format&fit=crop&w=500&q=80', desc: 'Moskova Kızıl Meydanı, Petersburg Ermitaj sarayı ve asil mimari.' },
  { id: 'country-br', title: 'Brazil', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=500&q=80', desc: 'Rio Copacabana plajı, İsa heykeli ve Iguazu şelalesi gürültüsü.' },
  { id: 'europe_region', title: 'Europe', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1473951574080-01fe45ec8643?auto=format&fit=crop&w=500&q=80', desc: 'Alplerden Akdeniz kıyılarına, kıtanın en muazzam başkent turları.' },
  { id: 'country-au', title: 'Australia', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=500&q=80', desc: 'Sidney Opera limanı, Melbourne grafiti sokakları ve okyanus yolları.' },
  { id: 'country-id', title: 'Indonesia', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=500&q=80', desc: 'Java Borobudur tapınağı, Bali okyanus falezleri ve egzotik ormanlar.' },
  { id: 'country-nl', title: 'Netherlands', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?auto=format&fit=crop&w=500&q=80', desc: 'Amsterdam Jordaan kanalları, tarihi yeldeğirmenleri ve laleler.' },
  { id: 'country-in', title: 'India', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=500&q=80', desc: 'Tac Mahal, Jaipur rüzgarlı saraylar ve Mumbai pazar renkleri.' },
  { id: 'country-se', title: 'Sweden', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1541675154750-0444c7d51e8e?auto=format&fit=crop&w=500&q=80', desc: 'Stockholm Gamla Stan, şık İskandinav caddeleri ve kutup durakları.' },
  { id: 'country-ch', title: 'Switzerland', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=500&q=80', desc: 'Lauterbrunnen yeşil vadileri, Luzern kentsel köprüleri ve Matterhorn.' },
  { id: 'country-no', title: 'Norway', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?auto=format&fit=crop&w=500&q=80', desc: 'Bergen rıhtımı, muazzam fiyort kıyısı ve Lofoten balıkçı köyleri.' },
  { id: 'country-ua', title: 'Ukraine', difficulty: 'Zor', imageUrl: 'https://images.unsplash.com/photo-1561542320-9a18cd340469?auto=format&fit=crop&w=500&q=80', desc: 'Kyiv Maidan meydanı, Lviv sokak pazar yerleri ve kadim kaleler.' },
  { id: 'country-ar', title: 'Argentina', difficulty: 'Orta', imageUrl: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?auto=format&fit=crop&w=500&q=80', desc: 'Buenos Aires La Boca renkleri, Mendoza bağları ve muhteşem Patagonia.' }
];

export default function App() {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Check if admin is active via URL query parameters
  const showAdminFeatures = useRef(typeof window !== 'undefined' && window.location.search.includes('admin=true')).current;

  // Global maps authentication error state
  const [googleMapsAuthError, setGoogleMapsAuthError] = useState(false);

  useEffect(() => {
    // Google Maps API triggers gm_authFailure on auth error
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps authentication failure (gm_authFailure) detected.");
      setGoogleMapsAuthError(true);
    };
    return () => {
      (window as any).gm_authFailure = null;
    };
  }, []);

  // Game states
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('geoguessr_username') || 'Gezgin';
  });
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [gameStatus, setGameStatus] = useState<'start' | 'playing' | 'guessed' | 'finished'>('start');
  const [gameMode, setGameMode] = useState<string>('turkey');
  
  const [playedLocationIds, setPlayedLocationIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('geoguessr_played_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [gameCategorySelection, setGameCategorySelection] = useState<'classic' | 'countries'>('countries');
  const [countryFilterSearch, setCountryFilterSearch] = useState('');
  
  const [gameRoundsList, setGameRoundsList] = useState<LocationData[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState<number>(0);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  
  const [selectedGuessLatLng, setSelectedGuessLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [activeRoundGuess, setActiveRoundGuess] = useState<Guess | null>(null);
  const [roundGuesses, setRoundGuesses] = useState<Guess[]>([]);
  const [totalScore, setTotalScore] = useState<number>(0);

  // Timer and sharing states
  const [timeLeft, setTimeLeft] = useState<number>(150);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  // Active Tab/Modal helpers
  const [activeMenuTab, setActiveMenuTab] = useState<'play' | 'leaderboard' | 'api-info'>('play');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isMapHovered, setIsMapHovered] = useState(false);
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const mapHoverTimeoutRef = useRef<any>(null);

  const handleMouseEnterMap = () => {
    if (mapHoverTimeoutRef.current) {
      clearTimeout(mapHoverTimeoutRef.current);
      mapHoverTimeoutRef.current = null;
    }
    setIsMapHovered(true);
  };

  const handleMouseLeaveMap = () => {
    if (mapHoverTimeoutRef.current) {
      clearTimeout(mapHoverTimeoutRef.current);
    }
    mapHoverTimeoutRef.current = setTimeout(() => {
      setIsMapHovered(false);
    }, 700); // 700ms grace period completely prevents shrinking while dragging or clicking on Google Maps
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingMap(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      if (mapHoverTimeoutRef.current) {
        clearTimeout(mapHoverTimeoutRef.current);
      }
    };
  }, []);
  
  // Mobile specific UI helper: "pano" or "map" view
  const [mobileActiveView, setMobileActiveView] = useState<'pano' | 'map'>('pano');

  // Sync username to localStorage
  const handleSaveUsername = (name: string) => {
    const trimmed = name.trim();
    if (trimmed) {
      setUsername(trimmed);
      localStorage.setItem('geoguessr_username', trimmed);
      setIsEditingUsername(false);
    }
  };

  // 1. Beginning Phase: Setup & start new game
  const handleStartGame = (mode: string) => {
    let pool: LocationData[] = [];
    
    // Map mode to filters
    if (mode === 'turkey') {
      pool = LOCATIONS.filter((l) => l.category === 'Türkiye' || l.country === 'Türkiye');
    } else if (mode === 'world') {
      pool = LOCATIONS.filter((l) => l.category === 'Dünya');
    } else if (mode === 'world_streets') {
      pool = LOCATIONS.filter((l) => l.category === 'Sokaklar');
    } else if (mode === 'satellite') {
      pool = LOCATIONS; // Satellite mode can use any coordinates
    } else if (mode === 'asia_region') {
      pool = LOCATIONS.filter((l) => l.category === 'Asya' || ['Japonya', 'Hindistan', 'Kamboçya', 'Malezya', 'Çin', 'Kuzey Kore', 'Endonezya', 'Ürdün'].includes(l.country));
    } else if (mode === 'country-us') {
      pool = LOCATIONS.filter((l) => l.country === 'ABD');
    } else if (mode === 'country-jp') {
      pool = LOCATIONS.filter((l) => l.country === 'Japonya');
    } else if (mode === 'country-uk') {
      pool = LOCATIONS.filter((l) => l.country === 'Birleşik Krallık' || l.country === 'İngiltere');
    } else if (mode === 'country-fr') {
      pool = LOCATIONS.filter((l) => l.country === 'Fransa');
    } else if (mode === 'country-es') {
      pool = LOCATIONS.filter((l) => l.country === 'İspanya');
    } else if (mode === 'country-de') {
      pool = LOCATIONS.filter((l) => l.country === 'Almanya');
    } else if (mode === 'country-ca') {
      pool = LOCATIONS.filter((l) => l.country === 'Kanada');
    } else if (mode === 'country-pl') {
      pool = LOCATIONS.filter((l) => l.country === 'Polonya');
    } else if (mode === 'country-it') {
      pool = LOCATIONS.filter((l) => l.country === 'İtalya');
    } else if (mode === 'country-ru') {
      pool = LOCATIONS.filter((l) => l.country === 'Rusya');
    } else if (mode === 'country-br') {
      pool = LOCATIONS.filter((l) => l.country === 'Brezilya');
    } else if (mode === 'europe_region') {
      pool = LOCATIONS.filter((l) => l.category === 'Avrupa' || ['Fransa', 'Birleşik Krallık', 'İsviçre', 'Norveç', 'İsveç', 'İtalya', 'İspanya', 'Almanya', 'Polonya', 'Hollanda', 'Ukrayna', 'Çekya', 'Avusturya'].includes(l.country));
    } else if (mode === 'country-au') {
      pool = LOCATIONS.filter((l) => l.country === 'Avustralya');
    } else if (mode === 'country-id') {
      pool = LOCATIONS.filter((l) => l.country === 'Endonezya');
    } else if (mode === 'country-nl') {
      pool = LOCATIONS.filter((l) => l.country === 'Hollanda');
    } else if (mode === 'country-in') {
      pool = LOCATIONS.filter((l) => l.country === 'Hindistan');
    } else if (mode === 'country-se') {
      pool = LOCATIONS.filter((l) => l.country === 'İsveç');
    } else if (mode === 'country-ch') {
      pool = LOCATIONS.filter((l) => l.country === 'İsviçre');
    } else if (mode === 'country-no') {
      pool = LOCATIONS.filter((l) => l.country === 'Norveç');
    } else if (mode === 'country-ua') {
      pool = LOCATIONS.filter((l) => l.country === 'Ukrayna');
    } else if (mode === 'country-ar') {
      pool = LOCATIONS.filter((l) => l.country === 'Arjantin');
    } else {
      pool = LOCATIONS;
    }

    // Smart randomized logic to minimize repetition in games
    const playedSet = new Set(playedLocationIds);
    const unplayed = pool.filter((l) => !playedSet.has(l.id));
    const played = pool.filter((l) => playedSet.has(l.id));

    const shuffledUnplayed = shuffleArray(unplayed);
    const shuffledPlayed = shuffleArray(played);

    let finalPool = [...shuffledUnplayed, ...shuffledPlayed];

    // Fill pool up to 5 elements if small
    if (finalPool.length < 5) {
      const extra = LOCATIONS.filter((l) => !finalPool.some((f) => f.id === l.id));
      const shuffledExtra = shuffleArray(extra);
      finalPool = [...finalPool, ...shuffledExtra.slice(0, 5 - finalPool.length)];
    }

    const chosenRounds = finalPool.slice(0, 5);

    // Save history
    const updatedPlayed = [...playedLocationIds];
    chosenRounds.forEach((r) => {
      if (!updatedPlayed.includes(r.id)) {
        updatedPlayed.push(r.id);
      }
    });

    if (updatedPlayed.length > 50) {
      updatedPlayed.splice(0, updatedPlayed.length - 50);
    }

    setPlayedLocationIds(updatedPlayed);
    localStorage.setItem('geoguessr_played_ids', JSON.stringify(updatedPlayed));

    setGameRoundsList(chosenRounds);
    setCurrentRoundIndex(0);
    setCurrentLocation(chosenRounds[0]);
    setSelectedGuessLatLng(null);
    setActiveRoundGuess(null);
    setRoundGuesses([]);
    setTotalScore(0);
    setGameMode(mode);
    setGameStatus('playing');
    setMobileActiveView('pano');
  };

  // 2. Guessing Phase: Calculate distance & record score
  const handleGuessSubmit = (isTimeoutParam: boolean | React.MouseEvent<HTMLButtonElement> = false) => {
    const isTimeout = isTimeoutParam === true;
    if (!currentLocation) return;
    if (!selectedGuessLatLng && !isTimeout) return;

    // Fallback coordinates if no location selected before timeout
    const latLng = selectedGuessLatLng || { lat: 39.0, lng: 35.0 };

    const distance = selectedGuessLatLng
      ? calculateDistance(
          currentLocation.lat,
          currentLocation.lng,
          latLng.lat,
          latLng.lng
        )
      : 20000;

    const score = isTimeout ? 0 : calculateScore(distance, gameMode);

    const newGuess: Guess = {
      round: currentRoundIndex + 1,
      targetLat: currentLocation.lat,
      targetLng: currentLocation.lng,
      guessedLat: latLng.lat,
      guessedLng: latLng.lng,
      distanceKm: Number(distance.toFixed(2)),
      score,
      locationName: currentLocation.name,
      isTimeout,
    };

    setActiveRoundGuess(newGuess);
    setRoundGuesses((prev) => [...prev, newGuess]);
    setTotalScore((prev) => prev + score);
    setGameStatus('guessed');
  };

  const handleGuessSubmitRef = useRef(handleGuessSubmit);
  useEffect(() => {
    handleGuessSubmitRef.current = handleGuessSubmit;
  }, [handleGuessSubmit]);

  // Countdown Timer for each round
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    // Reset timer to 150 seconds (2 minutes 30 seconds) whenever round changes or we start playing
    setTimeLeft(150);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleGuessSubmitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameStatus, currentRoundIndex]);

  // 3. Results Phase: Go to next round or finish
  const handleNextRound = () => {
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex < 5 && nextIndex < gameRoundsList.length) {
      setCurrentRoundIndex(nextIndex);
      setCurrentLocation(gameRoundsList[nextIndex]);
      setSelectedGuessLatLng(null);
      setActiveRoundGuess(null);
      setGameStatus('playing');
      setMobileActiveView('pano');
      setIsMapExpanded(false);
    } else {
      // Game Over: Save leaderboard score
      const finalScore = totalScore;
      const entry: LeaderboardEntry = {
        name: username,
        score: finalScore,
        date: new Date().toISOString(),
        mode: gameMode,
      };
      saveLeaderboardEntry(entry);
      setGameStatus('finished');
    }
  };

  const handleRestart = () => {
    setGameStatus('start');
    setGameRoundsList([]);
    setCurrentRoundIndex(0);
    setCurrentLocation(null);
    setSelectedGuessLatLng(null);
    setActiveRoundGuess(null);
    setRoundGuesses([]);
    setTotalScore(0);
  };

  const handleShare = async () => {
    const shareUrl = window.location.href.split('?')[0];
    const shareMessage = `🎯 GeoGuessr Türkiye & Dünya Oyunu\n👤 Oyuncu: ${username}\n🏆 Toplam Skor: ${totalScore.toLocaleString()} Puan / 25,000\n\nBakalım benim skorumu geçebilecek misin? Hemen tıkla ve oyna:\n🔗 ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'GeoGuessr Skor Bildirimi',
          text: shareMessage,
          url: shareUrl,
        });
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2500);
      } catch (err) {
        try {
          await navigator.clipboard.writeText(shareMessage);
          setShareStatus('copied');
          setTimeout(() => setShareStatus('idle'), 2500);
        } catch (clipErr) {
          setShareStatus('error');
          setTimeout(() => setShareStatus('idle'), 2500);
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareMessage);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2500);
      } catch (err) {
        setShareStatus('error');
        setTimeout(() => setShareStatus('idle'), 2500);
      }
    }
  };

  // SPLASH SCREEN FOR MISSING CONFIG
  if (!hasValidKey) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-slate-950 to-slate-950 pointer-events-none" />
        
        <div className="max-w-2xl w-full bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500 animate-bounce">
            <Compass className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black font-display tracking-tight text-white">Google Maps API Anahtarı Gerekli</h2>
            <p className="text-xs text-slate-400">
              GeoGuessr oyununun yüklenebilmesi, harita koordinatlarının sorgulanması ve sokak panoramasının çizilmesi için API anahtarınızı girmeniz gerekmektedir.
            </p>
          </div>

          <div className="bg-slate-950/80 rounded-2xl p-6 text-left border border-slate-800 space-y-4 text-xs">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">1</span>
              <div>
                <strong className="text-white text-sm">Ücretsiz Bir API Anahtarı Alın:</strong>
                <p className="text-slate-400 mt-0.5">
                  Google Cloud Console üzerinden bir harita projesi oluşturmak ve anahtarınızı almak için{' '}
                  <a
                    href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline font-semibold"
                  >
                    buraya tıklayın
                  </a>.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">2</span>
              <div>
                <strong className="text-white text-sm">Sırrı AI Studio'ya Ekleyin:</strong>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Ekranın sağ üst köşesindeki <strong className="text-white">Settings (⚙️ Dişli çark)</strong> simgesine tıklayın,{' '}
                  <strong className="text-emerald-400">Secrets (Sırlar)</strong> sekmesini açın. Sır ismi kısmına{' '}
                  <code className="bg-slate-900 border border-slate-800 px-1 py-0.5 rounded text-rose-400 font-mono">GOOGLE_MAPS_PLATFORM_KEY</code>{' '}
                  yazın ve değer kısmına aldığınız API anahtarını yapıştırıp onaylayın.
                </p>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] text-blue-300 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Sırrı eklediğinizde uygulama penceresi otomatik olarak baştan derlenecektir. Tarayıcı sayfasını yenilemenize gerek yoktur.</span>
            </div>
          </div>

          <div className="pt-2">
            <p className="text-[10px] text-slate-500 font-mono">
              Sokak Görünümü & Uydu Doğrulama Sistemi • 2026 GeoGuessr Clone
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/20 selection:text-blue-300 relative">
        
        {/* Sleek Ambient Vignette */}
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.7)] z-[5]" />

        {/* TOP STATUS BAR & HEADER */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 px-6 py-4 sticky top-0 z-40 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <button 
              onClick={handleRestart}
              className="flex items-center gap-3.5 cursor-pointer group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-blue-600/20 transition-all duration-300">
                <Compass className="w-5.5 h-5.5 text-white animate-spin-slow group-hover:rotate-45 transition-transform duration-300" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight text-white font-display">GeoGuessr <span className="text-blue-500">Maps</span></h1>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase">Keşif ve Harita Tahmin Oyunu</p>
              </div>
            </button>

            {/* HEADER CURRENT USER BAR */}
            <div className="flex items-center gap-3">
              {isEditingUsername ? (
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/50 p-1.5 rounded-xl shadow-xl">
                  <input
                    type="text"
                    defaultValue={username}
                    maxLength={15}
                    onBlur={(e) => handleSaveUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveUsername((e.target as HTMLInputElement).value);
                    }}
                    autoFocus
                    className="bg-transparent border-0 outline-0 text-xs px-2 text-white max-w-[100px] font-sans"
                  />
                  <button 
                    onClick={() => setIsEditingUsername(false)}
                    className="text-xs text-slate-450 hover:text-white px-1.5 font-medium"
                  >
                    Kapat
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingUsername(true)}
                  className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-xl text-xs hover:bg-slate-800 transition shadow-lg cursor-pointer font-medium"
                  title="Kullanıcı adını değiştir"
                >
                  <User className="w-4 h-4 text-blue-500 animate-pulse" />
                  <span className="text-slate-355">Gezgin: <strong className="text-white font-bold">{username}</strong></span>
                </button>
              )}

              {gameStatus === 'playing' || gameStatus === 'guessed' ? (
                <div className="hidden md:flex items-center gap-5 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 px-4 py-2 rounded-xl shadow-lg text-xs font-mono">
                  <div className="text-slate-400">
                    Tur: <span className="text-white font-black">{currentRoundIndex + 1} / 05</span>
                  </div>
                  <div className="h-4 w-px bg-slate-700/50" />
                  
                  {gameStatus === 'playing' && (
                    <>
                      <div className="text-slate-450 flex items-center gap-1.5 font-mono">
                        <Clock className={`w-4 h-4 ${timeLeft <= 30 ? 'text-red-550 animate-pulse' : 'text-blue-400'}`} />
                        <span className={`font-black ${timeLeft <= 30 ? 'text-red-400' : 'text-slate-205'}`}>
                          {formatTime(timeLeft)}
                        </span>
                      </div>
                      <div className="h-4 w-px bg-slate-700/50" />
                    </>
                  )}

                  <div className="text-slate-400">
                    Toplam Puan: <AnimatedCounter value={totalScore} className="text-emerald-400 font-black" />
                  </div>
                </div>
              ) : null}

              {showAdminFeatures && (
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/50 backdrop-blur text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shadow-lg animate-pulse"
                  title="Google Platform & API Limit Paneli (Yalnızca Admin)"
                >
                  <Settings className="w-4.5 h-4.5" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* CONTAINER FOR VIEWS */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            
            {/* 1. START SCREEN */}
            {gameStatus === 'start' && (
              <motion.div
                key="start-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-12"
              >
                {/* HERO INTEGRITY CARD */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950/95 backdrop-blur-xl border border-slate-700/45 p-8 sm:p-14 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10">
                  {/* Subtle Grid Mapping Effect */}
                  <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.15) 0%, transparent 80%)' }} />
                  <div className="absolute inset-0 border-t border-white/5 pointer-events-none" />

                  <div className="max-w-2xl space-y-6 z-10 text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 shadow-lg">
                      <Sparkles className="w-4 h-4 text-blue-400 animate-spin-slow" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 font-mono">Keşif ve Görsel Hafıza Mücadelesi</span>
                    </div>

                    <h2 className="text-4xl sm:text-6xl font-black font-display tracking-tight text-white leading-tight">
                      İpuçlarını Takip Et <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-350 to-indigo-400">Dünyayı Tahmin Et!</span>
                    </h2>
                    
                    <p className="text-slate-400 text-sm sm:text-base leading-relaxed font-sans max-w-xl">
                      Kendinizi ansızın tanımadığınız bir sokakta, antik kalıntının önünde ya da gökyüzünden bir uydu panoramasında bulun. Mimariyi, tabelaları, bitki örtüsünü ve plakaları inceleyip yerinizi saptayın!
                    </p>
                  </div>

                  {/* MINI COGNITIVE TERMINAL BADGE */}
                  <div className="w-full max-w-sm shrink-0 bg-slate-950/85 border border-slate-800 rounded-2xl p-6 shadow-2xl z-10 font-mono text-[11px] space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <span className="text-blue-400 font-black tracking-wider flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-blue-400 animate-pulse" />
                        GEOGUESS ENGINE
                      </span>
                      <span className="text-slate-500 uppercase">ONLINE</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-400">
                        <span>Hedef Mesafe Ölçümü:</span>
                        <span className="text-white">Çift Hassasiyetli Haversine</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Puan Algoritması:</span>
                        <span className="text-emerald-400 font-bold">Logaritmik Hassasiyet</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Görüntüleme Teknolojisi:</span>
                        <span className="text-white">Google Street View API</span>
                      </div>
                    </div>

                    <div className="border border-slate-850 p-3 rounded-xl bg-slate-900/40 space-y-2">
                      <div className="text-slate-400 font-bold flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                        <span>Kazanılabilir Başarılar:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded text-[9px] font-bold">🎯 Tam İsabet</span>
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/15 rounded text-[9px] font-bold">🧠 Coğrafya Dehası</span>
                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 rounded text-[9px] font-bold">🗺️ Seyyah</span>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* GAME CATEGORIES SWITCHER PANEL WITH DEEPLY CRAFTED ACCENTS */}
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-slate-800 pb-5">
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-black font-display text-white flex items-center gap-2">
                        <Compass className="w-6 h-6 text-emerald-400 animate-spin-slow" />
                        Oyun Modunu Seçin
                      </h3>
                      <p className="text-xs text-slate-400">Keşfe çıkmak istediğiniz coğrafyayı, ülkeyi veya özel oyun modunu belirleyin.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Interactive Switcher */}
                      <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
                        <button
                          onClick={() => setGameCategorySelection('classic')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                            gameCategorySelection === 'classic'
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-900/20'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Klasik Modlar
                        </button>
                        <button
                          onClick={() => setGameCategorySelection('countries')}
                          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer relative ${
                            gameCategorySelection === 'countries'
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-900/20'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Map className="w-3.5 h-3.5" />
                          Ülke & Bölge Turlarımız
                          <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        </button>
                      </div>

                      {/* Instant Search input (Only visible on country maps) */}
                      {gameCategorySelection === 'countries' && (
                        <div className="relative w-full sm:w-60">
                          <input
                            type="text"
                            placeholder="Ülke veya bölge ara..."
                            value={countryFilterSearch}
                            onChange={(e) => setCountryFilterSearch(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none transition"
                          />
                          {countryFilterSearch && (
                            <button
                              onClick={() => setCountryFilterSearch('')}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1. CLASSIQUE MODE SELECTION CARDS */}
                  {gameCategorySelection === 'classic' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* MODE 1: TÜRKİYE */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-750 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-xl group cursor-pointer"
                        onClick={() => handleStartGame('turkey')}
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner group-hover:bg-rose-500/25 transition">
                            <Map className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-white text-md">Türkiye Turu</h4>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Kolay-Orta</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Kapadokya, Efes Antik Kenti ve Sümela Manastırı gibi Türkiye'nin en nadide tarihi miraslarını ve doğal harikalarını tahmin edin.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartGame('turkey'); }}
                          className="w-full py-2.5 bg-slate-800 hover:bg-rose-600 hover:text-white text-xs font-bold text-slate-300 rounded-xl transition cursor-pointer font-display"
                        >
                          Yolculuğa Başla
                        </button>
                      </motion.div>

                      {/* MODE 2: DÜNYA LİMİTLERİ (LANDMARKS) */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-750 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-xl group cursor-pointer"
                        onClick={() => handleStartGame('world')}
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner group-hover:bg-blue-500/25 transition">
                            <Globe className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-white text-md">Dünya (Meşhur Yerler)</h4>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Orta</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Eyfel Kulesi, Kolezyum ve Tac Mahal gibi dünya tarihine yön vermiş, küresel ölçekteki görkemli mimari anıtları saptayın.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartGame('world'); }}
                          className="w-full py-2.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-xs font-bold text-slate-300 rounded-xl transition cursor-pointer font-display"
                        >
                          Keşfetmeye Başla
                        </button>
                      </motion.div>

                      {/* MODE 3: DÜNYA SOKAKLARI */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/70 hover:bg-slate-900 border border-slate-750 hover:border-emerald-500/35 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-xl group relative overflow-hidden cursor-pointer"
                        onClick={() => handleStartGame('world_streets')}
                      >
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 font-black text-[9px] tracking-widest px-3 py-1 rounded-bl-xl uppercase font-mono shadow-md animate-pulse">
                          YENİ
                        </div>

                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner group-hover:bg-emerald-500/25 transition">
                            <Milestone className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-white text-md">Sokaklar & Mahalleler</h4>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded">Zor</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              <strong>Serbest Gezinti Modu!</strong> Japonya, Londra, Paris, New York ve dahasının arka sokakları. Tabelaları okuyarak ülkeyi saptayın.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartGame('world_streets'); }}
                          className="w-full py-2.5 bg-emerald-500/10 text-emerald-350 border border-emerald-500/30 hover:bg-emerald-555 hover:text-white text-xs font-black rounded-xl transition cursor-pointer font-display"
                        >
                          Sokaklarda Gezin
                        </button>
                      </motion.div>

                      {/* MODE 4: UYDU SANDBOX */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-750 transition-all duration-300 rounded-2xl p-6 flex flex-col justify-between h-72 shadow-xl group cursor-pointer"
                        onClick={() => handleStartGame('satellite')}
                      >
                        <div className="space-y-4">
                          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner group-hover:bg-indigo-500/25 transition">
                            <Eye className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-white text-md">Uydu Sandbox</h4>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/10 text-rose-400 rounded">Uzman</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                              Yalnızca ortofoto uydu görüntüleri! Herhangi bir sokak görüntüsü veya gezinti yok. Sadece nehir çizgileri, ormanlar ve binalar.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartGame('satellite'); }}
                          className="w-full py-2.5 bg-slate-800 hover:bg-indigo-600 hover:text-white text-xs font-bold text-slate-300 rounded-xl transition cursor-pointer font-display"
                        >
                          Uzaydan Analiz Et
                        </button>
                      </motion.div>
                    </div>
                  )}

                  {/* 2. ADVANCED INTERACTIVE COUNTRY MAPS GRID WITH CUSTOM PIXEL REPLICATION */}
                  {gameCategorySelection === 'countries' && (
                    <div className="space-y-4">
                      {/* Grid Display */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {COUNTRY_MAPS.filter(map => {
                          const query = countryFilterSearch.trim().toLowerCase();
                          if (!query) return true;
                          return map.title.toLowerCase().includes(query) || 
                                 map.desc.toLowerCase().includes(query);
                        }).map((map) => {
                          const isAlreadyPlayed = playedLocationIds.includes(map.id);
                          
                          return (
                            <motion.div
                              key={map.id}
                              whileHover={{ y: -4 }}
                              transition={{ duration: 0.2 }}
                              onClick={() => handleStartGame(map.id)}
                              className="group/card flex flex-col justify-between bg-slate-900/40 hover:bg-slate-900 border border-slate-850 hover:border-emerald-500/30 rounded-2xl overflow-hidden aspect-[1.35/1] cursor-pointer shadow-xl transition-all duration-300"
                            >
                              {/* Thumbnail with overlay gradient */}
                              <div className="relative w-full h-full overflow-hidden flex flex-col justify-end p-4">
                                <img
                                  src={map.imageUrl}
                                  alt={map.title}
                                  referrerPolicy="no-referrer"
                                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110 group-hover/card:brightness-110"
                                />
                                {/* Overlay Ambient Shadows */}
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10" />

                                {/* Meta details in card footer */}
                                <div className="relative z-20 flex items-end justify-between w-full">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <h4 className="font-bold text-white text-sm sm:text-md group-hover/card:text-emerald-350 transition">
                                        {map.title}
                                      </h4>
                                      {isAlreadyPlayed && (
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" title="Geçmişte Oynandı" />
                                      )}
                                    </div>
                                    <p className="text-[10px] text-slate-355 line-clamp-1 max-w-[150px]">
                                      {map.desc}
                                    </p>
                                  </div>

                                  {/* Custom Signal Bars Difficulty Meter directly matching user image */}
                                  <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800/80 backdrop-blur">
                                    <div className="flex items-end gap-0.5 h-3">
                                      <div className={`w-0.75 h-1.5 rounded-sm ${
                                        map.difficulty === 'Kolay' ? 'bg-emerald-500' :
                                        map.difficulty === 'Orta' ? 'bg-amber-500' : 'bg-rose-500'
                                      }`} />
                                      <div className={`w-0.75 h-2.5 rounded-sm ${
                                        map.difficulty === 'Kolay' ? 'bg-slate-700' :
                                        map.difficulty === 'Orta' ? 'bg-amber-500' : 'bg-rose-500'
                                      }`} />
                                      <div className={`w-0.75 h-3.5 rounded-sm ${
                                        map.difficulty === 'Zor' ? 'bg-rose-500' : 'bg-slate-700'
                                      }`} />
                                    </div>
                                    <span className={`text-[8.5px] font-black tracking-wider uppercase ${
                                      map.difficulty === 'Kolay' ? 'text-emerald-400' :
                                      map.difficulty === 'Orta' ? 'text-amber-400' : 'text-rose-450'
                                    }`}>
                                      {map.difficulty}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Purple Node Sliders Track exactly representing images */}
                              <div className="bg-slate-950 px-5 py-2.5 border-t border-slate-900/60 shrink-0">
                                <div className="h-0.5 w-full bg-slate-900 relative flex items-center justify-between">
                                  <div className="absolute left-0 right-0 h-0.5 bg-indigo-950/90" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow border border-slate-950 z-10 hover:scale-125 transition-transform" />
                                  <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-950 z-10 hover:bg-slate-500 transition-colors" />
                                  <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-950 z-10 hover:bg-slate-500 transition-colors" />
                                  <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-950 z-10 hover:bg-slate-500 transition-colors" />
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}

                        {COUNTRY_MAPS.filter(map => {
                          const query = countryFilterSearch.trim().toLowerCase();
                          if (!query) return true;
                          return map.title.toLowerCase().includes(query) || 
                                 map.desc.toLowerCase().includes(query);
                        }).length === 0 && (
                          <div className="col-span-full py-12 text-center space-y-3">
                            <MapPin className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
                            <p className="text-sm text-slate-400">Aradığınız kriterlerde bir ülke veya bölge haritası bulunamadı.</p>
                            <button
                              onClick={() => setCountryFilterSearch('')}
                              className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                            >
                              Aramayı temizle ve tüm listeye göz at
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* INFO GUIDE & HIGHSCORES */}
                <div className="space-y-4">
                  <div className="flex gap-2 border-b border-slate-850 pb-px">
                    <button
                      onClick={() => setActiveMenuTab('play')}
                      className={`px-4 py-2 cursor-pointer text-sm font-semibold border-b-2 transition ${
                        activeMenuTab === 'play'
                          ? 'border-emerald-500 text-white font-bold'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      Skor Rehberi
                    </button>
                    <button
                      onClick={() => setActiveMenuTab('leaderboard')}
                      className={`px-4 py-2 cursor-pointer text-sm font-semibold border-b-2 transition ${
                        activeMenuTab === 'leaderboard'
                          ? 'border-emerald-500 text-white font-bold'
                          : 'border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      Skor Geçmişi & Rozetler
                    </button>
                  </div>

                  <div className="py-2">
                    {activeMenuTab === 'play' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300 text-sm">
                        <div className="space-y-4">
                          <h4 className="font-bold text-white text-md flex items-center gap-1.5">
                            <Trophy className="w-4.5 h-4.5 text-yellow-500" />
                            Puanlama Nasıl Çalışır?
                          </h4>
                          <p className="leading-relaxed">
                            Bırakıldığınız noktaya ne kadar yakın tahmin yaparsanız o kadar çok puan alırsınız. 
                            Mesafe ve puan eşleşmesi doğrusal değildir, üstel (logaritmik) decay formülü kullanılır:
                          </p>
                          <ul className="space-y-2.5 text-xs text-slate-400 list-none pl-0">
                            <li className="flex items-center gap-2.5 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl transition duration-200"><Compass className="w-4 h-4 text-emerald-400 shrink-0" /><span className="text-slate-355 font-medium"><strong className="text-white">0 - 50 Metre:</strong> 5000 Tam Puan!</span></li>
                            <li className="flex items-center gap-2.5 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl transition duration-200"><MapPin className="w-4 h-4 text-blue-400 shrink-0" /><span className="text-slate-355 font-medium"><strong className="text-slate-200">1 Kilometre:</strong> ~4900 Puan</span></li>
                            <li className="flex items-center gap-2.5 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl transition duration-200"><MapPin className="w-4 h-4 text-teal-400 shrink-0" /><span className="text-slate-355 font-medium"><strong className="text-slate-200">10 Kilometre:</strong> ~4700 Puan (Ülke modunda ~4400 Puan)</span></li>
                            <li className="flex items-center gap-2.5 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl transition duration-200"><MapPin className="w-4 h-4 text-amber-400 shrink-0" /><span className="text-slate-355 font-medium"><strong className="text-slate-200">100 Kilometre:</strong> ~3800 Puan (Ülke modunda ~2400 Puan)</span></li>
                            <li className="flex items-center gap-2.5 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-2.5 rounded-xl transition duration-200"><MapPin className="w-4 h-4 text-rose-500 shrink-0" /><span className="text-slate-355 font-medium"><strong className="text-slate-200">500+ Kilometre:</strong> Sınırlar dışı, hızlıca sıfıra yaklaşır.</span></li>
                          </ul>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-bold text-white text-md flex items-center gap-2">
                            <HelpCircle className="w-4.5 h-4.5 text-emerald-400" />
                            Taktikler & İpuçları
                          </h4>
                          <p className="leading-relaxed">
                            Kendinizi geliştirmek ve 5000 puana yaklaşmak için şu ipuçlarını göz önünde bulundurun:
                          </p>
                          <ul className="space-y-3 text-xs text-slate-400 list-none pl-0">
                            <li className="flex items-start gap-4 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-3.5 rounded-xl transition duration-200"><Languages className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /><div><strong className="text-white block mb-0.5">Tabela & Dil Analizi</strong><span className="text-slate-400 leading-relaxed text-[11px]">Sokak tabelalarını, dükkan isimlerini, reklam tabelalarını ve dilleri inceleyerek saptama yapın.</span></div></li>
                            <li className="flex items-start gap-4 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-3.5 rounded-xl transition duration-200"><Sun className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" /><div><strong className="text-white block mb-0.5">Güneşin Konumu</strong><span className="text-slate-400 leading-relaxed text-[11px]">Güneş güneydeyse Kuzey Yarımküre'desinizdir. Dünya turlarımızda hayat kurtarır!</span></div></li>
                            <li className="flex items-start gap-4 bg-slate-900/35 hover:bg-slate-900/60 border border-slate-850 p-3.5 rounded-xl transition duration-200"><Trees className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /><div><strong className="text-white block mb-0.5">Coğrafya & Bitki Örtüsü</strong><span className="text-slate-400 leading-relaxed text-[11px]">Bitki çeşitliliğini, ağaç türlerini, toprak rengini ve dağların dikliğini analiz edin.</span></div></li>
                          </ul>
                        </div>
                      </div>
                    )}
                    {activeMenuTab === 'leaderboard' && <StatsDashboard />}
                    {activeMenuTab === 'api-info' && <ApiInfo />}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 2. GAMEPLAY ENVIRONMENT */}
            {(gameStatus === 'playing' || gameStatus === 'guessed') && currentLocation && (
              <motion.div
                key="gameplay-area"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* DYNAMIC GOOGLE MAPS AUTH FAILURE SOLVER PANEL */}
                {googleMapsAuthError && (
                  <div className="bg-rose-950/90 border-2 border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <ShieldAlert className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-md font-bold text-white">Google Haritalar: Fatura (Billing) ve Renksiz Harita Sorunu</h4>
                        <p className="text-xs text-rose-200 leading-relaxed">
                          Girdiğiniz API Anahtarı başarıyla okunarak yüklenmiştir, ancak Google sunucuları projenizde <strong>"BillingNotEnabledMapError"</strong> (Faturalandırma Etkin Değil) hatası döndürdü.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-rose-900/40 pt-4">
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/10 space-y-2 font-sans">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest font-mono block">🎨 Harita Neden Sadece Gri / Renksiz Gözüküyor?</span>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          Google Maps, projenizde aktif bir kredi kartı / fatura hesabı tanımlı olmadığında haritayı kısıtlar. Bu durumda harita <strong>tamamen renksiz (grayscale alpha tonlarında)</strong> yüklenir ve üzerinde <em>"For development purposes only"</em> (Sadece geliştirme amaçlıdır) yazısı biner. Bu bir uygulama hatası değil, Google'ın koyduğu fatura kısıtlamasının sonucudur.
                        </p>
                      </div>
                      
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-rose-500/10 space-y-2 font-sans">
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest font-mono block">🛠️ Adım Adım Kesin Çözüm:</span>
                        <ul className="text-[11px] text-slate-300 space-y-1 my-1 list-decimal pl-4 leading-relaxed">
                          <li>
                            <a href="https://console.cloud.google.com/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold underline">Google Cloud Billing Console</a> sekmesini açın.
                          </li>
                          <li>
                            Haritayı oluşturduğunuz projeyi seçip <strong>"Faturalandırma Hesabı Bağla"</strong> (Link a billing account) butonuna tıklayın.
                          </li>
                          <li>
                            Aktif bir banka/kredi kartı ekleyin. Google her ay <strong>200$ değerinde ücretsiz kullanım kredisini</strong> otomatik olarak tanımlar. Geliştirme/bireysel amaçlı oynamalarda bu limit asla aşılmaz ve cepten para çıkmaz.
                          </li>
                          <li>
                            Kartı bağladıktan birkaç saniye sonra haritanızdaki gri desaturasyon kalkacak ve <strong>tüm harika renklerine</strong> kavuşacaktır.
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/50 p-3 rounded-xl border border-rose-500/10 font-sans">
                      <div className="text-[11px] text-slate-400">
                        🔑 Girilen API Anahtarı: <code className="font-mono text-white tracking-wider bg-slate-900 px-1.5 py-0.5 rounded">{API_KEY.slice(0, 6)}...{API_KEY.slice(-6)}</code>
                      </div>
                      <div className="flex gap-2.5">
                        <a 
                          href="https://console.cloud.google.com/google/maps-apis/overview" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition shadow-lg shrink-0"
                        >
                          Google Cloud Console'u Aç ↗
                        </a>
                        <button
                          onClick={() => setGoogleMapsAuthError(false)}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
                        >
                          Kapat ve Yine de Oyna
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GAMEPLAY HEADER FOR MOBILE */}
                <div className="flex md:hidden items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                  <div>
                    Tur: <span className="text-white font-bold">{currentRoundIndex + 1} / 5</span>
                  </div>
                  {gameStatus === 'playing' && (
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className={`w-3.5 h-3.5 ${timeLeft <= 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`} />
                      <span className={`font-bold ${timeLeft <= 30 ? 'text-red-400 animate-pulse' : 'text-slate-205'}`}>{formatTime(timeLeft)}</span>
                    </div>
                  )}
                  <div>
                    Kumulatif Puan: <AnimatedCounter value={totalScore} className="text-emerald-400 font-bold" />
                  </div>
                </div>

                {/* MOBILE VIEW SWITCH TAB BAR */}
                <div className="flex md:hidden gap-1 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setMobileActiveView('pano')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer transition ${
                      mobileActiveView === 'pano'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🔍 Sokak Görünümü
                  </button>
                  <button
                    onClick={() => setMobileActiveView('map')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer relative transition ${
                      mobileActiveView === 'map'
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🗺️ Tahmin Haritası
                    {selectedGuessLatLng && mobileActiveView !== 'map' && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[76vh] w-full relative">
                  
                  {/* LOW TIME WARNING RED VIGNETTE OVERLAY */}
                  {gameStatus === 'playing' && timeLeft <= 10 && (
                    <div 
                      className="absolute inset-0 pointer-events-none border-4 md:border-8 border-red-600/40 animate-[pulse_1s_infinite] rounded-2xl z-40 transition-all"
                      style={{ boxShadow: 'inset 0 0 50px rgba(220, 38, 38, 0.45)' }}
                    />
                  )}

                  {/* GIANT CENTERED TIMEOUT OVERLAY MODAL */}
                  {gameStatus === 'guessed' && activeRoundGuess?.isTimeout && (
                    <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 rounded-2xl border border-red-500/30">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-slate-900 border border-slate-700/60 p-6 md:p-8 rounded-2xl max-w-lg w-full text-center relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
                      >
                        {/* Red warning glowing bg light */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-650/45 rounded-full blur-[70px] pointer-events-none" />

                        <div className="flex flex-col items-center gap-4 text-center">
                          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/35 flex items-center justify-center text-red-500 animate-pulse">
                            <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
                          </div>

                          <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-xs font-mono font-black text-red-400 uppercase tracking-widest">
                            SÜRE DOLDU!
                          </span>

                          <h2 className="text-2xl font-black text-white font-display tracking-tight mt-1">
                            Geç Kaldın!
                          </h2>

                          <p className="text-xs text-slate-350 leading-relaxed max-w-sm mt-1">
                            Maalesef bu turda tahmin süren bitti ve <strong className="text-red-400">0 Puan</strong> aldın.
                          </p>

                          {/* Secret Location Reveal details card inside the overlay */}
                          <div className="w-full bg-slate-950/50 rounded-xl border border-slate-800 p-4 text-left space-y-2.5 mt-3">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block font-bold">GİZLİ KONUM</span>
                              <strong className="text-sm font-black text-blue-400">{currentLocation.name}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block font-bold">HAKKINDA</span>
                              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold text-slate-300">
                                {currentLocation.description}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={handleNextRound}
                            className="w-full py-3.5 bg-red-600 hover:bg-red-500 hover:shadow-lg hover:shadow-red-650/20 text-white font-black rounded-xl text-xs font-display tracking-widest transition duration-150 inline-flex items-center justify-center gap-2 cursor-pointer shadow-md mt-4"
                          >
                            <span>
                              {currentRoundIndex + 1 >= 5 ? 'OYUNU BİTİR' : 'SIRADAKİ LOKASYONA GEÇ'}
                            </span>
                            <ArrowRight className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}

                  {/* LEFT AREA: MAIN IMMERSIVE STREET VIEW PANORAMA */}
                  <div
                    className={`h-full relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 lg:col-span-8 ${
                      mobileActiveView === 'pano' ? 'block' : 'hidden lg:block'
                    }`}
                  >
                    <InteractiveStreetView
                      lat={currentLocation.lat}
                      lng={currentLocation.lng}
                      heading={currentLocation.heading}
                      pitch={currentLocation.pitch}
                      zoom={currentLocation.zoom}
                      isSatelliteMode={gameMode === 'satellite'}
                    />

                    {/* LARGE BEAUTIFUL FLOATING COUNTDOWN TIMER OVERLAY */}
                    {gameStatus === 'playing' && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none">
                        <div className={`flex flex-col items-center gap-0.5 px-6 py-2.5 rounded-2xl backdrop-blur-md transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${
                          timeLeft <= 10
                            ? 'border border-red-500 bg-red-950/80 text-red-400 animate-[bounce_1s_infinite] scale-110 shadow-red-500/20'
                            : timeLeft <= 30
                            ? 'border border-amber-500/60 bg-slate-950/80 shadow-amber-500/10 text-amber-400 animate-pulse'
                            : 'border border-slate-700/60 bg-slate-950/80 text-white'
                        }`}>
                          <span className={`text-[10px] md:text-[11px] uppercase font-mono tracking-widest font-bold ${
                            timeLeft <= 10 ? 'text-red-300' : 'text-slate-400'
                          }`}>Kalan Süre</span>
                          <div className="flex items-center gap-2.5">
                            <Clock className={`w-5 h-5 md:w-6 md:h-6 ${
                              timeLeft <= 10 ? 'text-red-500 animate-spin' : timeLeft <= 30 ? 'text-amber-500' : 'text-blue-400'
                            }`} style={timeLeft <= 10 ? { animationDuration: '2s' } : undefined} />
                            <span className={`font-mono text-2xl md:text-3xl font-black tracking-tight ${
                              timeLeft <= 10 ? 'text-red-300' : 'text-white'
                             }`}>
                              {formatTime(timeLeft)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* RIGHT AREA: INTEGRATED RE-SIZABLE GUESS MAP (DESKTOP: SIDE-BY-SIDE SEPARATED; MOBILE: FULL TAB VIEW) */}
                  <div
                    className={`transition-all duration-300 ${
                      mobileActiveView === 'map' ? 'block' : 'hidden lg:block'
                    } lg:col-span-4 h-full relative group rounded-2xl overflow-hidden border border-slate-805 bg-slate-950 shadow-2xl hover:scale-[1.02] hover:shadow-blue-500/10 hover:border-slate-700/80 z-20`}
                  >
                    <div className="w-full h-full relative flex flex-col justify-between">
                      
                      {/* GUESS WRAPPER */}
                      <div className="flex-1 min-h-0">
                        <GuessingMap
                          state={gameStatus === 'guessed' ? 'guessed' : 'playing'}
                          targetLatLng={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                          guessLatLng={selectedGuessLatLng}
                          onSetGuessLatLng={(latLng) => setSelectedGuessLatLng(latLng)}
                        />
                      </div>

                      {/* BOTTOM SUBMISSION CONTROLS (Floats nicely over maps container) */}
                      <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl z-20 shadow-xl">
                        
                        {/* GUESS NOTIFICATION DETAILS */}
                        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                          {selectedGuessLatLng ? (
                            <span className="flex items-center gap-2 text-[11px] font-mono text-blue-400">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                              Konum Belirlendi!
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                              <HelpCircle className="w-4 h-4 text-slate-500" />
                              Haritaya tıklayarak pin bırakın.
                            </span>
                          )}

                          <button
                            onClick={() => setIsMapExpanded(!isMapExpanded)}
                            className="hidden lg:block px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-white transition cursor-pointer font-mono border border-slate-700/30"
                          >
                            {isMapExpanded ? 'Haritayı Küçült ⤋' : 'Haritayı Genişlet ⤢'}
                          </button>
                        </div>

                        {/* CTA ACTION BUTTON */}
                        {gameStatus === 'playing' ? (
                          <button
                            disabled={!selectedGuessLatLng}
                            onClick={handleGuessSubmit}
                            className={`w-full py-3 rounded-xl text-xs font-black font-display tracking-wider transition-all duration-205 cursor-pointer flex items-center justify-center gap-2 ${
                              selectedGuessLatLng
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/25 hover:scale-[1.01] active:translate-y-[0.5px]'
                                : 'bg-slate-950/80 border border-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                          >
                            <MapPin className="w-4 h-4" />
                            TAHMİN ET
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <button
                              onClick={handleNextRound}
                              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black font-display tracking-wider transition duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-blue-600/10 hover:scale-[1.01]"
                            >
                              <span>
                                {currentRoundIndex + 1 >= 5 ? 'OYUNU BİTİR' : 'SONRAKİ TUR'}
                              </span>
                              <ArrowRight className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. FLOATING RESULTS BANNER IN GUESSED STATE */}
                {gameStatus === 'guessed' && activeRoundGuess && !activeRoundGuess.isTimeout && (
                  <motion.div
                    key="results-panel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative z-30 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden"
                  >
                    {/* ACCENT COLORED BACKGROUND RADIAL SHADOW */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

                    <div className="space-y-3.5 max-w-2xl text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                        {activeRoundGuess.isTimeout ? (
                          <span className="px-3.5 py-1 rounded-full text-xs font-black tracking-wide border uppercase bg-red-950/80 border-red-500/40 text-red-400 animate-pulse flex items-center gap-1.5 shadow-lg shadow-red-500/10">
                            ⚠️ Geç Kaldın, Süre Doldu!
                          </span>
                        ) : (
                          <span className={`px-3.5 py-1 rounded-full text-xs font-black tracking-wide border uppercase ${
                            getAccuracyFeedback(activeRoundGuess.score).bgClass
                          } ${getAccuracyFeedback(activeRoundGuess.score).twColor}`}>
                            {getAccuracyFeedback(activeRoundGuess.score).title}
                          </span>
                        )}
                        <span className={`px-3 py-1 text-xs font-mono rounded-full ${
                          activeRoundGuess.isTimeout 
                            ? 'bg-red-950/20 border border-red-500/20 text-red-300'
                            : 'bg-slate-950/80 border border-slate-700/50 text-slate-355'
                        }`}>
                          {activeRoundGuess.isTimeout 
                            ? 'Süre Sınırı Aşıldı (Zaman Doldu)' 
                            : <>Mesafe Hata Payı: <strong className="text-white font-black">{activeRoundGuess.distanceKm.toLocaleString()} km</strong></>
                          }
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-xl font-black text-white font-display tracking-tight">
                          {activeRoundGuess.isTimeout ? (
                            <span className="text-red-400">🚨 Süre Sınırı Aşıldı!</span>
                          ) : (
                            <>Gizli Konum: <span className="text-blue-450">{currentLocation.name}</span></>
                          )}
                        </h3>
                        {activeRoundGuess.isTimeout ? (
                          <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-medium">
                            Tahmin etmekte geç kaldınız veya süreyi aştınız! Bu turdan maalesef puan kazanamadınız. Bu turun gizli lokasyonu: <strong className="text-slate-200">{currentLocation.name}</strong>. {currentLocation.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-medium">
                            {currentLocation.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end shrink-0 w-full md:w-auto border-t md:border-t-0 border-slate-800/60 pt-4 md:pt-0">
                      <div className="text-left md:text-right">
                        <span className="block text-[10px] text-slate-400 font-mono uppercase tracking-wider">BU TUR PUANI</span>
                        <strong className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-350 font-display">
                          <AnimatedCounter value={activeRoundGuess.score} prefix="+ " />
                        </strong>
                        <span className="block text-[9px] text-slate-500 font-mono uppercase tracking-widest">MAKSİMUM: 5000</span>
                      </div>

                      <button
                        onClick={handleNextRound}
                        className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs font-display tracking-wider transition duration-150 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
                      >
                        {currentRoundIndex + 1 >= 5 ? 'SKOR ÖZETİ' : 'SIRADAKİ TUR'}
                        <ArrowRight className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 4. GAME OVER SUMMARY */}
            {gameStatus === 'finished' && (
              <motion.div
                key="summary-screen"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto space-y-6"
              >
                
                {/* FINAL HERO BANNER */}
                <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl">
                  {/* Grid Lines Overlay */}
                  <div className="absolute inset-0 bg-cover bg-center opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.4)), radial-gradient(circle at center, transparent 0%, #0f172a 100%)' }}>
                    <div className="w-full h-full flex items-center justify-center opacity-10">
                      <div className="w-full h-[1px] bg-slate-550 absolute"></div>
                      <div className="h-full w-[1px] bg-slate-555 absolute"></div>
                    </div>
                  </div>
                  
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
                  
                  <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center justify-center mx-auto text-yellow-500 shadow-lg mb-4 animate-bounce relative z-10">
                    <Trophy className="w-8 h-8" />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <span className="uppercase tracking-widest text-[10px] font-mono text-blue-400 block font-bold">OYUN TAMAMLANDI</span>
                    <h2 className="text-3xl sm:text-4xl font-black text-white font-display">Tebrikler, {username}!</h2>
                    <p className="text-sm text-slate-350 max-w-md mx-auto leading-relaxed">
                      {getFinalGameFeedback(totalScore)}
                    </p>
                  </div>

                  {/* SCORE DISPLAY FLASHER */}
                  <div className="my-6 inline-block bg-slate-950/85 border border-slate-700/50 rounded-2xl px-10 py-6 text-center shadow-inner relative z-10">
                    <span className="text-[10px] text-slate-450 font-mono uppercase tracking-widest block font-bold">Toplam Kaç Puan Kazandın?</span>
                    <strong className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-sky-350 font-display">
                      <AnimatedCounter value={totalScore} />
                    </strong>
                    <span className="block text-[10px] text-slate-500 font-mono mt-1 uppercase tracking-wider">MAKSİMUM OLASI PUAN: 25,000</span>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="flex flex-col sm:flex-row gap-3.5 justify-center relative z-10">
                    <button
                      onClick={handleRestart}
                      className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-600/15 text-white font-extrabold rounded-xl text-xs font-display tracking-wider transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Yeni Oyuna Başla
                    </button>
                    <button
                      onClick={handleShare}
                      className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/15 text-white font-extrabold rounded-xl text-xs font-display tracking-wider transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {shareStatus === 'copied' ? (
                        <>
                          <Check className="w-4 h-4 text-white animate-bounce" />
                          Skor Kopyalandı!
                        </>
                      ) : shareStatus === 'error' ? (
                        'Hata Oluştu'
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 text-white" />
                          Skorunu Paylaş
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setGameStatus('start');
                        setActiveMenuTab('leaderboard');
                      }}
                      className="px-6 py-3.5 bg-slate-900 border border-slate-700/50 hover:bg-slate-800 font-bold rounded-xl text-xs font-display text-white hover:scale-[1.01] transition shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      Liderlik Tablosunu İncele
                    </button>
                  </div>
                </div>

                {/* ROUND-BY-ROUND DETAILED ANALYSIS GRID */}
                <div className="bg-slate-900/90 border border-slate-700/50 rounded-2xl p-6 shadow-2xl space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5 text-blue-450" />
                    Raund Analiz Raporu
                  </h3>

                  <div className="space-y-2.5">
                    {roundGuesses.map((g, idx) => (
                      <div
                        key={g.round}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-slate-700/30 hover:bg-slate-900/40 duration-150 transition gap-3"
                      >
                        <div className="flex items-center gap-3.5">
                          <span className="w-8 h-8 rounded-xl bg-slate-905 border border-slate-750 text-slate-350 flex items-center justify-center font-black text-xs">
                            {idx + 1}
                          </span>
                          <div>
                            <strong className="text-white text-xs block font-bold">{g.locationName}</strong>
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                              {g.isTimeout 
                                ? 'Zaman Sınırı Aşıldı (Tahmin Yapılmadı)' 
                                : `Hata Payı: ${g.distanceKm.toLocaleString()} km`
                              }
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3.5 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-900 pt-2.5 sm:pt-0">
                          {g.isTimeout ? (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-red-950/80 border-red-500/40 text-red-400">
                              ⚠️ Süre Doldu!
                            </span>
                          ) : (
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              getAccuracyFeedback(g.score).bgClass
                            } ${getAccuracyFeedback(g.score).twColor}`}>
                              {getAccuracyFeedback(g.score).title}
                            </span>
                          )}
                          <span className="font-mono font-black text-sm text-blue-450 shrink-0">
                            + {g.score.toLocaleString()} <span className="text-[9px] text-slate-500 font-normal uppercase">Puan</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* MODAL FOR DEVELOPMENT SETTINGS, CREDITS & INFO */}
        <AnimatePresence>
          {showSettingsModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              
              {/* BACKDROP FILTER overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowSettingsModal(false)}
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
              />

              {/* SHEET CORE BODY */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="max-w-3xl w-full bg-slate-900 border border-slate-700/50 rounded-3xl p-6 shadow-2xl relative z-10 flex flex-col justify-between max-h-[90vh]"
              >
                
                {/* MODAL HEADER */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-white">
                    <Compass className="w-5 h-5 text-blue-450" />
                    <h3 className="font-extrabold text-md font-display">Oyuncu Konsolu & Google Platform Kartı</h3>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* MODAL CONTENT SCROLLPOINT */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                  <ApiInfo />
                </div>

                {/* FOOTER ACTION */}
                <div className="border-t border-slate-800 pt-4 mt-4 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Google AI Studio Build &copy; 2026</span>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-bold text-white rounded-lg cursor-pointer transition"
                  >
                    Kapat
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </APIProvider>
  );
}
