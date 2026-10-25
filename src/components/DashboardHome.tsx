import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Eye,
  Search,
  BookOpen,
  Scan,
  Camera,
  CameraOff,
  ChevronRight,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { ActiveTask } from '../types';
import { cameraManager, CameraSessionInfo } from '../services/cameraManager';
import { speechService } from '../services/speech';

interface DashboardHomeProps {
  onSelectTask: (task: ActiveTask) => void;
  onOpenVoiceAssistant: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  onSelectTask,
  onOpenVoiceAssistant,
}) => {
  const [cameraSession, setCameraSession] = useState<CameraSessionInfo>(cameraManager.getSessionInfo());

  useEffect(() => {
    const unsub = cameraManager.subscribe((info) => {
      setCameraSession(info);
    });
    return unsub;
  }, []);

  const isCameraLive = cameraSession.state === 'active';

  return (
    <div className="space-y-6 select-none" role="region" aria-label="OmniLens Dashboard">
      {/* 1. Welcome Heading matching image_e7ecfc04 */}
      <div className="space-y-1">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
          Understand your world.
        </h1>
        <p className="text-sm sm:text-base text-[#FAF7F0]/65 font-medium">
          Choose a feature or use voice assistance.
        </p>
      </div>

      {/* 2. Voice Assistant Bento Card matching image_e7ecfc04 */}
      <button
        onClick={onOpenVoiceAssistant}
        className="w-full bg-gradient-to-r from-[#1F0C16] via-[#240E1B] to-[#1C0A14] border border-[#3E1627] hover:border-[#EC4899]/60 hover:shadow-lg hover:shadow-[#EC4899]/10 rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 text-left transition-all cursor-pointer group shadow-xl"
        aria-label="Talk to OmniLens using your voice"
      >
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          {/* Glowing Microphone Circle */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#EC4899]/30 to-[#831843]/60 border border-[#EC4899]/50 shadow-md shadow-[#EC4899]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Mic className="w-7 h-7 sm:w-8 sm:h-8 text-[#EC4899]" />
          </div>

          <div className="space-y-1.5 min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight group-hover:text-pink-200 transition-colors">
              Talk to OmniLens
            </h2>
            <p className="text-xs sm:text-sm text-white/70">
              Ask for help using your voice.
            </p>
            <div className="inline-block px-3 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] sm:text-xs text-white/60 font-mono truncate max-w-full">
              Example: "Describe my surroundings" or "Find a bottle"
            </div>
          </div>
        </div>

        <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white transition-colors shrink-0" />
      </button>

      {/* 3. Explore your surroundings section header */}
      <div className="space-y-1 pt-1">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Explore your surroundings
        </h2>
        <p className="text-xs sm:text-sm text-[#FAF7F0]/65">
          Select a feature to get started.
        </p>
      </div>

      {/* 2. Primary 4-Card Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Describe Surroundings */}
        <button
          onClick={() => onSelectTask('describe')}
          className="bg-[#1C0D15] hover:bg-[#25101C] border border-[#381625] hover:border-[#EC4899]/60 rounded-3xl p-5 flex flex-col justify-between text-left transition-all cursor-pointer group shadow-lg min-h-[175px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#EC4899]/20 border border-[#EC4899]/40 flex items-center justify-center text-[#EC4899] mb-4 group-hover:scale-110 transition-transform shadow-md shadow-[#EC4899]/15">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-extrabold text-white group-hover:text-pink-200 transition-colors">
              Describe Surroundings
            </div>
            <div className="text-xs text-white/60 flex items-center justify-between gap-1 mt-1">
              <span>Hear scene, doors & actions.</span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </div>
        </button>

        {/* Card 2: Find Object */}
        <button
          onClick={() => onSelectTask('find')}
          className="bg-[#1C0D15] hover:bg-[#25101C] border border-[#381625] hover:border-[#F59E0B]/60 rounded-3xl p-5 flex flex-col justify-between text-left transition-all cursor-pointer group shadow-lg min-h-[175px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] mb-4 group-hover:scale-110 transition-transform shadow-md shadow-[#F59E0B]/15">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-extrabold text-white group-hover:text-amber-200 transition-colors">
              Find Object
            </div>
            <div className="text-xs text-white/60 flex items-center justify-between gap-1 mt-1">
              <span>Instant target localization.</span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </div>
        </button>

        {/* Card 3: Read Text */}
        <button
          onClick={() => onSelectTask('read')}
          className="bg-[#1C0D15] hover:bg-[#25101C] border border-[#381625] hover:border-[#FBBF24]/60 rounded-3xl p-5 flex flex-col justify-between text-left transition-all cursor-pointer group shadow-lg min-h-[175px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FBBF24]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#FBBF24]/20 border border-[#FBBF24]/40 flex items-center justify-center text-[#FBBF24] mb-4 group-hover:scale-110 transition-transform shadow-md shadow-[#FBBF24]/15">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-extrabold text-white group-hover:text-yellow-200 transition-colors">
              Read Text
            </div>
            <div className="text-xs text-white/60 flex items-center justify-between gap-1 mt-1">
              <span>Hear signs, badges & papers.</span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </div>
        </button>

        {/* Card 4: Live Detection */}
        <button
          onClick={() => onSelectTask('live')}
          className="bg-[#1C0D15] hover:bg-[#25101C] border border-[#381625] hover:border-[#10B981]/60 rounded-3xl p-5 flex flex-col justify-between text-left transition-all cursor-pointer group shadow-lg min-h-[175px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981]"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] mb-4 group-hover:scale-110 transition-transform shadow-md shadow-[#10B981]/15">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <div className="text-base font-extrabold text-white group-hover:text-emerald-200 transition-colors">
              Live Detection
            </div>
            <div className="text-xs text-white/60 flex items-center justify-between gap-1 mt-1">
              <span>Real-time local vision stream.</span>
              <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>
          </div>
        </button>
      </div>

      {/* 3. Bottom Bento Cards: Voice Assistant & Camera Hardware Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bento 1: Voice Assistant Bento Card */}
        <button
          onClick={onOpenVoiceAssistant}
          className="bg-gradient-to-r from-[#1F0C16] via-[#240E1B] to-[#1C0A14] border border-[#3E1627] hover:border-[#EC4899]/60 hover:shadow-lg hover:shadow-[#EC4899]/10 rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 text-left transition-all cursor-pointer group shadow-xl"
          aria-label="Talk to OmniLens using your voice"
        >
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            {/* Glowing Microphone Circle */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#EC4899]/30 to-[#831843]/60 border border-[#EC4899]/50 shadow-md shadow-[#EC4899]/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-[#EC4899]" />
            </div>

            <div className="space-y-1 min-w-0">
              <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight group-hover:text-pink-200 transition-colors">
                Talk to OmniLens
              </h2>
              <p className="text-xs text-white/70">
                Ask for help hands-free using voice commands.
              </p>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[11px] text-[#EC4899] font-mono truncate max-w-full">
                Say: "Describe surroundings" or "Find bottle"
              </div>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors shrink-0" />
        </button>

        {/* Bento 2: Camera Status Bento Card */}
        <button
          onClick={() => {
            if (isCameraLive) {
              cameraManager.releaseAll();
              speechService.speak('Camera stopped. Hardware resources released.');
            } else {
              onSelectTask('live');
            }
          }}
          className="bg-[#1C0D15] hover:bg-[#25101C] border border-[#381625] hover:border-pink-500/50 rounded-3xl p-5 sm:p-6 flex items-center justify-between gap-4 text-left transition-all cursor-pointer group shadow-xl"
        >
          <div className="flex items-center gap-4 sm:gap-5 min-w-0">
            <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex items-center justify-center shrink-0 transition-all ${
              isCameraLive 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/20' 
                : 'bg-white/10 border-white/20 text-white/70'
            }`}>
              {isCameraLive ? <Camera className="w-6 h-6 sm:w-7 sm:h-7" /> : <CameraOff className="w-6 h-6 sm:w-7 sm:h-7" />}
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-base sm:text-lg font-extrabold text-white">
                {isCameraLive ? 'Camera is active' : 'Camera is on standby'}
              </div>
              <div className="text-xs text-white/60">
                {isCameraLive ? 'Streaming video securely to vision assistant.' : 'Hardware activates only when you choose a feature.'}
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[11px] text-white/60 font-mono">
                {isCameraLive ? 'Optical sensor streaming' : 'Zero background capture'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white transition-colors shrink-0" />
        </button>
      </div>

      {/* 4. Privacy & Offline Processing Assurance Strip */}
      <div className="bg-[#150910] border border-[#2B101C] rounded-2xl px-5 py-3.5 flex items-center gap-3 text-xs text-white/70 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/80 shrink-0">
          <Sparkles className="w-4 h-4 text-[#00F0FF]" />
        </div>
        <div className="leading-snug">
          <span className="font-bold text-white">Privacy & Speed First: </span>
          <span>
            Continuous live detection runs 100% locally in your browser at 20-30 FPS. Visual frames are never recorded or retained.
          </span>
        </div>
      </div>
    </div>
  );
};
