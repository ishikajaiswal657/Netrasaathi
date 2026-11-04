'use client';

import React, { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { ExplanationBlock, PageBlocksResponse } from '@/lib/types';
import {
  speakText,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
  parseVoiceCommand,
  createSpeechRecognizer,
  SpeechRecognizerInstance,
  isSpeechRecognitionSupported,
  SUPPORTED_LANGUAGES,
} from '@/lib/speech';
import { getLocalizedBlock, getLocalizedStrings } from '@/lib/multilingual';
import { useAnnounce } from '@/components/accessibility/LiveAnnouncer';
import { AudioControls } from '@/components/player/AudioControls';
import { ExplanationBlockCard } from '@/components/reader/ExplanationBlockCard';
import { VoiceQuestionPanel } from '@/components/voice/VoiceQuestionPanel';
import { VoiceActivityIndicator } from '@/components/voice/VoiceActivityIndicator';
import { VoiceAvatar3D } from '@/components/voice/VoiceAvatar3D';
import { DirectConceptExplainerModal } from '@/components/voice/DirectConceptExplainerModal';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertCircle,
  Mic,
  MicOff,
  Sparkles,
  Subtitles,
  HelpCircle,
  X,
  Volume2,
} from 'lucide-react';

function ReaderView() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  const { announcePolite, announceAssertive } = useAnnounce();

  const [pageData, setPageData] = useState<PageBlocksResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Speech playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState(1.0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [showCaptions, setShowCaptions] = useState(true);
  const [currentCaptionText, setCurrentCaptionText] = useState('');

  // Direct Voice Concept Modal & Voice Command Help Modal
  const [isDirectExplainerOpen, setIsDirectExplainerOpen] = useState(false);
  const [isVoiceHelpOpen, setIsVoiceHelpOpen] = useState(false);

  // Hands-free voice commands mode
  const [isVoiceCommandsActive, setIsVoiceCommandsActive] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<string | null>(null);
  const commandRecognizerRef = useRef<SpeechRecognizerInstance | null>(null);

  // Keep refs for asynchronous playback callbacks
  const isPlayingRef = useRef(false);
  const blocksRef = useRef<ExplanationBlock[]>([]);
  const currentIdxRef = useRef(0);
  const rateRef = useRef(1.0);
  const langRef = useRef('en-IN');
  const playBlockRef = useRef<(idx: number) => void>(() => {});

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    blocksRef.current = pageData?.blocks || [];
  }, [pageData]);

  useEffect(() => {
    currentIdxRef.current = currentBlockIndex;
  }, [currentBlockIndex]);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  useEffect(() => {
    langRef.current = selectedLanguage;
  }, [selectedLanguage]);

  // Core function to speak a specific block
  const playBlockAtIndex = useCallback(
    (index: number) => {
      const currentBlocks = blocksRef.current;
      if (!currentBlocks || index < 0 || index >= currentBlocks.length) {
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentCaptionText('');
        announcePolite('Finished reading all cards on this page.');
        return;
      }

      const block = currentBlocks[index];
      setCurrentBlockIndex(index);
      setIsPlaying(true);
      setIsPaused(false);

      // Scroll active block into view smoothly
      const el = document.getElementById(`block-${block.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      const localized = getLocalizedBlock(block, langRef.current);
      const spokenTitle = localized.title ? `${localized.title}. ` : '';
      const textToSpeak = `${spokenTitle}${localized.text}`;

      setCurrentCaptionText(textToSpeak);
      announcePolite(
        `Reading card ${index + 1} of ${currentBlocks.length}: ${localized.title || block.title || block.block_type}`
      );

      speakText(textToSpeak, {
        rate: rateRef.current,
        lang: langRef.current,
        onStart: () => {
          setIsPlaying(true);
          setIsPaused(false);
        },
        onEnd: () => {
          if (isPlayingRef.current) {
            const nextIdx = index + 1;
            if (nextIdx < blocksRef.current.length) {
              playBlockRef.current(nextIdx);
            } else {
              setIsPlaying(false);
              setIsPaused(false);
              setCurrentCaptionText('');
              announcePolite('End of page. Use Next Page button to continue.');
            }
          }
        },
        onError: () => {
          setIsPlaying(false);
          setIsPaused(false);
        },
      });
    },
    [announcePolite]
  );

  useEffect(() => {
    playBlockRef.current = playBlockAtIndex;
  }, [playBlockAtIndex]);

  // Load document blocks for page
  const loadPageBlocks = useCallback(
    async (pageNumber: number) => {
      stopSpeech();
      setIsPlaying(false);
      setIsPaused(false);
      setCurrentCaptionText('');
      setCurrentBlockIndex(0);

      try {
        const data = await api.getDocumentBlocks(documentId, pageNumber);
        setPageData(data);
        setErrorMessage('');
        announcePolite(
          `Page ${data.page_number} loaded with ${data.blocks.length} explanation cards.`
        );
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 401) {
          router.push('/login');
          return;
        }
        const msg =
          err instanceof Error
            ? err.message
            : 'Could not load explanation cards for this document.';
        setErrorMessage(msg);
        announceAssertive(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [documentId, announceAssertive, announcePolite, router]
  );

  useEffect(() => {
    let isSubscribed = true;
    api.getDocumentBlocks(documentId, currentPage)
      .then((data) => {
        if (isSubscribed) {
          setPageData(data);
          setIsLoading(false);
          announcePolite(
            `Page ${data.page_number} loaded with ${data.blocks.length} explanation cards.`
          );
        }
      })
      .catch((err: unknown) => {
        if (isSubscribed) {
          if (err instanceof ApiError && err.status === 401) {
            router.push('/login');
            return;
          }
          const msg =
            err instanceof Error
              ? err.message
              : 'Could not load explanation cards for this document.';
          setErrorMessage(msg);
          setIsLoading(false);
          announceAssertive(msg);
        }
      });

    return () => {
      isSubscribed = false;
      stopSpeech();
      if (commandRecognizerRef.current) {
        commandRecognizerRef.current.abort();
      }
    };
  }, [documentId, currentPage, announcePolite, announceAssertive, router]);

  // Playback Control Handlers
  const handlePlay = useCallback(() => {
    if (!pageData || pageData.blocks.length === 0) return;
    playBlockAtIndex(currentBlockIndex);
  }, [pageData, currentBlockIndex, playBlockAtIndex]);

  const handlePause = useCallback(() => {
    pauseSpeech();
    setIsPlaying(false);
    setIsPaused(true);
    announcePolite('Speech paused.');
  }, [announcePolite]);

  const handleResume = useCallback(() => {
    resumeSpeech();
    setIsPlaying(true);
    setIsPaused(false);
    announcePolite('Speech resumed.');
  }, [announcePolite]);

  const handleStop = useCallback(() => {
    stopSpeech();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentCaptionText('');
    announcePolite('Speech stopped.');
  }, [announcePolite]);

  const handleRepeat = useCallback(() => {
    playBlockAtIndex(currentBlockIndex);
  }, [playBlockAtIndex, currentBlockIndex]);

  const handleNext = useCallback(() => {
    if (pageData && currentBlockIndex < pageData.blocks.length - 1) {
      playBlockAtIndex(currentBlockIndex + 1);
    }
  }, [pageData, currentBlockIndex, playBlockAtIndex]);

  const handlePrevious = useCallback(() => {
    if (currentBlockIndex > 0) {
      playBlockAtIndex(currentBlockIndex - 1);
    }
  }, [currentBlockIndex, playBlockAtIndex]);

  const handleChangeRate = useCallback(
    (newRate: number) => {
      const clamped = Math.max(0.75, Math.min(newRate, 1.5));
      setRate(clamped);
      announcePolite(`Speech rate set to ${clamped}x.`);
      if (isPlayingRef.current) {
        playBlockAtIndex(currentIdxRef.current);
      }
    },
    [announcePolite, playBlockAtIndex]
  );

  const handleChangeLanguage = useCallback(
    (newLang: string) => {
      setSelectedLanguage(newLang);
      langRef.current = newLang;
      const loc = getLocalizedStrings(newLang);
      announcePolite(loc.langChanged);
      if (isPlayingRef.current) {
        // Read the current card in the new language immediately without overlapping announcements
        playBlockAtIndex(currentIdxRef.current);
      } else {
        // Not actively playing document cards; speak the language confirmation
        speakText(loc.langChanged, { lang: newLang });
      }
    },
    [announcePolite, playBlockAtIndex]
  );

  const handleCycleNextLanguage = useCallback(() => {
    const currentIdx = SUPPORTED_LANGUAGES.findIndex((l) => l.code === langRef.current);
    const nextIdx = (currentIdx + 1) % SUPPORTED_LANGUAGES.length;
    const nextLang = SUPPORTED_LANGUAGES[nextIdx].code;
    handleChangeLanguage(nextLang);
  }, [handleChangeLanguage]);

  const handleReadSingleBlock = (block: ExplanationBlock) => {
    if (!pageData) return;
    const idx = pageData.blocks.findIndex((b) => b.id === block.id);
    if (idx !== -1) {
      playBlockAtIndex(idx);
    }
  };

  const handleAnnounceVoiceHelp = useCallback(() => {
    setIsVoiceHelpOpen(true);
    const helpSpoken =
      'Voice commands available: Say Next to go forward. Say Previous or Back to go back. Say Repeat to hear the card again. Say Slower or Faster to adjust reading speed. Say Stop to pause. Say Captions to toggle subtitles. Say Language to change voice language.';
    speakText(helpSpoken, { rate: 1.0, lang: langRef.current });
    announcePolite(helpSpoken);
  }, [announcePolite]);

  // Voice Commands Hands-Free Listener
  const toggleVoiceCommands = useCallback(() => {
    if (!isSpeechRecognitionSupported()) {
      announceAssertive('Voice commands are not supported in this browser. Please use Google Chrome or Edge.');
      return;
    }

    if (isVoiceCommandsActive) {
      if (commandRecognizerRef.current) {
        commandRecognizerRef.current.abort();
      }
      setIsVoiceCommandsActive(false);
      setLastVoiceCommand(null);
      announcePolite('Hands-free voice commands disabled.');
    } else {
      setIsVoiceCommandsActive(true);
      announcePolite(
        'Hands-free voice commands enabled. You can say: Next, Previous, Repeat, Slower, Faster, Stop, Captions, or Help.'
      );

      const recognizer = createSpeechRecognizer(
        {
          onStart: () => {},
          onResult: (transcript, isFinal) => {
            if (isFinal) {
              const cmd = parseVoiceCommand(transcript);
              if (cmd) {
                setLastVoiceCommand(cmd);
                announcePolite(`Voice command recognized: ${cmd}`);
                switch (cmd) {
                  case 'next':
                    handleNext();
                    break;
                  case 'previous':
                    handlePrevious();
                    break;
                  case 'repeat':
                    handleRepeat();
                    break;
                  case 'play':
                    handlePlay();
                    break;
                  case 'slower':
                    handleChangeRate(rateRef.current - 0.25);
                    break;
                  case 'faster':
                    handleChangeRate(rateRef.current + 0.25);
                    break;
                  case 'stop':
                    handleStop();
                    break;
                  case 'captions':
                    setShowCaptions((prev) => !prev);
                    break;
                  case 'language':
                    handleCycleNextLanguage();
                    break;
                  case 'help':
                    handleAnnounceVoiceHelp();
                    break;
                }
              }
            }
          },
          onError: (err) => {
            console.warn('Voice command recognition warning:', err);
          },
          onEnd: () => {
            if (isVoiceCommandsActive && commandRecognizerRef.current) {
              try {
                commandRecognizerRef.current.start();
              } catch {}
            }
          },
        },
        selectedLanguage
      );

      if (recognizer) {
        commandRecognizerRef.current = recognizer;
        recognizer.start();
      }
    }
  }, [
    isVoiceCommandsActive,
    announcePolite,
    announceAssertive,
    handleNext,
    handlePrevious,
    handleRepeat,
    handlePlay,
    handleChangeRate,
    handleStop,
    handleCycleNextLanguage,
    handleAnnounceVoiceHelp,
    selectedLanguage,
  ]);

  // Keyboard Shortcuts Listener for Motor & Blind Accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlayingRef.current) {
          handlePause();
        } else if (isPaused) {
          handleResume();
        } else {
          handlePlay();
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRepeat();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleStop();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        toggleVoiceCommands();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setIsDirectExplainerOpen(true);
      } else if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleAnnounceVoiceHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handlePause,
    handleResume,
    handlePlay,
    handleNext,
    handlePrevious,
    handleRepeat,
    handleStop,
    toggleVoiceCommands,
    handleAnnounceVoiceHelp,
    isPaused,
  ]);

  const totalPages = pageData?.total_pages || 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="bg-slate-50 min-h-screen py-8 sm:py-10 text-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Navigation & Direct Voice Ask Trigger */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 p-2 rounded-xl hover:bg-slate-200/60 min-h-[40px] transition-all"
            aria-label="Back to document dashboard"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Return to Documents</span>
          </Link>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Direct Voice Asking Button (No File Needed) */}
            <button
              type="button"
              onClick={() => setIsDirectExplainerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer min-h-[40px]"
              aria-label="Ask for any diagram or concept directly by voice without uploading a file (Keyboard shortcut: V)"
              title="Direct Voice Mode (V)"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>Ask Netra Any Diagram (V)</span>
            </button>

            {/* Voice Command Help Button */}
            <button
              type="button"
              onClick={handleAnnounceVoiceHelp}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all min-h-[40px] cursor-pointer shadow-xs"
              aria-label="View and listen to voice commands guide (Keyboard shortcut: H)"
              title="Voice Commands Guide (H)"
            >
              <HelpCircle className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span>Voice Guide (H)</span>
            </button>

            {/* Hands-Free Voice Commands Toggle */}
            <button
              type="button"
              onClick={toggleVoiceCommands}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all min-h-[40px] cursor-pointer shadow-xs ${
                isVoiceCommandsActive
                  ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              aria-label={
                isVoiceCommandsActive
                  ? 'Disable hands-free voice commands'
                  : 'Enable hands-free voice commands: Next, Previous, Repeat, Slower, Faster, Stop (Shortcut: C)'
              }
              aria-pressed={isVoiceCommandsActive}
            >
              {isVoiceCommandsActive ? (
                <Mic className="h-4 w-4 text-white" aria-hidden="true" />
              ) : (
                <MicOff className="h-4 w-4 text-slate-400" aria-hidden="true" />
              )}
              <span>
                {isVoiceCommandsActive
                  ? 'Voice Commands: Active'
                  : 'Voice Commands (Press C)'}
              </span>
            </button>
          </div>
        </div>

        {/* Live Hands-Free Voice HUD Banner */}
        {isVoiceCommandsActive && (
          <aside
            role="status"
            aria-live="polite"
            className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center gap-3">
              <VoiceActivityIndicator
                isActive={true}
                level={0.6}
                label="Hands-Free Listening"
                size="sm"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  Say a Command: Next, Previous, Slower, Faster, Stop, Repeat, Captions, Help
                </span>
                {lastVoiceCommand && (
                  <span className="text-[11px] font-bold text-emerald-700">
                    Recognized: &quot;{lastVoiceCommand}&quot;
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={toggleVoiceCommands}
              className="text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-200 self-end sm:self-auto cursor-pointer font-semibold"
            >
              Turn Off
            </button>
          </aside>
        )}

        {/* Reader Header Card with 3D Voice Assistant Avatar */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <VoiceAvatar3D
                size="md"
                state={isPlaying ? 'speaking' : isVoiceCommandsActive ? 'listening' : 'idle'}
                speechBubbleText={
                  isPlaying
                    ? `Reading Card ${currentBlockIndex + 1}`
                    : isVoiceCommandsActive
                    ? 'Listening for command...'
                    : 'Ready to read aloud'
                }
              />
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-0.5 rounded-full border border-blue-200 uppercase tracking-wider w-fit">
                  <BookOpen className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
                  <span>Accessible Talking Reader</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {documentId === 'doc-101' ? 'Computer Networks: OSI Model & Handshake' : documentId}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Document Ref:{' '}
                  <code className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-blue-700 font-bold">
                    {documentId}
                  </code>
                </p>
              </div>
            </div>

            {/* Page Switcher */}
            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-2xl border border-slate-200 shadow-xs shrink-0 self-center md:self-auto">
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setCurrentPage((p) => Math.max(1, p - 1));
                }}
                disabled={!canGoPrev || isLoading}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-all shadow-xs"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>

              <span className="text-sm font-extrabold text-slate-900 px-3 min-w-[100px] text-center">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={!canGoNext || isLoading}
                className="p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer transition-all shadow-xs"
                aria-label="Next Page"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Live Synchronized Accessible Captions (for Deaf & Hard-of-Hearing Students) */}
        {showCaptions && isPlaying && currentCaptionText && (
          <aside
            role="status"
            aria-live="polite"
            className="bg-white border-2 border-blue-500/70 p-5 rounded-2xl shadow-sm flex items-start gap-3.5 transition-all animate-fade-in"
          >
            <Subtitles className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Live Spoken Caption ({selectedLanguage})
              </span>
              <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                {currentCaptionText}
              </p>
            </div>
          </aside>
        )}

        {/* Error state */}
        {errorMessage && (
          <div
            role="alert"
            className="p-5 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs"
          >
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <strong className="font-bold block text-base text-rose-900">
                Failed to load explanations:
              </strong>
              <p className="text-sm">{errorMessage}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsLoading(true);
                loadPageBlocks(currentPage);
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div
            className="bg-white rounded-3xl p-16 text-center space-y-4 border border-slate-200 shadow-sm"
            aria-busy="true"
          >
            <div
              className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-sm"
              aria-hidden="true"
            />
            <p className="text-slate-700 font-bold text-base">
              Structuring plain-English explanation cards for Page {currentPage}...
            </p>
          </div>
        )}

        {/* Explanation Blocks Ordered List */}
        {!isLoading && pageData && pageData.blocks.length > 0 && (
          <section aria-label="Explanation cards on this page" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <span>Explanation Cards ({pageData.blocks.length})</span>
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                Click &quot;Listen to this block&quot; on any card to read it directly
              </span>
            </div>

            <div className="space-y-4">
              {pageData.blocks.map((block, idx) => (
                <ExplanationBlockCard
                  key={block.id}
                  block={block}
                  isActive={isPlaying && currentBlockIndex === idx}
                  onReadBlock={handleReadSingleBlock}
                />
              ))}
            </div>
          </section>
        )}

        {/* Sticky Accessible Audio Controls */}
        {!isLoading && pageData && pageData.blocks.length > 0 && (
          <AudioControls
            isPlaying={isPlaying}
            isPaused={isPaused}
            rate={rate}
            currentBlockIndex={currentBlockIndex}
            totalBlocks={pageData.blocks.length}
            selectedLanguage={selectedLanguage}
            showCaptions={showCaptions}
            onPlay={handlePlay}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
            onRepeat={handleRepeat}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onChangeRate={handleChangeRate}
            onChangeLanguage={handleChangeLanguage}
            onToggleCaptions={() => setShowCaptions((prev) => !prev)}
          />
        )}

        {/* Voice Questions & Grounded Q&A Interface */}
        <VoiceQuestionPanel
          documentId={documentId}
          documentTitle={documentId === 'doc-101' ? 'Computer Networks: OSI Model & Handshake' : documentId}
        />
      </div>

      {/* Voice Command Reference Modal */}
      {isVoiceHelpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="voice-help-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
        >
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6 text-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Volume2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <h3 id="voice-help-title" className="text-xl font-extrabold text-slate-900">
                  Voice Commands Reference
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsVoiceHelpOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-all cursor-pointer"
                aria-label="Close voice commands reference"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600">
              When Hands-Free Voice Commands are active (Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-blue-700 font-mono text-xs font-bold">C</kbd>), you can speak any of these words:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Next Card</strong>
                <p className="text-slate-600">Say: &quot;Next&quot;, &quot;Forward&quot;, or &quot;Aage&quot;</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Previous Card</strong>
                <p className="text-slate-600">Say: &quot;Previous&quot;, &quot;Back&quot;, or &quot;Peechhe&quot;</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Repeat Card</strong>
                <p className="text-slate-600">Say: &quot;Repeat&quot;, &quot;Read again&quot;, or &quot;Dobara&quot;</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Pause / Stop</strong>
                <p className="text-slate-600">Say: &quot;Stop&quot;, &quot;Pause&quot;, or &quot;Ruko&quot;</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Slower Speech</strong>
                <p className="text-slate-600">Say: &quot;Slower&quot; or &quot;Dheere&quot;</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Faster Speech</strong>
                <p className="text-slate-600">Say: &quot;Faster&quot; or &quot;Tez&quot;</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Captions / Subtitles</strong>
                <p className="text-slate-600">Say: &quot;Captions&quot; or &quot;Subtitles&quot;</p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <strong className="text-blue-700 block font-bold">Change Language</strong>
                <p className="text-slate-600">Say: &quot;Language&quot; or &quot;Bhasha&quot;</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsVoiceHelpOpen(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Close Guide
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Voice Asking Modal (Hands-Free Without File Upload) */}
      <DirectConceptExplainerModal
        isOpen={isDirectExplainerOpen}
        onClose={() => setIsDirectExplainerOpen(false)}
        selectedLanguage={selectedLanguage}
      />
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-12 text-center space-y-4" aria-busy="true">
          <div
            className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto shadow-sm"
            aria-hidden="true"
          />
          <p className="text-slate-700 font-bold">Loading accessible reader...</p>
        </div>
      }
    >
      <ReaderView />
    </Suspense>
  );
}
