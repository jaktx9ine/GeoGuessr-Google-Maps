import { useEffect, useRef, useState } from 'react';
import { Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

interface GuessingMapProps {
  state: 'playing' | 'guessed';
  targetLatLng: { lat: number; lng: number } | null;
  guessLatLng: { lat: number; lng: number } | null;
  onSetGuessLatLng: (latLng: { lat: number; lng: number }) => void;
}

// Custom sub-component to mount the map polyline line
function Polyline({ path }: { path: google.maps.LatLngLiteral[] }) {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) return;

    // Delete previous polyline if any
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#f43f5e', // deep rose
      strokeOpacity: 0.9,
      strokeWeight: 3.5,
      icons: [
        {
          icon: {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 2,
          },
          offset: '0',
          repeat: '10px',
        },
      ],
      map,
    });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
    };
  }, [map, path]);

  return null;
}

// Controller component to automatically pan and zoom to show both pins after guess
function MapViewportController({
  state,
  target,
  guess,
}: {
  state: 'playing' | 'guessed';
  target: { lat: number; lng: number } | null;
  guess: { lat: number; lng: number } | null;
}) {
  const map = useMap();
  const lastTargetRef = useRef<string | null>(null);

  // 1. Center map on Turkey ONCE per round when target location changes
  useEffect(() => {
    if (!map) return;

    if (state === 'playing') {
      const targetKey = target ? `${target.lat},${target.lng}` : 'null';
      if (lastTargetRef.current !== targetKey) {
        map.setZoom(5);
        map.setCenter({ lat: 39.0, lng: 35.0 });
        lastTargetRef.current = targetKey;
      }
    } else {
      lastTargetRef.current = null;
    }
  }, [map, state, target]);

  // 2. Fit bounds to show both pins after a guess is submitted
  useEffect(() => {
    if (!map) return;

    if (state === 'guessed' && target && guess) {
      try {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(target);
        bounds.extend(guess);

        // Adjust bounds with elegant smooth fit
        map.fitBounds(bounds, {
          top: 70,
          right: 70,
          bottom: 70,
          left: 70,
        });

        // Limit maximum zoom in case guess is extremely close to stop map looking distorted
        const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
          if (map.getZoom() && map.getZoom()! > 13) {
            map.setZoom(12);
          }
        });
        return () => {
          google.maps.event.removeListener(listener);
        };
      } catch (err) {
        console.error('Error fitting bounds:', err);
      }
    }
  }, [map, state, target, guess]);

  return null;
}

export default function GuessingMap({
  state,
  targetLatLng,
  guessLatLng,
  onSetGuessLatLng,
}: GuessingMapProps) {
  const map = useMap();

  const handleMapClick = (e: any) => {
    if (state !== 'playing') return;

    let clickedLat: number | null = null;
    let clickedLng: number | null = null;

    // Support both vis.gl details API and fallback raw structures
    if (e.detail?.latLng) {
      clickedLat = e.detail.latLng.lat;
      clickedLng = e.detail.latLng.lng;
    } else if (e.latLng) {
      clickedLat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : e.latLng.lat;
      clickedLng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : e.latLng.lng;
    }

    if (clickedLat !== null && clickedLng !== null) {
      onSetGuessLatLng({ lat: clickedLat, lng: clickedLng });
    }
  };

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden border border-slate-700/60 shadow-xl bg-slate-900">
      
      {/* BASE REACT MAP */}
      <Map
        defaultCenter={{ lat: 39.0, lng: 35.0 }}
        defaultZoom={5}
        mapId="GEOGUESSR_MAP_ID"
        onClick={handleMapClick}
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        // Controls optimized for easy map zoom & coordinate tagging
        disableDefaultUI={true}
        zoomControl={true}
        gestureHandling="greedy"
      >
        {/* VIEWPORT CONTROLLER */}
        <MapViewportController state={state} target={targetLatLng} guess={guessLatLng} />

        {/* 1. GUESS MARKER (Red Flag / Target Ring) */}
        {guessLatLng && (
          <AdvancedMarker 
            position={guessLatLng} 
            title="Tahmininiz"
          >
            <Pin 
              background="#f43f5e" 
              borderColor="#be123c" 
              glyphColor="#fff" 
              scale={1.2}
            />
          </AdvancedMarker>
        )}

        {/* 2. TARGET MARKER (Green Pin - Only visible after guess is submitted) */}
        {state === 'guessed' && targetLatLng && (
          <AdvancedMarker 
            position={targetLatLng} 
            title="Gerçek Konum"
          >
            <Pin 
              background="#10b981" 
              borderColor="#047857" 
              glyphColor="#fff" 
              scale={1.2}
            />
          </AdvancedMarker>
        )}

        {/* 3. POLYLINES (Connect Target & Guess after review) */}
        {state === 'guessed' && targetLatLng && guessLatLng && (
          <Polyline path={[guessLatLng, targetLatLng]} />
        )}
      </Map>
    </div>
  );
}
