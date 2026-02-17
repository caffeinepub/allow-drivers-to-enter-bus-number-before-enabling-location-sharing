import React, { useEffect, useRef, useState } from 'react';
import type { Location } from '../backend';

interface BusMapProps {
  location: Location | null | undefined;
  busNumber: string | null;
}

export default function BusMap({ location, busNumber }: BusMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prevLocation, setPrevLocation] = useState<{ x: number; y: number } | null>(null);
  const animationRef = useRef<number | null>(null);
  const [animatedPosition, setAnimatedPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    let currentX = animatedPosition?.x || 0;
    let currentY = animatedPosition?.y || 0;
    let targetX = currentX;
    let targetY = currentY;

    if (location) {
      // Normalize coordinates to canvas
      const normalizedLat = ((location.latitude % 0.01) + 0.01) % 0.01;
      const normalizedLng = ((location.longitude % 0.01) + 0.01) % 0.01;
      
      targetX = (normalizedLng / 0.01) * width;
      targetY = (normalizedLat / 0.01) * height;

      // Initialize position if first time
      if (!animatedPosition) {
        currentX = targetX;
        currentY = targetY;
        setAnimatedPosition({ x: currentX, y: currentY });
      }
    }

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'oklch(0.98 0.01 200)');
      gradient.addColorStop(1, 'oklch(0.95 0.02 220)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = 'oklch(0.88 0.01 220)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw roads (simulated)
      ctx.strokeStyle = 'oklch(0.65 0.02 220)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      
      // Vertical roads
      ctx.beginPath();
      ctx.moveTo(width * 0.2, 0);
      ctx.lineTo(width * 0.2, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(width * 0.8, 0);
      ctx.lineTo(width * 0.8, height);
      ctx.stroke();
      
      // Horizontal road
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();

      // Road markings
      ctx.strokeStyle = 'oklch(0.95 0 0)';
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 10]);
      
      ctx.beginPath();
      ctx.moveTo(width * 0.2, 0);
      ctx.lineTo(width * 0.2, height);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      ctx.lineTo(width, height * 0.5);
      ctx.stroke();
      
      ctx.setLineDash([]);

      if (location) {
        // Smooth animation towards target
        const speed = 0.1;
        currentX += (targetX - currentX) * speed;
        currentY += (targetY - currentY) * speed;
        
        setAnimatedPosition({ x: currentX, y: currentY });

        // Draw route trail
        if (prevLocation) {
          ctx.strokeStyle = 'oklch(0.6 0.15 250 / 0.3)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(prevLocation.x, prevLocation.y);
          ctx.lineTo(currentX, currentY);
          ctx.stroke();
        }

        // Draw pulse rings
        const time = Date.now() / 1000;
        for (let i = 0; i < 3; i++) {
          const pulseRadius = 20 + (time * 30 + i * 20) % 60;
          const pulseOpacity = 1 - ((time * 30 + i * 20) % 60) / 60;
          ctx.strokeStyle = `oklch(0.6 0.2 250 / ${pulseOpacity * 0.3})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(currentX, currentY, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        const busSize = 20;
        
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.arc(currentX + 3, currentY + 3, busSize / 2 + 8, 0, Math.PI * 2);
        ctx.fill();

        // Outer glow
        const glowGradient = ctx.createRadialGradient(currentX, currentY, 0, currentX, currentY, busSize / 2 + 12);
        glowGradient.addColorStop(0, 'oklch(0.6 0.25 250 / 0.8)');
        glowGradient.addColorStop(1, 'oklch(0.6 0.25 250 / 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, busSize / 2 + 12, 0, Math.PI * 2);
        ctx.fill();

        // Outer circle
        ctx.fillStyle = 'oklch(0.6 0.2 250)';
        ctx.beginPath();
        ctx.arc(currentX, currentY, busSize / 2 + 6, 0, Math.PI * 2);
        ctx.fill();

        // Inner circle
        const innerGradient = ctx.createRadialGradient(currentX - 3, currentY - 3, 0, currentX, currentY, busSize / 2 + 2);
        innerGradient.addColorStop(0, 'oklch(0.65 0.22 250)');
        innerGradient.addColorStop(1, 'oklch(0.5 0.25 250)');
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(currentX, currentY, busSize / 2 + 2, 0, Math.PI * 2);
        ctx.fill();

        // Bus icon (simplified)
        ctx.fillStyle = 'white';
        ctx.fillRect(currentX - 7, currentY - 5, 14, 10);
        ctx.fillRect(currentX - 5, currentY - 7, 10, 3);
        
        // Windows
        ctx.fillStyle = 'oklch(0.5 0.25 250)';
        ctx.fillRect(currentX - 5, currentY - 3, 4, 3);
        ctx.fillRect(currentX + 1, currentY - 3, 4, 3);

        // Label with background
        if (busNumber) {
          ctx.font = 'bold 13px sans-serif';
          const textWidth = ctx.measureText(busNumber).width;
          const labelPadding = 8;
          const labelY = currentY + busSize + 20;
          
          // Label background
          ctx.fillStyle = 'oklch(0.2 0 0 / 0.8)';
          ctx.beginPath();
          ctx.roundRect(
            currentX - textWidth / 2 - labelPadding,
            labelY - 10,
            textWidth + labelPadding * 2,
            20,
            4
          );
          ctx.fill();
          
          // Label text
          ctx.fillStyle = 'white';
          ctx.textAlign = 'center';
          ctx.fillText(busNumber, currentX, labelY + 4);
        }

        setPrevLocation({ x: currentX, y: currentY });
      } else {
        // No location message
        ctx.fillStyle = 'oklch(0.5 0.02 220)';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('No bus location available', width / 2, height / 2 - 10);
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'oklch(0.6 0.02 220)';
        ctx.fillText('Enter a bus number to start tracking', width / 2, height / 2 + 15);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [location, busNumber, animatedPosition]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden border bg-muted shadow-inner">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      {location && (
        <div className="absolute top-4 right-4 bg-background/95 backdrop-blur px-3 py-2 rounded-lg shadow-lg border text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">Live Tracking</span>
          </div>
        </div>
      )}
    </div>
  );
}
