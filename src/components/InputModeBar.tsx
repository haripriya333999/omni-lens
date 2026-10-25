import React from 'react';
import { Camera, Image as ImageIcon, Mic, FileText, Sparkles } from 'lucide-react';

export type InputSourceMode = 'camera' | 'upload';

interface InputModeBarProps {
  inputMode: InputSourceMode;
  onChangeInputMode: (mode: InputSourceMode) => void;
  onOpenVoice?: () => void;
  isVoiceActive?: boolean;
}

export const InputModeBar: React.FC<InputModeBarProps> = ({
  inputMode,
  onChangeInputMode,
  onOpenVoice,
  isVoiceActive = false,
}) => {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 p-2 bg-[#1B0B13]/90 backdrop-blur-md border border-[#3A1627] rounded-2xl shadow-lg select-none"
      role="toolbar"
      aria-label="Input mode selector"
    >
      {/* Left: Voice & Text shortcuts matching image_89f6a0e3 */}
      <div className="flex items-center gap-2">
        {onOpenVoice && (
          <button
            onClick={onOpenVoice}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              isVoiceActive
                ? 'bg-[#EC4899] text-white border-[#EC4899] shadow-md shadow-[#EC4899]/30'
                : 'bg-[#260E1B] text-white/90 border-[#471B31] hover:bg-[#331324] hover:text-white'
            }`}
            title="Ask OmniLens using your voice"
          >
            <div className="flex items-center gap-1 text-[#EC4899]">
              <span className="w-1 h-3 bg-[#EC4899] rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-[#EC4899] rounded-full animate-pulse delay-75" />
              <span className="w-1 h-2 bg-[#EC4899] rounded-full animate-pulse delay-150" />
            </div>
            <span>Voice</span>
          </button>
        )}
      </div>

      {/* Right: Camera vs Upload Photo toggle matching image_89f6a0e3 */}
      <div className="flex items-center gap-1.5 p-1 bg-[#12070D] rounded-xl border border-[#3A1627]">
        <button
          onClick={() => onChangeInputMode('camera')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            inputMode === 'camera'
              ? 'bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
          aria-pressed={inputMode === 'camera'}
        >
          <Camera className="w-4 h-4 text-[#00F0FF]" />
          <span>Camera</span>
        </button>

        <span className="text-[#3A1627]">|</span>

        <button
          onClick={() => onChangeInputMode('upload')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
            inputMode === 'upload'
              ? 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40 shadow-sm'
              : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
          aria-pressed={inputMode === 'upload'}
        >
          <ImageIcon className="w-4 h-4 text-[#EC4899]" />
          <span>Upload Photo</span>
        </button>
      </div>
    </div>
  );
};
