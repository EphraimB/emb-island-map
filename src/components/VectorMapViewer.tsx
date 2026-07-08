'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Anchor, Route, Mountain, Compass, Trees as Tree, Castle, Flag, Tent, MapPin, 
  School, Info, Home, Star, Coffee, Ship, Gamepad, Film, Rocket, Building, Train, Cookie
} from 'lucide-react';
import { GraphNode, Road } from '../utils/routing';

export function getLandmarkIcon(name: string, className = "w-5 h-5") {
  switch (name) {
    case 'Anchor': return <Anchor className={className} />;
    case 'Route': return <Route className={className} />;
    case 'Mountain': return <Mountain className={className} />;
    case 'Compass': return <Compass className={className} />;
    case 'Tree': return <Tree className={className} />;
    case 'Castle': return <Castle className={className} />;
    case 'Flag': return <Flag className={className} />;
    case 'Tent': return <Tent className={className} />;
    case 'School': return <School className={className} />;
    case 'Home': return <Home className={className} />;
    case 'Star': return <Star className={className} />;
    case 'Coffee': return <Coffee className={className} />;
    case 'Ship': return <Ship className={className} />;
    case 'Info': return <Info className={className} />;
    case 'Gamepad': return <Gamepad className={className} />;
    case 'Film': return <Film className={className} />;
    case 'Rocket': return <Rocket className={className} />;
    case 'Building': return <Building className={className} />;
    case 'Train': return <Train className={className} />;
    case 'Cookie': return <Cookie className={className} />;
    default: return <MapPin className={className} />;
  }
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

interface TileInfo {
  row: number;
  col: number;
  filename: string;
}

interface MapData {
  tiles: Record<string, TileInfo>;
  landmasses: Landmass[];
  roads: Road[];
  landmarks: Landmark[];
}

interface VectorMapViewerProps {
  mapData: MapData;
  showOriginals: boolean;
  activeRoute: GraphNode[];
  selectedLandmarkId: string | null;
  activeStepCoords: { x: number; y: number } | null;
  onSelectLandmark: (id: string) => void;
}

export default function VectorMapViewer({
  mapData,
  showOriginals,
  activeRoute,
  selectedLandmarkId,
  activeStepCoords,
  onSelectLandmark
}: VectorMapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [svgOverlayElement, setSvgOverlayElement] = useState<SVGSVGElement | null>(null);

  const totalWidth = 32256;
  const totalHeight = 51408;

  // Mixed grid geometry calculator
  const getTileGeometry = (row: number, col: number) => {
    const isPortrait = row < 13;
    const width = isPortrait ? 3024 : 4032;
    const height = isPortrait ? 4032 : 3024;
    
    let x = 0;
    let y = 0;
    
    if (isPortrait) {
      x = 0;
      y = 3024 + (12 - row) * 4032;
    } else {
      x = (col - 1) * 4032;
      y = 0;
    }
    
    return { x, y, width, height, isPortrait };
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map in simple flat coordinate system
    const map = L.map(mapContainerRef.current, {
      crs: L.CRS.Simple,
      minZoom: -6,
      maxZoom: 2,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      attributionControl: false,
      zoomControl: false,
    });

    const bounds: L.LatLngBoundsExpression = [[-totalHeight, 0], [0, totalWidth]];
    map.fitBounds(bounds);
    mapRef.current = map;

    // Create the SVG overlay element dynamically
    const svg = L.SVG.create('svg') as SVGSVGElement;
    svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
    svg.setAttribute('width', `${totalWidth}`);
    svg.setAttribute('height', `${totalHeight}`);
    svg.classList.add('will-change-transform');

    const overlay = L.svgOverlay(svg, bounds, { interactive: true });
    overlay.addTo(map);
    setSvgOverlayElement(svg);

    return () => {
      map.remove();
      mapRef.current = null;
      setSvgOverlayElement(null);
    };
  }, []);

  // Programmatically pan and zoom when coordinates update (Search or Navigation Steps)
  useEffect(() => {
    if (mapRef.current && activeStepCoords) {
      const latlng = L.latLng(-activeStepCoords.y, activeStepCoords.x);
      mapRef.current.setView(latlng, -1, { animate: true, duration: 1.2 });
    }
  }, [activeStepCoords]);

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn(0.5);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut(0.5);
    }
  };

  const handleRecenter = () => {
    if (mapRef.current) {
      const bounds: L.LatLngBoundsExpression = [[-totalHeight, 0], [0, totalWidth]];
      mapRef.current.fitBounds(bounds, { animate: true });
    }
  };

  const renderPoints = (points: Point[]) => {
    return points.map(pt => `${pt.x},${pt.y}`).join(' ');
  };

  const getPathData = (points: Point[]) => {
    return points.map((pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `L ${pt.x} ${pt.y}`)).join(' ');
  };

  const getExitLabel = (desc?: string) => {
    if (!desc) return null;
    const match = desc.match(/Exit\s+\d+/i);
    return match ? match[0].toUpperCase() : null;
  };

  return (
    <div className="relative w-full h-full">
      {/* Leaflet Map Target */}
      <div 
        ref={mapContainerRef} 
        className="w-full h-full bg-[#cadbfa] dark:bg-slate-900 transition-colors overflow-hidden select-none outline-none"
      />

      {/* Floating Zoom & Compass Controls */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-lg select-none transition-transform active:scale-95"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-center font-bold text-lg select-none transition-transform active:scale-95"
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={handleRecenter}
          className="w-10 h-10 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-center select-none transition-transform active:scale-95"
          title="Recenter Map"
        >
          <Compass className="w-5 h-5 animate-pulse text-blue-500" />
        </button>
      </div>

      {/* React Portal rendering SVG contents into the Leaflet overlay container */}
      {svgOverlayElement && createPortal(
        <>
          {/* Sea Grid Background */}
          <rect width={totalWidth} height={totalHeight} fill="none" />

          {/* Render original drawings in the background with opacity */}
          {showOriginals && Object.entries(mapData.tiles).map(([key, tile]) => {
            const { x, y, isPortrait } = getTileGeometry(tile.row, tile.col);
            return (
              <image
                key={key}
                href={`/maps/original/${tile.filename}`}
                x={0}
                y={0}
                width={4032}
                height={3024}
                transform={
                  isPortrait
                    ? `translate(${x + 3024}, ${y}) rotate(90)`
                    : `translate(${x}, ${y})`
                }
                className="opacity-45 pointer-events-none will-change-transform"
              />
            );
          })}

          {/* Landmass Vectors */}
          {mapData.landmasses.map((land) => (
            <polygon
              key={land.id}
              points={renderPoints(land.points)}
              className="fill-[#e6f4ea] dark:fill-emerald-950/20 stroke-[#81c995] dark:stroke-emerald-800 stroke-[50px] transition-colors"
            />
          ))}

          {/* Base Roads (Not Active Route) - Redrawn in Google Maps styles */}
          {mapData.roads.map((road) => {
            const pointsString = renderPoints(road.points);
            const pathData = getPathData(road.points);
            const isFreeway = road.type === 'freeway';

            return (
              <g key={road.id}>
                {/* Road Outline (Grey or Dark Yellow/Orange border) */}
                <polyline
                  points={pointsString}
                  className={`fill-none stroke-linejoin-round stroke-linecap-round ${
                    isFreeway 
                      ? 'stroke-[#e27a14] dark:stroke-amber-900 stroke-[240px]' 
                      : 'stroke-[#dadce0] dark:stroke-slate-800 stroke-[160px]'
                  }`}
                />
                {/* Road Center (White or Golden Yellow freeway) */}
                <polyline
                  points={pointsString}
                  className={`fill-none stroke-linejoin-round stroke-linecap-round ${
                    isFreeway 
                      ? 'stroke-[#ffe082] dark:stroke-amber-500 stroke-[180px]' 
                      : 'stroke-[#ffffff] dark:stroke-slate-700 stroke-[110px]'
                  }`}
                />
                {/* Freeway Center Divider Dash Line */}
                {isFreeway && (
                  <polyline
                    points={pointsString}
                    className="fill-none stroke-[#ffffff] dark:stroke-slate-800 stroke-[16px] stroke-dasharray-[60,60] stroke-linejoin-round stroke-linecap-round opacity-80"
                  />
                )}

                {/* Hidden path for text-align routing */}
                <path id={`path-${road.id}`} d={pathData} fill="none" stroke="none" />

                {/* Street Name Labels aligned along the curves */}
                <text className="font-sans text-[120px] fill-slate-700 dark:fill-slate-200 font-bold select-none pointer-events-none stroke-[#ffffff] dark:stroke-slate-900 stroke-[30px] paint-order-stroke opacity-85">
                  <textPath href={`#path-${road.id}`} startOffset="50%" textAnchor="middle">
                    {road.name}
                  </textPath>
                </text>
              </g>
            );
          })}

          {/* Active Routing Line */}
          {activeRoute.length > 0 && (
            <g>
              {/* Outer Glow Line */}
              <polyline
                points={activeRoute.map(pt => `${pt.x},${pt.y}`).join(' ')}
                className="fill-none stroke-[#1a73e8]/35 stroke-[320px] stroke-linejoin-round stroke-linecap-round"
              />
              {/* Main Blue Line */}
              <polyline
                points={activeRoute.map(pt => `${pt.x},${pt.y}`).join(' ')}
                className="fill-none stroke-[#1a73e8] stroke-[200px] stroke-linejoin-round stroke-linecap-round"
              />
              {/* Inner Bright Guide Line */}
              <polyline
                points={activeRoute.map(pt => `${pt.x},${pt.y}`).join(' ')}
                className="fill-none stroke-[#8ab4f8] stroke-[70px] stroke-linejoin-round stroke-linecap-round"
              />
            </g>
          )}

          {/* Floating Exit Signs above freeway junction points */}
          {mapData.roads.flatMap(road => 
            road.points
              .filter(pt => pt.description && pt.description.toLowerCase().includes('exit'))
              .map((pt, idx) => {
                const exitLabel = getExitLabel(pt.description);
                if (!exitLabel) return null;
                
                return (
                  <g key={`exit-${road.id}-${idx}`} transform={`translate(${pt.x}, ${pt.y - 250})`} className="pointer-events-none select-none">
                    {/* Drop shadow indicator */}
                    <rect
                      x="-150"
                      y="-70"
                      width="300"
                      height="130"
                      rx="16"
                      fill="#000000"
                      opacity="0.15"
                      transform="translate(10, 10)"
                    />
                    {/* Sign board */}
                    <rect
                      x="-150"
                      y="-70"
                      width="300"
                      height="130"
                      rx="16"
                      fill="#0f9d58"
                      stroke="#ffffff"
                      strokeWidth="10"
                    />
                    {/* Text label */}
                    <text
                      x="0"
                      y="12"
                      textAnchor="middle"
                      className="font-sans font-black text-[42px] fill-white"
                    >
                      {exitLabel}
                    </text>
                  </g>
                );
              })
          )}

          {/* Landmarks Pins */}
          {mapData.landmarks.map((landmark) => {
            const isSelected = selectedLandmarkId === landmark.id;
            return (
              <g
                key={landmark.id}
                onClick={() => onSelectLandmark(landmark.id)}
                className="cursor-pointer group pointer-events-auto"
              >
                {/* Selection Pulsing Ring */}
                {isSelected && (
                  <circle
                    cx={landmark.x}
                    cy={landmark.y}
                    r="400"
                    className="fill-blue-500/20 stroke-blue-500 stroke-[10px] animate-pulse"
                  />
                )}

                {/* HTML Pins using ForeignObject for vector scalability */}
                <foreignObject
                  x={landmark.x - 200}
                  y={landmark.y - 200}
                  width="400"
                  height="400"
                  className="overflow-visible"
                >
                  <div 
                    className={`flex flex-col items-center justify-center w-full h-full transition-transform active:scale-90 ${
                      isSelected 
                        ? 'scale-125' 
                        : 'hover:scale-110'
                    }`}
                  >
                    {/* Floating Pin Circle */}
                    <div 
                      className={`flex items-center justify-center w-48 h-48 rounded-full border-[10px] shadow-2xl transition-all ${
                        isSelected 
                          ? 'bg-blue-600 border-white text-white' 
                          : 'bg-white border-red-500 text-red-600 dark:bg-slate-800 dark:border-red-600 dark:text-red-500'
                      }`}
                    >
                      {getLandmarkIcon(landmark.icon, "w-24 h-24 stroke-[2.5]")}
                    </div>

                    {/* Pin Teardrop pointer arrow */}
                    <div 
                      className={`w-0 h-0 border-l-[25px] border-l-transparent border-r-[25px] border-r-transparent border-t-[36px] -mt-1 ${
                        isSelected ? 'border-t-white' : 'border-t-red-500 dark:border-t-red-600'
                      }`}
                    />
                  </div>
                </foreignObject>

                {/* Marker Text Label underneath */}
                <text
                  x={landmark.x}
                  y={landmark.y + 320}
                  textAnchor="middle"
                  className={`font-sans font-bold text-[130px] stroke-[24px] paint-order-stroke pointer-events-none select-none transition-colors ${
                    isSelected 
                      ? 'fill-blue-600 stroke-white' 
                      : 'fill-slate-800 stroke-white dark:fill-slate-100 dark:stroke-slate-900'
                  }`}
                >
                  {landmark.name}
                </text>
              </g>
            );
          })}
        </>,
        svgOverlayElement
      )}
    </div>
  );
}
