import { BookOpen, ShieldAlert, Key, Cloud, CreditCard, ChevronRight, Calculator } from 'lucide-react';

export default function ApiInfo() {
  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2 pb-6 text-slate-300">
      {/* HEADER CARD */}
      <div className="bg-gradient-to-r from-blue-900/40 to-slate-900/40 border border-blue-500/20 rounded-xl p-5 shadow-lg">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          Google Maps Platform API Kılavuzu & Limitleri
        </h3>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Bu uygulama, harita çizimi, etkileşimli Street View panosunun yüklenmesi, tahmin işaretçileri 
          ve mesafe hesaplamaları için gerçek Google Maps Platform servisleri ile entegre çalışmaktadır.
        </p>
      </div>

      {/* APIS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <h4 className="font-semibold text-white text-sm">Maps JavaScript API</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">
            Oyuncunun etkileşimli olarak harita üzerinde gezinmesini (pan, zoom), tahmin pini bırakmasını, 
            ve turlar bittiğinde mesafe polylines (rotaları) çizilmesini sağlar.
          </p>
          <div className="text-[11px] font-mono bg-slate-950/80 p-2 rounded text-blue-300">
            Fiyat: 1000 çağrı başına $7.00
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h4 className="font-semibold text-white text-sm">Street View Service</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">
            Belirlenen gizli noktanın sokak düzeyinde panoramasını, kamera açısı ve yönü (heading, pitch, zoom) 
            ayarları ile yükler. Oyuncunun 360 derece etrafa bakmasını sağlar.
          </p>
          <div className="text-[11px] font-mono bg-slate-950/80 p-2 rounded text-emerald-300">
            Fiyat: 1000 çağrı başına $14.00
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <h4 className="font-semibold text-white text-sm">Maps Static API</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">
            Raund sonuçlarında ve özet ekranında kullanılan hafif, hızlı yüklenen ve bütçe dostu 
            statik harita görsellerini dinamik URL'ler üzerinden oluşturmak için kullanılır.
          </p>
          <div className="text-[11px] font-mono bg-slate-950/80 p-2 rounded text-purple-300">
            Fiyat: 1000 çağrı başına $2.00
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <h4 className="font-semibold text-white text-sm">Geocoding & Core API</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-2">
            Oyundaki coğrafi koordinatların işlenmesini, mesafe analitiğini ve yer adlarının 
            veritabanı ile eşleştirilmesini sağlar. Harita başlatım kütüphanelerini yükler.
          </p>
          <div className="text-[11px] font-mono bg-slate-950/80 p-2 rounded text-yellow-300">
            Fiyat: Çoğunlukla ücretsiz / JavaScript API ile tümleşik
          </div>
        </div>
      </div>

      {/* COST AWARENESS */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <h4 className="font-semibold text-white text-sm flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          Maliyet Analizi ve Ücretsiz Kota (Cost Awareness)
        </h4>
        <p className="text-xs leading-relaxed text-slate-300">
          Google Cloud, her faturalandırma hesabı için aylık <strong className="text-emerald-400">$200 ücretsiz kredi</strong> sunar. 
          Bu kredi sayesinde, aşağıdaki kullanım miktarları tamamen <strong className="text-emerald-400">ÜCRETSIZ</strong> şekilde 
          karşılanmaktadır:
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
          <li className="bg-slate-950/50 p-2 rounded border border-slate-800">
            <span className="block text-slate-400">Veya sadece:</span>
            <strong className="text-white text-sm block">~28,500</strong>
            <span className="text-slate-400">Statik Harita / ay</span>
          </li>
          <li className="bg-slate-950/50 p-2 rounded border border-slate-800">
            <span className="block text-slate-400">Veya sadece:</span>
            <strong className="text-white text-sm block">~14,000</strong>
            <span className="text-slate-400">Dinamik Harita / ay</span>
          </li>
          <li className="bg-slate-950/50 p-2 rounded border border-slate-800">
            <span className="block text-slate-400">Veya sadece:</span>
            <strong className="text-white text-sm block">~28,500</strong>
            <span className="text-slate-400">Statik Sokak Görünümü / ay</span>
          </li>
        </ul>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded text-[11px] text-blue-300 flex gap-2">
          <span className="font-bold">Öneri:</span>
          <span>Bütçenizi kontrol altında tutmak için, Google Cloud Konsolu üzerinden günlük veya aylık harcama limitleri / bütçe alarmları ayarlayabilirsiniz.</span>
        </div>
      </div>

      {/* SECURITY AND RESTRICTIONS */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-4">
        <h4 className="font-semibold text-white text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          API Anahtarı Güvenliği ve Kısıtlama Önerileri
        </h4>
        <div className="space-y-2 text-xs leading-relaxed">
          <p>
            API anahtarınızın çalınmasını ve yetkisiz kullanılmasını önlemek için Google Cloud Console'da 
            mutlaka aşağıdaki güvenlik kısıtlamalarını uygulayınız:
          </p>
          <div className="space-y-2 bg-slate-950/50 p-3 rounded border border-slate-800">
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Uygulama Kısıtlamaları (Application Restrictions):</strong>
                <p className="text-slate-400 text-[11px]">HTTP başvuranları (web siteleri) seçeneğini tercih edip sitenizin tam URL adresini (örn. <code>https://*.run.app/*</code> veya kendi alan adınızı) girin.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">API Kısıtlamaları (API Restrictions):</strong>
                <p className="text-slate-400 text-[11px]">Anahtarı sadece bu projenin kullandığı 'Maps JavaScript API', 'Street View Service' ve 'Maps Static API' ile sınırlayın.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COORDINATES CALCULATION */}
      <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-5 space-y-4">
        <h4 className="font-semibold text-white text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-400" />
          Tahmin Doğruluğu Nasıl Hesaplanır? (Mekanik Detayları)
        </h4>
        <div className="space-y-2 text-xs leading-relaxed">
          <p>
            Oyunda coğrafi tahmininizin hedefe uzaklığını ölçmek için dünya yüzeyinin eğriliğini hesaba katan 
            <strong className="text-white"> Haversine Formülü</strong> kullanılır.
          </p>
          <div className="bg-slate-950/60 p-3 rounded font-mono text-[11px] text-slate-300 border border-slate-800 overflow-x-auto">
            d = 2R · arcsin( √[ sin²(Δlat/2) + cos(lat1)·cos(lat2)·sin²(Δlng/2) ] )
          </div>
          <p className="text-slate-400">
            Puanlar 0 ile 5000 arasındadır. 50 metreden daha az hata payı olan tahminler 5000 tam puan kazandırır. 
            Mesafe arttıkça puan üstel bir biçimde azalır. Bölgesel (Türkiye) modunda hata hassasiyeti çok daha yüksek 
            olduğu için puan eksilmesi daha hızlı gerçekleşir.
          </p>
        </div>
      </div>
    </div>
  );
}
