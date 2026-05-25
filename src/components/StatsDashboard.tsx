import { useState, useEffect } from 'react';
import { Trophy, RefreshCw, Award, Star, History, Calendar, MapPin } from 'lucide-react';
import { getLeaderboard, getFinalGameFeedback } from '../utils';
import { LeaderboardEntry } from '../types';

export default function StatsDashboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(getLeaderboard());
  }, []);

  const handleClear = () => {
    if (confirm('Tüm skor geçmişinizi sıfırlamak istediğinize emin misiniz?')) {
      localStorage.removeItem('geoguessr_leaderboard');
      setEntries([]);
    }
  };

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto pr-2 pb-6">
      
      {/* BENTO GRID HERO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* LEADERBOARD CARD */}
        <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500 animate-pulse" />
                Liderlik Tablosu (En İyi 10 Skor)
              </h3>
              {entries.length > 0 && (
                <button
                  onClick={handleClear}
                  className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1 bg-red-950/40 px-2 py-1 rounded border border-red-900/30"
                >
                  <RefreshCw className="w-3 h-3" />
                  Sıfırla
                </button>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Award className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                Henüz kayıtlı oyun skoru yok. Oyunu tamamlayarak skorunuzu buraya kaydedebilirsiniz!
              </div>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {entries.map((entry, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm transition-all ${
                      index === 0
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : index === 1
                        ? 'bg-slate-300/10 border-slate-300/30'
                        : index === 2
                        ? 'bg-amber-700/10 border-amber-700/30'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-yellow-500 text-slate-950 shadow-md shadow-yellow-500/10'
                          : index === 1
                          ? 'bg-slate-400 text-slate-950'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-white">{entry.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          Mod: {entry.mode === 'turkey' ? 'Türkiye Turu' : entry.mode === 'world' ? 'Dünya Turu' : entry.mode === 'world_streets' ? 'Sokaklar & Mahalleler' : 'Uydu / Sandbox'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400 text-base">{entry.score} <span className="text-[10px] text-slate-500 font-normal">Puan</span></div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(entry.date).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ACHIEVEMENTS / BADGES (Gamified Experience) */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-400" />
              Başarımlar & Rozetler
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                <div className="w-9 h-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  🎯
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Nokta Atışı</div>
                  <div className="text-[10px] text-slate-400">Haritada 5km'den yakın tahmin yap (4800+ puan).</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                <div className="w-9 h-9 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center text-yellow-400 shrink-0">
                  👑
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Coğrafya Dehası</div>
                  <div className="text-[10px] text-slate-400">Tek bir oyunda 23,000+ toplam skora ulaş.</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-lg border border-slate-800">
                <div className="w-9 h-9 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  🇹🇷
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Vatansever Gezgin</div>
                  <div className="text-[10px] text-slate-400">Türkiye Turu modunda 5 raundu da tamamla.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GAME FLOW CHART EXPLAINER */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 space-y-4">
        <h3 className="text-md font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          Oyun Aşamaları ve Rehber
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
            <span className="text-emerald-400 font-bold block mb-1">Aşama 1: Keşif & Analiz</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Oyun başladığında rastgele konumun Street View veya Uydu görüntüsü yüklenir. Çevredeki dil, mimari, 
              bitki örtüsü, trafik akışı ve coğrafi şekilleri inceleyin.
            </p>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
            <span className="text-amber-400 font-bold block mb-1">Aşama 2: Harita Tahmini</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Sağ alttaki etkileşimli tahmin haritasını büyütün, yakınlaştırın (zoom/pan) ve tahmin ettiğiniz yerin 
              üzerine tıklayarak pini yerleştirin. Hazır olduğunuzda "Tahmin Et" butonuna basın.
            </p>
          </div>
          <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg space-y-1">
            <span className="text-purple-400 font-bold block mb-1">Aşama 3: Sonuç & Puanlama</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Haritada gerçek yer ile tahmin pini arasındaki rota çizilir, mesafe hesaplanır ve puanınız verilir. 
              Gözlem yeteneğinizi geliştirerek 5 raundu en yüksek puanla bitirmeye çalışın!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
