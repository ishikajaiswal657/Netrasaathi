/**
 * Browser Web Speech API Service
 * Manages accessible Text-to-Speech (TTS) and Speech-to-Text (STT) without external billing.
 * Supports multiple Indian and international languages, adjustable rate/pitch,
 * word boundary tracking for visual captions, and hands-free voice command parsing.
 */

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-IN', name: 'English (India)', nativeName: 'English (India)' },
  { code: 'en-US', name: 'English (US)', nativeName: 'English (US)' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn-IN', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'ta-IN', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te-IN', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr-IN', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ml-IN', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
];

export interface SpeechOptions {
  rate?: number; // 0.75, 1.0, 1.25, 1.5
  pitch?: number; // 0.8 - 1.2
  lang?: string; // Language code, e.g. 'en-IN', 'hi-IN'
  onBoundary?: (charIndex: number, length?: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  );
}

let activeUtterance: SpeechSynthesisUtterance | null = null;
let currentAudioElement: HTMLAudioElement | null = null;
let currentPlaybackId = 0;
let currentAbortController: AbortController | null = null;
let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

/**
 * Streams neural speech synthesis from backend using OpenAI TTS engine (tts-1-hd, nova voice).
 * Guarantees crystal-clear human articulation with authentic Indian pronunciation.
 * Incorporates generational concurrency tokens and network AbortControllers to prevent overlapping audio.
 */
