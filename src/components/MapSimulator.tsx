/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { LocationItem, PassengerStep, DriverStep } from '../types';
import { Compass, Navigation, Radio, MapPin, Map as MapIcon } from 'lucide-react';

interface MapSimulatorProps {
  pickup: LocationItem | null;
  destination: LocationItem | null;
  step: PassengerStep | DriverStep;
  userRole: 'passenger' | 'driver';
  onMapClick?: (lat: number, lng: number, label: string) => void;
  tukTukProgress?: number; // 0 to 100 for path animation
  driverStepType?: 'pickup' | 'destination' | 'done';
}

export default function MapSimulator({
  pickup,
  destination,
  step,
  userRole,
  onMapClick,
  tukTukProgress = 0,
  driverStepType = 'pickup',
}: MapSimulatorProps) {
  // We represent the map inside a coordinate space of 400x400
  const width = 400;
  const height = 400;
  
  // Simulated elements on the map (like trees, houses, other Tuk-Tuks)
  const [ambientVehicles, setAmbientVehicles] = useState([
    { id: 1, x: 80, y: 150, dx: 0.5, dy: 0, icon: '🛺' },
    { id: 2, x: 320, y: 120, dx: 0, dy: 0.6, icon: '🚗' },
    { id: 3, x: 200, y: 300, dx: -0.4, dy: 0, icon: '🛵' },
    { id: 4, x: 150, y: 80, dx: 0, dy: -0.5, icon: '🛺' }
  ]);

  // Update ambient vehicles for that "live map" feel
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbientVehicles((prev) =>
        prev.map((v) => {
          let newX = v.x + v.dx;
          let newY = v.y + v.dy;
          
          // Wrap around limits
          if (newX > 400) newX = 0;
          if (newX < 0) newX = 400;
          if (newY > 400) newY = 0;
          if (newY < 0) newY = 400;
          
          return { ...v, x: newX, y: newY };
        })
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Map clicks helper
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onMapClick) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale client coordinate to SVG space (400x400)
    const svgX = (x / rect.width) * width;
    const svgY = (y / rect.height) * height;

    // Convert SVG coords to simple lat/lng offsets for display (El Waqf center)
    const simulatedLat = 25.99 + (1 - svgY / height) * 0.08;
    const simulatedLng = 32.45 + (svgX / width) * 0.11;

    // Determine nearest landmark or street name based on click location
    let streetName = 'شارع فرعي في الوقف';
    if (svgY < 120) {
      streetName = 'السنابسة / جبل السنابسة';
    } else if (svgY > 280) {
      streetName = 'المراشدة / طريق الجبل';
    } else if (svgX > 280) {
      streetName = 'جبل العماير والوشاحية';
    } else if (svgX < 120) {
      streetName = 'الوقف (المركز) / المستشفى';
    } else {
      streetName = 'البهايجة والمنشية والمعادي';
    }

    onMapClick(simulatedLat, simulatedLng, streetName);
  };

  // Convert lat/lng to coordinate space 400x400 (El Waqf region scaling)
  // Default values if pickup/destination is null
  const getCoords = (item: LocationItem | null, isPickup: boolean) => {
    if (item) {
      // Scale from our POPULAR_LOCATIONS coordinates
      const x = ((item.lng - 32.45) / 0.11) * width;
      const y = (1 - (item.lat - 25.99) / 0.08) * height;
      return { x: Math.max(20, Math.min(width - 20, x)), y: Math.max(20, Math.min(height - 20, y)) };
    }
    // Static fallbacks
    return isPickup ? { x: 120, y: 160 } : { x: 280, y: 220 };
  };

  const pickupCoord = getCoords(pickup, true);
  const destCoord = getCoords(destination, false);

  // Calculate the active Tuk-Tuk position along the path
  let activeTukTukPos = { x: pickupCoord.x, y: pickupCoord.y };
  let pathAngle = 0;

  if (step === 'trip_active' || step === 'on_trip') {
    if (driverStepType === 'pickup') {
      // Driver moving from some random start (e.g. 50, 50) towards pickup
      const startX = 60;
      const startY = 320;
      const pct = tukTukProgress / 100;
      activeTukTukPos.x = startX + (pickupCoord.x - startX) * pct;
      activeTukTukPos.y = startY + (pickupCoord.y - startY) * pct;
      
      const dx = pickupCoord.x - startX;
      const dy = pickupCoord.y - startY;
      pathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    } else {
      // Passenger is in the trip or driver is navigating from pickup to destination
      const pct = tukTukProgress / 100;
      activeTukTukPos.x = pickupCoord.x + (destCoord.x - pickupCoord.x) * pct;
      activeTukTukPos.y = pickupCoord.y + (destCoord.y - pickupCoord.y) * pct;

      const dx = destCoord.x - pickupCoord.x;
      const dy = destCoord.y - pickupCoord.y;
      pathAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-100 rounded-3xl overflow-hidden shadow-inner border border-slate-200">
      {/* Dynamic Header Overlay */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-slate-100 text-xs text-slate-700 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>تتبع GPS حي ونشط</span>
        </div>
        <button className="p-2 rounded-full bg-white/95 backdrop-blur shadow-sm pointer-events-auto border border-slate-100 active:scale-95 transition-transform">
          <Compass className="w-5 h-5 text-slate-600 animate-spin-slow" />
        </button>
      </div>

      {/* SVG Canvas Map */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 400 400"
        className="w-full h-full cursor-crosshair select-none"
        onClick={handleSvgClick}
      >
        {/* Background Grids & Land */}
        <rect width="400" height="400" fill="#E8ECE9" />
        
        {/* Neighborhood Landmass Colors (Parks / Green zones) */}
        <path d="M0 0 C 100 50, 50 120, 0 150 Z" fill="#D3E2D4" opacity="0.7" />
        <path d="M280 0 C 350 40, 380 120, 400 150 L 400 0 Z" fill="#D3E2D4" opacity="0.6" />
        <path d="M50 300 C 120 340, 180 320, 200 400 L 0 400 Z" fill="#D3E2D4" opacity="0.6" />
        <path d="M250 320 C 300 300, 360 380, 400 370 L 400 400 L 220 400 Z" fill="#D3E2D4" opacity="0.5" />

        {/* The Great River Nile (نهر النيل) */}
        <path
          d="M 230 0 C 220 100, 250 150, 230 250 C 210 320, 190 360, 180 400"
          fill="none"
          stroke="#A9D3E9"
          strokeWidth="32"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M 230 0 C 220 100, 250 150, 230 250 C 210 320, 190 360, 180 400"
          fill="none"
          stroke="#BAE1F5"
          strokeWidth="20"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Bridges across the Nile */}
        {/* 15th May Bridge */}
        <line x1="160" y1="120" x2="300" y2="135" stroke="#CBD5E1" strokeWidth="12" opacity="0.9" />
        <line x1="160" y1="120" x2="300" y2="135" stroke="#F1F5F9" strokeWidth="6" />

        {/* 6th October Bridge */}
        <line x1="140" y1="210" x2="280" y2="225" stroke="#CBD5E1" strokeWidth="12" opacity="0.9" />
        <line x1="140" y1="210" x2="280" y2="225" stroke="#F1F5F9" strokeWidth="6" />

        {/* Demand Hotspots (Glowing Cairo Heatmap) */}
        <g opacity="0.12">
          {/* Embaba */}
          <circle cx="50" cy="50" r="45" fill="#EF4444" />
          <circle cx="50" cy="50" r="20" fill="#F59E0B" />
          {/* Dokki */}
          <circle cx="50" cy="270" r="45" fill="#EF4444" />
          <circle cx="50" cy="270" r="20" fill="#F59E0B" />
          {/* Downtown / Tahrir */}
          <circle cx="340" cy="340" r="45" fill="#EF4444" />
          <circle cx="340" cy="340" r="20" fill="#F59E0B" />
        </g>

        {/* Major Grid Roads */}
        <g stroke="#F8FAFC" strokeLinecap="round" opacity="0.95">
          {/* Main Ring Road / Al-Kornish */}
          <path d="M 310 0 L 310 400" strokeWidth="14" />
          <path d="M 90 0 L 90 400" strokeWidth="14" />
          <path d="M 0 160 L 400 160" strokeWidth="14" />
          <path d="M 0 310 L 400 310" strokeWidth="14" />

          {/* Diagonals / Al-Tahrir Street */}
          <path d="M 0 80 L 180 180" strokeWidth="10" />
          <path d="M 180 180 L 400 240" strokeWidth="10" />
          <path d="M 0 240 L 400 100" strokeWidth="10" stroke="#E2E8F0" />
        </g>

        {/* Inner Road Yellow/Grey Lane Markings */}
        <g stroke="#94A3B8" strokeWidth="1" strokeDasharray="4 6" opacity="0.6">
          <path d="M 310 0 L 310 400" />
          <path d="M 90 0 L 90 400" />
          <path d="M 0 160 L 400 160" />
          <path d="M 0 310 L 400 310" />
        </g>

        {/* Neighborhood names (El Waqf style) */}
        <text x="50" y="50" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="Cairo" opacity="0.75">السنابسة</text>
        <text x="350" y="80" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="Cairo" opacity="0.75">جبل العماير</text>
        <text x="50" y="270" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="Cairo" opacity="0.75">الوقف (المركز)</text>
        <text x="340" y="340" fill="#64748B" fontSize="10" fontWeight="bold" fontFamily="Cairo" opacity="0.75">المراشدة</text>
        <text x="130" y="380" fill="#64748B" fontSize="9" fontWeight="bold" fontFamily="Cairo" opacity="0.6">المنشية والمعادي</text>

        {/* Ambient Moving Traffic Cars / TukTuks */}
        {ambientVehicles.map((v) => (
          <g key={v.id}>
            <text
              x={v.x}
              y={v.y}
              fontSize="14"
              textAnchor="middle"
              alignmentBaseline="middle"
              className="transition-all duration-300 pointer-events-none"
            >
              {v.icon}
            </text>
          </g>
        ))}

        {/* Searching Radar Animation (When searching for a captain) */}
        {step === 'searching' && (
          <g transform={`translate(${pickupCoord.x}, ${pickupCoord.y})`}>
            <circle r="60" fill="none" stroke="#16A34A" strokeWidth="1.5" opacity="0.15">
              <animate attributeName="r" values="20;120" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle r="40" fill="none" stroke="#16A34A" strokeWidth="1" opacity="0.25">
              <animate attributeName="r" values="10;80" dur="2s" begin="0.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0" dur="2s" begin="0.6s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Trip Path (Only visible when pickup and destination are defined) */}
        {pickup && destination && (step === 'home' || step === 'searching' || step === 'trip_active' || step === 'on_trip') && (
          <g>
            {/* Background glowing path line */}
            <path
              d={`M ${pickupCoord.x} ${pickupCoord.y} L ${destCoord.x} ${destCoord.y}`}
              fill="none"
              stroke="#16A34A"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.2"
            />
            {/* Flowing dashes representing traffic direction */}
            <path
              d={`M ${pickupCoord.x} ${pickupCoord.y} L ${destCoord.x} ${destCoord.y}`}
              fill="none"
              stroke="#16A34A"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 6"
            >
              <animate attributeName="stroke-dashoffset" values="50;0" dur="2s" repeatCount="indefinite" />
            </path>
          </g>
        )}

        {/* Pickup Pin */}
        {pickup && (
          <g transform={`translate(${pickupCoord.x}, ${pickupCoord.y - 12})`}>
            {/* Pulse effect */}
            <circle cx="0" cy="12" r="6" fill="#16A34A" opacity="0.3">
              <animate attributeName="r" values="4;15" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* The pin itself */}
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 9.3 12 20 12 20s12-10.7 12-20c0-6.63-5.37-12-12-12zm0 16.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"
              fill="#16A34A"
              transform="scale(0.8) translate(-12, -15)"
            />
            <text x="0" y="2" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">أ</text>
          </g>
        )}

        {/* Destination Pin */}
        {destination && (step === 'home' || step === 'searching' || step === 'trip_active' || step === 'on_trip' || step === 'rating') && (
          <g transform={`translate(${destCoord.x}, ${destCoord.y - 12})`}>
            {/* Red pulsing locator */}
            <circle cx="0" cy="12" r="6" fill="#EF4444" opacity="0.3">
              <animate attributeName="r" values="4;15" dur="1.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" />
            </circle>
            <path
              d="M12 0C5.37 0 0 5.37 0 12c0 9.3 12 20 12 20s12-10.7 12-20c0-6.63-5.37-12-12-12zm0 16.5c-2.48 0-4.5-2.02-4.5-4.5s2.02-4.5 4.5-4.5 4.5 2.02 4.5 4.5-2.02 4.5-4.5 4.5z"
              fill="#EF4444"
              transform="scale(0.8) translate(-12, -15)"
            />
            <text x="0" y="2" fill="white" fontSize="7" fontWeight="bold" textAnchor="middle">ب</text>
          </g>
        )}

        {/* Active Moving Tuk-Tuk icon (Trip active or driver navigating) */}
        {(step === 'trip_active' || step === 'on_trip') && (
          <g transform={`translate(${activeTukTukPos.x}, ${activeTukTukPos.y})`}>
            {/* Tuk tuk glow */}
            <circle cx="0" cy="0" r="14" fill="#FBBF24" opacity="0.3" className="animate-pulse" />
            
            {/* Rotating container for direction direction */}
            <g transform={`rotate(${pathAngle})`}>
              {/* Backwards-pointing speed lines */}
              <line x1="-12" y1="-4" x2="-18" y2="-4" stroke="#FBBF24" strokeWidth="1.5" opacity="0.7" />
              <line x1="-12" y1="4" x2="-18" y2="4" stroke="#FBBF24" strokeWidth="1.5" opacity="0.7" />
              
              {/* Actual stylized Tuk-Tuk emoji / block */}
              <text
                x="0"
                y="1"
                fontSize="22"
                textAnchor="middle"
                alignmentBaseline="middle"
                className="select-none pointer-events-none drop-shadow-md"
              >
                🛺
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* Map Hint / Interactive Instruction */}
      {step === 'home' && (
        <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex justify-center">
          <div className="bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md border border-slate-700/50 flex items-center gap-1.5 pointer-events-auto">
            <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>انقر على أي مكان بالخريطة لتحديد موقع وجهتك!</span>
          </div>
        </div>
      )}
    </div>
  );
}
