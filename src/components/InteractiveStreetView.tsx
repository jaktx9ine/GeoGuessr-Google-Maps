import { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Eye, Map as MapIcon, RotateCcw, HelpCircle } from 'lucide-react';

interface StreetViewProps {
  lat: number;
  lng: number;
  heading?: number;
  pitch?: number;
  zoom?: number;
  isSatelliteMode: boolean;
}

export default function InteractiveStreetView({
  lat,
  lng,
  heading = 0,
  pitch = 0,
  zoom = 1,
  isSatelliteMode,
}: StreetViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const streetViewLib = useMapsLibrary('streetView');
  const mapsLib = useMapsLibrary('maps');
  const coreLib = useMapsLibrary('core');

  const [panorama, setPanorama] = useState<google.maps.StreetViewPanorama | null>(null);
  const [fallbackMap, setFallbackMap] = useState<google.maps.Map | null>(null);
  const [status, setStatus] = useState<'loading' | 'active' | 'fallback' | 'error'>('loading');
  const [initHeading, setInitHeading] = useState(heading);

  // Cache coordinates to reset view easily
  const resetHeading = () => {
    if (panorama) {
      panorama.setPov({ heading, pitch });
      panorama.setZoom(zoom);
    } else if (fallbackMap) {
      fallbackMap.setHeading(heading);
      fallbackMap.setZoom(17);
    }
  };

  useEffect(() => {
    if (!streetViewLib || !containerRef.current) return;

    setStatus('loading');
    setPanorama(null);
    setFallbackMap(null);

    // Clean up previous panorama/map contents in the container
    containerRef.current.innerHTML = '';

    const position = { lat, lng };

    if (isSatelliteMode) {
      // Direct Satellite Fallback (Used when user plays Sandbox/Satellite mode)
      try {
        const renderSatelliteMap = () => {
          const map = new google.maps.Map(containerRef.current!, {
            center: position,
            zoom: 16,
            mapTypeId: 'satellite',
            // Disable almost all labels and UI to simulate guessing correctly
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: true,
            fullscreenControl: false,
            styles: [
              {
                featureType: 'all',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
          });
          setFallbackMap(map);
          setStatus('fallback');
        };

        if (window.google?.maps?.Map) {
          renderSatelliteMap();
        } else {
          // Fallback timer
          setTimeout(renderSatelliteMap, 500);
        }
      } catch (err) {
        console.error('Error loading satellite map:', err);
        setStatus('error');
      }
      return;
    }

    // Street View Mode
    const service = new google.maps.StreetViewService();

    // Helper to render panorama once found
    const setupPano = (latLng: google.maps.LatLng) => {
      const element = containerRef.current;
      if (!element) return;
      try {
        const pano = new google.maps.StreetViewPanorama(element, {
          position: latLng,
          pov: { heading, pitch },
          zoom: zoom,
          addressControl: false, // Prevents cheating (showing city info)
          showRoadLabels: false, // Prevents cheating (showing street names)
          linksControl: true,
          panControl: true,
          zoomControl: true,
          enableCloseButton: false,
          motionTracking: false,
          motionTrackingControl: false,
          clickToGo: true, // Allow double click to travel
          scrollwheel: true, // Allow wheel scaling
        });

        setPanorama(pano);
        setStatus('active');
      } catch (e) {
        console.error('Pano element creation failed:', e);
        setStatus('error');
      }
    };

    // Helper to render satellite fallback
    const setupSatelliteFallback = () => {
      try {
        const map = new google.maps.Map(containerRef.current!, {
          center: position,
          zoom: 17,
          mapTypeId: isSatelliteMode ? 'satellite' : 'roadmap',
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          styles: [
            {
              featureType: 'all',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });
        setFallbackMap(map);
        setStatus('fallback');
      } catch (mErr) {
        console.error('Map fallback failure:', mErr);
        setStatus('error');
      }
    };

    // Stage 1: Tight matching (100 meters) to match landmarks and precise neighborhoods without snapping to distant highways.
    // Force OUTDOOR sources to guarantee navigable streets and paths where users can walk around.
    service.getPanorama(
      {
        location: position,
        radius: 100,
        sources: [google.maps.StreetViewSource.OUTDOOR],
        preference: google.maps.StreetViewPreference.BEST,
      },
      (data, statusResult) => {
        if (statusResult === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          setupPano(data.location.latLng);
        } else {
          // Stage 2: Broader matching (1000 meters) as fallback
          console.warn('Exact location panorama missing within 100m. Expanding search to 1000m.');
          service.getPanorama(
            {
              location: position,
              radius: 1000,
              sources: [google.maps.StreetViewSource.OUTDOOR],
              preference: google.maps.StreetViewPreference.BEST,
            },
            (dataFallback, statusFallbackResult) => {
              if (statusFallbackResult === google.maps.StreetViewStatus.OK && dataFallback?.location?.latLng) {
                setupPano(dataFallback.location.latLng);
              } else {
                console.warn('Expanding search to 50000m and standard sources.');
                service.getPanorama(
                  {
                    location: position,
                    radius: 50000,
                    preference: google.maps.StreetViewPreference.BEST,
                  },
                  (dataThird, statusThirdResult) => {
                    if (statusThirdResult === google.maps.StreetViewStatus.OK && dataThird?.location?.latLng) {
                      setupPano(dataThird.location.latLng);
                    } else {
                      console.warn('No Street View panorama found of any source. Resorting to flat fallback view.');
                      setupSatelliteFallback();
                    }
                  }
                );
              }
            }
          );
        }
      }
    );

    return () => {
      if (panorama) {
        panorama.setVisible(false);
      }
    };
  }, [streetViewLib, lat, lng, heading, pitch, zoom, isSatelliteMode]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      
      {/* MAP MOUNT POINT */}
      <div id="street-view-pano" ref={containerRef} className="w-full h-full bg-slate-950" />

      {/* OVERLAY INDICATORS */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin mb-4" />
          <p className="text-sm font-medium text-emerald-400 font-sans tracking-wide">Google Street View Yükleniyor...</p>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">Çevre ve coğrafya oluşturuluyor</p>
        </div>
      )}

      {status === 'fallback' && (
        <div className="absolute top-4 left-4 z-10 bg-slate-900/90 backdrop-blur border border-amber-500/30 px-3 py-2 rounded-lg flex items-center gap-2 text-amber-400 shadow-lg text-xs">
          <MapIcon className="w-4 h-4" />
          <span>Sokak Görünümü Yok: <strong>{isSatelliteMode ? 'Uydu Görünümü Aktif' : 'Harita Görünümü Aktif'}</strong></span>
        </div>
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-20 p-6 text-center">
          <Eye className="w-12 h-12 text-rose-500 mb-3" />
          <p className="text-red-400 font-semibold mb-1 text-sm">Görünüm Aracı Başlatılamadı</p>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            Google Maps yükleme kısıtlamalarından veya internet bağlantınızdan dolayı sokak görünümü çağrısı başarısız oldu.
          </p>
          <button 
            onClick={() => setStatus('loading')}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white hover:bg-slate-700 hover:text-white transition"
          >
            Yeniden Dene
          </button>
        </div>
      )}

      {/* FLOATING CONTROL BAR */}
      {status !== 'loading' && status !== 'error' && (
        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
          <button
            onClick={resetHeading}
            className="bg-slate-900/80 backdrop-blur text-white hover:bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold"
            title="Başlangıç Kamera Açısına Sıfırla"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            Açıyı Sıfırla
          </button>
          
          <div className="hidden sm:flex bg-slate-900/80 backdrop-blur border border-slate-700 px-3 py-2.5 rounded-lg text-[11px] text-slate-400 items-center gap-1.5 shadow-lg">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Masmavi okları takip ederek sokakta yürüyebilirsiniz.</span>
          </div>
        </div>
      )}
    </div>
  );
}
