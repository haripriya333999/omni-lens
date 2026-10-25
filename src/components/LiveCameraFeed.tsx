import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Radio,
  AlertCircle,
  Sparkles,
  X,
  CheckCircle2,
  FlipHorizontal,
  Upload,
} from 'lucide-react';
import { speechService } from '../services/speech';
import { cameraManager, CameraDetailedError } from '../services/cameraManager';

interface LiveCameraFeedProps {
  onCapture: (dataUrl: string, file?: File) => void;
  onCloseCamera: () => void;
  isLoading: boolean;
}

export const LiveCameraFeed: React.FC<LiveCameraFeedProps> = ({
  onCapture,
  onCloseCamera,
  isLoading,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraStarting, setCameraStarting] = useState<boolean>(false);
  const [error, setError] = useState<CameraDetailedError | null>(null);
  const [autoScan, setAutoScan] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('user');
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const timerRef = useRef<any>(null);
  const cameraRequestIdRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    const reqId = ++cameraRequestIdRef.current;
    setError(null);
    setCameraStarting(true);
    setCameraActive(false);

    try {
      const stream = await cameraManager.acquireSession('live-camera-feed', {
        facingMode: mode,
        idealWidth: 1280,
        idealHeight: 720,
      });

      if (!isMountedRef.current || cameraRequestIdRef.current !== reqId) {
        cameraManager.releaseSession('live-camera-feed', videoRef.current);
        return;
      }

      if (videoRef.current) {
        cameraManager.attachToVideo(videoRef.current, stream);
        const isReady = await cameraManager.waitForVideoReady(videoRef.current, 2500);
        if (!isMountedRef.current || cameraRequestIdRef.current !== reqId) {
          cameraManager.releaseSession('live-camera-feed', videoRef.current);
          return;
        }
        if (isReady) {
          setCameraActive(true);
          setCameraStarting(false);
          speechService.speak('Live camera active. Point camera at surroundings.');
        }
      }
    } catch (err: any) {
      if (cameraRequestIdRef.current !== reqId) return;
      console.warn('LiveCameraFeed start error:', err);
      const classified = cameraManager.classifyCameraError(err);
      setError(classified);
      setCameraActive(false);
      setCameraStarting(false);
      speechService.speak(classified.title + '. ' + classified.message, 'interrupt');
    }
  };

  const stopCameraStream = () => {
    cameraRequestIdRef.current++;
    cameraManager.releaseSession('live-camera-feed', videoRef.current);
    setCameraActive(false);
    setCameraStarting(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    startCamera();
    return () => {
      isMountedRef.current = false;
      stopCameraStream();
    };
  }, []);

  const takeSnapshot = () => {
    if (!videoRef.current || !cameraActive) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'live-camera-frame.jpg', { type: 'image/jpeg' });
          onCapture(dataUrl, file);
        } else {
          onCapture(dataUrl);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  // Continuous auto-scan
  useEffect(() => {
    if (autoScan && cameraActive) {
      timerRef.current = setInterval(() => {
        takeSnapshot();
      }, 5000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoScan, cameraActive]);

  const toggleCameraFacing = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    setIsMirrored(next === 'user');
    startCamera(next);
  };

  const toggleMirrorMode = () => {
    const nextMirror = !isMirrored;
    setIsMirrored(nextMirror);
    speechService.speak(
      nextMirror
        ? 'Mirror mode enabled. Left and right are aligned.'
        : 'Mirror mode disabled. Standard camera orientation.'
    );
  };

  return (
    <div
      className="p-5 bg-[#1C0D15] rounded-3xl border border-[#3E1627] shadow-xl space-y-4 mb-6 select-none"
      role="region"
      aria-label="Live Camera Assistance Viewfinder"
    >
      <div className="flex items-center justify-between pb-3 border-b border-[#311320]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Live Camera Assistance Feed
            </h3>
            <p className="text-xs text-white/60">
              Point your camera at doors, signs, or objects and click Capture
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive && (
            <>
              <button
                onClick={toggleMirrorMode}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isMirrored
                    ? 'bg-[#EC4899] text-white border-[#EC4899] shadow-sm'
                    : 'bg-[#25101C] text-white/80 border-[#3E1627] hover:bg-[#331425]'
                }`}
                title="Mirror mode: inverts camera feed so your real right is right, and real left is left (ideal for laptop cameras)"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>{isMirrored ? 'Laptop Mirror: ON' : 'Mirror: OFF'}</span>
              </button>
              <button
                onClick={toggleCameraFacing}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#25101C] text-white/80 border border-[#3E1627] hover:bg-[#331425] transition-colors cursor-pointer"
                title="Flip between front and rear cameras"
              >
                Flip Camera
              </button>
            </>
          )}

          <button
            onClick={() => {
              stopCameraStream();
              onCloseCamera();
            }}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close live camera feed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-5 bg-amber-950/40 rounded-2xl text-xs text-amber-200 space-y-3 border border-amber-500/40">
          <div className="font-bold flex items-center gap-2 text-sm text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error.title}</span>
          </div>
          <p className="leading-relaxed text-white/85">{error.message}</p>
          <div className="p-3 bg-black/40 rounded-xl text-xs font-mono text-white/80 whitespace-pre-line border border-white/10">
            {error.guidance}
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            {error.canRetry && (
              <button
                onClick={() => startCamera()}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-500 transition-colors cursor-pointer"
              >
                Retry Camera
              </button>
            )}
            <button
              onClick={onCloseCamera}
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/15 text-white font-semibold text-xs hover:bg-white/15 transition-colors cursor-pointer"
            >
              Upload Photo Instead
            </button>
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-[460px] flex items-center justify-center border border-[#3E1627] shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ transform: isMirrored ? 'scaleX(-1)' : 'none' }}
            className="w-full h-full object-cover transition-transform duration-200"
          />

          {/* Viewfinder crosshair */}
          <div className="absolute inset-0 pointer-events-none border border-white/15 rounded-2xl m-4 flex items-center justify-center">
            <div className="w-16 h-16 border-2 border-[#EC4899]/70 rounded-2xl" />
          </div>

          {autoScan && (
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-mono font-bold flex items-center gap-1.5 shadow-md animate-pulse">
              <Radio className="w-3.5 h-3.5" />
              <span>Auto-Scanning Scene...</span>
            </div>
          )}
        </div>
      )}

      {/* Camera Action Buttons */}
      {!error && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScan(!autoScan)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                autoScan
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm animate-pulse'
                  : 'bg-[#25101C] text-white/80 border-[#3E1627] hover:bg-[#331425]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{autoScan ? 'Auto-Scan On (5s)' : 'Enable Continuous Auto-Scan'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={takeSnapshot}
              disabled={isLoading || !cameraActive}
              className="px-6 py-3 rounded-2xl bg-[#EC4899] hover:bg-[#DB2777] disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#EC4899]/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Capture Frame & Analyze</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
