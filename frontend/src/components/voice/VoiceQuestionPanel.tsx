'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognizer,
  createAudioLevelMonitor,
  speakText,
  stopSpeech,
  SUPPORTED_LANGUAGES,
} from '@/lib/speech';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { VoiceActivityIndicator } from './VoiceActivityIndicator';
import { VoiceAvatar3D, AvatarState } from './VoiceAvatar3D';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Bot,
  Globe,
  RotateCcw,
} from 'lucide-react';

interface VoiceQuestionPanelProps {
  documentId: string;
  documentTitle: string;
}

export function VoiceQuestionPanel({ documentId, documentTitle }: VoiceQuestionPanelProps) {
  const { announcePolite, announceAssertive } = useAnnounce();

  const [questionText, setQuestionText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0.5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [relevantPages, setRelevantPages] = useState<number[]>([]);
  const [isAnsweringAloud, setIsAnsweringAloud] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSttSupported, setIsSttSupported] = useState(true);
  const [speechLanguage, setSpeechLanguage] = useState('en-IN');

  const streamRef = useRef<MediaStream | null>(null);
  const stopAudioMonitorRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setIsSttSupported(isSpeechRecognitionSupported());
    return () => {
      if (stopAudioMonitorRef.current) {
        stopAudioMonitorRef.current();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startListening = async () => {
    setErrorMessage('');
    if (!isSpeechRecognitionSupported()) {
      const msg =
        'Speech recognition is not supported in this browser. You can type your question in the text box below.';
      setErrorMessage(msg);
      announceAssertive(msg);
      return;
    }

    try {
      // Attempt to capture microphone stream for visual frequency activity meter
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          stopAudioMonitorRef.current = createAudioLevelMonitor(stream, (level) => {
            setAudioLevel(level);
          });
        } catch {
          // If mic stream capture is blocked, speech recognition can still attempt to run
          setAudioLevel(0.6);
        }
      }

      const recognizer = createSpeechRecognizer(
        {
          onStart: () => {
            setIsListening(true);
            setStatusMessage('Microphone active. Speak your question now.');
            announcePolite('Listening. Speak your question now.');
          },
          onResult: (transcript, isFinal) => {
            setQuestionText(transcript);
            if (isFinal) {
              setStatusMessage('Voice captured. Review or submit your question below.');
              announcePolite(`Recognized: "${transcript}". Press Submit Question.`);
              stopListening();
            }
          },
          onError: (err) => {
            stopListening();
            const errDetail =
              err === 'not-allowed'
                ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
                : `Speech input notice: ${err}`;
            setErrorMessage(errDetail);
            announceAssertive(errDetail);
          },
          onEnd: () => {
            setIsListening(false);
          },
        },
        speechLanguage
      );

      if (recognizer) {
        recognizer.start();
      }
    } catch {
      stopListening();
      const msg = 'Could not access microphone. Please check permissions.';
      setErrorMessage(msg);
      announceAssertive(msg);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (stopAudioMonitorRef.current) {
      stopAudioMonitorRef.current();
      stopAudioMonitorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = questionText.trim();
    if (!query) {
      announceAssertive('Please speak or type a question first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setAnswer(null);
    setRelevantPages([]);
    announcePolite('Consulting your study notes, please wait...');

    try {
      const token = getToken();
      const res = await api.askQuestion(documentId, query, token);
      setAnswer(res.answer);
      setRelevantPages(res.relevant_pages || []);

      const citationMsg =
        res.relevant_pages && res.relevant_pages.length > 0
          ? ` Found on page ${res.relevant_pages.join(', ')}.`
          : '';

      const spokenResponse = `${res.answer}${citationMsg}`;
      announcePolite(`Answer received: ${spokenResponse}`);

      speakText(spokenResponse, {
        rate: 1.0,
        lang: speechLanguage,
        onStart: () => setIsAnsweringAloud(true),
        onEnd: () => setIsAnsweringAloud(false),
        onError: () => setIsAnsweringAloud(false),
      });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not generate an answer right now. Please try again.';
      setErrorMessage(msg);
      announceAssertive(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReadAnswerAloud = () => {
    if (!answer) return;
    if (isAnsweringAloud) {
      stopSpeech();
      setIsAnsweringAloud(false);
      return;
    }

    setIsAnsweringAloud(true);
    speakText(answer, {
      rate: 1.0,
      lang: speechLanguage,
      onEnd: () => setIsAnsweringAloud(false),
      onError: () => setIsAnsweringAloud(false),
    });
    announcePolite('Reading answer aloud.');
  };

  const sampleQuestions = [
    'Summarize the core concepts in this section.',
    'Explain the primary sequence of steps in this flowchart.',
    'What do the axes and trends represent in this chart?',
    'What is the practical meaning of this formula?',
  ];

  const avatarState: AvatarState = isAnsweringAloud
    ? 'speaking'
    : isSubmitting
    ? 'thinking'
    : isListening
    ? 'listening'
    : 'idle';

  const avatarBubbleText = isAnsweringAloud
    ? 'Explaining answer...'
    : isSubmitting
    ? 'Consulting notes...'
    : isListening
    ? 'Listening to you...'
    : 'Ask me anything about this page!';

  return (
    <section
      role="region"
      aria-label="Ask questions about this document by voice or text"
      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6 text-slate-900"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3.5 py-1 rounded-full border border-blue-200">
            <Bot className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <span>Document Q&amp;A Assistant</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Ask Questions About This Document
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Answers are strictly grounded in your study notes for &quot;{documentTitle}&quot;.
          </p>
        </div>

        {/* Browser support & Language Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200">
            <Globe className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
            <label htmlFor="stt-lang-select" className="sr-only">
              Speech Recognition Language
            </label>
            <select
              id="stt-lang-select"
              value={speechLanguage}
              onChange={(e) => {
                setSpeechLanguage(e.target.value);
                announcePolite(`Speech language set to ${e.target.value}`);
              }}
              className="bg-transparent text-xs text-slate-900 font-bold focus:outline-hidden cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code} className="bg-white text-slate-900">
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            {isSttSupported ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>Voice Input Ready</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                <HelpCircle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span>Type Mode</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs"
        >
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Voice Dictation Hub with 3D Avatar */}
      <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-blue-50/50 via-indigo-50/30 to-slate-50/80 rounded-2xl border border-blue-100/80 text-center space-y-4">
        {/* 3D Interactive Avatar */}
        <VoiceAvatar3D
          size="md"
          state={avatarState}
          speechBubbleText={avatarBubbleText}
          onClick={isListening ? stopListening : startListening}
          className="cursor-pointer"
        />

        {/* Pulsing Concentric Mic Button with Activity Indicator */}
        <div className="relative">
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
              <div className="absolute -inset-2 rounded-full bg-rose-500/20 animate-pulse" />
            </>
          )}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-14 h-14 rounded-full flex items-center justify-center font-bold transition-all relative z-10 cursor-pointer shadow-sm ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md ring-4 ring-rose-200 scale-105'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-105 active:scale-95'
            }`}
            aria-label={isListening ? 'Stop recording voice' : 'Record question with microphone'}
            aria-pressed={isListening}
          >
            {isListening ? (
              <MicOff className="h-6 w-6 text-white" aria-hidden="true" />
            ) : (
              <Mic className="h-6 w-6 text-white" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Live Audio Activity Frequency Wave */}
        <VoiceActivityIndicator
          isActive={isListening}
          level={audioLevel}
          label={isListening ? 'Listening to voice...' : 'Microphone Ready'}
        />

        <div className="space-y-1">
          <span className="font-extrabold text-slate-900 text-sm sm:text-base">
            {isListening ? 'Listening to your question...' : 'Click Netra or Mic to Speak'}
          </span>
          <p className="text-xs text-slate-600 max-w-sm">
            {isListening
              ? 'Speak clearly in your chosen language. Your voice will appear below.'
              : 'Speak hands-free with Netra, or type your question in the text box below.'}
          </p>
        </div>

        {statusMessage && (
          <p
            className="text-xs text-blue-700 font-bold bg-blue-100/70 px-3.5 py-1 rounded-full border border-blue-200"
            role="status"
          >
            {statusMessage}
          </p>
        )}
      </div>

      {/* Question Form */}
      <form onSubmit={handleAsk} className="space-y-4">
        <div>
          <label htmlFor="voice-question-input" className="block text-xs font-bold text-slate-700 mb-2">
            Your Question
          </label>
          <div className="relative">
            <textarea
              id="voice-question-input"
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="e.g., Explain the main concept on page 1, or describe the sequence of steps in the flowchart..."
              className="w-full rounded-2xl bg-white border border-slate-300 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all resize-none shadow-xs"
              aria-required="true"
            />
            {questionText && (
              <button
                type="button"
                onClick={() => setQuestionText('')}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 text-xs"
                aria-label="Clear question text"
                title="Clear question"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Submit & Read Aloud Action Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !questionText.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer min-h-[40px]"
              aria-label="Submit question to tutor"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>{isSubmitting ? 'Consulting Notes...' : 'Submit Question'}</span>
            </button>
          </div>

          {answer && (
            <button
              type="button"
              onClick={handleReadAnswerAloud}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[40px] ${
                isAnsweringAloud
                  ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              aria-label={isAnsweringAloud ? 'Stop reading answer aloud' : 'Read answer aloud'}
            >
              <Volume2 className="h-4 w-4" aria-hidden="true" />
              <span>{isAnsweringAloud ? 'Stop Audio' : 'Listen to Answer'}</span>
            </button>
          )}
        </div>
      </form>

      {/* Grounded Answer Display */}
      {answer && (
        <div
          role="region"
          aria-label="Tutor Answer"
          className="p-5 sm:p-6 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
              <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span>Verified Answer</span>
            </div>
            {relevantPages.length > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-bold">
                Found on Page {relevantPages.join(', ')}
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
            {answer}
          </p>
        </div>
      )}

      {/* Suggested Quick Questions */}
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <span className="text-xs font-bold text-slate-600 block">
          Or select a sample question:
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestionText(q);
                announcePolite(`Question selected: ${q}`);
              }}
              className="text-xs text-left px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-all cursor-pointer font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
