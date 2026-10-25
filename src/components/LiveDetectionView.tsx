import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Activity,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
  AlertCircle,
  Clock,
  Sparkles,
  FlipHorizontal,
  Sliders,
  Scan,
  Zap,
} from 'lucide-react';
import { ActiveTask, Detection } from '../types';
import { speechService } from '../services/speech';
import { cameraManager } from '../services/cameraManager';
import { localDetector } from '../services/localDetector';

interface LiveDetectionViewProps {
  highContrast?: boolean;
  onSwitchTask?: (task: ActiveTask) => void;
}

interface AnnouncementItem {
  id: string;
  time: string;
  text: string;
  type: 'detection' | 'guidance' | 'system';
}

export const LiveDetectionView: React.FC<LiveDetectionViewProps> = ({
  highContrast = false,
  onSwitchTask,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Requirement: Detection Sensitivity must ALWAYS default to 100% (maximum)
  const [sensitivity, setSensitivity] = useState<number>(100);
  const [duplicateSuppression, setDuplicateSuppression] = useState<boolean>(true);
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(true);
  const [invertLeftRight, setInvertLeftRight] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('omnilens_accessibility');
      if (saved) {
        try {
          return JSON.parse(saved).invertLeftRight || false;
        } catch (e) {}
      }
    }
    return true; // Default to true for front-facing laptop webcam
  });

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState<string>(
    'Live detection ready. Press Start Camera & Stream for instant real-time vision.'
  );
  const [detections, setDetections] = useState<Detection[]>([]);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'active' | 'stopping' | 'error'>('idle');
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Performance telemetry
  const [inferenceMs, setInferenceMs] = useState<number>(0);
  const [fps, setFps] = useState<number>(0);

  // Refs for zero-latency camera loop
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const inFlightRef = useRef<boolean>(false);
  const cameraRequestIdRef = useRef<number>(0);

  // Audio coordination refs
  const lastSpokenLabelsRef = useRef<string>('');
  const lastSpokenTimeRef = useRef<number>(0);

  // Map 100% sensitivity to the most sensitive practical confidence threshold (0.15)
  // Higher sensitivity lowers the minimum threshold down to 0.15 to consider candidate objects
  const minConfidence = Math.max(0.12, 0.65 - ((sensitivity - 10) / 90) * (0.65 - 0.15));

  // Initialize local neural model on mount
  useEffect(() => {
    isMountedRef.current = true;
    (async () => {
      if (!localDetector.isReady()) {
        setModelLoading(true);
        await localDetector.initModel();
        if (isMountedRef.current) setModelLoading(false);
      }
    })();

    return () => {
      isMountedRef.current = false;
      stopDetectionLoop();
      cameraManager.releaseSession('live-detection', videoRef.current);
      speechService.stop();
    };
  }, []);

  const startCamera = async () => {
    const reqId = ++cameraRequestIdRef.current;
    setError(null);
    setCameraState('starting');

    try {
      const stream = await cameraManager.acquireSession('live-detection', {
        facingMode: 'user',
        idealWidth: 1280,
        idealHeight: 720,
      });

      if (!isMountedRef.current || cameraRequestIdRef.current !== reqId) {
        cameraManager.releaseSession('live-detection', videoRef.current);
        return;
      }

      if (videoRef.current) {
        cameraManager.attachToVideo(videoRef.current, stream);
        await cameraManager.waitForVideoReady(videoRef.current, 2500);

        if (!isMountedRef.current || cameraRequestIdRef.current !== reqId) {
          cameraManager.releaseSession('live-detection', videoRef.current);
          return;
        }

        setCameraActive(true);
        setCameraState('active');
      }
    } catch (err: any) {
      if (cameraRequestIdRef.current !== reqId) return;
      console.warn('Live camera error:', err);
      const classified = cameraManager.classifyCameraError(err);
      setError(classified.message + ' ' + classified.guidance);
      setCameraActive(false);
      setCameraState('error');
      speechService.speak(classified.title + '. ' + classified.message, 'interrupt');
    }
  };

  const stopDetectionLoop = () => {
    isRunningRef.current = false;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    inFlightRef.current = false;
    setIsRunning(false);
  };

  const stopCameraStream = () => {
    cameraRequestIdRef.current++;
    stopDetectionLoop();
    cameraManager.releaseSession('live-detection', videoRef.current);
    setCameraActive(false);
    setCameraState('idle');
    setDetections([]);
    setInferenceMs(0);
    setFps(0);
  };

  // Continuous bounded detection loop
  const runLiveLoop = useCallback(async () => {
    if (!isRunningRef.current || !isMountedRef.current) return;

    const video = videoRef.current;
    if (video && video.readyState >= 2 && !video.paused) {
      // Bounded latest-frame execution: only infer if not already processing
      if (!inFlightRef.current) {
        inFlightRef.current = true;
        try {
          const res = await localDetector.detect(video, minConfidence, invertLeftRight);
          if (isMountedRef.current && isRunningRef.current) {
            setDetections(res.detections);
            setInferenceMs(res.inferenceMs);
            setFps(res.fps);

            // Announce detections via speech in the background without blocking video
            if (speechEnabled && res.detections.length > 0) {
              handleSpeechAnnouncements(res.detections);
            }
          }
        } catch (e) {
          console.warn('[LiveDetection] Loop inference error:', e);
        } finally {
          inFlightRef.current = false;
        }
      }
    }

    if (isRunningRef.current && isMountedRef.current) {
      rafIdRef.current = requestAnimationFrame(runLiveLoop);
    }
  }, [minConfidence, invertLeftRight, speechEnabled]);

  // Priority-aware speech coordination with duplicate suppression
  const handleSpeechAnnouncements = (currentDets: Detection[]) => {
    const now = Date.now();
    // Sort detections by size (prominence in view)
    const sorted = [...currentDets].sort(
      (a, b) => b.box.width * b.box.height - a.box.width * a.box.height
    );

    // Build concise spoken phrase for the top 3 objects
    const topItems = sorted.slice(0, 3);
    const labelsKey = topItems.map((d) => `${d.label}-${d.position}`).join(',');

    // Duplicate suppression: suppress identical announcements within 6 seconds
    if (
      duplicateSuppression &&
      labelsKey === lastSpokenLabelsRef.current &&
      now - lastSpokenTimeRef.current < 6000
    ) {
      return;
    }

    const descriptions = topItems.map((d) => {
      const art = ['a', 'e', 'i', 'o', 'u'].includes(d.label[0]) ? 'an' : 'a';
      return `${art} ${d.label} ${d.sideDirection || 'in center'}`;
    });

    let spoken = '';
    if (descriptions.length === 1) {
      spoken = `Visible: ${descriptions[0]}.`;
    } else if (descriptions.length === 2) {
      spoken = `Visible: ${descriptions[0]}, and ${descriptions[1]}.`;
    } else {
      const last = descriptions.pop();
      spoken = `Visible: ${descriptions.join(', ')}, and ${last}.`;
    }

    lastSpokenLabelsRef.current = labelsKey;
    lastSpokenTimeRef.current = now;
    setLatestAnnouncement(spoken);

    setAnnouncements((prev) => [
      {
        id: `ann-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        text: spoken,
        type: 'detection',
      },
      ...prev.slice(0, 19),
    ]);

    speechService.speak(spoken, 'queue', 'obstacle');
  };

  const handleStartStream = async () => {
    if (!cameraActive) {
      await startCamera();
    }
    setIsRunning(true);
    isRunningRef.current = true;
    speechService.speak('Continuous Live Detection active. Point your camera at any object.', 'interrupt');

    // Start requestAnimationFrame loop
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(runLiveLoop);
  };

  const handlePauseStream = () => {
    stopDetectionLoop();
    speechService.speak('Live detection stream paused. Camera is on standby.');
  };

  const handleStopAll = () => {
    stopCameraStream();
    speechService.speak('Live detection stopped. Camera hardware turned off.');
  };

  // Re-trigger loop if sensitivity or mirroring settings change while running
  useEffect(() => {
    if (isRunning) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(runLiveLoop);
    }
  }, [minConfidence, invertLeftRight, speechEnabled, isRunning, runLiveLoop]);

  return (
    <div className="space-y-6 select-none" role="region" aria-label="Live Detection Stream Screen">
      {/* Top Header Card */}
      <div className="p-6 rounded-3xl bg-[#180A10]/95 backdrop-blur-md border border-[#3E1627] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                isRunning
                  ? 'bg-emerald-400 animate-pulse'
                  : cameraActive
                  ? 'bg-amber-400'
                  : 'bg-white/30'
              }`}
            />
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <span>Live Detection Stream</span>
              <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>Instant In-Browser Neural Engine</span>
              </span>
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                isRunning
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : cameraActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-white/10 text-white/60 border-white/10'
              }`}
            >
              {isRunning ? 'Continuous Stream Active' : cameraActive ? 'Camera Standby' : 'Camera Off'}
            </span>
          </div>
          <p className="text-xs text-white/65">
            Continuous local object detection with 0ms network latency. Reuses neural model in memory for fluid visual tracking.
          </p>
        </div>

        {/* Primary Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isRunning ? (
            <>
              <button
                onClick={handlePauseStream}
                className="py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md bg-amber-600 hover:bg-amber-700 text-white"
                aria-label="Pause Live Detection"
              >
                <Pause className="w-4 h-4" />
                <span>Pause (Standby)</span>
              </button>
              <button
                onClick={handleStopAll}
                className="py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md bg-rose-600 hover:bg-rose-700 text-white"
                aria-label="Stop camera and turn off hardware"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Stop Camera</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleStartStream}
                className="py-2.5 px-5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#10B981]/25 bg-[#10B981] hover:bg-[#059669] text-white"
                aria-label="Start Live Detection"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{cameraActive ? 'Resume Stream' : 'Start Camera & Stream'}</span>
              </button>
              {cameraActive && (
                <button
                  onClick={handleStopAll}
                  className="py-2.5 px-3.5 rounded-xl bg-white/10 border border-white/15 hover:bg-rose-950/60 text-rose-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  aria-label="Stop camera and release hardware"
                >
                  <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Turn Off Camera</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => speechService.stop()}
            className="py-2.5 px-3.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 text-rose-200 border border-rose-600/40 font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
            aria-label="Stop speaking immediately"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Silence Audio</span>
          </button>

          <button
            onClick={() => speechService.repeat()}
            className="py-2.5 px-3.5 rounded-xl bg-[#220E19] border border-[#3E1627] hover:bg-[#331425] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            aria-label="Repeat last spoken announcement"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Repeat</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Camera on Left, Spoken Guidance on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video preview & Canvas Overlays */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl bg-[#180A10]/95 backdrop-blur-md border border-[#3E1627] shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs flex-wrap gap-2">
              <span className="font-bold text-white flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#10B981]" />
                Live Camera Input
              </span>

              {/* Real-time Telemetry Badges */}
              {isRunning && (
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ⚡ {inferenceMs}ms
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {fps} FPS
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {detections.length} objects
                  </span>
                </div>
              )}

              <button
                onClick={() => setInvertLeftRight(!invertLeftRight)}
                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                  invertLeftRight
                    ? 'bg-[#10B981]/20 border-[#10B981]/40 text-[#10B981]'
                    : 'bg-[#220E19] border-[#3E1627] text-white/70'
                }`}
                title="Inverts preview so your real right is right, and real left is left"
              >
                <FlipHorizontal className="w-3.5 h-3.5" />
                <span>Laptop Mirror: {invertLeftRight ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            {/* Video Viewport with Aspect-Ratio Preserving Letterbox Alignment */}
            <div
              ref={containerRef}
              className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-[#3E1627] shadow-inner"
            >
              {error ? (
                <div className="p-6 text-center text-white space-y-3 max-w-sm">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
                  <p className="text-xs font-semibold leading-relaxed">{error}</p>
                  <button
                    onClick={startCamera}
                    className="mt-2 py-2 px-4 rounded-xl bg-[#10B981] text-white text-xs font-bold cursor-pointer"
                  >
                    Retry Camera
                  </button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-contain ${
                      invertLeftRight ? 'scale-x-[-1]' : ''
                    }`}
                  />
                  {!cameraActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-black/85 z-10 space-y-3">
                      {cameraState === 'starting' || modelLoading ? (
                        <>
                          <Activity className="w-8 h-8 text-[#10B981] animate-spin" />
                          <p className="text-xs font-bold text-white">
                            {modelLoading ? 'Initializing Neural Vision Engine...' : 'Starting live camera stream...'}
                          </p>
                        </>
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-white/50" />
                          <p className="text-sm font-bold text-white">Live Camera is on Standby</p>
                          <p className="text-xs text-white/60 max-w-xs">
                            Press "Start Camera & Stream" to activate continuous real-time object recognition.
                          </p>
                          <button
                            onClick={handleStartStream}
                            className="py-2.5 px-5 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#10B981]/25 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Camera & Stream</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Accurately Mapped Bounding Boxes */}
                  {cameraActive &&
                    detections.map((d, i) => {
                      const nb = d.normalizedBox || {
                        x: (d.box?.x || 0) / 640,
                        y: (d.box?.y || 0) / 480,
                        width: (d.box?.width || 0) / 640,
                        height: (d.box?.height || 0) / 480,
                      };

                      // When mirrored via scale-x-[-1], horizontally invert the box position
                      const leftPct = invertLeftRight ? (1 - (nb.x + nb.width)) * 100 : nb.x * 100;

                      return (
                        <div
                          key={d.id || i}
                          className="absolute border-2 border-[#10B981] bg-[#10B981]/15 rounded-lg pointer-events-none transition-all duration-75"
                          style={{
                            left: `${Math.max(0, Math.min(95, leftPct))}%`,
                            top: `${Math.max(0, Math.min(95, nb.y * 100))}%`,
                            width: `${Math.max(4, Math.min(100, nb.width * 100))}%`,
                            height: `${Math.max(4, Math.min(100, nb.height * 100))}%`,
                          }}
                        >
                          <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#10B981] text-black whitespace-nowrap shadow-md uppercase">
                            {d.label} {Math.round(d.confidence * 100)}%
                          </span>
                        </div>
                      );
                    })}
                </>
              )}
            </div>

            {/* Detection Sensitivity Filter — ALWAYS Defaults to 100% (Maximum) */}
            <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-[#10B981]" />
                    <span className="font-bold text-white">Detection Sensitivity Filter</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                      {sensitivity === 100 ? 'MAXIMUM' : `${sensitivity}%`}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60">
                    100% maximum sensitivity considers lower-confidence candidates for subtle & small items.
                  </p>
                </div>

                <span className="text-xs font-mono font-bold text-[#10B981] tabular-nums px-2.5 py-1 rounded-lg bg-[#10B981]/20 border border-[#10B981]/40 shadow-sm">
                  {sensitivity}%
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseInt(e.target.value, 10))}
                className="w-full accent-[#10B981] cursor-pointer"
                aria-label="Detection sensitivity filter (always defaults to 100%)"
              />

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#311320] text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-white/80">
                  <input
                    type="checkbox"
                    checked={duplicateSuppression}
                    onChange={(e) => setDuplicateSuppression(e.target.checked)}
                    className="rounded text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                  />
                  <span>Duplicate suppression (calm audio)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-semibold text-white/80">
                  <input
                    type="checkbox"
                    checked={speechEnabled}
                    onChange={(e) => setSpeechEnabled(e.target.checked)}
                    className="rounded text-[#10B981] focus:ring-[#10B981] cursor-pointer"
                  />
                  <span>Spoken announcements</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Announcements & History */}
        <div className="lg:col-span-5 space-y-4">
          {/* Latest Spoken Guidance Card */}
          <div className="p-6 rounded-3xl bg-[#180A10]/95 backdrop-blur-md border border-[#3E1627] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#10B981] flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" />
                Latest Spoken Guidance
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                Live Spatial Audio
              </span>
            </div>

            <div
              className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] text-white text-sm font-semibold leading-relaxed border-l-4 border-[#10B981]"
              aria-live="polite"
              aria-atomic="true"
            >
              "{latestAnnouncement}"
            </div>

            <p className="text-[11px] text-white/60">
              Announces changes in your physical surroundings based on detected objects, room elements, and human activity.
            </p>
          </div>

          {/* Announcement Timeline Log */}
          <div className="p-6 rounded-3xl bg-[#180A10]/95 backdrop-blur-md border border-[#3E1627] shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#311320]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#10B981]" />
                Recent Announcements
              </span>
              <button
                onClick={() => setAnnouncements([])}
                className="text-[11px] font-bold text-[#10B981] hover:underline cursor-pointer"
              >
                Clear Log
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {announcements.length === 0 ? (
                <p className="text-xs text-white/40 italic py-4 text-center">
                  Waiting for detection stream...
                </p>
              ) : (
                announcements.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#220E19] border border-[#3E1627] flex items-start justify-between gap-3 text-xs"
                  >
                    <p className="text-white font-medium leading-snug">
                      {item.text}
                    </p>
                    <span className="text-[10px] font-mono text-white/50 shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
