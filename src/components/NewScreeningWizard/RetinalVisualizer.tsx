import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Layers, 
  Activity, 
  Eye, 
  SunMedium, 
  Sliders,
  CheckCircle,
  Crosshair
} from 'lucide-react';
import { EyeAssessment } from '../../types';

interface RetinalVisualizerProps {
  assessment: EyeAssessment;
  eyeLabel: 'OD (Right Eye)' | 'OS (Left Eye)';
}

export const RetinalVisualizer: React.FC<RetinalVisualizerProps> = ({
  assessment,
  eyeLabel,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeFilter, setActiveFilter] = useState<'standard' | 'green' | 'clahe' | 'heatmap'>('standard');
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.65);
  const [showCrosshairs, setShowCrosshairs] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom handlers
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 4.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.8));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setZoom((prev) => Math.min(Math.max(prev + zoomFactor, 0.8), 4.0));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex flex-col ${
        isFullscreen ? 'h-screen w-screen' : 'h-[440px] sm:h-[480px]'
      }`}
    >
      {/* Visualizer Top Bar Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Badge: Eye & Filter state */}
        <div className="flex items-center space-x-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs shadow-md">
          <span className="font-bold text-teal-400 font-mono tracking-wide">{eyeLabel}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-medium capitalize">
            {activeFilter === 'green' ? 'Green-Free (Vessel Mode)' : activeFilter === 'heatmap' ? 'Grad-CAM AI Heatmap' : activeFilter === 'clahe' ? 'CLAHE Enhanced' : 'Standard True-Color'}
          </span>
        </div>

        {/* Right Tools: Zoom, Pan reset, Crosshairs, Fullscreen */}
        <div className="flex items-center space-x-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 shadow-md">
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`p-1.5 rounded transition-colors ${
              showCrosshairs ? 'bg-teal-600/30 text-teal-300 border border-teal-500/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Retinal Macula/Disc Center Reticle"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div 
        className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden flex items-center justify-center select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative transition-transform duration-75 origin-center"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* Base Fundus Image with Filter FX */}
          <img
            src={assessment.imageUrl}
            alt={`${eyeLabel} Fundus`}
            className="max-h-[380px] sm:max-h-[420px] object-contain rounded-full shadow-2xl transition-all"
            style={{
              filter: 
                activeFilter === 'green'
                  ? 'brightness(1.1) contrast(1.4) hue-rotate(90deg) saturate(2)'
                  : activeFilter === 'clahe'
                  ? 'contrast(1.6) brightness(1.05)'
                  : 'none',
            }}
            draggable={false}
          />

          {/* Grad-CAM Heatmap Layer (Dynamic Simulation / Backend Render) */}
          {activeFilter === 'heatmap' && (
            <div 
              className="absolute inset-0 rounded-full pointer-events-none mix-blend-screen overflow-hidden"
              style={{ opacity: heatmapOpacity }}
            >
              {assessment.heatmapUrl ? (
                <img 
                  src={assessment.heatmapUrl} 
                  alt="Grad-CAM Lesion Activation" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: assessment.drStage >= 3
                      ? 'radial-gradient(circle at 60% 45%, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.6) 35%, rgba(59, 130, 246, 0.3) 65%, transparent 80%)'
                      : assessment.drStage >= 1
                      ? 'radial-gradient(circle at 55% 48%, rgba(245, 158, 11, 0.7) 0%, rgba(16, 185, 129, 0.4) 40%, transparent 70%)'
                      : 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.3) 0%, transparent 60%)',
                  }}
                />
              )}
            </div>
          )}

          {/* Optical Center Reticle / Crosshair */}
          {showCrosshairs && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-full h-[1px] bg-teal-400/40 border-dashed"></div>
              <div className="h-full w-[1px] bg-teal-400/40 border-dashed absolute"></div>
              <div className="w-20 h-20 rounded-full border border-teal-400/50 absolute"></div>
            </div>
          )}
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute bottom-16 right-3 pointer-events-none bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 border border-slate-800">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Visualizer Bottom Filter Switcher Strip */}
      <div className="bg-slate-900/95 border-t border-slate-800 px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setActiveFilter('standard')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeFilter === 'standard'
                ? 'bg-teal-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            True Color
          </button>
          <button
            onClick={() => setActiveFilter('green')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeFilter === 'green'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Green-Channel (Vessels)
          </button>
          <button
            onClick={() => setActiveFilter('clahe')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              activeFilter === 'clahe'
                ? 'bg-cyan-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            CLAHE Enhance
          </button>
          <button
            onClick={() => setActiveFilter('heatmap')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all flex items-center space-x-1.5 ${
              activeFilter === 'heatmap'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Grad-CAM AI Heatmap</span>
          </button>
        </div>

        {/* Heatmap Opacity Slider (when heatmap is active) */}
        {activeFilter === 'heatmap' && (
          <div className="flex items-center space-x-2 text-xs text-slate-300">
            <span className="text-[11px] text-slate-400">Heatmap Intensity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        )}
      </div>
    </div>
  );
};
