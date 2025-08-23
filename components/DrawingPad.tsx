'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

type DrawingPadProps = {
  className?: string;
  lineWidth?: number;
  strokeStyle?: string;
};

export interface DrawingPadRef {
  captureImage: () => string | null;
  clearCanvas: () => void;
}

const DrawingPad = forwardRef<DrawingPadRef, DrawingPadProps>(({ className = '', lineWidth = 2, strokeStyle = '#111827' }, ref) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  useImperativeHandle(ref, () => ({
    captureImage: () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      
      try {
        // Create a temporary canvas to handle device pixel ratio
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return null;
        
        // Set the temporary canvas size to the display size
        const rect = canvas.getBoundingClientRect();
        tempCanvas.width = rect.width;
        tempCanvas.height = rect.height;
        
        // Draw the original canvas content to the temporary canvas
        tempCtx.drawImage(canvas, 0, 0, rect.width, rect.height);
        
        // Convert to data URL
        return tempCanvas.toDataURL('image/png');
      } catch (error) {
        console.error('Error capturing canvas image:', error);
        return null;
      }
    },
    clearCanvas: () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      // Refill white background in CSS pixels
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.restore();
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const setupCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.lineWidth = lineWidth;
      context.strokeStyle = strokeStyle;
      ctxRef.current = context;
      // Fill background white for better visibility
      context.save();
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, rect.width, rect.height);
      context.restore();
    };

    setupCanvas();
    setIsReady(true);

    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(container);
    return () => {
      ro.disconnect();
    };
  }, [lineWidth, strokeStyle]);

  const getRelativePoint = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ctxRef.current) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const { x, y } = getRelativePoint(e.clientX, e.clientY);
    lastPointRef.current = { x, y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !ctxRef.current || !lastPointRef.current) return;
    const ctx = ctxRef.current;
    const { x, y } = getRelativePoint(e.clientX, e.clientY);
    const { x: lx, y: ly } = lastPointRef.current;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if ((e.target as HTMLElement).hasPointerCapture(e.pointerId)) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    // Refill white background in CSS pixels
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.restore();
  };

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}> 
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
          aria-label="Clear notepad"
          title="Clear"
        >
          Clear
        </button>
      </div>
      <div ref={containerRef} className="w-full h-full">
        <canvas
          ref={canvasRef}
          className={`w-full h-full touch-none cursor-crosshair ${isReady ? '' : 'opacity-0'}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>
    </div>
  );
});

DrawingPad.displayName = 'DrawingPad';

export default DrawingPad;


