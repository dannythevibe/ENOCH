'use client';

import React, { useRef, useEffect } from 'react';
import Map, { Marker, Source, Layer, MapRef } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { landmarks } from '../../lib/mock-data';

interface Point {
  lat: number;
  lng: number;
}

interface CoordinateGridProps {
  userLocation: Point;
  destination?: { id: string; name: string; lat: number; lng: number };
  mapTheme?: 'dark' | 'light' | 'satellite';
}

export default function CoordinateGrid({ userLocation, destination, mapTheme = 'dark' }: CoordinateGridProps) {
  const mapRef = useRef<MapRef>(null);

  // Redemption City coordinates for initial center
  const centerPosition = userLocation.lat !== 0 
    ? { longitude: userLocation.lng, latitude: userLocation.lat }
    : { longitude: 3.4630, latitude: 6.8180 };

  useEffect(() => {
    if (mapRef.current && userLocation.lat !== 0) {
      mapRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 16.5,
        pitch: 60,
        bearing: -20,
        duration: 2000
      });
    }
  }, [userLocation.lat, userLocation.lng]);

  useEffect(() => {
    if (mapRef.current && destination) {
      mapRef.current.flyTo({
        center: [destination.lng, destination.lat],
        zoom: 17.5,
        pitch: 60,
        bearing: -20,
        duration: 2000
      });
    }
  }, [destination]);

  const routeGeoJSON: any = destination && userLocation.lat !== 0 ? {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'LineString',
      coordinates: [
        [userLocation.lng, userLocation.lat],
        [destination.lng, destination.lat]
      ]
    }
  } : null;

  return (
    <div className="w-full h-full relative z-0">
      <Map
        ref={mapRef}
        initialViewState={{
          ...centerPosition,
          zoom: 16.5,
          pitch: 60,
          bearing: -20
        }}
        mapStyle={
          mapTheme === 'satellite' ? {
            version: 8,
            sources: {
              'esri-satellite': {
                type: 'raster',
                tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                tileSize: 256
              }
            },
            layers: [{
              id: 'satellite-layer',
              type: 'raster',
              source: 'esri-satellite',
              minzoom: 0,
              maxzoom: 19
            }]
          } : mapTheme === 'light' 
            ? "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
            : "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        }
        interactive={true}
        dragRotate={true}
        pitchWithRotate={true}
        style={{ width: '100%', height: '100%' }}
      >
        {/* User Marker */}
        {userLocation.lat !== 0 && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
            <div className="relative w-5 h-5 cursor-pointer">
              <div className="absolute inset-0 bg-[#c3f400] rounded-full animate-ping opacity-75"></div>
              <div className="absolute top-[2px] left-[2px] w-4 h-4 bg-[#c3f400] rounded-full border-2 border-[#121314] shadow-[0_0_15px_#c3f400]"></div>
            </div>
          </Marker>
        )}

        {/* Landmarks */}
        {landmarks.map(l => (
          <Marker key={l.id} longitude={l.lng} latitude={l.lat} anchor="bottom">
            {l.id === destination?.id ? (
              <div className="flex flex-col items-center">
                <div className="bg-[#121314] border border-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-md mb-1 shadow-lg whitespace-nowrap">
                  {l.name}
                </div>
                <div className="w-4 h-4 bg-[#c3f400] rounded-full border-[3px] border-[#121314] shadow-[0_0_15px_#c3f400]"></div>
                <div className="w-0.5 h-6 bg-gradient-to-t from-[#c3f400]/0 to-[#c3f400]"></div>
              </div>
            ) : (
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#121314] border border-white/10 text-[#c4c9ac] text-[9px] font-bold px-1.5 py-0.5 rounded mb-1 shadow-lg whitespace-nowrap">
                  {l.name}
                </div>
                <div className="w-3 h-3 bg-white/70 rounded-full border-2 border-[#121314] shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:bg-white group-hover:scale-125 transition-transform"></div>
              </div>
            )}
          </Marker>
        ))}



        {/* Redemption Camp Full Plot Boundary */}
        <Source
          id="camp-boundary"
          type="geojson"
          data={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [[
                // Approximate 2500 hectare boundary mapping the perimeter
                [3.4680, 6.8280], // NE Corner (Near Main Gate Expressway)
                [3.4680, 6.8150], // SE Edge (Following Lagos-Ibadan)
                [3.4600, 6.8020], // Far South Edge
                [3.4480, 6.7980], // SW Corner (Deep Shimawa Area)
                [3.4420, 6.8080], // West Edge (Past the Arena)
                [3.4500, 6.8200], // NW Edge
                [3.4600, 6.8280], // North Edge
                [3.4680, 6.8280]  // Back to start
              ]]
            }
          }}
        >
          <Layer
            id="camp-boundary-fill"
            type="fill"
            source="camp-boundary"
            paint={{
              'fill-color': '#c3f400',
              'fill-opacity': 0.05
            }}
          />
          <Layer
            id="camp-boundary-line"
            type="line"
            source="camp-boundary"
            paint={{
              'line-color': '#c3f400',
              'line-width': 2,
              'line-dasharray': [2, 4],
              'line-opacity': 0.8
            }}
          />
        </Source>

        {/* Route Line */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              source="route"
              layout={{
                'line-join': 'round',
                'line-cap': 'round'
              }}
              paint={{
                'line-color': '#c3f400',
                'line-width': 4,
                'line-opacity': 0.8,
                'line-dasharray': [0, 2] // gives a dotted appearance
              }}
            />
          </Source>
        )}
      </Map>
      
      <div className={`absolute inset-0 pointer-events-none z-10 ${mapTheme === 'dark' ? 'shadow-[inset_0_0_150px_rgba(18,19,20,1)]' : mapTheme === 'light' ? 'shadow-[inset_0_0_100px_rgba(255,255,255,0.7)]' : 'shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]'}`}></div>
    </div>
  );
}