export async function playBackendTTS(
  text: string,
  options: SpeechOptions = {},
  playbackId: number = currentPlaybackId
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (playbackId !== currentPlaybackId) return false;

  const controller = new AbortController();
  currentAbortController = controller;

  try {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:8000';

    const payload = JSON.stringify({
      text,
      lang: options.lang || 'en-IN',
      speed: options.rate || 1.0,
      voice: 'nova',
    });

    let response: Response | null = null;
    try {
      response = await fetch(`${apiBase}/api/v1/audio/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controller.signal,
      });
    } catch (directErr) {
      if (playbackId !== currentPlaybackId) return false;
      // Direct call failed, attempt relative path proxied by Next.js
      try {
        response = await fetch('/api/v1/audio/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
      } catch {
        return false;
      }
    }

    if (playbackId !== currentPlaybackId) return false;

    if (!response || !response.ok) {
      return false;
    }

    const audioBlob = await response.blob();
    if (playbackId !== currentPlaybackId) return false;

    // Hard stop any previous audio or utterance before initializing new stream
    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement.src = '';
      currentAudioElement = null;
    }
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    currentAudioElement = audio;

    options.onStart?.();

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudioElement === audio) {
        currentAudioElement = null;
      }
      if (playbackId === currentPlaybackId) {
        options.onEnd?.();
      }
    };

    audio.onerror = (err) => {
      URL.revokeObjectURL(audioUrl);
      if (currentAudioElement === audio) {
        currentAudioElement = null;
      }
      if (playbackId === currentPlaybackId) {
        options.onError?.(err);
      }
    };

    try {
      await audio.play();
    } catch (playErr) {
      if (playbackId !== currentPlaybackId) return false;
      console.warn('Audio play interrupted or blocked:', playErr);
    }

    return true;
  } catch (err) {
    if (playbackId !== currentPlaybackId) return false;
    console.error('playBackendTTS error:', err);
    return false;
  }
}

/**
 * Returns all synthesized voices available on the client device.
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    cachedVoices = voices;
    return voices;
  }
  return cachedVoices;
}

/**
 * Finds the best voice matching the chosen language code.
 */
export function findVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (!voices || voices.length === 0) return null;

  const normalizedTarget = langCode.replace('_', '-').toLowerCase();
  const prefix = normalizedTarget.split('-')[0];

  // 1. Exact match on language tag (e.g. 'hi-in' === 'hi-in')
  const exact = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === normalizedTarget);
  if (exact) return exact;

  // 2. Prefix match on language tag (e.g. 'hi' in 'hi-in')
  const matchedPrefix = voices.find((v) => v.lang.replace('_', '-').toLowerCase().startsWith(prefix));
  if (matchedPrefix) return matchedPrefix;

  // 3. Name match for multilingual voices on Chrome/Edge (e.g., 'Microsoft Swara Online (Natural) - Hindi')
  const langKeywords: Record<string, string[]> = {
    hi: ['hindi', 'हिन्दी', 'swara', 'madhur'],
    ta: ['tamil', 'தமிழ்', 'valluvar'],
    te: ['telugu', 'తెలుగు', 'mohan'],
    bn: ['bengali', 'বাংলা', 'bashkar'],
    mr: ['marathi', 'मराठी', 'aarohi'],
    ml: ['malayalam', 'മലയാളം', 'midhun'],
    es: ['spanish', 'español'],
    en: ['india', 'ravi', 'heera', 'neerja', 'prabhat'],
  };

  const keywords = langKeywords[prefix];
  if (keywords) {
    const namedVoice = voices.find((v) => {
      const vName = v.name.toLowerCase();
      return keywords.some((k) => vName.includes(k));
    });
    if (namedVoice) return namedVoice;
  }

  return null;
}

/**
 * Speaks the provided text using OpenAI Neural Backend TTS as the primary studio engine
 * for all Indian languages and Indian English (en-IN), preventing any dual voice overlap.
 */
export async function speakText(text: string, options: SpeechOptions = {}): Promise<void> {
  // Hard stop any ongoing speech or audio immediately
  stopSpeech();

  // Increment sequence ID: any in-flight request is immediately invalidated
  const playbackId = ++currentPlaybackId;

  // PRIORITY 1: ALWAYS route through high-definition OpenAI Neural TTS (tts-1-hd, nova)
  // This guarantees clear Indian-accented English and native South Asian pronunciation.
  const success = await playBackendTTS(text, options, playbackId);
  if (playbackId !== currentPlaybackId) {
    // A newer speech request was made while fetching this one
    return;
  }
  if (success) {
    return;
  }

  // FALLBACK ONLY: If backend is completely unreachable, fall back to browser Web Speech API
  if (!isSpeechSynthesisSupported()) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    options.onError?.('SpeechSynthesis is not supported in this browser.');
    return;
  }

  const targetLang = options.lang || 'en-IN';
  const matchedVoice = findVoiceForLanguage(targetLang);

  const utterance = new SpeechSynthesisUtterance(text);
  activeUtterance = utterance;

  utterance.lang = targetLang;
  utterance.rate = Math.max(0.75, Math.min(options.rate ?? 1.0, 1.5));
  utterance.pitch = Math.max(0.8, Math.min(options.pitch ?? 1.0, 1.2));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  utterance.onboundary = (event) => {
    if (playbackId === currentPlaybackId) {
      options.onBoundary?.(event.charIndex, event.charLength);
    }
  };

  utterance.onstart = () => {
    if (playbackId === currentPlaybackId) {
      options.onStart?.();
    }
  };

  utterance.onend = () => {
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    if (playbackId === currentPlaybackId) {
      options.onEnd?.();
    }
  };

  utterance.onerror = (event) => {
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    if (event.error !== 'interrupted' && event.error !== 'canceled') {
      if (playbackId === currentPlaybackId) {
        options.onError?.(event);
      }
    }
  };

  window.speechSynthesis.speak(utterance);
}

export function pauseSpeech(): void {
  if (currentAudioElement && !currentAudioElement.paused) {
    currentAudioElement.pause();
  }
  if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeech(): void {
  if (currentAudioElement && currentAudioElement.paused) {
    currentAudioElement.play();
  }
  if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }
}

export function stopSpeech(): void {
  // Advance sequence ID to invalidate any pending in-flight TTS fetches
  currentPlaybackId++;

  // Abort any ongoing network request
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }

  // Halt and discard HTML5 Audio element
  if (currentAudioElement) {
    try {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement.src = '';
    } catch {
      // Ignored
    }
    currentAudioElement = null;
  }

  // Cancel Web Speech API utterance
  if (isSpeechSynthesisSupported()) {
    activeUtterance = null;
    window.speechSynthesis.cancel();
  }
}

export type VoiceCommand =
  | 'next'
  | 'previous'
  | 'repeat'
  | 'slower'
  | 'faster'
  | 'stop'
  | 'play'
  | 'language'
  | 'captions'
  | 'help';

/**
 * Parses user speech for recognized playback voice commands.
 * Supports English, Hindi, and Indian regional variations.
 */
export function parseVoiceCommand(text: string): VoiceCommand | null {
  if (!text) return null;
  // Clean punctuation, extra spaces, and lowercase
  const clean = text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '')
    .trim();

  // Navigation: Next
  if (
    [
      'next',
      'skip',
      'forward',
      'next block',
      'go next',
      'next card',
      'aage',
      'agla',
      'porer',
    ].includes(clean)
  ) {
    return 'next';
  }

  // Navigation: Previous / Back
  if (
    [
      'previous',
      'back',
      'go back',
      'prev',
      'previous block',
      'previous card',
      'peechhe',
      'pichla',
      'agero',
    ].includes(clean)
  ) {
    return 'previous';
  }

  // Playback: Repeat
  if (
    [
      'repeat',
      'again',
      'repeat block',
      'repeat card',
      'read again',
      'say again',
      'restart',
      'dobara',
      'phir se',
    ].includes(clean)
  ) {
    return 'repeat';
  }

  // Playback: Play / Resume
  if (
    [
      'play',
      'start',
      'resume',
      'listen',
      'read',
      'chalao',
      'shuru',
      'bolo',
    ].includes(clean)
  ) {
    return 'play';
  }

  // Playback: Stop / Pause
  if (
    [
      'stop',
      'pause',
      'quiet',
      'stop reading',
      'halt',
      'silence',
      'roko',
      'ruk jao',
      'band',
    ].includes(clean)
  ) {
    return 'stop';
  }

  // Playback Speed: Slower
  if (
    [
      'slower',
      'slow down',
      'read slower',
      'speak slower',
      'dheere',
      'kam karo',
    ].includes(clean)
  ) {
    return 'slower';
  }

  // Playback Speed: Faster
  if (
    [
      'faster',
      'speed up',
      'read faster',
      'speak faster',
      'tez',
      'jaldi',
      'badhao',
    ].includes(clean)
  ) {
    return 'faster';
  }

  // Accessibility: Captions / Subtitles
  if (
    [
      'captions',
      'subtitles',
      'toggle captions',
      'closed captions',
      'subtitles on',
      'subtitles off',
    ].includes(clean)
  ) {
    return 'captions';
  }

  // Language Switch
  if (
    [
      'language',
      'change language',
      'switch language',
      'bhasha',
    ].includes(clean)
  ) {
    return 'language';
  }

  // Help
  if (
    [
      'help',
      'commands',
      'voice commands',
      'what can i say',
      'madad',
      'sahayata',
    ].includes(clean)
  ) {
    return 'help';
  }

  return null;
}

export interface SpeechRecognizerHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface SpeechRecognizerInstance {
  start: () => void;
  stop: () => void;
  abort: () => void;
}

/**
 * Creates an instance of browser speech recognition.
 */
export function createSpeechRecognizer(
  handlers: SpeechRecognizerHandlers,
  langCode: string = 'en-IN',
  continuous: boolean = false
): SpeechRecognizerInstance | null {
  if (!isSpeechRecognitionSupported()) {
    handlers.onError('Speech recognition is not supported in this browser. Please type your question.');
    return null;
  }

  type SpeechRecognitionClass = new () => {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((event: { error: string; message?: string }) => void) | null;
    onresult: ((event: {
      resultIndex: number;
      results: {
        length: number;
        [index: number]: {
          isFinal: boolean;
          0: { transcript: string; confidence: number };
        };
      };
    }) => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
  };

  const RecognitionClass = (
    (window as unknown as { SpeechRecognition?: SpeechRecognitionClass }).SpeechRecognition ||
    (window as unknown as { webkitSpeechRecognition?: SpeechRecognitionClass }).webkitSpeechRecognition
  ) as SpeechRecognitionClass;

  const recognition = new RecognitionClass();
  recognition.continuous = continuous;
  recognition.interimResults = true;
  recognition.lang = langCode;

  recognition.onstart = () => {
    handlers.onStart?.();
  };

  recognition.onend = () => {
    handlers.onEnd?.();
  };

  recognition.onerror = (event) => {
    let friendlyError = 'Speech recognition error occurred.';
    if (event.error === 'not-allowed') {
      friendlyError = 'Microphone permission was denied. Please allow microphone access in your browser settings to ask spoken questions.';
    } else if (event.error === 'no-speech') {
      friendlyError = 'No speech was detected. Please try speaking again.';
    } else if (event.error === 'network') {
      friendlyError = 'Network error during speech recognition.';
    }
    handlers.onError(friendlyError);
  };

  recognition.onresult = (event) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const item = event.results[i];
      if (item.isFinal) {
        finalTranscript += item[0].transcript;
      } else {
        interimTranscript += item[0].transcript;
      }
    }

    const transcript = finalTranscript || interimTranscript;
    handlers.onResult(transcript, Boolean(finalTranscript));
  };

  return {
    start: () => {
      try {
        recognition.start();
      } catch (err) {
        console.warn('Recognition start warning:', err);
      }
    },
    stop: () => {
      try {
        recognition.stop();
      } catch (err) {
        console.warn('Recognition stop warning:', err);
      }
    },
    abort: () => {
      try {
        recognition.abort();
      } catch (err) {
        console.warn('Recognition abort warning:', err);
      }
    },
  };
}

/**
 * Accessible audio volume visualizer monitor.
 * Analyzes microphone stream and calculates root-mean-square volume (0.0 to 1.0)
 * for visual sound-wave feedback.
 */
export function createAudioLevelMonitor(
  stream: MediaStream,
  onLevel: (level: number) => void
): () => void {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return () => {};

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animationId: number;

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      // Normalized between 0 and 1
      const normalized = Math.min(1.0, average / 128);
      onLevel(normalized);
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      source.disconnect();
      analyser.disconnect();
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  } catch (err) {
    console.warn('Audio level monitor error:', err);
    return () => {};
  }
}
