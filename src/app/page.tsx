'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { 
  Search, Navigation, Compass, Map, ToggleLeft, ToggleRight, 
  MapPin, ArrowUpDown, ChevronRight, ChevronLeft, RotateCcw, X, Info
} from 'lucide-react';
import { findShortestPath, generateDirections, GraphNode, DirectionStep } from '../utils/routing';
import mapDataRaw from '../data/map-data.json';

// Dynamically import the map viewer (client-side only to avoid SSR issues with zoom-pan library)
const VectorMapViewer = dynamic(() => import('../components/VectorMapViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-sky-100 dark:bg-slate-900">
      <div className="text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading Map Canvas...</p>
      </div>
    </div>
  )
});

interface TileInfo {
  row: number;
  col: number;
  filename: string;
}

interface Point {
  x: number;
  y: number;
}

interface Landmass {
  id: string;
  name: string;
  points: Point[];
}

interface Landmark {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  icon: string;
}

interface Road {
  id: string;
  name: string;
  type?: string;
  points: Point[];
}

interface MapData {
  tiles: Record<string, TileInfo>;
  landmasses: Landmass[];
  roads: Road[];
  landmarks: Landmark[];
}

export default function Home() {
  const mapData = mapDataRaw as MapData;
  const [showOriginals, setShowOriginals] = useState<boolean>(true);

  // Search & Routing States
  const [startLandmarkId, setStartLandmarkId] = useState<string>('');
  const [endLandmarkId, setEndLandmarkId] = useState<string>('');
  const [activeRoute, setActiveRoute] = useState<GraphNode[]>([]);
  const [directions, setDirections] = useState<DirectionStep[]>([]);
  
  // Active Navigation Step Index
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  
  // Selected Landmark for details
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);

  // Auto-pan coordinates trigger
  const [zoomToCoords, setZoomToCoords] = useState<{ x: number; y: number } | null>(null);

  // General Search Input State
  const [searchQuery, setSearchQuery] = useState('');

  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    const matchedLandmarks = mapData.landmarks
      .filter(l => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q))
      .map(l => ({ ...l, type: 'landmark' as const }));

    const matchedRoads = mapData.roads
      .filter(r => r.name.toLowerCase().includes(q))
      .map(r => {
        const midPoint = r.points[Math.floor(r.points.length / 2)];
        return {
          id: r.id,
          name: r.name,
          description: `Road path with ${r.points.length} nodes`,
          x: midPoint.x,
          y: midPoint.y,
          icon: 'Compass',
          type: 'road' as const
        };
      });

    return [...matchedLandmarks, ...matchedRoads];
  };

  const searchResults = getSearchResults();

  // Handle Landmark Pin Click
  const handleSelectLandmark = (id: string) => {
    setSelectedLandmarkId(id);
    const landmark = mapData.landmarks.find(l => l.id === id);
    if (landmark) {
      setZoomToCoords({ x: landmark.x, y: landmark.y });
    }
  };

  // Swap Start & End landmarks
  const handleSwapLocations = () => {
    const temp = startLandmarkId;
    setStartLandmarkId(endLandmarkId);
    setEndLandmarkId(temp);
    if (endLandmarkId && startLandmarkId) {
      calculateRoute(endLandmarkId, startLandmarkId);
    }
  };

  // Calculate shortest route
  const calculateRoute = (startId: string, endId: string) => {
    const startL = mapData.landmarks.find(l => l.id === startId);
    const endL = mapData.landmarks.find(l => l.id === endId);

    if (startL && endL) {
      const path = findShortestPath(mapData.roads, startL.x, startL.y, endL.x, endL.y);
      setActiveRoute(path);

      if (path.length > 0) {
        const steps = generateDirections(path, mapData.landmarks);
        setDirections(steps);
        setActiveStepIndex(0); // Focus on first step
        setZoomToCoords({ x: steps[0].x, y: steps[0].y });
      } else {
        alert('Could not find a path between these locations. Make sure the roads connect in the editor!');
        setDirections([]);
        setActiveStepIndex(null);
      }
    } else {
      setActiveRoute([]);
      setDirections([]);
      setActiveStepIndex(null);
    }
  };

  // Reset/Clear Navigation Route
  const handleClearRoute = () => {
    setStartLandmarkId('');
    setEndLandmarkId('');
    setActiveRoute([]);
    setDirections([]);
    setActiveStepIndex(null);
    setSelectedLandmarkId(null);
  };

  // Active step coordinates helper
  const getActiveStepCoords = () => {
    if (activeStepIndex !== null && directions[activeStepIndex]) {
      return { x: directions[activeStepIndex].x, y: directions[activeStepIndex].y };
    }
    return zoomToCoords;
  };

  return (
    <div className="relative flex h-screen w-screen flex-col md:flex-row overflow-hidden font-sans bg-gray-50 text-gray-800">
      
      {/* Search & Directions Floating Container */}
      <div className="absolute top-4 left-4 z-20 w-full max-w-[calc(100%-2rem)] md:w-96 flex flex-col gap-3 pointer-events-none">
        
        {/* Floating Google Maps Search & Route Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 flex flex-col gap-3 pointer-events-auto">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-blue-500 shrink-0" />
            <h1 className="text-base font-bold text-gray-900 dark:text-white">Island Map Navigator</h1>
          </div>

          {/* General Search Autocomplete Input */}
          <div className="relative flex flex-col gap-1 z-30">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search landmarks or roads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-950 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 dark:text-slate-100 pointer-events-auto"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 text-gray-400 hover:text-gray-650"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Results list */}
            {searchResults.length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden divide-y divide-gray-100 dark:divide-slate-800 max-h-48 overflow-y-auto z-40 pointer-events-auto">
                {searchResults.map(res => (
                  <button
                    key={res.id}
                    onClick={() => {
                      setZoomToCoords({ x: res.x, y: res.y });
                      if (res.type === 'landmark') {
                        setSelectedLandmarkId(res.id);
                      } else {
                        // For roads, center the view
                        setSelectedLandmarkId(null);
                      }
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800/60 transition-colors flex items-center gap-2.5 text-xs text-gray-700 dark:text-slate-300"
                  >
                    <div className="text-blue-500 shrink-0">
                      {res.type === 'landmark' ? <MapPin className="w-3.5 h-3.5" /> : <Compass className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-semibold text-gray-900 dark:text-white truncate">{res.name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{res.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 relative">
            {/* Start Location Input */}
            <div className="relative flex items-center">
              <div className="absolute left-3 w-2 h-2 rounded-full border border-gray-400 bg-white dark:bg-slate-800 z-10" />
              <select
                value={startLandmarkId}
                onChange={(e) => {
                  setStartLandmarkId(e.target.value);
                  if (e.target.value && endLandmarkId) calculateRoute(e.target.value, endLandmarkId);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-850 rounded-xl bg-gray-50 dark:bg-slate-950 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 dark:text-slate-100"
              >
                <option value="">Choose Starting Point...</option>
                {mapData.landmarks.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            {/* Vertical Connector Line (Google style) */}
            <div className="absolute left-[15px] top-[14px] bottom-[14px] w-0.5 border-l border-dashed border-gray-300 pointer-events-none" />

            {/* Swap locations button */}
            <button
              onClick={handleSwapLocations}
              disabled={!startLandmarkId && !endLandmarkId}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 p-1.5 rounded-full text-gray-500 dark:text-slate-400 hover:text-gray-800 transition-colors shadow-sm active:scale-90"
              title="Swap Locations"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            {/* End Location Input */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-2.5 w-4 h-4 text-red-500 z-10" />
              <select
                value={endLandmarkId}
                onChange={(e) => {
                  setEndLandmarkId(e.target.value);
                  if (startLandmarkId && e.target.value) calculateRoute(startLandmarkId, e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-850 rounded-xl bg-gray-50 dark:bg-slate-950 text-sm font-medium focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 dark:text-slate-100"
              >
                <option value="">Choose Destination...</option>
                {mapData.landmarks.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Route controls */}
          {activeRoute.length > 0 && (
            <div className="flex justify-between items-center border-t border-gray-100 dark:border-slate-800 pt-2 text-xs">
              <span className="text-gray-500 font-medium">Route calculated</span>
              <button
                onClick={handleClearRoute}
                className="flex items-center gap-1 text-red-500 hover:text-red-600 font-semibold p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>

        {/* Turn-by-Turn Directions Panel */}
        {directions.length > 0 && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 flex flex-col gap-3 pointer-events-auto max-h-[50vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
              <h2 className="text-sm font-bold text-gray-850 dark:text-white flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-blue-500" />
                <span>Turn-by-Turn Directions</span>
              </h2>
              <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 font-bold px-2 py-0.5 rounded-full">
                {directions.length} Steps
              </span>
            </div>

            {/* Steps List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {directions.map((step, idx) => {
                const isActive = activeStepIndex === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveStepIndex(idx);
                      setZoomToCoords({ x: step.x, y: step.y });
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                      isActive 
                        ? 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-100 scale-[0.98]' 
                        : 'bg-white border-transparent hover:bg-gray-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-gray-700 dark:text-slate-300'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                      isActive 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-750 dark:text-slate-400'
                    }`}>
                      <span className="text-xs font-bold">{idx + 1}</span>
                    </div>

                    <div className="flex flex-col gap-0.5 text-xs">
                      <p className={`font-semibold ${isActive ? 'text-blue-950 dark:text-blue-100 text-sm' : 'text-gray-800 dark:text-slate-200'}`}>
                        {step.instruction}
                      </p>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                        Coords: ({step.x}, {step.y})
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Navigation Steppers (GPS-style next/prev buttons) */}
            {activeStepIndex !== null && (
              <div className="flex justify-between items-center border-t border-gray-100 dark:border-slate-800 pt-3">
                <button
                  disabled={activeStepIndex === 0}
                  onClick={() => {
                    const nextIdx = activeStepIndex - 1;
                    setActiveStepIndex(nextIdx);
                    setZoomToCoords({ x: directions[nextIdx].x, y: directions[nextIdx].y });
                  }}
                  className="flex items-center gap-1 py-1.5 px-3 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 dark:bg-slate-800 dark:hover:bg-slate-750 dark:disabled:bg-slate-950 dark:disabled:text-slate-700 text-xs font-bold text-gray-700 dark:text-slate-200 rounded-lg shadow-sm transition-all active:scale-95 disabled:scale-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Prev</span>
                </button>

                <div className="text-xs font-semibold text-gray-500">
                  Step {activeStepIndex + 1} of {directions.length}
                </div>

                <button
                  disabled={activeStepIndex === directions.length - 1}
                  onClick={() => {
                    const nextIdx = activeStepIndex + 1;
                    setActiveStepIndex(nextIdx);
                    setZoomToCoords({ x: directions[nextIdx].x, y: directions[nextIdx].y });
                  }}
                  className="flex items-center gap-1 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-300 dark:disabled:bg-slate-950 dark:disabled:text-slate-700 text-xs font-bold text-white rounded-lg shadow-md transition-all active:scale-95 disabled:scale-100"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Bottom-Right Controls Panel (Style Toggle) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Landmark Info Detail Overlay */}
        {selectedLandmarkId && !directions.length && (
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 w-80 mb-2 flex flex-col gap-2 relative">
            <button
              onClick={() => setSelectedLandmarkId(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {(() => {
              const landmark = mapData.landmarks.find(l => l.id === selectedLandmarkId);
              if (!landmark) return null;
              return (
                <>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white pr-6">{landmark.name}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">{landmark.description}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setStartLandmarkId(landmark.id);
                        if (endLandmarkId) calculateRoute(landmark.id, endLandmarkId);
                      }}
                      className="flex-1 text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900 py-1.5 rounded-lg text-center"
                    >
                      Set Start
                    </button>
                    <button
                      onClick={() => {
                        setEndLandmarkId(landmark.id);
                        if (startLandmarkId) calculateRoute(startLandmarkId, landmark.id);
                      }}
                      className="flex-1 text-[11px] font-bold bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900 py-1.5 rounded-lg text-center"
                    >
                      Set Destination
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 flex flex-col gap-2.5">
          <button
            onClick={() => setShowOriginals(!showOriginals)}
            className="flex items-center justify-between gap-3 text-xs font-semibold text-gray-700 dark:text-slate-200"
          >
            <div className="flex items-center gap-1.5">
              <Map className="w-4 h-4 text-blue-500" />
              <span>Show JPEGs Overlay</span>
            </div>
            {showOriginals ? (
              <ToggleRight className="w-8 h-8 text-blue-600 cursor-pointer" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-400 cursor-pointer" />
            )}
          </button>
          
          <div className="text-[10px] text-gray-400 flex items-center gap-1 border-t border-gray-100 dark:border-slate-800 pt-2">
            <Info className="w-3 h-3 shrink-0" />
            <span>Stitched coordinates: 32,256 x 51,408</span>
          </div>
        </div>
      </div>

      {/* Main Map Viewer Canvas */}
      <div className="flex-1 h-full w-full z-10">
        <VectorMapViewer
          mapData={mapData}
          showOriginals={showOriginals}
          activeRoute={activeRoute}
          selectedLandmarkId={selectedLandmarkId}
          activeStepCoords={getActiveStepCoords()}
          onSelectLandmark={handleSelectLandmark}
        />
      </div>

    </div>
  );
}
