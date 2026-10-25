import React, { useEffect, useState } from 'react';
import { Volume2, RotateCcw, Play, Pause, Square, Gauge, Sparkles, VolumeX } from 'lucide-react';
import { speechService } from '../services/speech';

interface SpeechControllerProps {
  currentText: string;
  autoSpeak?: boolean;
}

export const SpeechController: React.FC<SpeechControllerProps> = ({
  currentText,
  autoSpeak = false,
}) => {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(speechService.getRate());

  useEffect(() => {
    const unsubscribe = speechService.subscribe((speaking) => {
      setIsSpeaking(speaking);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (autoSpeak && currentText) {
      speechService.speak(currentText);
    }
  }, [currentText, autoSpeak]);

  const handlePlay = () => {
    if (currentText) {
      speechService.speak(currentText);
    }
  };

  const handleRepeat = () => {
    speechService.repeat();
  };

  const handleStop = () => {
    speechService.stop();
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    speechService.setRate(newRate);
    if (isSpeaking && currentText) {
      speechService.speak(currentText);
    }
  };

  const rates = [0.8, 1.0, 1.25, 1.5];

  return (
    <div
      className="p-4 bg-[#1C0D15] rounded-3xl border border-[#3E1627] shadow-xl flex flex-wrap items-center justify-between gap-4 select-none"
      role="region"
      aria-label="Speech and Audio Controls"
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
            isSpeaking
              ? 'bg-[#EC4899] text-white animate-pulse shadow-md shadow-[#EC4899]/30'
              : 'bg-[#25101C] text-[#EC4899] border border-[#3E1627]'
          }`}
          aria-hidden="true"
        >
          <Volume2 className={`w-5 h-5 ${isSpeaking ? 'scale-110' : 'opacity-80'}`} />
        </div>
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <span>{isSpeaking ? 'Speaking Output Aloud...' : 'Spoken Audio Ready'}</span>
            {isSpeaking && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div className="text-xs text-white/60">
            {isSpeaking ? 'Press Stop to silence audio' : 'Press Read Aloud or use shortcuts to listen'}
          </div>
        </div>
      </div>

      <div className="flex items-center flex-wrap gap-2">
        {/* Read Aloud Button */}
        <button
          onClick={handlePlay}
          disabled={!currentText}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-[#EC4899] text-white hover:bg-[#DB2777] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] cursor-pointer"
          aria-label="Read description aloud"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Read Aloud</span>
        </button>

        {/* Repeat Button */}
        <button
          onClick={handleRepeat}
          disabled={!speechService.getLastSpoken()}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#25101C] text-white/90 hover:bg-[#331425] disabled:opacity-40 disabled:cursor-not-allowed border border-[#3E1627] transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] cursor-pointer"
          aria-label="Repeat last spoken description"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Repeat</span>
        </button>

        {/* Pause / Resume Button */}
        <button
          onClick={() => {
            if (speechService.isPaused()) {
              speechService.resume();
            } else {
              speechService.pause();
            }
          }}
          disabled={!isSpeaking && !speechService.isPaused()}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-[#25101C] text-white/90 hover:bg-[#331425] disabled:opacity-40 disabled:cursor-not-allowed border border-[#3E1627] transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EC4899] cursor-pointer"
          aria-label={speechService.isPaused() ? "Resume speaking" : "Pause speaking"}
        >
          {speechService.isPaused() ? (
            <>
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>Pause</span>
            </>
          )}
        </button>

        {/* Stop Button */}
        <button
          onClick={handleStop}
          disabled={!isSpeaking && !speechService.isPaused()}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-950/60 text-rose-200 hover:bg-rose-900/80 border border-rose-600/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
          aria-label="Stop speaking"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
          <span>Stop</span>
        </button>

        {/* Speed / Rate Selector */}
        <div className="flex items-center gap-1 pl-2 border-l border-[#3E1627] text-xs text-white/70">
          <Gauge className="w-3.5 h-3.5 mr-0.5 text-[#EC4899]" />
          <span className="sr-only">Speech speed:</span>
          {rates.map((r) => (
            <button
              key={r}
              onClick={() => handleRateChange(r)}
              className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                rate === r
                  ? 'bg-[#EC4899] text-white shadow-sm'
                  : 'bg-[#25101C] text-white/70 hover:bg-[#331425] hover:text-white'
              }`}
              aria-label={`Set speech speed to ${r} times normal`}
              aria-pressed={rate === r}
            >
              {r}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
