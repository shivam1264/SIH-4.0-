import { useEffect } from 'react';
import { useVoiceAssistant, PageQAItem } from '../context/VoiceAssistantContext';

/**
 * Hook for pages to easily register page-specific Q&A voice commands.
 *
 * Example:
 * ```ts
 * usePageVoice('Dashboard', [
 *   { triggers: ['score', 'marks', 'kitna score'], answer: () => `Aapka average score ${avgScore}% hai` },
 *   { triggers: ['exams', 'completed'], answer: () => `Aapne ${attempts.length} exams diye hain` },
 * ]);
 * ```
 */
export function usePageVoice(pageName: string, items: PageQAItem[]) {
  const { registerPageContext, speak } = useVoiceAssistant();

  useEffect(() => {
    const unregister = registerPageContext(pageName, items);
    return () => {
      unregister();
    };
  }, [pageName, items, registerPageContext]);

  return { speak };
}

export type { PageQAItem };
