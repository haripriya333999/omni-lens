import React, { useState, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  Settings,
  Sparkles,
  Volume2,
  VolumeX,
  Eye,
  Menu,
  Activity,
  Mic,
  SlidersHorizontal,
} from 'lucide-react';
import { ActiveTask } from '../types';
import { cameraManager, CameraSessionInfo } from '../services/cameraManager';
import { speechService } from '../services/speech';

interface HeaderProps {
  activeTask: ActiveTask;
  onSelectTask: (task: ActiveTask) => void;
  onOpenSettings: () => void;
  onToggleCameraQuick?: () => void;
  onToggleMobileMenu?: () => void;
  isRightPanelOpen?: boolean;
  onToggleRightPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTask,
  onSelectTask,
  onOpenSettings,
  onToggleCameraQuick,
  onToggleMobileMenu,
  isRightPanelOpen = true,
  onToggleRightPanel,
}) => {
  const [cameraSession, setCameraSession] = useState<CameraSessionInfo>(cameraManager.getSessionInfo());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const unsubCamera = cameraManager.subscribe((info) => {
      setCameraSession(info);
    });
    const unsubSpeech = speechService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => {
      unsubCamera();
      unsubSpeech();
    };
  }, []);

  const getCameraLabel = () => {
    if (cameraSession.state === 'active') return 'Camera active';
    if (cameraSession.state === 'starting') return 'Starting camera...';
    if (cameraSession.state === 'stopping') return 'Stopping...';
    if (cameraSession.state === 'error') return 'Camera unavailable';
    return 'Camera off';
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c0609]/95 backdrop-blur-md border-b border-[#2D121F] px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 select-none">
      {/* Left: Mobile Menu Toggle + Brand Identity */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Menu Toggle Button */}
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-[#1C0D15] border border-[#3D1829] text-white/80 hover:text-white hover:bg-[#28111E] transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 text-[#EC4899]" />
          </button>
        )}

        <button
          onClick={() => onSelectTask('home')}
          className="flex items-center gap-2.5 sm:gap-3 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] rounded-xl p-1"
          aria-label="OmniLens Home"
        >
          {/* Glowing Eye Logo */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#00F0FF] via-[#EC4899] to-white p-0.5 shadow-lg shadow-[#00F0FF]/25 flex items-center justify-center transition-transform group-hover:scale-105 shrink-0">
            <div className="w-full h-full bg-[#12080D] rounded-full flex items-center justify-center relative overflow-hidden">
              <Eye className="w-5 h-5 text-white" />
              <div className="absolute inset-0 bg-radial from-[#00F0FF]/40 to-transparent pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              OmniLens
            </span>

            <span className="hidden md:inline-block text-[#3D1829] font-light text-xl">|</span>

            <span className="hidden md:inline-block text-xs sm:text-sm text-[#FAF7F0]/70 font-medium">
              Understand your world. Through sound.
            </span>
          </div>
        </button>
      </div>

      {/* Right: Persistent System Status Indicators & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Camera Status Pill Button */}
        <button
          onClick={() => {
            if (cameraSession.state === 'active') {
              cameraManager.releaseAll();
              speechService.speak('Camera stopped. Hardware resources released.');
            } else if (onToggleCameraQuick) {
              onToggleCameraQuick();
            } else {
              onSelectTask('live');
            }
          }}
          className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-sm ${
            cameraSession.state === 'active'
              ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-emerald-950/40'
              : cameraSession.state === 'starting'
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300 animate-pulse'
              : 'bg-[#1C0D15] border-[#3D1829] text-white/80 hover:bg-[#28111E] hover:border-[#521E36]'
          }`}
          title={cameraSession.state === 'active' ? 'Click to stop camera' : 'Camera status (click to manage)'}
          aria-label={getCameraLabel()}
        >
          {cameraSession.state === 'active' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </>
          ) : (
            <CameraOff className="w-3.5 h-3.5 text-white/60 shrink-0" />
          )}
          <span className="hidden sm:inline">{getCameraLabel()}</span>
          <span className="sm:hidden">{cameraSession.state === 'active' ? 'Live' : 'Cam Off'}</span>
        </button>

        {/* Persistent Compact Mic & Vision status indicators when right panel is closed */}
        {!isRightPanelOpen && (
          <div className="hidden xl:flex items-center gap-1.5">
            {/* Mic Ready Pill */}
            <div
              className="px-2.5 py-1.5 rounded-full bg-[#1C0D15] border border-[#3D1829] text-[11px] font-mono text-emerald-300 flex items-center gap-1.5"
              title="Microphone voice listener ready"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>Mic Ready</span>
            </div>

            {/* Vision Model Pill */}
            <div
              className="px-2.5 py-1.5 rounded-full bg-[#1C0D15] border border-[#3D1829] text-[11px] font-mono text-[#00F0FF] flex items-center gap-1.5"
              title="Gemini 3.8 Flash Vision intelligence ready"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]" />
              <Eye className="w-3 h-3 text-[#00F0FF]" />
              <span>Vision Ready</span>
            </div>
          </div>
        )}

        {/* Right Panel Toggle Button (Accessibility & Status Drawer) */}
        {onToggleRightPanel && (
          <button
            onClick={onToggleRightPanel}
            className={`px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isRightPanelOpen
                ? 'bg-[#2C121D] text-[#EC4899] border-[#EC4899]/50 shadow-sm shadow-[#EC4899]/20'
                : 'bg-[#1C0D15] text-white/80 border-[#3D1829] hover:bg-[#28111E] hover:text-white'
            }`}
            title={isRightPanelOpen ? 'Close Accessibility & Status panel' : 'Open Accessibility & Status panel'}
            aria-label="Toggle Accessibility and System Status panel"
            aria-expanded={isRightPanelOpen}
          >
            <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
            <span className="hidden md:inline">Accessibility & Status</span>
          </button>
        )}

        {/* Global Speech Stop control */}
        {isSpeaking && (
          <button
            onClick={() => speechService.stop()}
            className="p-2 rounded-full bg-[#EC4899]/20 border border-[#EC4899]/40 text-[#EC4899] hover:bg-[#EC4899]/30 transition-colors cursor-pointer"
            title="Stop active speech"
            aria-label="Stop speech"
          >
            <VolumeX className="w-4 h-4 animate-pulse" />
          </button>
        )}

        {/* Settings Gear Button */}
        <button
          onClick={onOpenSettings}
          className="p-2 sm:p-2 rounded-full bg-[#1C0D15] border border-[#3D1829] text-white/80 hover:text-white hover:bg-[#28111E] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899]"
          title="Open Settings"
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

