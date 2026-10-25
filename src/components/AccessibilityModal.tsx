import React from 'react';
import { X, Volume2, Eye, Sun, Sparkles, Compass, FlipHorizontal } from 'lucide-react';
import { AccessibilitySettings } from '../types';
import { speechService } from '../services/speech';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onUpdateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleTestSpeech = () => {
    speechService.speak(
      'This is an accessibility test of OmniLens voice synthesis. Text size and contrast settings are saved on your device.'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accessibility-settings-title"
    >
      <div className="bg-[#180B12] rounded-3xl p-6 max-w-lg w-full border border-[#3E1627] shadow-2xl space-y-6 my-8 text-white select-none">
        <div className="flex items-center justify-between pb-3 border-b border-[#311320]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EC4899]/20 text-[#EC4899] flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 id="accessibility-settings-title" className="text-lg font-bold text-white">
                Accessibility Settings
              </h3>
              <p className="text-xs text-white/60">
                Tailor contrast, typography size, and speech output
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
            aria-label="Close accessibility settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Size Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white block">
            Interface Text Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'Standard (16px)' },
              { id: 'large', label: 'Large (18px)' },
              { id: 'xlarge', label: 'Extra Large (20px)' },
            ].map((size) => (
              <button
                key={size.id}
                onClick={() => onUpdateSettings({ fontSize: size.id as any })}
                className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                  settings.fontSize === size.id
                    ? 'bg-[#EC4899] text-white border-[#EC4899] shadow-sm'
                    : 'bg-[#220E19] text-white/80 border-[#3E1627] hover:border-[#EC4899]/50'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* High Contrast Mode */}
        <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Sun className="w-4 h-4 text-[#EC4899]" />
              High Contrast Display
            </div>
            <div className="text-xs text-white/70 mt-0.5">
              Enforces high-visibility yellow/green bounding boxes and deep obsidian backgrounds
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
            className={`w-12 h-7 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              settings.highContrast ? 'bg-[#EC4899]' : 'bg-white/20'
            }`}
            aria-label="Toggle high contrast display"
            role="switch"
            aria-checked={settings.highContrast}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                settings.highContrast ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion Mode */}
        <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#EC4899]" />
              Reduce Animations
            </div>
            <div className="text-xs text-white/70 mt-0.5">
              Stops the moving neon perimeter light trails for vestibular comfort
            </div>
          </div>
          <button
            onClick={() => onUpdateSettings({ reduceMotion: !settings.reduceMotion })}
            className={`w-12 h-7 rounded-full transition-colors relative p-0.5 cursor-pointer ${
              settings.reduceMotion ? 'bg-[#EC4899]' : 'bg-white/20'
            }`}
            aria-label="Toggle reduced motion"
            role="switch"
            aria-checked={settings.reduceMotion}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                settings.reduceMotion ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Speech Rate Control */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-[#EC4899]" />
              Speech Synthesis Speed
            </span>
            <span className="font-mono text-[#EC4899]">{settings.speechRate || 1.0}x</span>
          </div>
          <div className="flex gap-2">
            {[0.85, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => {
                  onUpdateSettings({ speechRate: rate });
                  speechService.setRate(rate);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  (settings.speechRate || 1.0) === rate
                    ? 'bg-[#EC4899] text-white border-[#EC4899]'
                    : 'bg-[#220E19] text-white/80 border-[#3E1627] hover:border-[#EC4899]/50'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center justify-between border-t border-[#311320]">
          <button
            onClick={handleTestSpeech}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Test Voice
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#EC4899] hover:bg-[#DB2777] text-white text-xs font-bold transition-colors cursor-pointer shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
