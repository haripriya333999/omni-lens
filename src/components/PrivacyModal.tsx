import React from 'react';
import { ShieldCheck, X, Eye, Camera, Lock, Server, Cpu } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-[#180B12] border border-[#3E1627] text-[#FAF7F0] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close privacy modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Zero Unnecessary Retention</span>
          </div>
          <h2 id="privacy-modal-title" className="text-2xl font-extrabold text-white tracking-tight">
            Your Privacy & Safety in OmniLens
          </h2>
          <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
            OmniLens is designed from the ground up for assistive autonomy with complete respect for user privacy and device control.
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-white/80">
          <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] space-y-2">
            <div className="flex items-center gap-2.5 font-bold text-white">
              <Camera className="w-4 h-4 text-[#00F0FF]" />
              <span>Camera Lifecycle & Explicit Activation</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              The camera is never started in the background. It turns on strictly when you choose a camera feature (such as Live Detection) or click "Capture Photo". When you press Stop or switch tasks, all hardware tracks are released immediately and your camera light turns off.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] space-y-2">
            <div className="flex items-center gap-2.5 font-bold text-white">
              <Server className="w-4 h-4 text-[#EC4899]" />
              <span>Multimodal Vision & OCR Processing</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              When you submit a frame or uploaded photograph for analysis, it is securely transmitted over HTTPS to the OmniLens backend server. The backend runs high-precision Gemini Multimodal Vision and Neural OCR in-process. Images are never persisted to disk or used for advertising.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#220E19] border border-[#3E1627] space-y-2">
            <div className="flex items-center gap-2.5 font-bold text-white">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Local Device Control</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              You can use OmniLens entirely with uploaded photographs if you do not wish to grant browser camera permissions. Preferences (speech speed, contrast, motion) are stored exclusively in your browser's local storage.
            </p>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#EC4899] hover:bg-[#DB2777] text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
