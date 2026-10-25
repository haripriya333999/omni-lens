import React, { useState, useEffect } from 'react';
import {
  Camera,
  Mic,
  Volume2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  X,
  HelpCircle,
  Eye,
} from 'lucide-react';
import { cameraManager } from '../services/cameraManager';
import { speechService } from '../services/speech';

interface OnboardingPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const OnboardingPermissionsModal: React.FC<OnboardingPermissionsModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [cameraErrorDetails, setCameraErrorDetails] = useState<string | null>(null);

  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [micErrorDetails, setMicErrorDetails] = useState<string | null>(null);

  const [isSpeechTested, setIsSpeechTested] = useState<boolean>(false);

  // Check initial permissions state if available
  useEffect(() => {
    if (!isOpen) return;

    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as any })
        .then((res) => {
          if (res.state === 'granted') setCameraStatus('granted');
          else if (res.state === 'denied') setCameraStatus('denied');
        })
        .catch(() => {});

      navigator.permissions
        .query({ name: 'microphone' as any })
        .then((res) => {
          if (res.state === 'granted') setMicStatus('granted');
          else if (res.state === 'denied') setMicStatus('denied');
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestCamera = async () => {
    setCameraStatus('requesting');
    setCameraErrorDetails(null);

    try {
      const stream = await cameraManager.acquireSession('onboarding-test', {
        idealWidth: 1280,
        idealHeight: 720,
      });

      // Immediately release test stream so hardware light turns off
      cameraManager.releaseSession('onboarding-test');
      setCameraStatus('granted');
      speechService.speak('Camera access granted successfully. OmniLens can now see live surroundings.');
    } catch (err: any) {
      console.warn('Onboarding camera request failed:', err);
      const classified = cameraManager.classifyCameraError(err);
      setCameraStatus('denied');
      setCameraErrorDetails(classified.guidance);
      speechService.speak('Camera permission denied or device busy. You can still upload photos from your device.');
    }
  };

  const handleRequestMicrophone = async () => {
    setMicStatus('requesting');
    setMicErrorDetails(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('unsupported');
      setMicErrorDetails('Microphone input is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus('granted');
      speechService.speak('Microphone access granted. You can now use voice commands.');
    } catch (err: any) {
      console.warn('Onboarding microphone request failed:', err);
      setMicStatus('denied');
      setMicErrorDetails(
        'Microphone permission was denied. You can still use buttons, keyboard navigation, or click the lock icon 🔒 beside the URL bar to enable microphone.'
      );
      speechService.speak('Microphone access was denied. You can still use all OmniLens visual features via buttons and keyboard.');
    }
  };

  const handleTestSpeech = () => {
    setIsSpeechTested(true);
    speechService.speak(
      'Welcome to OmniLens. High-fidelity spoken audio is active and crystal clear. Spatial elevation and horizontal direction cues are ready.',
      'interrupt'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="bg-[#180B12] border border-[#3E1627] text-[#FAF7F0] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close setup modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EC4899]/15 border border-[#EC4899]/30 text-[#EC4899] text-xs font-semibold">
            <Eye className="w-3.5 h-3.5" />
            <span>Accessible First-Time Setup</span>
          </div>
          <h2 id="onboarding-title" className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome to OmniLens
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            OmniLens is a voice-first visual companion for blind and low-vision users. We respect your privacy: camera and microphone are never accessed in the background and only run on explicit user action.
          </p>
        </div>

        {/* Permission Cards */}
        <div className="space-y-3.5">
          {/* 1. Camera Card */}
          <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center shrink-0">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Camera Access</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/75">
                      Required for Live Scan
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Used to identify doors, read signs, guide walking navigation, and find objects.
                  </p>
                </div>
              </div>

              <div>
                {cameraStatus === 'granted' ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enabled</span>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestCamera}
                    disabled={cameraStatus === 'requesting'}
                    className="px-4 py-2 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{cameraStatus === 'requesting' ? 'Requesting...' : 'Enable Camera Access'}</span>
                  </button>
                )}
              </div>
            </div>

            {cameraStatus === 'denied' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="w-4 h-4" />
                  <span>Camera Access Blocked by Browser</span>
                </div>
                <p className="whitespace-pre-line text-[11px] text-white/80 leading-relaxed">
                  {cameraErrorDetails}
                </p>
                <div className="pt-1 flex gap-2">
                  <button
                    onClick={handleRequestCamera}
                    className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Retry Camera
                  </button>
                  <span className="text-[11px] text-white/60 self-center">
                    (Or choose "Upload Photo" to use photos directly!)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Microphone Card */}
          <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center shrink-0">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">Microphone Access</h3>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/75">
                      Optional for Voice
                    </span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Used when you say "Describe my surroundings", "Find a bottle", or "Stop".
                  </p>
                </div>
              </div>

              <div>
                {micStatus === 'granted' ? (
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Enabled</span>
                  </div>
                ) : (
                  <button
                    onClick={handleRequestMicrophone}
                    disabled={micStatus === 'requesting'}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/15 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#EC4899]" />
                    <span>{micStatus === 'requesting' ? 'Requesting...' : 'Enable Microphone'}</span>
                  </button>
                )}
              </div>
            </div>

            {micStatus === 'denied' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90">
                <p className="font-semibold text-amber-300 mb-1">Microphone Access Denied</p>
                <p className="text-[11px] text-white/70">{micErrorDetails}</p>
              </div>
            )}
          </div>

          {/* 3. Spoken Audio Test Card */}
          <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Spoken Audio Speech Output</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Web Speech synthesis reads scene descriptions and spatial cues aloud. Does not require mic permission.
                </p>
              </div>
            </div>

            <button
              onClick={handleTestSpeech}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isSpeechTested ? 'Test Audio Again' : 'Test Speech Output'}</span>
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3 text-xs text-white/70">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>
            <strong>Zero background tracking:</strong> Photos and camera frames are analyzed in memory only when you explicitly press Capture or start Live Detection.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#3E1627]">
          <p className="text-xs text-white/50">
            You can also upload photos without any camera permissions.
          </p>
          <button
            onClick={() => {
              onContinue();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-[#EC4899] to-[#BE185D] hover:from-[#DB2777] hover:to-[#9D174D] text-white text-sm font-bold shadow-lg shadow-[#EC4899]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Continue to OmniLens</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
