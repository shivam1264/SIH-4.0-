import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AccessibilityPrefs, ThemeMode, FontSize, Spacing, FontFamily } from '../types';
import { screenReaderAnnouncer } from '../services/screenReaderAnnouncer';

const DEFAULTS: AccessibilityPrefs = {
  theme: 'dark',
  fontSize: 'default',
  spacing: 'default',
  fontFamily: 'inter',
  voiceMode: true,
  voiceRate: 0.96,
  voicePitch: 0.96,
  voiceName: '',
  highFocus: true,
  reduceMotion: false,
  audioFeedback: true,
  autoReadQuestion: true,
  timerWarnings: true,
};

interface AccessibilityCtx {
  prefs: AccessibilityPrefs;
  setTheme: (t: ThemeMode) => void;
  setFontSize: (f: FontSize) => void;
  setSpacing: (s: Spacing) => void;
  setFontFamily: (f: FontFamily) => void;
  toggleVoice: () => void;
  setVoiceRate: (r: number) => void;
  setVoicePitch: (p: number) => void;
  setVoiceName: (n: string) => void;
  toggleHighFocus: () => void;
  toggleReduceMotion: () => void;
  toggleAudioFeedback: () => void;
  toggleAutoRead: () => void;
  toggleTimerWarnings: () => void;
  resetToDefaults: () => void;
  announcePolite: (msg: string) => void;
  announceAssertive: (msg: string) => void;
  orientCurrentPage: (pathname: string, speakAloud?: boolean) => void;
}

const Ctx = createContext<AccessibilityCtx | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AccessibilityPrefs>(() => {
    try {
      const stored = localStorage.getItem('sight-exam-accessibility');
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch { return DEFAULTS; }
  });

  // Apply to DOM & sync speech service
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', prefs.theme);
    root.setAttribute('data-fontsize', prefs.fontSize);
    root.setAttribute('data-spacing', prefs.spacing);
    root.setAttribute('data-font', prefs.fontFamily);
    root.setAttribute('data-highfocus', String(prefs.highFocus));
    root.setAttribute('data-reducemotion', String(prefs.reduceMotion));
    localStorage.setItem('sight-exam-accessibility', JSON.stringify(prefs));
  }, [prefs]);

  const update = (patch: Partial<AccessibilityPrefs>) =>
    setPrefs(p => ({ ...p, ...patch }));

  return (
    <Ctx.Provider value={{
      prefs,
      setTheme: (t) => update({ theme: t }),
      setFontSize: (f) => update({ fontSize: f }),
      setSpacing: (s) => update({ spacing: s }),
      setFontFamily: (f) => update({ fontFamily: f }),
      toggleVoice: () => update({ voiceMode: !prefs.voiceMode }),
      setVoiceRate: (r) => update({ voiceRate: r }),
      setVoicePitch: (p) => update({ voicePitch: p }),
      setVoiceName: (n) => update({ voiceName: n }),
      toggleHighFocus: () => update({ highFocus: !prefs.highFocus }),
      toggleReduceMotion: () => update({ reduceMotion: !prefs.reduceMotion }),
      toggleAudioFeedback: () => update({ audioFeedback: !prefs.audioFeedback }),
      toggleAutoRead: () => update({ autoReadQuestion: !prefs.autoReadQuestion }),
      toggleTimerWarnings: () => update({ timerWarnings: !prefs.timerWarnings }),
      resetToDefaults: () => setPrefs(DEFAULTS),
      announcePolite: (msg: string) => screenReaderAnnouncer.announcePolite(msg),
      announceAssertive: (msg: string) => screenReaderAnnouncer.announceAssertive(msg),
      orientCurrentPage: (pathname: string, speakAloud?: boolean) =>
        screenReaderAnnouncer.orientCurrentPage(pathname, speakAloud ?? prefs.voiceMode),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAccessibility outside provider');
  return ctx;
}
