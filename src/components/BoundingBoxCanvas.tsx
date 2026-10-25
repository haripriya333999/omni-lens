import React, { useRef, useEffect, useState } from 'react';
import { Detection } from '../types';

interface BoundingBoxCanvasProps {
  imageSrc: string;
  detections: Detection[];
  highlightLabel?: string;
  selectedDetectionId?: string;
  onSelectDetection?: (det: Detection) => void;
  onImageReady?: (img: HTMLImageElement) => void;
  highContrast?: boolean;
}

export const BoundingBoxCanvas: React.FC<BoundingBoxCanvasProps> = ({
  imageSrc,
  detections,
  highlightLabel,
  selectedDetectionId,
  onSelectDetection,
  onImageReady,
  highContrast = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Handle image loading
  useEffect(() => {
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
      if (onImageReady) {
        onImageReady(img);
      }
    };
  }, [imageSrc, onImageReady]);

  // Color helper based on label
  const getColorPalette = (label: string, isMatch: boolean, isSelected: boolean) => {
    if (highContrast) {
      if (isSelected || isMatch) {
        return {
          stroke: '#00FF66',
          fill: 'rgba(0, 255, 102, 0.25)',
          tagBg: '#000000',
          tagText: '#00FF66',
        };
      }
      return {
        stroke: '#FFFF00',
        fill: 'rgba(255, 255, 0, 0.15)',
        tagBg: '#000000',
        tagText: '#FFFF00',
      };
    }

    const lower = label.toLowerCase();
    // Doors and windows: Rich warm Amber / Cyan
    if (lower.includes('door') || lower.includes('latch') || lower.includes('handle')) {
      return {
        stroke: '#D97706', // amber-600
        fill: isSelected ? 'rgba(217, 119, 6, 0.25)' : 'rgba(217, 119, 6, 0.12)',
        tagBg: '#78350F',
        tagText: '#FFFFFF',
      };
    }
    if (lower.includes('window') || lower.includes('ventilator') || lower.includes('curtain')) {
      return {
        stroke: '#0284C7', // sky-600
        fill: isSelected ? 'rgba(2, 132, 199, 0.25)' : 'rgba(2, 132, 199, 0.12)',
        tagBg: '#0C4A6E',
        tagText: '#FFFFFF',
      };
    }
    if (lower.includes('fan') || lower.includes('light') || lower.includes('bulb')) {
      return {
        stroke: '#EAB308', // yellow-500
        fill: isSelected ? 'rgba(234, 179, 8, 0.25)' : 'rgba(234, 179, 8, 0.12)',
        tagBg: '#713F12',
        tagText: '#FFFFFF',
      };
    }
    // Person and Gestures: Vibrant Emerald
    if (lower.includes('person') || lower.includes('man') || lower.includes('woman') || lower.includes('girl')) {
      return {
        stroke: isSelected ? '#10B981' : '#059669',
        fill: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.12)',
        tagBg: '#064E3B',
        tagText: '#FFFFFF',
      };
    }
    // Snack / bottle / phone / items: Royal Violet or Orange
    if (lower.includes('cookie') || lower.includes('snack') || lower.includes('packet') || lower.includes('bottle')) {
      return {
        stroke: '#EA580C', // orange-600
        fill: isSelected ? 'rgba(234, 88, 12, 0.25)' : 'rgba(234, 88, 12, 0.12)',
        tagBg: '#7C2D12',
        tagText: '#FFFFFF',
      };
    }

    // Default Royal Lavender
    return {
      stroke: isSelected ? '#7353B5' : '#8B5CF6',
      fill: isSelected ? 'rgba(115, 83, 181, 0.25)' : 'rgba(115, 83, 181, 0.12)',
      tagBg: '#392743',
      tagText: '#FFFFFF',
    };
  };

  // Redraw canvas
  useEffect(() => {
    if (!imageLoaded || !imageRef.current || !canvasRef.current || !containerRef.current) return;
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match image dimensions
    canvas.width = img.naturalWidth || img.width || 640;
    canvas.height = img.naturalHeight || img.height || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding boxes
    detections.forEach((det) => {
      const isMatch = highlightLabel
        ? det.label.toLowerCase().includes(highlightLabel.toLowerCase()) ||
          highlightLabel.toLowerCase().includes(det.label.toLowerCase())
        : true;
      const isSelected = selectedDetectionId === det.id;

      const palette = getColorPalette(det.label, isMatch, isSelected);

      // Accurately map normalized coordinates [0.0 - 1.0] to canvas natural pixels
      let x = det.box.x;
      let y = det.box.y;
      let width = det.box.width;
      let height = det.box.height;

      if (det.normalizedBox) {
        const normX = det.normalizedBox.x > 1.0 ? det.normalizedBox.x / 1000 : det.normalizedBox.x;
        const normY = det.normalizedBox.y > 1.0 ? det.normalizedBox.y / 1000 : det.normalizedBox.y;
        const normW = det.normalizedBox.width > 1.0 ? det.normalizedBox.width / 1000 : det.normalizedBox.width;
        const normH = det.normalizedBox.height > 1.0 ? det.normalizedBox.height / 1000 : det.normalizedBox.height;

        x = Math.max(0, Math.round(normX * canvas.width));
        y = Math.max(0, Math.round(normY * canvas.height));
        width = Math.max(12, Math.round(normW * canvas.width));
        height = Math.max(12, Math.round(normH * canvas.height));
      } else if (canvas.width !== 640 || canvas.height !== 480) {
        x = Math.round((det.box.x / 640) * canvas.width);
        y = Math.round((det.box.y / 480) * canvas.height);
        width = Math.round((det.box.width / 640) * canvas.width);
        height = Math.round((det.box.height / 480) * canvas.height);
      }

      // Draw box outline and fill
      ctx.lineWidth = isSelected ? 4 : highContrast ? 3 : 2.5;
      ctx.strokeStyle = palette.stroke;
      ctx.fillStyle = palette.fill;

      // Rounded rectangle effect
      ctx.beginPath();
      const radius = 6;
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      ctx.stroke();

      // Label badge
      const confPercent = Math.round(det.confidence * 100);
      const sideText = det.sideDirection
        ? (det.sideDirection.includes('left') ? 'Left Side' : det.sideDirection.includes('right') ? 'Right Side' : 'Center')
        : (det.position === 'center' ? 'Center' : det.position === 'left' ? 'Left Side' : 'Right Side');
      
      const badgeText = `${det.label.toUpperCase()} · ${sideText} · ${confPercent}%`;

      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      const textMetrics = ctx.measureText(badgeText);
      const textWidth = textMetrics.width;
      const textHeight = 16;
      const padX = 6;
      const padY = 4;
      const tagX = Math.max(0, x);
      const tagY = Math.max(0, y - textHeight - padY * 2);

      // Tag background
      ctx.fillStyle = palette.tagBg;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, textWidth + padX * 2, textHeight + padY * 2, 4);
      ctx.fill();

      if (highContrast) {
        ctx.strokeStyle = palette.tagText;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Tag text
      ctx.fillStyle = palette.tagText;
      ctx.fillText(badgeText, tagX + padX, tagY + textHeight);
    });
  }, [imageLoaded, detections, highlightLabel, selectedDetectionId, highContrast]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl overflow-hidden bg-black/90 border border-[#3E1627] flex items-center justify-center max-h-[500px] shadow-2xl"
    >
      <img
        src={imageSrc}
        alt="Visual scene under analysis"
        className="max-h-[500px] w-full object-contain"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        aria-hidden="true"
      />
    </div>
  );
};
