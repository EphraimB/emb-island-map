'use client';

import React, { useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { 
  Anchor, Route, Mountain, Compass, Trees as Tree, Castle, Flag, Tent, MapPin, 
  School, Info, Home, Star, Coffee, Ship
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
  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-centering effect when coordinates change
  useEffect(() => {
    if (activeStepCoords && transformRef.current && containerRef.current) {
      const { x, y } = activeStepCoords;
      const wWidth = containerRef.current.clientWidth;
      const wHeight = containerRef.current.clientHeight;

      // Zoom level for focus (higher is closer)
      const targetScale = 0.08; 

      // Center in container
      const targetX = wWidth / 2 - x * targetScale;
      const targetY = wHeight / 2 - y * targetScale;

      transformRef.current.setTransform(targetX, targetY, targetScale, 1000, 'easeOut');
    }
  }, [activeStepCoords]);

  // Initial centering on Mount (focus on the middle of the L shape or first landmark)
  useEffect(() => {
    if (transformRef.current && containerRef.current && mapData.landmarks.length > 0) {
      const firstLandmark = mapData.landmarks[0];
      const wWidth = containerRef.current.clientWidth;
      const wHeight = containerRef.current.clientHeight;

      // Start zoomed out to see the map
      const initialScale = 0.025;
      const targetX = wWidth / 2 - firstLandmark.x * initialScale;
      const targetY = wHeight / 2 - firstLandmark.y * initialScale;

      transformRef.current.setTransform(targetX, targetY, initialScale, 0);
    }
  }, [mapData]);

  // Global SVG coordinates:
  // 8 cols * 4032 px = 32256 px wide
  // 13 rows * 3024 px = 39312 px high
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
      x = 0; // Column 1 is at x = 0
      y = 3024 + (12 - row) * 4032;
    } else {
      x = (col - 1) * 4032;
      y = 0; // Row 13 is at y = 0
    }
    
    return { x, y, width, height, isPortrait };
  };

  // Render landmass points
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
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-[#cadbfa] dark:bg-slate-900 transition-colors overflow-hidden select-none"
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={0.025}
        minScale={0.005}
        maxScale={0.25}
        doubleClick={{ disabled: false }}
        wheel={{ step: 0.1 }}
      >
        <TransformComponent wrapperClass="!w-full !h-full">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${totalWidth} ${totalHeight}`}
            width={totalWidth}
            height={totalHeight}
            className="origin-top-left max-w-none max-h-none"
          >
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
                  className="opacity-45 pointer-events-none"
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
                  <text className="font-sans text-[46px] fill-slate-700 dark:fill-slate-200 font-bold select-none pointer-events-none stroke-[#ffffff] dark:stroke-slate-900 stroke-[14px] paint-order-stroke opacity-85">
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
                  className="cursor-pointer group"
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

            {/* Current Navigation Node indicator pin */}
            {activeStepCoords && (
              <g transform={`translate(${activeStepCoords.x}, ${activeStepCoords.y})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="150"
                  className="fill-blue-500/30 stroke-blue-400 stroke-[8px] animate-ping"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="60"
                  className="fill-blue-600 stroke-white stroke-[12px] shadow-lg"
                />
              </g>
            )}
          </svg>
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
}
