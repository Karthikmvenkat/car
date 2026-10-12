'use client';

import { useState } from 'react';
import { ColorOption } from '@/lib/types';

interface VehicleColorPickerProps {
  colors: ColorOption[];
  selectedColor?: string;
  onColorChange?: (color: ColorOption) => void;
}

export function VehicleColorPicker({
  colors,
  selectedColor,
  onColorChange,
}: VehicleColorPickerProps) {
  const [activeTab, setActiveTab] = useState<'exterior' | 'interior'>('exterior');

  const exteriorColors = colors.filter((c) => c.type === 'exterior');
  const interiorColors = colors.filter((c) => c.type === 'interior');
  const displayColors = activeTab === 'exterior' ? exteriorColors : interiorColors;

  const currentColor = selectedColor
    ? colors.find((c) => c.name === selectedColor)
    : displayColors[0];

  const handleSelect = (color: ColorOption) => {
    onColorChange?.(color);
  };

  return (
    <div className="bg-white rounded-2xl border border-primary-border p-6">
      <h3 className="text-heading-sm font-semibold text-primary-text mb-4">
        Color Options
      </h3>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-primary-surface rounded-lg mb-5">
        <button
          onClick={() => setActiveTab('exterior')}
          className={`flex-1 py-2 text-body-sm font-medium rounded-md transition-all ${
            activeTab === 'exterior'
              ? 'bg-white text-primary-text shadow-sm'
              : 'text-primary-muted hover:text-primary-text'
          }`}
        >
          Exterior
        </button>
        <button
          onClick={() => setActiveTab('interior')}
          className={`flex-1 py-2 text-body-sm font-medium rounded-md transition-all ${
            activeTab === 'interior'
              ? 'bg-white text-primary-text shadow-sm'
              : 'text-primary-muted hover:text-primary-text'
          }`}
        >
          Interior
        </button>
      </div>

      {/* Color Swatches */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {displayColors.map((color) => (
          <button
            key={color.name}
            onClick={() => handleSelect(color)}
            className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all ${
              currentColor?.name === color.name
                ? 'bg-primary-surface ring-2 ring-primary-accent'
                : 'hover:bg-primary-surface/50'
            }`}
            title={color.name}
          >
            <div
              className={`w-10 h-10 rounded-full border-2 transition-transform group-hover:scale-110 ${
                currentColor?.name === color.name
                  ? 'border-primary-accent scale-110'
                  : 'border-primary-border'
              }`}
              style={{ backgroundColor: color.hex }}
            >
              {color.hex === '#F5F5F0' || color.hex === '#FAFAFA' || color.hex === '#F5F0E8' ? (
                <div className="w-full h-full rounded-full border border-primary-border/30" />
              ) : null}
            </div>
            <span className="text-[10px] text-primary-muted text-center leading-tight line-clamp-2">
              {color.name}
            </span>
            {color.price && (
              <span className="text-[9px] text-primary-accent font-medium">
                +{color.price.toLocaleString()}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Selected Color Info */}
      {currentColor && (
        <div className="flex items-center gap-3 p-3 bg-primary-surface rounded-lg">
          <div
            className="w-8 h-8 rounded-full border border-primary-border"
            style={{ backgroundColor: currentColor.hex }}
          />
          <div className="flex-1">
            <p className="text-body-sm font-medium text-primary-text">
              {currentColor.name}
            </p>
            <p className="text-caption text-primary-muted capitalize">
              {currentColor.type} Color
            </p>
          </div>
          {currentColor.price && (
            <span className="text-body-sm font-semibold text-primary-accent">
              +{currentColor.price.toLocaleString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
