'use client';

import { useState, useRef, useEffect } from 'react';
import { ColorOption } from '@/lib/types';

interface CarViewer3DProps {
  colors: ColorOption[];
  vehicleName: string;
  vehicleImageUrl: string;
}

export function CarViewer3D({ colors, vehicleName, vehicleImageUrl }: CarViewer3DProps) {
  const exteriorColors = colors.filter((c) => c.type === 'exterior');
  const [selectedColor, setSelectedColor] = useState<ColorOption>(
    colors.find((c) => c.type === 'exterior') || colors[0]
  );
  const [rotateY, setRotateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [displayImage, setDisplayImage] = useState(vehicleImageUrl);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // When a color with its own image is selected, swap the displayed image
  useEffect(() => {
    const newImage = selectedColor.imageUrl || vehicleImageUrl;
    if (newImage !== displayImage) {
      setIsTransitioning(true);
      // Preload the new image before fading in
      const img = new Image();
      img.onload = () => {
        setDisplayImage(newImage);
        setImageLoaded(true);
        setTimeout(() => setIsTransitioning(false), 50);
      };
      img.onerror = () => {
        // If the color image fails, fall back to the default
        setDisplayImage(vehicleImageUrl);
        setImageLoaded(true);
        setTimeout(() => setIsTransitioning(false), 50);
      };
      img.src = newImage;
    }
  }, [selectedColor, vehicleImageUrl, displayImage]);

  // Subtle auto-sway when not interacting
  useEffect(() => {
    if (isDragging) return;
    let frame: number;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;
      setRotateY(Math.sin(elapsed * 0.4) * 6);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.current.x;
    setRotateY((prev) => Math.max(-25, Math.min(25, prev + dx * 0.15)));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const dx = e.touches[0].clientX - lastPos.current.x;
    setRotateY((prev) => Math.max(-25, Math.min(25, prev + dx * 0.15)));
    lastPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((prev) => Math.max(0.8, Math.min(1.5, prev - e.deltaY * 0.001)));
  };

  const handleColorSelect = (color: ColorOption) => {
    setSelectedColor(color);
  };

  return (
    <div className="bg-gradient-to-b from-[#f0f2ee] to-[#e4e7e0] rounded-2xl border border-primary-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary-border/50">
        <div>
          <h3 className="text-heading-sm font-semibold text-primary-text">
            Color Studio
          </h3>
          <p className="text-caption text-primary-muted mt-0.5">{vehicleName}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-primary-surface rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-medium text-primary-muted">LIVE</span>
          </div>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={containerRef}
        className="relative h-[420px] cursor-grab active:cursor-grabbing select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => setIsDragging(false)}
        onWheel={handleWheel}
      >
        {/* Floor reflection */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[120px]"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.03) 100%)`,
          }}
        />

        {/* Car Image — swaps per selected color */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            perspective: '1200px',
          }}
        >
          <div
            className="relative w-full h-full"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotateY}deg) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          >
            {/* The car image for the selected color */}
            <img
              src={displayImage}
              alt={`${vehicleName} — ${selectedColor.name}`}
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
              style={{
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.15))',
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 0.35s ease-in-out',
              }}
            />

            {/* Highlight/sheen overlay for realism */}
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, transparent 60%, rgba(0,0,0,0.08) 100%)',
                mixBlendMode: 'overlay',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        {/* Ground shadow */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[70%] h-[30px] rounded-[50%]"
          style={{
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 70%)',
            filter: 'blur(6px)',
          }}
        />

        {/* Color name badge */}
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-black/10"
            style={{ backgroundColor: selectedColor.hex }}
          />
          <span className="text-body-sm font-medium text-primary-text">
            {selectedColor.name}
          </span>
        </div>

        {/* Interaction hint */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-full">
          <svg className="w-4 h-4 text-primary-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 9l4 4 4-4M5 15l4 4 4-4" />
            <path d="M15 9l4 4 4-4M15 15l4 4 4-4" />
          </svg>
          <span className="text-[11px] text-primary-muted font-medium">Drag to rotate &middot; Scroll to zoom</span>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-t border-primary-border/50">
        {/* Color Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-caption text-primary-muted">Exterior Color</span>
            <span className="text-body-sm font-medium text-primary-text">
              {selectedColor.name}
              {selectedColor.price && (
                <span className="text-primary-accent ml-1.5">
                  (+{selectedColor.price.toLocaleString()})
                </span>
              )}
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {exteriorColors.map((color) => (
              <button
                key={color.name}
                onClick={() => handleColorSelect(color)}
                className={`relative w-10 h-10 rounded-full transition-all duration-200 ${
                  selectedColor.name === color.name
                    ? 'ring-2 ring-primary-accent ring-offset-2 scale-110'
                    : 'hover:scale-110'
                }`}
                style={{ backgroundColor: color.hex }}
                title={`${color.name}${color.price ? ` (+${color.price.toLocaleString()})` : ''}`}
              >
                {(color.hex === '#F5F5F0' || color.hex === '#FAFAFA' || color.hex === '#F5F0E8') && (
                  <div className="absolute inset-0 rounded-full border border-primary-border/40" />
                )}
                {selectedColor.name === color.name && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className={`w-4 h-4 ${
                        color.hex === '#0F0F0F' || color.hex === '#1A1A1A' || color.hex === '#1C1C1E'
                          ? 'text-white'
                          : 'text-primary-text'
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
