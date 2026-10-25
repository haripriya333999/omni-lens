import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  RotateCcw,
  Volume2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { ActiveTask } from '../types';
import { speechService } from '../services/speech';

interface VoiceAssistantControllerProps {
  onSelectTask: (task: ActiveTask) => void;
  onRunAction: (task: ActiveTask, targetQuery?: string) => void;
  isSpeaking: boolean;
  onOpenAccessibility?: () => void;
}

function playAudioChime(type: 'start' | 'stop' | 'heard') {
  if (typeof window === 'undefined') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'start') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'stop') {
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.18); // E4
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'heard') {
      osc.frequency.setValueAtTime(783.99, now); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.1); // C6
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (e) {
    // Ignore autoplay restriction
  }
}

export const VoiceAssistantController: React.FC<VoiceAssistantControllerProps> = ({
  onSelectTask,
  onRunAction,
  isSpeaking,
  onOpenAccessibility,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [micError, setMicError] = useState<string | null>(null);
  const [isShortcutsExpanded, setIsShortcutsExpanded] = useState<boolean>(false);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState<string>('');

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<boolean>(false);
  const micErrorRef = useRef<string | null>(null);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    micErrorRef.current = micError;
  }, [micError]);

  const announce = (msg: string) => {
    setScreenReaderAnnouncement(msg);
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        isListeningRef.current = true;
        setMicError(null);
        micErrorRef.current = null;
        playAudioChime('start');
        announce('Microphone active. Listening for commands.');
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const text = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        setTranscript(text);
        playAudioChime('heard');
        processVoiceCommand(text);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          const errText =
            'Microphone permission was denied. You can continue using keyboard shortcuts (D, F, R, A, Esc) or click actions below.';
          setMicError(errText);
          micErrorRef.current = errText;
          setIsListening(false);
          isListeningRef.current = false;
          playAudioChime('stop');
          speechService.speak('Microphone permission denied. Continuing with keyboard and touch access.');
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current && !micErrorRef.current) {
          try {
            recognition.start();
          } catch (e) {
            setIsListening(false);
            isListeningRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };

      recognitionRef.current = recognition;
    } catch (e) {
      // Speech recognition unsupported
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      playAudioChime('stop');
      speechService.speak('Voice assistant microphone paused.');
    } else {
      setMicError(null);
      micErrorRef.current = null;
      if (!recognitionRef.current) {
        setMicError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
        speechService.speak('Speech recognition is not supported in this browser.');
        return;
      }
      try {
        isListeningRef.current = true;
        recognitionRef.current.start();
        speechService.speak('Listening. Say describe surroundings, find an object, or read text.');
      } catch (e: any) {
        console.warn('Recognition start failed:', e);
      }
    }
  };

  const processVoiceCommand = (rawText: string) => {
    const text = rawText.trim().toLowerCase();

    // 1. Stop
    if (text.includes('stop') || text.includes('quiet') || text.includes('silence')) {
      speechService.stop();
      speechService.speak('Speech stopped.');
      return;
    }

    // 2. Repeat
    if (text.includes('repeat') || text.includes('again') || text.includes('what did you say')) {
      speechService.repeat();
      return;
    }

    // 3. Describe surroundings
    if (
      text.includes('describe') ||
      text.includes('surrounding') ||
      text.includes('what is around') ||
      text.includes('what do you see') ||
      text.includes('scene')
    ) {
      onSelectTask('describe');
      onRunAction('describe');
      speechService.speak('Describing surroundings now.');
      return;
    }

    // 4. Read text
    if (
      text.includes('read') ||
      text.includes('text') ||
      text.includes('sign') ||
      text.includes('badge') ||
      text.includes('label')
    ) {
      onSelectTask('read');
      onRunAction('read');
      speechService.speak('Reading text aloud.');
      return;
    }

    // 5. Find object
    if (
      text.includes('find') ||
      text.includes('look for') ||
      text.includes('where is') ||
      text.includes('locate') ||
      text.includes('search')
    ) {
      let query = text
        .replace(/find\s+(my\s+|the\s+|a\s+|an\s+)?/g, '')
        .replace(/where\s+is\s+(my\s+|the\s+|a\s+|an\s+)?/g, '')
        .replace(/look\s+for\s+(my\s+|the\s+|a\s+|an\s+)?/g, '')
        .replace(/locate\s+(my\s+|the\s+|a\s+|an\s+)?/g, '')
        .replace(/search\s+(for\s+)?/g, '')
        .trim();

      if (!query) query = 'bottle';
      onSelectTask('find');
      onRunAction('find', query);
      speechService.speak(`Finding ${query}.`);
      return;
    }

    // 6. Live Detection
    if (
      text.includes('live') ||
      text.includes('continuous') ||
      text.includes('stream') ||
      text.includes('monitor')
    ) {
      onSelectTask('live');
      onRunAction('live');
      speechService.speak('Starting live detection stream.');
      return;
    }

    // 7. Pause & Resume
    if (text.includes('pause')) {
      speechService.pause();
      return;
    }
    if (text.includes('resume')) {
      speechService.resume();
      return;
    }

    // 8. Help
    if (text.includes('help') || text.includes('instructions')) {
      speechService.speak(
        'Voice commands: Say describe surroundings, find my bottle, read text, live detection, repeat, or stop.'
      );
    }
  };

  // Global Keyboard shortcuts for blind users
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          speechService.stop();
          target.blur();
        }
        return;
      }

      const key = e.key.toLowerCase();
      if (key === 'v' || key === 'm') {
        e.preventDefault();
        toggleListening();
      } else if (key === 'escape' || key === 's') {
        e.preventDefault();
        speechService.stop();
      } else if (key === 'a') {
        e.preventDefault();
        speechService.repeat();
      } else if (key === 'd' || key === '1') {
        e.preventDefault();
        onSelectTask('describe');
        speechService.speak('Switched to Describe Surroundings.');
      } else if (key === 'f' || key === '2') {
        e.preventDefault();
        onSelectTask('find');
        speechService.speak('Switched to Find an Object.');
      } else if (key === 'r' || key === '3') {
        e.preventDefault();
        onSelectTask('read');
        speechService.speak('Switched to Read Text Aloud.');
      } else if (key === 'l' || key === '4') {
        e.preventDefault();
        onSelectTask('live');
        speechService.speak('Switched to Live Detection Stream.');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isListening, onSelectTask]);

  return (
    <section
      aria-label="Voice assistance"
      className="p-3 sm:p-4 bg-[#180A10]/95 backdrop-blur-md text-white rounded-2xl border border-[#3E1627] shadow-2xl select-none transition-all duration-200"
    >
      {/* Live Region for Screen Readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {screenReaderAnnouncement}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Compact Mic Button + Guidance / Live Transcript */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={toggleListening}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#EC4899] ${
              isListening
                ? 'bg-[#EC4899] text-white animate-pulse shadow-lg shadow-[#EC4899]/50 scale-105 border border-white/20'
                : 'bg-[#25101C] hover:bg-[#331425] text-[#EC4899] shadow-md border border-[#3E1627]'
            }`}
            aria-label={
              isListening
                ? 'Turn off microphone (Press V to toggle)'
                : 'Turn on microphone (Press V to toggle)'
            }
          >
            {isListening ? (
              <Mic className="w-5 h-5 text-white" />
            ) : (
              <MicOff className="w-5 h-5 text-white/60" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">Voice Assistant</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                  isListening
                    ? 'bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/40'
                    : 'bg-white/10 text-white/70'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isListening ? 'bg-[#EC4899] animate-ping' : 'bg-white/40'
                  }`}
                />
                <span>{isListening ? 'Listening…' : 'Idle · Press V'}</span>
              </span>

              {transcript && (
                <span className="px-2 py-0.5 rounded-lg bg-white/10 border border-white/15 text-[11px] text-[#EC4899] font-mono truncate max-w-[200px]">
                  "{transcript}"
                </span>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-white/70 truncate mt-0.5">
              Say <strong className="text-[#EC4899]">“Describe”</strong>,{' '}
              <strong className="text-[#10B981]">“Live detection”</strong>,{' '}
              <strong className="text-[#FBBF24]">“Read text”</strong>, or{' '}
              <strong className="text-[#F59E0B]">“Find [item]”</strong>
            </p>
          </div>
        </div>

        {/* Right: Actions (Turn on/off mic, Stop Speaking, Repeat, Shortcuts) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Microphone Action Button */}
          <button
            onClick={toggleListening}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-500'
                : 'bg-gradient-to-r from-[#EC4899] to-[#DB2777] hover:from-[#DB2777] hover:to-[#BE185D] text-white shadow-md shadow-[#EC4899]/20'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-white" />
            <span>{isListening ? 'Mute' : 'Speak'}</span>
          </button>

          {/* Immediate Stop Speaking (Alert Red) whenever speech is active */}
          {isSpeaking && (
            <button
              onClick={() => {
                speechService.stop();
                speechService.speak('Speech stopped.');
              }}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-[#B42318] hover:bg-[#9a1e14] text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm animate-pulse"
              aria-label="Stop speaking immediately"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop</span>
            </button>
          )}

          {/* Repeat Button */}
          <button
            onClick={() => speechService.repeat()}
            className="px-3 py-2 rounded-xl font-semibold text-xs text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
            aria-label="Repeat last spoken announcement"
            title="Repeat last speech (Press A)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Repeat</span>
          </button>

          {/* Expandable Keyboard Shortcuts */}
          <button
            onClick={() => setIsShortcutsExpanded(!isShortcutsExpanded)}
            className="px-2.5 py-2 rounded-xl font-semibold text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1 cursor-pointer"
            aria-expanded={isShortcutsExpanded}
            aria-label="Toggle keyboard shortcuts and quick command guidance"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keys</span>
            {isShortcutsExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable shortcuts drawer */}
      {isShortcutsExpanded && (
        <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white font-bold">
              V
            </kbd>{' '}
            <span className="text-white/70 text-[11px]">Mic</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white font-bold">
              D
            </kbd>{' '}
            <span className="text-white/70 text-[11px]">Describe</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white font-bold">
              F
            </kbd>{' '}
            <span className="text-white/70 text-[11px]">Find</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white font-bold">
              R
            </kbd>{' '}
            <span className="text-white/70 text-[11px]">Read</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white font-bold">
              L
            </kbd>{' '}
            <span className="text-white/70 text-[11px]">Live</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white font-bold">
              A
            </kbd>{' '}
            <span className="text-white/70 text-[11px]">Repeat</span>
          </div>
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono text-white font-bold">
              Esc
            </kbd>{' '}
            <span className="text-white/70 text-[11px]">Stop</span>
          </div>
        </div>
      )}

      {/* Mic permission error banner if needed */}
      {micError && (
        <div className="mt-3 p-3 rounded-xl bg-[#B42318]/20 border border-[#B42318]/50 text-xs text-rose-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
          <div className="flex-1 leading-snug">
            <p className="font-semibold text-rose-100">{micError}</p>
            <p className="mt-0.5 text-[11px] text-rose-200/80">
              Press keyboard keys <kbd className="px-1 py-0.2 rounded bg-black/30">D</kbd>,{' '}
              <kbd className="px-1 py-0.2 rounded bg-black/30">F</kbd>, or{' '}
              <kbd className="px-1 py-0.2 rounded bg-black/30">R</kbd> anytime without voice input.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
