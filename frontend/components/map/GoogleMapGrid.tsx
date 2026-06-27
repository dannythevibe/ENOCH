'use client';

import React, { useEffect, useRef, useState } from 'react';

interface Point {
  lat: number;
  lng: number;
}

interface GoogleMapGridProps {
  userLocation: Point;
  destination?: { id: string; name: string; lat: number; lng: number };
  mapTheme?: 'dark' | 'light' | 'satellite';
  routeCoordinates?: [number, number][];
}

// Custom dark map styling matching Enoch green cyber-neon theme
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#121314' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#121314' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#e3e2e3' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c4c9ac' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c4c9ac' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1b1c1d' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c4c9ac' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#1f2021' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#343536' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8e9379' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#292a2b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#444933' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#c3f400' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0d0e0f' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#444933' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#0d0e0f' }],
  },
];

export default function GoogleMapGrid({
  userLocation,
  destination,
  mapTheme = 'dark',
  routeCoordinates,
}: GoogleMapGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [is3D, setIs3D] = useState(false);

  const toggle3D = () => {
    if (!mapRef.current) return;
    if (is3D) {
      mapRef.current.setTilt(0);
      mapRef.current.setHeading(0);
      setIs3D(false);
    } else {
      mapRef.current.setTilt(45);
      mapRef.current.setHeading(35);
      setIs3D(true);
    }
  };
  
  const userMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const trafficLayerRef = useRef<any>(null);

  // Load Google Maps API Script
  useEffect(() => {
    if ((window as any).google && (window as any).google.maps) {
      setApiLoaded(true);
      return;
    }

    const scriptId = 'google-maps-api-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setApiLoaded(true);
      };

      script.onerror = () => {
        setLoadError(true);
        console.error('Failed to load Google Maps SDK.');
      };

      document.head.appendChild(script);
    } else {
      // Script was already appended but not loaded yet
      script.addEventListener('load', () => setApiLoaded(true));
      script.addEventListener('error', () => setLoadError(true));
    }
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!apiLoaded || !containerRef.current) return;

    const google = (window as any).google;
    const initialCenter = userLocation.lat !== 0 
      ? { lat: userLocation.lat, lng: userLocation.lng }
      : { lat: 6.8180, lng: 3.4630 };

    const mapOptions: any = {
      center: initialCenter,
      zoom: 16,
      maxZoom: 22,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: true,
      fullscreenControl: false,
      styles: mapTheme === 'dark' ? darkMapStyle : [],
      mapTypeId: mapTheme === 'satellite' ? google.maps.MapTypeId.HYBRID : google.maps.MapTypeId.ROADMAP
    };

    const map = new google.maps.Map(containerRef.current, mapOptions);
    mapRef.current = map;

    // Add Live Traffic Layer
    const trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);
    trafficLayerRef.current = trafficLayer;

  }, [apiLoaded]);

  // Update Map Styling / Theme
  useEffect(() => {
    if (!mapRef.current) return;
    const google = (window as any).google;

    if (mapTheme === 'satellite') {
      mapRef.current.setMapTypeId(google.maps.MapTypeId.HYBRID);
      mapRef.current.setOptions({ styles: [] });
    } else if (mapTheme === 'light') {
      mapRef.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      mapRef.current.setOptions({ styles: [] });
    } else {
      mapRef.current.setMapTypeId(google.maps.MapTypeId.ROADMAP);
      mapRef.current.setOptions({ styles: darkMapStyle });
    }
  }, [mapTheme]);

  // Handle User Location Updates
  useEffect(() => {
    if (!mapRef.current || !apiLoaded) return;
    const google = (window as any).google;

    if (userLocation.lat !== 0) {
      const pos = { lat: userLocation.lat, lng: userLocation.lng };

      if (!userMarkerRef.current) {
        // Create custom user marker (glowing green dot)
        const element = document.createElement('div');
        element.className = 'google-user-marker';
        element.style.width = '20px';
        element.style.height = '20px';
        element.style.borderRadius = '50%';
        element.style.backgroundColor = '#CCFF00';
        element.style.border = '2px border #121314';
        element.style.boxShadow = '0 0 15px #CCFF00';
        
        userMarkerRef.current = new google.maps.Marker({
          position: pos,
          map: mapRef.current,
          title: 'Your Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#CCFF00',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#121314',
            scale: 7
          }
        });
      } else {
        userMarkerRef.current.setPosition(pos);
      }

      // Fly to user
      mapRef.current.panTo(pos);
    }
  }, [userLocation, apiLoaded]);

  // Handle Destination Marker Updates
  useEffect(() => {
    if (!mapRef.current || !apiLoaded) return;
    const google = (window as any).google;

    if (destination) {
      const pos = { lat: destination.lat, lng: destination.lng };

      if (destMarkerRef.current) {
        destMarkerRef.current.setMap(null);
      }

      destMarkerRef.current = new google.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: destination.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: '#c3f400',
          fillOpacity: 1,
          strokeWeight: 1.5,
          strokeColor: '#121314',
          scale: 6
        }
      });

      // Recenter Map on destination
      mapRef.current.panTo(pos);
      mapRef.current.setZoom(17);
    } else {
      if (destMarkerRef.current) {
        destMarkerRef.current.setMap(null);
        destMarkerRef.current = null;
      }
    }
  }, [destination, apiLoaded]);

  // Handle Route line updates
  useEffect(() => {
    if (!mapRef.current || !apiLoaded) return;
    const google = (window as any).google;

    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null);
      routePolylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      const path = routeCoordinates.map((coord) => ({
        lat: coord[1],
        lng: coord[0],
      }));

      routePolylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#CCFF00',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map: mapRef.current,
      });

      // Fit bounds to fit route
      const bounds = new google.maps.LatLngBounds();
      path.forEach((pt) => bounds.extend(pt));
      mapRef.current.fitBounds(bounds);
    }
  }, [routeCoordinates, apiLoaded]);

  if (loadError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#121314] text-red-400 p-6 text-center">
        <span className="material-symbols-outlined text-4xl mb-2">error</span>
        <h4 className="font-bold">Offline or Maps API Blocked</h4>
        <p className="text-xs text-[#c4c9ac] mt-1 max-w-xs">
          Google Maps live feed could not load. Switch to the Offline Map view or check your connection.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative google-map-wrapper">
      {!apiLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#121314] z-20 gap-3">
          <span className="material-symbols-outlined text-[#c3f400] animate-spin text-3xl">sync</span>
          <span className="text-[#c4c9ac] text-xs font-bold tracking-widest uppercase">Connecting live map...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full google-map-container" />
      
      {apiLoaded && (
        <button 
          onClick={toggle3D}
          className={`absolute top-4 right-4 z-30 flex items-center justify-center w-12 h-12 rounded-full border backdrop-blur-md transition-all duration-300 cursor-pointer ${
            is3D 
              ? 'border-[#CCFF00] bg-[#121314]/90 text-[#CCFF00] shadow-[0_0_15px_rgba(204,255,0,0.4)] scale-[1.05]' 
              : 'border-[#444933]/50 bg-[#1b1c1d]/85 text-[#c4c9ac] hover:text-white hover:border-white/30'
          }`}
          title="Toggle 3D View"
        >
          <span className="material-symbols-outlined text-xl">{is3D ? 'view_in_ar' : '3d_rotation'}</span>
        </button>
      )}

      {/* Styled overrides injected locally to strip branding reference overlays */}
      <style jsx global>{`
        .google-map-container a[href^="https://maps.google.com/maps"],
        .google-map-container a[href^="https://www.google.com/intl"],
        .google-map-container .gmnoprint a,
        .google-map-container .gmnoprint span,
        .google-map-container .gm-style-cc {
          display: none !important;
        }
        .google-map-container .gm-bundled-control {
          display: none !important;
        }
        /* Custom User Marker Style fallback */
        .google-user-marker {
          animation: mapPulse 2s infinite;
        }
        @keyframes mapPulse {
          0% { transform: scale(0.9); opacity: 1; }
          50% { transform: scale(1.1); box-shadow: 0 0 20px #CCFF00; }
          100% { transform: scale(0.9); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
