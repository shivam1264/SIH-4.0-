// ── Voice Command Classifier Service ──────────────────────────────
export interface VoiceCommandMatch {
  action: string;
  label: string;
}

export function classifyVoiceCommand(raw: string): VoiceCommandMatch | null {
  if (!raw) return null;
  const t = raw.toLowerCase().replace(/[.,!?;:\-_]/g, ' ').trim().replace(/\s+/g, ' ');
  if (!t) return null;

  // ── Helper: does text contain an action/select intent word? ──────
  const hasActionIntent = /\b(tap|click|select|choose|tick|check|lagao|dabao|bharo|pick|press|daba|laga)\b/i.test(t);
  // Note: "mark" and "karo" and "kar" removed from hasActionIntent to avoid conflicts with FLAG

  // ═══════════════════════════════════════════════════════════════
  // ── NAVIGATION commands (checked FIRST to avoid option conflicts)
  // ═══════════════════════════════════════════════════════════════

  // ── Next Question ──────────────────────────────────────────────
  if (
    /\b(next(\s+question|\s+sawal|\s+prashna)?|agla(\s+sawal|\s+prashna)?|aage(\s+badho|\s+chalo)?|aage\s+jao|forward|skip)\b/i.test(t) &&
    !/\b(option|a|b|c|d|1|2|3|4)\b/i.test(t)
  ) {
    return { action: 'NEXT', label: 'Next Question' };
  }

  // ── Previous Question ──────────────────────────────────────────
  if (
    /\b(previous(\s+question|\s+sawal)?|prev(\s+question|\s+sawal)?|back|pichla(\s+sawal|\s+prashna)?|peeche(\s+jao)?|piche(\s+chalo)?|wapas(\s+jao)?|peeche|pichhe)\b/i.test(t) &&
    !/\b(go\s+back\s+to\s+option|wapas\s+option)\b/i.test(t)
  ) {
    return { action: 'PREV', label: 'Previous Question' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── SUBMIT / FINISH (checked early — high priority) ────────────
  // ═══════════════════════════════════════════════════════════════
  if (
    /\b(submit(\s+exam|\s+karo|\s+kar|\s+now|\s+test)?|finish(\s+exam|\s+test)?|exam\s+(khatam|jama|submit|finish|end)|khatam(\s+karo)?|jama(\s+karo)?|end\s+exam|paper\s+(de\s+do|jama|submit)|exam\s+de\s+do)\b/i.test(t)
  ) {
    return { action: 'SUBMIT', label: 'Submit Exam' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── FLAG / MARK FOR REVIEW ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (
    /\b(flag(\s+karo|\s+kar|\s+this|\s+question|\s+sawal)?|unflag(\s+karo)?|mark(\s+for\s+review|\s+review|\s+karo|\s+kar|\s+sawal|\s+question)?|review(\s+karo|\s+kar|\s+me\s+daalo|\s+mein\s+daalo)?|nishaan(\s+lagao|\s+karo)?|nishan(\s+lagao)?|bookmark(\s+karo)?|baad\s+mein(\s+dekhna)?|later(\s+check)?)\b/i.test(t)
  ) {
    return { action: 'FLAG', label: 'Flagged for Review' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── READ / REPEAT QUESTION ─────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (
    /\b(read(\s+question|\s+again|\s+aloud|\s+out|\s+karo|\s+kar)?|repeat(\s+question|\s+karo|\s+kar)?|again|padho(\s+question|\s+sawal)?|bolo(\s+question|\s+sawal|\s+phir)?|dobara(\s+padho|\s+bolo|\s+suno)?|sunao|sunaye|phir\s+se(\s+padho|\s+bolo)?|sawal\s+padho|question\s+padho|ek\s+baar\s+aur)\b/i.test(t) &&
    !/\b(options?\s+padho|options?\s+bolo|only\s+options?)\b/i.test(t)
  ) {
    return { action: 'READ', label: 'Read Question' };
  }

  // ── Read Options only ──────────────────────────────────────────
  if (
    /\b(read\s+options?|options?\s+padho|options?\s+bolo|only\s+options?|sirf\s+options?|options?\s+sunao)\b/i.test(t)
  ) {
    return { action: 'READ_OPTIONS', label: 'Read Options' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── TIME REMAINING ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (
    /\b(how\s+much\s+time|time\s+left|time\s+remaining|time\s+bataao|time\s+batao|kitna\s+time|kitna\s+samay|kitna\s+waqt|time\s+check|bache\s+hue\s+time|remaining\s+time|time\s+kya\s+hai)\b/i.test(t) ||
    /^time$/i.test(t)
  ) {
    return { action: 'TIME', label: 'Time Remaining' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── CLEAR / UNSELECT ANSWER ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (
    /\b(clear(\s+answer|\s+selection|\s+karo|\s+kar)?|unselect(\s+karo)?|hatao|remove(\s+answer)?|answer\s+hatao|selection\s+hatao|deselect(\s+karo)?|reset(\s+answer)?)\b/i.test(t)
  ) {
    return { action: 'CLEAR', label: 'Cleared Answer' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── JUMP TO QUESTION NUMBER ────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  const qMatch = t.match(/\b(?:question|sawal|prashna|q\.?|number|no\.?)\s*(\d+)\b/i);
  if (qMatch) {
    const num = parseInt(qMatch[1], 10);
    if (num >= 1) return { action: `GOTO_${num}`, label: `Question ${num}` };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── MODAL CONFIRMATION (Yes / No) ─────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (
    /\b(yes|haan|haa|ha|confirm|pakka|bilkul|zaroor|theek\s+hai|okay|ok|done)\b/i.test(t) &&
    !/\b(option|a|b|c|d|1|2|3|4)\b/i.test(t)
  ) {
    return { action: 'CONFIRM_YES', label: 'Confirm Submit' };
  }
  if (
    /\b(no|nahi|nahin|cancel|continue|wapas|ruko|rukao|mat\s+karo|nahi\s+karna|band\s+karo)\b/i.test(t) &&
    !/\b(option|a|b|c|d|1|2|3|4)\b/i.test(t)
  ) {
    return { action: 'CANCEL_NO', label: 'Continue Exam' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── STOP / TOGGLE VOICE ────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════
  if (
    /\b(stop\s+voice|voice\s+off|mic\s+off|band\s+karo\s+mic|exit\s+voice|mute(\s+mic)?|mike\s+off)\b/i.test(t)
  ) {
    return { action: 'STOP_VOICE', label: 'Voice Mode Off' };
  }

  // ── Start Exam ────────────────────────────────────────────────
  if (
    /\b(start(\s+the\s+exam|\s+exam|\s+test|\s+now)?|begin(\s+exam|\s+test)?|shuru(\s+karo|\s+kar|\s+kijiye)?|chalu(\s+karo|\s+kar)?|exam\s+shuru|start\s+karo|click(\s+begin|\s+start|\s+here)?|tap(\s+begin|\s+start)?|proceed|let'?s\s+start)\b/i.test(t) ||
    /^(start|begin|shuru|chalu|enter|go|click|tap|open)$/i.test(t)
  ) {
    return { action: 'START_EXAM', label: 'Start Exam' };
  }

  // ═══════════════════════════════════════════════════════════════
  // ── OPTION SELECTION A / B / C / D ────────────────────────────
  // ═══════════════════════════════════════════════════════════════

  // ── Option A ──────────────────────────────────────────────────
  if (
    /^(a|alpha|apple|ay|ae|eh|1|one|first|pehla|pahla|ek)$/i.test(t) ||
    /^option\s*(a|alpha|1|one|first|pehla|pahla)$/i.test(t) ||
    /\boptions?\s*(number|no\.?|wala)?\s*(a|alpha|1|one|first|pehla|pahla)\b/i.test(t) ||
    /\b(a|alpha|1|one|first|pehla|pahla)\s*(number|no\.?|wala)?\s*options?\b/i.test(t) ||
    /\b(tap|click|select|choose|tick|check|lagao|dabao|press)\s*(on\s*)?(options?\s*)?(a|alpha|1|one|first|pehla|pahla)\b/i.test(t) ||
    /\b(options?\s*)?(a|alpha|1|one|first|pehla|pahla)\s*(ko\s*)?(tap|click|select|choose|tick|lagao|dabao|press|pe|par|wala)\b/i.test(t) ||
    /\b(answer|ans)\s*(is|=|:)?\s*(options?\s*)?(a|alpha|1|one|first|pehla|pahla)\b/i.test(t) ||
    /\b(a|alpha|1)\s*(hai|hoga|sahi\s*hai|answer\s*hai|is\s*the\s*answer|select|wala|choose|sahi)\b/i.test(t) ||
    /^(a|1)\s*(hai|hoga|karo|lagao|wala|pe|par|ko|please|sir|sahi)$/i.test(t) ||
    (hasActionIntent && /\b(a|alpha|first|pehla|pahla|1)\b/i.test(t) && !/\b(b|c|d|second|third|fourth|dusra|teesra|chautha|2|3|4|next|prev|flag|submit|read|clear|time)\b/i.test(t))
  ) {
    return { action: 'SELECT_A', label: 'Option A' };
  }

  // ── Option B ──────────────────────────────────────────────────
  if (
    /^(b|bravo|beta|be|bee|we|2|two|second|dusra|doosra|do)$/i.test(t) ||
    /^option\s*(b|bravo|beta|be|bee|2|two|second|dusra|doosra)$/i.test(t) ||
    /\boptions?\s*(number|no\.?|wala)?\s*(b|bravo|beta|be|bee|2|two|second|dusra|doosra)\b/i.test(t) ||
    /\b(b|bravo|beta|be|bee|2|two|second|dusra|doosra)\s*(number|no\.?|wala)?\s*options?\b/i.test(t) ||
    /\b(tap|click|select|choose|tick|check|lagao|dabao|press)\s*(on\s*)?(options?\s*)?(b|bravo|beta|be|bee|2|two|second|dusra|doosra)\b/i.test(t) ||
    /\b(options?\s*)?(b|bravo|beta|be|bee|2|two|second|dusra|doosra)\s*(ko\s*)?(tap|click|select|choose|tick|lagao|dabao|press|pe|par|wala)\b/i.test(t) ||
    /\b(answer|ans)\s*(is|=|:)?\s*(options?\s*)?(b|bravo|beta|be|bee|2|two|second|dusra|doosra)\b/i.test(t) ||
    /\b(b|bravo|beta|2)\s*(hai|hoga|sahi\s*hai|answer\s*hai|is\s*the\s*answer|select|wala|choose|sahi)\b/i.test(t) ||
    /^(b|beta|2)\s*(hai|hoga|karo|lagao|wala|pe|par|ko|please|sir|sahi)$/i.test(t) ||
    (hasActionIntent && /\b(b|beta|bravo|second|dusra|doosra|2)\b/i.test(t) && !/\b(a|c|d|first|third|fourth|pehla|teesra|chautha|1|3|4|next|prev|flag|submit|read|clear|time)\b/i.test(t))
  ) {
    return { action: 'SELECT_B', label: 'Option B' };
  }

  // ── Option C ──────────────────────────────────────────────────
  if (
    /^(c|charlie|see|sea|si|se|sii|3|three|third|teesra|tisra|teen)$/i.test(t) ||
    /^option\s*(c|charlie|see|sea|si|se|sii|3|three|third|teesra|tisra|teen)$/i.test(t) ||
    /^options?\s*c$/i.test(t) ||
    /\boptions?\s*(number|no\.?|wala)?\s*(c|charlie|see|sea|si|se|sii|3|three|third|teesra|tisra|teen)\b/i.test(t) ||
    /\b(c|charlie|see|sea|si|se|sii|3|three|third|teesra|tisra|teen)\s*(number|no\.?|wala)?\s*options?\b/i.test(t) ||
    /\b(tap|click|select|choose|tick|check|lagao|dabao|press)\s*(on\s*)?(options?\s*)?(c|charlie|see|sea|si|se|sii|3|three|third|teesra|tisra|teen)\b/i.test(t) ||
    /\b(options?\s*)?(c|charlie|see|sea|si|se|sii|3|three|third|teesra|tisra|teen)\s*(ko\s*)?(tap|click|select|choose|tick|lagao|dabao|press|pe|par|wala)\b/i.test(t) ||
    /\b(answer|ans)\s*(is|=|:)?\s*(options?\s*)?(c|charlie|see|sea|si|se|sii|3|three|third|teesra|tisra|teen)\b/i.test(t) ||
    /\b(c|charlie|see|sea|si|se|sii|3)\s*(hai|hoga|sahi\s*hai|answer\s*hai|is\s*the\s*answer|select|wala|choose|sahi)\b/i.test(t) ||
    /^(c|charlie|see|3)\s*(hai|hoga|karo|lagao|wala|pe|par|ko|please|sir|sahi)$/i.test(t) ||
    /\b(c|see|sea|si)\s+select\b/i.test(t) ||
    /\bselect\s+(c|see|sea|si)\b/i.test(t) ||
    (hasActionIntent && /\b(c|charlie|see|sea|si|se|third|teesra|tisra|3)\b/i.test(t) && !/\b(a|b|d|first|second|fourth|pehla|dusra|chautha|1|2|4|next|prev|flag|submit|read|clear|time)\b/i.test(t))
  ) {
    return { action: 'SELECT_C', label: 'Option C' };
  }

  // ── Option D ──────────────────────────────────────────────────
  if (
    /^(d|delta|dee|di|de|dii|4|four|fourth|chautha|chaar|char)$/i.test(t) ||
    /^option\s*(d|delta|dee|di|de|4|four|fourth|chautha|chaar|char)$/i.test(t) ||
    /\boptions?\s*(number|no\.?|wala)?\s*(d|delta|dee|di|de|dii|4|four|for|fore|fourth|chautha|chaar|char)\b/i.test(t) ||
    /\b(d|delta|dee|di|de|dii|4|four|fourth|chautha|chaar|char)\s*(number|no\.?|wala)?\s*options?\b/i.test(t) ||
    /\b(tap|click|select|choose|tick|check|lagao|dabao|press)\s*(on\s*)?(options?\s*)?(d|delta|dee|di|de|dii|4|four|for|fore|fourth|chautha|chaar|char)\b/i.test(t) ||
    /\b(options?\s*)?(d|delta|dee|di|de|dii|4|four|for|fore|fourth|chautha|chaar|char)\s*(ko\s*)?(tap|click|select|choose|tick|lagao|dabao|press|pe|par|wala)\b/i.test(t) ||
    /\b(answer|ans)\s*(is|=|:)?\s*(options?\s*)?(d|delta|dee|di|de|dii|4|four|for|fore|fourth|chautha|chaar|char)\b/i.test(t) ||
    /\b(d|delta|dee|di|de|4)\s*(hai|hoga|sahi\s*hai|answer\s*hai|is\s*the\s*answer|select|wala|choose|sahi)\b/i.test(t) ||
    /^(d|delta|dee|4)\s*(hai|hoga|karo|lagao|wala|pe|par|ko|please|sir|sahi)$/i.test(t) ||
    (hasActionIntent && /\b(d|delta|dee|di|de|fourth|chautha|chaar|char|4)\b/i.test(t) && !/\b(a|b|c|first|second|third|pehla|dusra|teesra|1|2|3|next|prev|flag|submit|read|clear|time)\b/i.test(t))
  ) {
    return { action: 'SELECT_D', label: 'Option D' };
  }

  return null;
}
