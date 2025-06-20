import React from 'react';

interface RadiusSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

/**
 * RadiusSlider component for controlling the filter radius
 * Provides a slider to select the radius in kilometers (1-50km)
 */
const RadiusSlider: React.FC<RadiusSliderProps> = ({ 
  value, 
  onChange, 
  min = 1, 
  max = 50 
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md">
      <div className="flex flex-col gap-2">
        <label htmlFor="radius-slider" className="text-sm font-medium flex justify-between">
          <span>Rayon de recherche:</span>
          <span className="font-bold">{value} km</span>
        </label>
        <input
          id="radius-slider"
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="Contrôle du rayon de recherche en kilomètres"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>{min} km</span>
          <span>{max} km</span>
        </div>
      </div>
    </div>
  );
};

export default RadiusSlider;
