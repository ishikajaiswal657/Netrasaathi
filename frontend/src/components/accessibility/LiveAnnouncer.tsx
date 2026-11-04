'use client';

/**
 * Screen Reader Live Announcer
 * Provides programmatic announcements to assistive technologies (NVDA, JAWS, VoiceOver)
 * using ARIA live regions with polite and assertive priorities.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface LiveAnnouncerContextType {
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextType>({
  announcePolite: () => {},
  announceAssertive: () => {},
});

export function LiveAnnouncerProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState<string>('');
  const [assertiveMessage, setAssertiveMessage] = useState<string>('');

  const announcePolite = useCallback((msg: string) => {
    // Clear first to re-trigger screen reader announcement on identical messages
    setPoliteMessage('');
    setTimeout(() => setPoliteMessage(msg), 50);
  }, []);

  const announceAssertive = useCallback((msg: string) => {
    setAssertiveMessage('');
    setTimeout(() => setAssertiveMessage(msg), 50);
  }, []);

  return (
    <LiveAnnouncerContext.Provider value={{ announcePolite, announceAssertive }}>
      {children}
      {/* Off-screen live regions for assistive devices */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
        id="sr-polite-announcer"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        role="alert"
        id="sr-assertive-announcer"
      >
        {assertiveMessage}
      </div>
    </LiveAnnouncerContext.Provider>
  );
}

export function useAnnounce() {
  return useContext(LiveAnnouncerContext);
}
