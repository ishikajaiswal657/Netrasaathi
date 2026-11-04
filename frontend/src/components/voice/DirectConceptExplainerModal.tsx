'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  ArrowRight,
  Globe,
  Loader2,
} from 'lucide-react';
import { VoiceAvatar3D, AvatarState } from './VoiceAvatar3D';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeech,
  SUPPORTED_LANGUAGES,
  SpeechRecognizerInstance,
} from '@/lib/speech';
import { getLocalizedStrings, generateConceptBlocks } from '@/lib/multilingual';
import { ExplanationBlock } from '@/lib/types';
import { getBlockTypeDetails } from '@/lib/utils';
import { VisualRepresentation } from '@/components/reader/VisualRepresentation';

interface DirectConceptExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLanguage: string;
}

export function DirectConceptExplainerModal({
  isOpen,
  onClose,
  selectedLanguage,
}: DirectConceptExplainerModalProps) {
  const [language, setLanguage] = useState(selectedLanguage || 'en-IN');
  const [isListening, setIsListening] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedBlocks, setGeneratedBlocks] = useState<ExplanationBlock[]>([]);
  const [statusMessage, setStatusMessage] = useState('Press the microphone and ask for any diagram or concept.');
  const [activeSpeakingBlockId, setActiveSpeakingBlockId] = useState<number | string | null>(null);

  const recognizerRef = useRef<SpeechRecognizerInstance | null>(null);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      prevIsOpenRef.current = false;
      stopSpeech();
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
      setIsListening(false);
      setGeneratedBlocks([]);
      setQueryText('');
    } else if (!prevIsOpenRef.current) {
      // Greet the student only on initial modal activation to prevent overlapping speeches
      prevIsOpenRef.current = true;
      const loc = getLocalizedStrings(language);
      setStatusMessage(loc.greeting);
      speakText(loc.greeting, {
        lang: language,
      });
    }
  }, [isOpen, language]);

  const startListening = () => {
    if (!isSpeechRecognitionSupported()) {
      setStatusMessage('Speech recognition not supported in this browser. Please type your topic.');
      return;
    }

    const loc = getLocalizedStrings(language);
    stopSpeech();
    setIsListening(true);
    setStatusMessage(loc.listening);

    const recognizer = createSpeechRecognizer(
      {
        onStart: () => {
          setIsListening(true);
        },
        onResult: (transcript, isFinal) => {
          setQueryText(transcript);
          if (isFinal) {
            setIsListening(false);
            handleExplainConcept(transcript);
          }
        },
        onError: (err) => {
          setIsListening(false);
          setStatusMessage(err);
        },
        onEnd: () => {
          setIsListening(false);
        },
      },
      language
    );

    if (recognizer) {
      recognizerRef.current = recognizer;
      recognizer.start();
    }
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    const loc = getLocalizedStrings(language);
    setIsListening(false);
    setStatusMessage(loc.stopListening);
  };

  // Generate simple, structured educational explanation blocks for the spoken query
  const handleExplainConcept = async (query: string) => {
    if (!query.trim()) return;
    setIsGenerating(true);
    const loc = getLocalizedStrings(language);
    setStatusMessage(`Preparing easy explanation for: "${query}"...`);

    // Intelligent accessibility generator for common diagrams and concepts
    setTimeout(() => {
      const blocks = generateConceptBlocks(query, language);
      setGeneratedBlocks(blocks);
      setIsGenerating(false);
      setStatusMessage(`${loc.readyRead} (${blocks.length})`);

      // Automatically speak the first block out loud in the selected language
      if (blocks.length > 0) {
        speakBlock(blocks[0]);
      }
    }, 700);
  };

  const speakBlock = (block: ExplanationBlock) => {
    setActiveSpeakingBlockId(block.id);
    const spokenText = `${block.title}. ${block.explanation_text}`;
    speakText(spokenText, {
      lang: language,
      onEnd: () => {
        setActiveSpeakingBlockId(null);
      },
      onError: () => {
        setActiveSpeakingBlockId(null);
      },
    });
  };

  if (!isOpen) return null;

  const avatarState: AvatarState =
    activeSpeakingBlockId !== null
      ? 'speaking'
      : isListening
      ? 'listening'
      : isGenerating
      ? 'thinking'
      : 'idle';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4 text-slate-900 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="voice-modal-title" className="text-lg sm:text-xl font-extrabold text-slate-900">
                Direct Voice Concept Explainer
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Ask for any diagram, flowchart, or formula hands-free
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Selector Dropdown */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-xs">
              <Globe className="h-3.5 w-3.5 text-blue-600 mr-1.5 shrink-0" aria-hidden="true" />
              <label htmlFor="modal-lang-select" className="sr-only">
                Language
              </label>
              <select
                id="modal-lang-select"
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  stopSpeech();
                  const newLoc = getLocalizedStrings(newLang);
                  setStatusMessage(newLoc.langChanged);
                  speakText(newLoc.langChanged, { lang: newLang });
                }}
                className="bg-transparent text-xs text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
                aria-label="Select assistant language"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-white text-slate-900">
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
              aria-label="Close direct voice explainer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* 3D Voice Assistant Interactive Stage */}
        <div className="flex flex-col items-center justify-center text-center space-y-3 py-2 bg-gradient-to-b from-blue-50/50 to-indigo-50/30 rounded-3xl border border-blue-100/60 p-5">
          <VoiceAvatar3D
            state={avatarState}
            size="lg"
            speechBubbleText={statusMessage}
            onClick={isListening ? stopListening : startListening}
            className="cursor-pointer"
          />

          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:scale-105 active:scale-95'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span>Stop Listening</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4" />
                  <span>Click to Speak with Netra</span>
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 font-medium pt-1">
              Try saying: &quot;Explain the OSI model flowchart&quot; or &quot;Describe Newton&apos;s second law&quot;
            </p>
          </div>
        </div>

        {/* Text Input Fallback */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExplainConcept(queryText);
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Or type any diagram or topic to explain..."
            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all shadow-xs"
            aria-label="Type concept or diagram name"
          />
          <button
            type="submit"
            disabled={isGenerating || !queryText.trim()}
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-xs sm:text-sm text-white transition-all disabled:opacity-40 cursor-pointer shadow-sm flex items-center gap-2"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            <span>Explain</span>
          </button>
        </form>

        {/* Results: Structured Voice Cards */}
        {generatedBlocks.length > 0 && (
          <div className="space-y-4 border-t border-slate-200 pt-4">
            <h3 className="text-xs uppercase tracking-wider font-extrabold text-blue-700">
              Audio Explanation Cards ({generatedBlocks.length})
            </h3>

            <div className="space-y-3">
              {generatedBlocks.map((blk) => {
                const details = getBlockTypeDetails(blk.block_type);
                const isSpeakingThis = activeSpeakingBlockId === blk.id;

                return (
                  <div
                    key={blk.id}
                    className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                      isSpeakingThis
                        ? 'bg-blue-50/80 border-blue-400 shadow-md ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${details.badgeClass}`}>
                          {details.label}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-slate-900">
                          {blk.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => speakBlock(blk)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSpeakingThis
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                        aria-label={`Listen to ${blk.title}`}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>{isSpeakingThis ? 'Speaking...' : 'Listen'}</span>
                      </button>
                    </div>

                    {/* Interactive Visual Representation (Flowchart, Diagram, Formula, Graph, Table) */}
                    <VisualRepresentation
                      blockType={blk.block_type}
                      title={blk.title}
                      explanationText={blk.explanation_text}
                    />

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal mt-2 pt-2 border-t border-slate-100">
                      {blk.explanation_text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

