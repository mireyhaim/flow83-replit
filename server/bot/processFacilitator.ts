import type { Journey, JourneyStep, Participant } from "@shared/schema";

export type ConversationState = 
  | "START" 
  | "MICRO_ONBOARDING"
  | "ORIENTATION" 
  | "CORE_QUESTION" 
  | "CLARIFY" 
  | "INTERPRET" 
  | "TASK" 
  | "TASK_SUPPORT" 
  | "CLOSURE" 
  | "DONE";

export interface DayPlan {
  flow_id: string;
  flow_title: string;
  language: "hebrew" | "english";
  tone_profile: {
    style: string;
    formality: string;
    verbosity: string;
  };
  day: number;
  day_title: string;
  day_goal: string;
  orientation: {
    context: string;
    rule_of_today: string;
  };
  core_question: {
    question: string;
    answer_mode: "choice" | "short_text";
    choices?: string[];
    validation?: {
      type: "choice" | "regex" | "keywords";
      keywords?: string[];
      min_length?: number;
    };
  };
  guided_interpretation: {
    pattern_hint: string;
    bridge_to_task: string;
  };
  task: {
    task_title: string;
    time_minutes: number;
    action_type: "write" | "think" | "do" | "speak";
    instruction: string;
    task_question: string;
    why_it_matters: string;
    completion_signal: string;
    common_blocks?: Array<{
      block: string;
      clarification: string;
      example: string;
    }>;
  };
  closure: {
    acknowledge: string;
    preview: string;
  };
  persona_signature?: string;
  forbidden_phrases?: string[];
}

export interface FacilitatorOutput {
  next_state: ConversationState;
  message: string;
  log: {
    day: number;
    flow_id: string;
    state_reason: string;
    detected_intent: "checkin" | "answer_core" | "confused" | "task_help" | "completed" | "skip" | "emotional" | "other";
  };
}

export interface FacilitatorContext {
  participant: Participant;
  journey: Journey;
  step: JourneyStep;
  dayPlan: DayPlan;
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

const BANNED_PHRASES_HEBREW = [
  // Removed "אני שומע/ת אותך" - these are now ENCOURAGED for natural validation
  "יש כאן אנרגיה",
  "האמת שלך",
  "זה הכל להיום",
  "תודה ששיתפת",
  // Keep only clearly artificial/clinical phrases
];

const CONFUSION_TRIGGERS_HEBREW = [
  "לא הבנתי",
  "מה הכוונה",
  "מה זה אומר",
  "לא ברור",
  "מה את רוצה",
  "מה אני צריכה",
  "אני לא מבינה",
];

const TASK_HELP_TRIGGERS_HEBREW = [
  "איך עושים",
  "מה לכתוב",
  "אני לא מצליחה",
  "אני לא יודעת",
  "לא יודע מה",
  "קשה לי",
  "עזרה",
];

const SKIP_TRIGGERS_HEBREW = [
  "לדלג",
  "אפשר לדלג",
  "לא רוצה",
  "נתקדם",
  "תעבור",
];

// English triggers for multilingual support
const CONFUSION_TRIGGERS_ENGLISH = [
  "i don't understand",
  "what do you mean",
  "what does that mean",
  "not clear",
  "what are you asking",
  "what should i do",
  "i don't get it",
  "confused",
  "unclear",
  "i'm lost",
];

const TASK_HELP_TRIGGERS_ENGLISH = [
  "how do i",
  "what to write",
  "i can't",
  "i don't know",
  "help me",
  "hard for me",
  "help",
  "stuck",
  "what does the task mean",
  "what do you mean by",
  "explain the task",
  "what exactly",
];

// Extra task-specific confusion triggers - detected only in TASK state
const TASK_CONFUSION_TRIGGERS_HEBREW = [
  "לא הבנתי את המשימה",
  "מה המשימה אומרת",
  "מה המשימה",
  "לא מבינה את המשימה",
  "מה לעשות במשימה",
];

const TASK_CONFUSION_TRIGGERS_ENGLISH = [
  "what does the task",
  "what is the task",
  "explain the task",
  "what do you mean",
  "can you clarify",
];

// SKIP trigger patterns - these should be explicit skip commands, not substrings
// The detection function below uses exact match or start-of-message match
const SKIP_TRIGGERS_ENGLISH_EXACT = [
  "skip",
  "skip this",
  "skip it",
  "can we skip",
  "let's skip",
  "next please",
  "go to next",
  "move on please",
  "let's move on",
  "i want to skip",
  "don't want to do this",
];
const SKIP_TRIGGERS_ENGLISH_START = [
  "skip,",
  "skip.",
  "skip!",
];

// Completion triggers - task done signals
const COMPLETION_TRIGGERS_HEBREW = [
  "סיימתי",
  "עשיתי",
  "גמרתי",
  "הנה",
  "כתבתי",
  "עשיתי את זה",
  "סגור",
  "בוצע",
  "מוכן",
  "עשו",
];

const COMPLETION_TRIGGERS_ENGLISH = [
  "done",
  "finished",
  "completed",
  "here it is",
  "i did it",
  "i wrote",
  "i've done",
  "ready",
  "complete",
];

// Checkin triggers - simple acknowledgments that mean "continue"
const CHECKIN_TRIGGERS = [
  "כן",
  "בסדר",
  "אוקיי",
  "yes",
  "ok",
  "okay",
  "בואי",
  "יאללה",
  "let's go",
  "sure",
  "start",
  "התחלה",
];

export function detectUserIntent(
  userMessage: string, 
  currentState: ConversationState
): FacilitatorOutput["log"]["detected_intent"] {
  const msg = userMessage.toLowerCase().trim();
  
  // Check skip triggers first - applies to all states
  // Use exact match or start-of-message for more precision
  const isSkipHebrew = SKIP_TRIGGERS_HEBREW.some(t => msg === t || msg.startsWith(t + " ") || msg.startsWith(t + ","));
  const isSkipEnglishExact = SKIP_TRIGGERS_ENGLISH_EXACT.some(t => msg === t);
  const isSkipEnglishStart = SKIP_TRIGGERS_ENGLISH_START.some(t => msg.startsWith(t));
  if (isSkipHebrew || isSkipEnglishExact || isSkipEnglishStart) {
    return "skip";
  }
  
  // ============ STATE-SPECIFIC INTENT DETECTION ============
  
  // TASK state: prioritize task-specific help and completion
  if (currentState === "TASK" || currentState === "TASK_SUPPORT") {
    // Check task-specific confusion first (routes to task_help)
    if (TASK_CONFUSION_TRIGGERS_HEBREW.some(t => msg.includes(t)) ||
        TASK_CONFUSION_TRIGGERS_ENGLISH.some(t => msg.includes(t))) {
      return "task_help";
    }
    
    // Check general task help triggers
    if (TASK_HELP_TRIGGERS_HEBREW.some(t => msg.includes(t)) ||
        TASK_HELP_TRIGGERS_ENGLISH.some(t => msg.includes(t))) {
      return "task_help";
    }
    
    // Also route general confusion to task_help in TASK state
    // (e.g., "I'm confused", "לא ברור לי", "אני לא מבינה")
    if (CONFUSION_TRIGGERS_HEBREW.some(t => msg.includes(t)) ||
        CONFUSION_TRIGGERS_ENGLISH.some(t => msg.includes(t))) {
      return "task_help";
    }
    
    // Check completion triggers
    if (COMPLETION_TRIGGERS_HEBREW.some(t => msg.includes(t)) ||
        COMPLETION_TRIGGERS_ENGLISH.some(t => msg.includes(t))) {
      return "completed";
    }
    
    // Substantive response (>50 chars) = task completion
    if (msg.length > 50) {
      return "completed";
    }
    
    // Short acknowledgments in TASK state - stay in TASK, don't complete
    return "other";
  }
  
  // CORE_QUESTION state: check for confusion or answer
  if (currentState === "CORE_QUESTION") {
    const wordCount = msg.split(/\s+/).filter(w => w.length > 0).length;
    
    // Question words that indicate the user is asking (not answering)
    const questionWordsHebrew = ["מה", "איך", "למה", "מתי", "איפה", "מי", "האם", "כמה", "איזה"];
    const questionWordsEnglish = ["what", "how", "why", "when", "where", "who", "which", "is it", "are you"];
    
    // === EARLY CONFUSION DETECTION (runs on ALL messages) ===
    
    // Normalize message for pattern matching: strip punctuation for simpler matching
    const msgLower = msg.toLowerCase();
    const msgNormalized = msgLower.replace(/[,.:;!]/g, " ").replace(/\s+/g, " ").trim();
    
    // Questions are always confusion
    if (msg.includes("?")) {
      return "confused";
    }
    
    // Single-word confusion indicators (standalone words only)
    const singleWordConfusion = [
      "unsure", "idk", "dunno", "huh",
      "confused", "confusing", "unclear",
      "lost", "stuck",
      // Hebrew (only standalone confusion words, NOT "לא" which is too broad)
      "מבולבל", "מבולבלת",
    ];
    const words = msgNormalized.split(/\s+/).filter(w => w.length > 0);
    if (words.length === 1 && singleWordConfusion.includes(words[0])) {
      return "confused";
    }
    
    // Two-word confusion patterns (starting with modifier)
    const twoWordConfusionStarts = ["still", "very", "so", "really", "totally"];
    if (words.length === 2 && 
        twoWordConfusionStarts.includes(words[0]) && 
        singleWordConfusion.includes(words[1])) {
      return "confused"; // e.g., "still unsure", "very confused"
    }
    
    // Clarification requests
    const clarificationRequests = [
      "explain", "repeat", "again", "clarify", "rephrase", "can you", "could you",
      "תסביר", "תסבירי", "תחזור", "תחזרי", "אפשר שוב", "עוד פעם", "פעם נוספת"
    ];
    if (clarificationRequests.some(w => msgLower.includes(w))) {
      return "confused";
    }
    
    // TOKEN-PATTERN NEGATED CLARITY DETECTION (runs on ALL messages)
    // Detects any sequence with negated clarity stem + interrogative (with any fillers between)
    {
      const clarityTokens = msg.toLowerCase().split(/[\s,.:;!?'"()[\]{}]+/).filter(t => t.length > 0);
      
      const negatedClarityStems = {
        english: ["unclear", "confused", "confusing"],
        englishNegated: [
          ["not", "clear"],
          ["don't", "understand"], ["dont", "understand"],
          ["don't", "get"], ["dont", "get"],
          ["don't", "follow"], ["dont", "follow"],
          ["can't", "understand"], ["cant", "understand"], ["cannot", "understand"],
          ["can't", "figure"], ["cant", "figure"],
          ["no", "idea"],
          ["not", "sure"],
          ["i'm", "not"], ["im", "not"],
        ],
        hebrew: ["מובן", "ברור", "מבינה", "מבין", "יודע", "יודעת", "בטוח", "בטוחה"],
      };
      
      const interrogatives = new Set([
        "what", "how", "why", "when", "where", "which",
        "מה", "איך", "למה", "מתי", "איפה", "איזה",
      ]);
      
      // Check patterns and short-circuit to confused
      for (let i = 0; i < clarityTokens.length; i++) {
        const token = clarityTokens[i];
        
        // Check single-word English stems
        if (negatedClarityStems.english.includes(token)) {
          for (let j = i + 1; j < Math.min(clarityTokens.length, i + 8); j++) {
            if (interrogatives.has(clarityTokens[j])) {
              return "confused";
            }
          }
        }
        
        // Check Hebrew stems with לא before them
        if (token === "לא" && i + 1 < clarityTokens.length) {
          const nextToken = clarityTokens[i + 1];
          const isHebrewClarityStem = negatedClarityStems.hebrew.some(stem => 
            nextToken.startsWith(stem) || nextToken.includes(stem)
          );
          if (isHebrewClarityStem) {
            for (let j = i + 2; j < Math.min(clarityTokens.length, i + 10); j++) {
              if (interrogatives.has(clarityTokens[j])) {
                return "confused";
              }
            }
          }
        }
        
        // Check two-word English negated patterns
        if (i + 1 < clarityTokens.length) {
          const twoWords = [token, clarityTokens[i + 1]];
          const isNegatedPair = negatedClarityStems.englishNegated.some(pair => 
            pair[0] === twoWords[0] && pair[1] === twoWords[1]
          );
          if (isNegatedPair) {
            for (let j = i + 2; j < Math.min(clarityTokens.length, i + 10); j++) {
              if (interrogatives.has(clarityTokens[j])) {
                return "confused";
              }
            }
          }
        }
      }
      
      // Also check "אין לי מושג" pattern
      if (msg.includes("אין לי מושג") || msg.includes("אין לי שום מושג")) {
        return "confused";
      }
      
      // Short negated clarity statements WITHOUT interrogatives
      // Match confusion phrase + optional trailing filler (yet, still, about this, עדיין, etc.)
      // But NOT substantive content like "pressure" or "work"
      
      // Allowed trailing filler words (non-substantive)
      const trailingFillerPattern = `(?:\\s+(?:yet|still|now|anymore|about\\s+(?:this|it|that)|at\\s+all|right\\s+now|really|honestly|עדיין|כרגע|עכשיו|בכלל|ממש|פשוט))*`;
      
      const pureConfusionPatterns = [
        // English - match message with optional trailing filler (case-insensitive)
        new RegExp(`^(?:i'?m\\s+)?not\\s+sure${trailingFillerPattern}$`, 'i'),
        new RegExp(`^(?:i\\s+)?don'?t\\s+know${trailingFillerPattern}$`, 'i'),
        new RegExp(`^not\\s+clear${trailingFillerPattern}$`, 'i'),
        new RegExp(`^still\\s+(?:un)?clear${trailingFillerPattern}$`, 'i'),
        new RegExp(`^(?:i'?m\\s+)?confused${trailingFillerPattern}$`, 'i'),
        new RegExp(`^(?:i'?m\\s+)?uncertain${trailingFillerPattern}$`, 'i'),
        new RegExp(`^no\\s+idea${trailingFillerPattern}$`, 'i'),
        new RegExp(`^(?:i\\s+)?can'?t\\s+tell${trailingFillerPattern}$`, 'i'),
        // Added: unsure variants
        new RegExp(`^(?:i'?m\\s+)?(?:still\\s+)?unsure${trailingFillerPattern}$`, 'i'),
        new RegExp(`^unsure\\s+(?:about\\s+)?(?:this|that|it)${trailingFillerPattern}$`, 'i'),
        new RegExp(`^still\\s+not\\s+sure${trailingFillerPattern}$`, 'i'),
        // Hebrew - match message with optional trailing filler
        new RegExp(`^(?:אני\\s+)?לא\\s+(?:בטוח|בטוחה)${trailingFillerPattern}$`),
        new RegExp(`^(?:אני\\s+)?לא\\s+(?:ברור|מובן)${trailingFillerPattern}$`),
        new RegExp(`^(?:אני\\s+)?לא\\s+(?:מבינה?|מבין)${trailingFillerPattern}$`),
        new RegExp(`^(?:אני\\s+)?לא\\s+(?:יודעת?|יודע)${trailingFillerPattern}$`),
        new RegExp(`^(?:אני\\s+)?מבולבל(?:ת)?${trailingFillerPattern}$`),
        new RegExp(`^(?:אני\\s+)?עדיין\\s+לא\\s+(?:בטוח|בטוחה|מבין|מבינה)${trailingFillerPattern}$`),
      ];
      
      // Use normalized message (punctuation removed) for matching
      // This handles "not sure, honestly" → "not sure honestly"
      if (pureConfusionPatterns.some(p => p.test(msgNormalized))) {
        return "confused";
      }
    }
    
    // Check confusion triggers for feature-scoring path
    const hasConfusionTrigger = 
      CONFUSION_TRIGGERS_HEBREW.some(t => msg.includes(t)) ||
      CONFUSION_TRIGGERS_ENGLISH.some(t => msg.includes(t));
    
    const hasHelpTrigger = 
      TASK_HELP_TRIGGERS_HEBREW.some(t => msg.includes(t)) ||
      TASK_HELP_TRIGGERS_ENGLISH.some(t => msg.includes(t));
    
    // FEATURE-SCORING INTENT CLASSIFIER
    // Uses weighted features to determine if confusion trigger + content = answer or confusion
    if (hasConfusionTrigger || hasHelpTrigger) {
      // Initialize scores: positive = answer, negative = confusion
      let answerScore = 0;
      let confusionScore = 10; // Start with confusion bias (trigger was found)
      
      // Note: Token-pattern negated clarity detection already handled above (runs on ALL messages)
      
      // === ANSWER SIGNALS (add to answerScore) ===
      
      // 1. Reasoning/causal words (+20 points)
      const reasoningWords = [
        "because", "since", "due to", "caused by",
        "בגלל", "מכיוון", "עקב", "בשל"
      ];
      if (reasoningWords.some(w => msg.includes(w))) {
        answerScore += 20;
      }
      
      // 2. Copula declarative patterns (+15 points)
      // English: "it's the X", "it's my X"
      // Hebrew: "זה הX", "זה X"
      const copulaPatterns = [
        /it'?s\s+(?:the|my|a|an)\s+[a-z]{3,}/i,   // "it's the pressure"
        /זה\s+ה[א-ת]{2,}/,                         // "זה הלחץ"
        /זה\s+[א-ת]{3,}/,                          // "זה לחץ" (without ה)
      ];
      if (copulaPatterns.some(p => p.test(msg))) {
        answerScore += 15;
      }
      
      // 3. Perception/thinking verbs with content (+12 points)
      const perceptionPatterns = [
        /i\s+(?:feel|think|believe|guess)\s+(?:like|that|it'?s)/i,
        /אני\s+(?:מרגיש|מרגישה|חושב|חושבת|מאמין|מאמינה)\s+(?:ש|כי|את)/,
      ];
      if (perceptionPatterns.some(p => p.test(msg))) {
        answerScore += 12;
      }
      
      // 4. Hedging with content (+10 points)
      const hedgeWithContentPatterns = [
        /maybe\s+(?:it'?s|the|my|because)/i,
        /probably\s+(?:the|my|it'?s)/i,
        /אולי\s+(?:זה|בגלל)/,
        /כנראה\s+(?:זה|בגלל)/,
      ];
      if (hedgeWithContentPatterns.some(p => p.test(msg))) {
        answerScore += 10;
      }
      
      // 5. BARE NOUN/ADJECTIVE PHRASES after hedge detection
      // TOKENIZED APPROACH: Split into tokens, filter stop-words, count substantive content
      
      // Comprehensive stop-word set (all exclusions in one place)
      const STOP_WORDS = new Set([
        // === ENGLISH ===
        // Determiners/articles
        "a", "an", "the", "this", "that", "those", "these", "any", "all", "some",
        // Pronouns
        "i", "me", "my", "myself", "you", "your", "he", "she", "it", "its", "we", "they", "them",
        // Interrogatives
        "what", "when", "where", "which", "who", "whom", "whose", "whether", "however", "why", "how",
        // Verbs (common)
        "do", "doing", "don't", "dont", "did", "does", "make", "made", "write", "wrote",
        "should", "need", "want", "have", "has", "had", "having", "get", "got", "getting",
        "know", "knowing", "knew", "think", "thinking", "thought", "feel", "feeling", "felt",
        "be", "is", "are", "was", "were", "been", "being", "am",
        "can", "could", "would", "will", "might", "may", "must",
        "go", "going", "went", "come", "coming", "came", "say", "said", "tell", "told",
        "see", "saw", "look", "looking", "understand", "understood", "mean", "means",
        // Adverbs/modifiers
        "just", "really", "still", "also", "even", "only", "like", "very", "too", "so",
        "maybe", "probably", "possibly", "certainly", "definitely", "actually", "basically",
        "always", "never", "often", "sometimes", "now", "then", "here", "there",
        // Conjunctions/prepositions
        "and", "but", "or", "if", "for", "with", "without", "about", "from", "to", "at", "in", "on",
        // Confusion-related
        "confused", "confusing", "asking", "saying", "unclear",
        // Negations
        "not", "no", "none", "nothing", "nobody",
      ]);
      
      // Hebrew stop-words (as separate set for case-sensitive matching)
      const HEBREW_STOP_WORDS = new Set([
        // Pronouns (subject)
        "אני", "אתה", "את", "הוא", "היא", "אנחנו", "אתם", "אתן", "הם", "הן",
        // Pronouns (indirect/prepositional: לי, לך, etc.)
        "לי", "לך", "לו", "לה", "לנו", "לכם", "לכן", "להם", "להן",
        "אותי", "אותך", "אותו", "אותה", "אותנו", "אותם", "אותן",
        "שלי", "שלך", "שלו", "שלה", "שלנו", "שלכם", "שלהם",
        // Interrogatives
        "מה", "מתי", "איפה", "איך", "למה", "מי", "כמה", "איזה", "איזו", "אילו",
        // Negation
        "לא", "אין", "בלי", "אף",
        // Modal verbs (all conjugations)
        "צריך", "צריכה", "צריכים", "צריכות",
        "רוצה", "רוצים", "רוצות",
        "יכול", "יכולה", "יכולים", "יכולות",
        "חייב", "חייבת", "חייבים", "חייבות",
        "אפשר", "מותר", "אסור",
        // Knowledge/understanding verbs
        "יודע", "יודעת", "יודעים", "יודעות",
        "מבין", "מבינה", "מבינים", "מבינות",
        "חושב", "חושבת", "חושבים", "חושבות",
        "מרגיש", "מרגישה", "מרגישים", "מרגישות",
        // Certainty/uncertainty verbs
        "בטוח", "בטוחה", "בטוחים", "בטוחות",
        // Action infinitives (ל prefix verbs)
        "לעשות", "להתמודד", "לטפל", "לכתוב", "לעזור", "להסביר",
        "לדעת", "להבין", "לחשוב", "לעבור", "להמשיך", "להתחיל",
        "לומר", "לגיד", "לספר", "לקחת", "לתת", "לראות", "לשמוע",
        "להגיד", "לעזור", "לקבל", "להיות", "לעבוד", "לחיות",
        // Clarity words (in confusion context)
        "ברור", "ברורה", "מובן", "מובנת",
        // Adverbs (time, manner, degree)
        "עדיין", "עכשיו", "אחרי", "לפני", "מאוד", "קצת", "הרבה", "תמיד", "אף פעם",
        "כנראה", "אולי", "בטח", "ודאי", "כמעט", "כלל",
        // Common filler words
        "גם", "רק", "עוד", "כבר", "ממש", "פשוט", "כאילו", "בכלל",
        "זה", "זו", "זאת", "אלה", "אלו",
        "של", "עם", "על", "אל", "מן", "בין", "לפני", "אחרי",
        "כי", "אם", "או", "אבל", "אז", "כך",
        "הוא", "היא", "הם", "הן", // as copula
        "יש", "אין", "היה", "היתה", "היו",
        // Confusion-related verb forms
        "אומר", "אומרת", "שואל", "שואלת",
      ]);
      
      // Helper function to detect Hebrew text
      const isHebrew = (word: string) => /[\u0590-\u05FF]/.test(word);
      
      // Tokenize: split on whitespace and punctuation
      const tokens = msg.split(/[\s,.:;!?'"()[\]{}]+/).filter(t => t.length > 0);
      
      // Filter to substantive tokens
      const substantiveWords = tokens.filter(token => {
        const lowerToken = token.toLowerCase();
        const isHeb = isHebrew(token);
        
        // Length filter: Hebrew >= 3 chars, English >= 4 chars
        const minLength = isHeb ? 3 : 4;
        if (token.length < minLength) return false;
        
        // Check against stop-word lists
        if (STOP_WORDS.has(lowerToken)) return false;
        if (HEBREW_STOP_WORDS.has(token)) return false;
        
        // Note: Hebrew infinitives (ל prefix verbs) are handled by HEBREW_STOP_WORDS
        // We don't use a blanket "starts with ל" check because it catches nouns like לחץ, לחם, לב
        
        // Additional Hebrew confusion detection: partial matches
        const hebrewConfusionPatterns = ["מבינ", "אומר", "שואל"];
        if (hebrewConfusionPatterns.some(p => token.includes(p))) return false;
        
        return true;
      });
      
      // Score based on substantive word count
      if (substantiveWords.length >= 2) {
        answerScore += 15; // Two+ substantive words = strong answer signal
      } else if (substantiveWords.length === 1) {
        // Single substantive word can still indicate an answer
        // Give it +11 points (must beat baseline confusionScore of 10)
        // e.g., "I don't know, pressure." or "אני לא יודעת, לחץ."
        answerScore += 11;
      }
      
      // === CONFUSION SIGNALS (add to confusionScore) ===
      
      // 1. Message ends with pure confusion filler (+10)
      const confusionFillerEnd = [
        /any\s*of\s*this\s*$/i,
        /at\s*all\s*$/i,
        /anymore\s*$/i,
        /את\s*זה\s*בכלל\s*$/,
        /בכלל\s*$/,
        /את\s*זה\s*$/,
      ];
      if (confusionFillerEnd.some(p => p.test(msg))) {
        confusionScore += 10;
      }
      
      // 2. Remaining is ONLY confusion-related content (+12)
      if (substantiveWords.length === 0) {
        confusionScore += 12; // No substantive content at all
      }
      
      // === DECISION ===
      // Answer score must clearly outweigh confusion score
      if (answerScore > confusionScore) {
        return "answer_core";
      }
      
      return "confused";
    }
    
    // No confusion trigger - but check for substantive content before returning answer
    // This prevents "still unsure what to say" from being marked as answer
    
    // First: Check if message starts with common confusion patterns
    // BUT only if there's no substantive content following (prevents catching hedged answers)
    const confusionStartPatterns = [
      /^(?:i'?m\s+)?(?:still\s+)?unsure\b/i,
      /^(?:i'?m\s+)?(?:still\s+)?not\s+sure\b/i,
      /^(?:i\s+)?(?:still\s+)?don'?t\s+know\b/i,
      /^(?:i'?m\s+)?(?:still\s+)?confused\b/i,
      /^(?:i'?m\s+)?(?:still\s+)?uncertain\b/i,
      /^(?:i'?m\s+)?(?:still\s+)?unclear\b/i,
      /^(?:i\s+)?(?:still\s+)?can'?t\s+figure\b/i,
      // Hebrew
      /^(?:אני\s+)?(?:עדיין\s+)?לא\s+(?:בטוח|בטוחה)\b/,
      /^(?:אני\s+)?(?:עדיין\s+)?לא\s+(?:יודע|יודעת)\b/,
      /^(?:אני\s+)?(?:עדיין\s+)?לא\s+(?:מבין|מבינה)\b/,
      /^(?:אני\s+)?(?:עדיין\s+)?מבולבל(?:ת)?\b/,
    ];
    
    // Check for substantive content using the same filter as above
    const isHebrew = (word: string) => /[\u0590-\u05FF]/.test(word);
    const QUICK_STOP_WORDS = new Set([
      "unsure", "confused", "unclear", "uncertain", "lost", "stuck",
      "not", "sure", "know", "don't", "dont", "can't", "cant", "still", "really",
      "just", "maybe", "perhaps", "probably", "actually", "honestly",
      "i", "i'm", "im", "me", "my", "you", "it", "this", "that", "what", "how", "why",
      "the", "a", "an", "to", "say", "do", "think", "feel", "figure", "out",
      "about", "next", "steps", "step", "thing", "things", "here", "there", "now", "then",
      "when", "where", "should", "would", "could", "can", "will", "have", "has", "had",
      "been", "being", "was", "were", "are", "is", "am", "get", "got", "going", "go",
      "אני", "לא", "בטוח", "בטוחה", "יודע", "יודעת", "מבין", "מבינה",
      "ברור", "מובן", "עדיין", "ממש", "באמת", "כנראה", "אולי",
      "זה", "זו", "זאת", "מה", "איך", "למה", "עכשיו", "הבא", "הבאה", "צעד", "צעדים",
    ]);
    const quickTokens = msgNormalized.split(/\s+/).filter(t => t.length > 0);
    const quickSubstantive = quickTokens.filter(t => {
      const minLen = isHebrew(t) ? 3 : 4;
      if (t.length < minLen) return false;
      if (QUICK_STOP_WORDS.has(t.toLowerCase())) return false;
      if (QUICK_STOP_WORDS.has(t)) return false;
      return true;
    });
    
    // Only treat as confusion if there's no substantive content
    if (confusionStartPatterns.some(p => p.test(msgNormalized)) && quickSubstantive.length === 0) {
      return "confused";
    }
    
    // Reuse stop-word detection to find substantive content
    const FALLBACK_STOP_WORDS = new Set([
      // Confusion stems
      "unsure", "confused", "unclear", "uncertain", "lost", "stuck",
      // Hedges
      "not", "sure", "know", "don't", "dont", "can't", "cant", "still", "really",
      "just", "maybe", "perhaps", "probably", "actually", "honestly",
      // Pronouns/determiners
      "i", "i'm", "im", "me", "my", "you", "it", "this", "that", "what", "how", "why",
      "the", "a", "an", "to", "say", "do", "think", "feel",
      // Common filler/direction words
      "about", "next", "steps", "step", "thing", "things", "here", "there", "now", "then",
      "when", "where", "should", "would", "could", "can", "will", "have", "has", "had",
      "been", "being", "was", "were", "are", "is", "am", "get", "got", "going", "go",
      // Hebrew confusion/hedge words
      "אני", "לא", "בטוח", "בטוחה", "יודע", "יודעת", "מבין", "מבינה",
      "ברור", "מובן", "עדיין", "ממש", "באמת", "כנראה", "אולי",
      "זה", "זו", "זאת", "מה", "איך", "למה", "עכשיו", "הבא", "הבאה", "צעד", "צעדים",
    ]);
    
    // isHebrew already defined above
    const fallbackTokens = msgNormalized.split(/\s+/).filter(t => t.length > 0);
    const fallbackSubstantive = fallbackTokens.filter(t => {
      const minLen = isHebrew(t) ? 3 : 4;
      if (t.length < minLen) return false;
      if (FALLBACK_STOP_WORDS.has(t.toLowerCase())) return false;
      if (FALLBACK_STOP_WORDS.has(t)) return false;
      return true;
    });
    
    // Only return answer if there's actual substantive content
    if (fallbackSubstantive.length >= 1) {
      return "answer_core";
    }
    
    // No substantive content - treat as confusion
    return "confused";
  }
  
  // ORIENTATION state: detect if user is answering the core question or just acknowledging
  if (currentState === "ORIENTATION") {
    // Check for confusion first
    if (CONFUSION_TRIGGERS_HEBREW.some(t => msg.includes(t)) ||
        CONFUSION_TRIGGERS_ENGLISH.some(t => msg.includes(t))) {
      return "confused";
    }
    
    // Long messages (>30 chars) are emotional/substantive answers
    if (msg.length > 30) {
      return "emotional";
    }
    
    // Short acknowledgments
    return "checkin";
  }
  
  // START state: any response moves forward
  if (currentState === "START") {
    return "checkin";
  }
  
  // MICRO_ONBOARDING state: any response (including skip) moves forward
  // The user's answer becomes userIntentAnchor
  if (currentState === "MICRO_ONBOARDING") {
    return "checkin"; // Any response moves to ORIENTATION
  }
  
  // INTERPRET state: just pass through to TASK
  if (currentState === "INTERPRET") {
    return "other";
  }
  
  // CLOSURE state: any response completes the day
  if (currentState === "CLOSURE") {
    return "completed";
  }
  
  // Check simple checkin/acknowledgment for other states
  if (CHECKIN_TRIGGERS.some(t => msg === t || msg.startsWith(t + " "))) {
    return "checkin";
  }
  
  // Long emotional/reflective messages
  if (msg.length > 100) {
    return "emotional";
  }
  
  return "other";
}

export function determineNextState(
  currentState: ConversationState,
  intent: FacilitatorOutput["log"]["detected_intent"],
  clarifyCount: number,
  taskSupportCount: number
): ConversationState {
  // CLARIFY only allowed from CORE_QUESTION or ORIENTATION states (not from TASK or later)
  if (intent === "confused" && clarifyCount < 2 && 
      (currentState === "CORE_QUESTION" || currentState === "ORIENTATION")) {
    return "CLARIFY";
  }
  
  // TASK_SUPPORT only allowed from TASK state, max 1 time
  if (intent === "task_help" && taskSupportCount < 1 && currentState === "TASK") {
    return "TASK_SUPPORT";
  }
  
  switch (currentState) {
    case "START":
      return "MICRO_ONBOARDING";
    
    case "MICRO_ONBOARDING":
      // After user answers the micro onboarding question, move to ORIENTATION
      return "ORIENTATION";
    
    case "ORIENTATION":
      // ORIENTATION asks the opening question for the day
      // Only move forward if user gives a substantive answer (not just "ok" or "אוקיי")
      if (intent === "answer_core" || intent === "emotional") {
        return "INTERPRET";
      }
      // Simple acknowledgments like "ok", "אוקיי" - stay in ORIENTATION and ask again
      if (intent === "checkin" || intent === "other") {
        return "ORIENTATION"; // Stay and ask a meaningful question
      }
      return "ORIENTATION";
    
    case "CORE_QUESTION":
      // Legacy state - kept for backward compatibility
      if (intent === "answer_core" || intent === "emotional") {
        return "INTERPRET";
      }
      return "CORE_QUESTION";
    
    case "CLARIFY":
      return "CORE_QUESTION";
    
    case "INTERPRET":
      // After interpreting what the user shared, move to TASK
      // But if user just gives minimal acknowledgment, stay and go deeper
      if (intent === "checkin" || intent === "other") {
        return "INTERPRET"; // Stay and reflect more
      }
      return "TASK";
    
    case "TASK":
      if (intent === "completed") {
        return "CLOSURE";
      }
      return "TASK";
    
    case "TASK_SUPPORT":
      if (intent === "task_help") {
        return "TASK_SUPPORT";
      }
      if (intent === "completed") {
        return "CLOSURE";
      }
      return "TASK";
    
    case "CLOSURE":
      return "DONE";
    
    case "DONE":
      return "DONE";
    
    default:
      return "ORIENTATION";
  }
}

export function validateMessage(message: string, state: ConversationState): string {
  let validated = message;
  
  for (const phrase of BANNED_PHRASES_HEBREW) {
    const regex = new RegExp(phrase, 'gi');
    validated = validated.replace(regex, '');
  }
  
  validated = validated.replace(/\s+/g, ' ').trim();
  
  if (state !== "CLARIFY" && state !== "TASK_SUPPORT") {
    const questionMarks = (validated.match(/\?/g) || []).length;
    if (questionMarks > 1) {
      const parts = validated.split('?');
      validated = parts[0] + '?' + parts.slice(1).join('').replace(/\?/g, '.');
    }
  }
  
  return validated;
}

export function buildSystemPrompt(dayPlan: DayPlan, journey: Journey): string {
  const language = dayPlan.language === "hebrew" ? "Hebrew" : "English";
  const isHebrew = dayPlan.language === "hebrew";
  
  return `You ARE the mentor guiding this process. You are NOT a digital assistant, NOT an AI.
You speak as a real mentor would: warm, present, grounded.

=== YOUR CORE BEHAVIOR RULES ===

1) VALIDATION FIRST (תיקוף רגשי)
Before moving to ANY next step, ALWAYS acknowledge what the user shared.
If they express difficulty, frustration, or being stuck - STOP and give it space.
${isHebrew ? 
  'BAD: "יום 1. המטרה לזהות דפוסים. מה הדבר הראשון שעולה לך?"' :
  'BAD: "Day 1. The goal is to identify patterns. What comes to mind first?"'}
${isHebrew ?
  'GOOD: "אני שומעת את התסכול. התחושה הזו ש\'לא משנה מה אני עושה\' היא כבדה. בדיוק בשביל זה אנחנו כאן..."' :
  'GOOD: "I hear the frustration. That feeling of \'nothing works\' is heavy. That\'s exactly why we\'re here..."'}

2) EMOTIONAL VALIDATION (תיקוף רגשי)
Validate the user's feelings naturally - don't repeat their words literally like a robot.
Use varied validation phrases:
- Hebrew: "אני שומעת אותך", "זה לא פשוט", "מובן לי", "זה כבד", "אני מבינה", "זה הגיוני שתרגישי ככה"
- English: "I hear you", "That's not easy", "I understand", "That sounds heavy", "It makes sense you'd feel that way"
DO NOT copy-paste their exact words in quotes - it feels robotic. Instead, paraphrase naturally.
BAD: "את מרגישה ש'אלוהים לא איתך', ש'אין לך מזל'" (robotic repetition)
GOOD: "ההרגשה הזו של בדידות, כשמרגישים שהעולם לא עובד איתנו - זה כבד מאוד." (natural paraphrase)

3) WEAVE CONTENT NATURALLY
Never announce goals like a presentation. Weave them into the conversation.
${isHebrew ?
  'BAD: "יום 1. היום מתמקדים בזיהוי דפוס. הכלל להיום: מזהים לא פותרים."' :
  'BAD: "Day 1. Today we focus on pattern identification. Rule: identify, don\'t solve."'}
${isHebrew ?
  'GOOD: "ביום הראשון שלנו אנחנו לא מנסים לתקן את החסימות האלו, אלא רק להתבונן בהן ברוגע."' :
  'GOOD: "On our first day together, we\'re not trying to fix these blocks, just observe them calmly."'}

4) NO REPETITION
The system tracks what already happened. If the user already answered something, acknowledge and move forward - don't re-explain.

5) MAX 200 WORDS per message. ONE question, then WAIT.

=== BANNED PHRASES ===
- "אני X הדיגיטלי" / "I am the digital X"
- "פיתחו אותי" / "I was developed"  
- "תודה ששיתפת" / "Thank you for sharing"
- "אני כאן בשבילך" / Generic "I'm here for you"
- Dry announcements of goals/rules

=== CONTEXT ===
FLOW: ${journey.name}
LANGUAGE: ${language}
TONE: ${dayPlan.tone_profile.style}
${dayPlan.persona_signature ? `PERSONA: ${dayPlan.persona_signature}` : ''}

DAY ${dayPlan.day}: ${dayPlan.day_title}
TODAY'S FOCUS: ${dayPlan.day_goal}
TODAY'S PRINCIPLE: ${dayPlan.orientation.rule_of_today}`;
}

export function buildStatePrompt(
  state: ConversationState,
  dayPlan: DayPlan,
  userMessage: string,
  intent: FacilitatorOutput["log"]["detected_intent"],
  participant?: { 
    firstName?: string;
    userOnboardingConfig?: { addressing_style: string; tone_preference: string; depth_preference: string; pace_preference: string } | null 
  }
): string {
  const participantName = participant?.firstName || '';
  // Style modifiers based on userOnboardingConfig
  const config = participant?.userOnboardingConfig;
  const addressingNote = config?.addressing_style === 'female' 
    ? `CRITICAL - FEMININE HEBREW FORMS REQUIRED:
- ALWAYS use את (never אתה)
- Use feminine verb forms: גילית, עשית, הרגשת, ראית, אמרת
- Use feminine possessives: שלך
- Examples: "את מוזמנת", "איך את מרגישה", "מה גרם לך"
- NEVER use masculine forms like אתה, גילית (masc), עשית (masc)` 
    : config?.addressing_style === 'male' 
      ? `CRITICAL - MASCULINE HEBREW FORMS REQUIRED:
- ALWAYS use אתה (never את)
- Use masculine verb forms: גילית, עשית, הרגשת, ראית, אמרת
- Use masculine possessives: שלך
- Examples: "אתה מוזמן", "איך אתה מרגיש", "מה גרם לך"` 
      : 'Use neutral forms where possible';
  const toneNote = config?.tone_preference === 'direct' 
    ? 'Be very brief and direct. Short sentences.'
    : config?.tone_preference === 'soft' 
      ? 'Be warm and supportive. Add gentle transitions.'
      : 'Use balanced tone.';
  const depthNote = config?.depth_preference === 'practical' 
    ? 'Skip extra framing. Get straight to action.'
    : 'Add 1-2 framing sentences for context.';
  
  switch (state) {
    case "START":
      return `Generate a short welcome message.
Say: "שלום! טוב שהתחלת."
Keep it to ONE sentence. Do not ask questions yet.
${addressingNote}
${toneNote}`;

    case "MICRO_ONBOARDING":
      const nameGreeting = participantName ? `היי ${participantName}` : 'היי';
      return `Generate the MICRO_ONBOARDING welcome message.

STRUCTURE (write EXACTLY in this order):
1. Warm welcome line: "${nameGreeting}, טוב שהגעת."
2. Brief intro (1-2 sentences): "אני כאן כדי ללוות אותך בתהליך הזה, צעד־צעד, בצורה ברורה ומעשית. כל יום נתמקד בדבר אחד בלבד — כדי ליצור תנועה אמיתית."
3. Transition line: "לפני שמתחילים, שאלה קצרה שתעזור לי להוביל אותך בצורה מדויקת."
4. The intent question: "מה הדבר שגרם לך לבחור להתחיל את התהליך הזה עכשיו?"

CRITICAL RULES:
- NO day number (אין "יום 1")
- NO theories or concepts (אין "דפוסים", אין "מודעות")
- NO content dump
- Keep it warm and human
- End with the intent question and WAIT for response

${addressingNote}
${toneNote}`;

    case "ORIENTATION":
      const coreChoicesText = dayPlan.core_question.choices 
        ? ` (${dayPlan.core_question.choices.join(' / ')})`
        : '';
      const isHebrewLang = dayPlan.language === "hebrew";
      
      // Check if user gave a minimal response (staying in ORIENTATION)
      const isMinimalResponse = intent === "checkin" || intent === "other";
      
      if (isMinimalResponse) {
        // User said something like "ok" or "אוקיי" - respond warmly and invite engagement
        return `The user responded with: "${userMessage}"

Respond like a real mentor would - warm, present, understanding. Don't just ask a question.

${isHebrewLang ? `
YOUR APPROACH:
1. Acknowledge them warmly (show you see them)
2. Share something brief and grounding about this day's focus
3. Then gently invite them to share

Core question for this day: ${dayPlan.core_question.question}${coreChoicesText}
Day focus: ${dayPlan.day_goal}

GOOD EXAMPLE:
"נעים שהגעת. אני יודעת שלפעמים קשה לדעת מאיפה להתחיל - וזה בסדר גמור. 
ביום הזה אנחנו פשוט מתבוננים, בלי לנסות לתקן שום דבר.
אז בוא נתחיל ברוגע: ${dayPlan.core_question.question}${coreChoicesText}"

BAD EXAMPLE (too short, robotic):
"יופי. ${dayPlan.core_question.question}"
` : `
YOUR APPROACH:
1. Acknowledge them warmly
2. Share something brief about today's focus
3. Gently invite them to share

Core question: ${dayPlan.core_question.question}${coreChoicesText}

GOOD EXAMPLE:
"Glad you're here. I know sometimes it's hard to know where to start - and that's completely okay.
Today we're simply observing, without trying to fix anything.
So let's begin gently: ${dayPlan.core_question.question}${coreChoicesText}"
`}

RULES:
- Be warm and present, like a real mentor
- MAX 200 words
- Share something meaningful before asking
- End with an invitation, not a demand

${addressingNote}
${toneNote}`;
      }
      
      // First time in ORIENTATION - full introduction
      return `Generate ORIENTATION message - introduce Day ${dayPlan.day} in a CONVERSATIONAL way.

The user just shared why they're here. Now you're transitioning to Day ${dayPlan.day}.

CONTENT TO WEAVE IN (don't announce formally):
- Day focus: ${dayPlan.day_goal}
- Today's principle: ${dayPlan.orientation.rule_of_today}
- Core question: ${dayPlan.core_question.question}${coreChoicesText}

${isHebrewLang ? `
BAD EXAMPLE (dry, formal):
"יום 1. היום מתמקדים בזיהוי דפוס. הכלל להיום: מזהים לא פותרים. איפה הדפוס הכי מורגש?"

GOOD EXAMPLE (conversational, weaving content naturally):
"ביום הראשון שלנו אנחנו לא מנסים לתקן שום דבר - רק להתבונן ברוגע.
אז בוא נתחיל: ${dayPlan.core_question.question}${coreChoicesText}"
` : `
BAD EXAMPLE (dry, formal):
"Day 1. Today we focus on pattern identification. Rule: identify, don't solve. Where do you notice this?"

GOOD EXAMPLE (conversational, weaving content naturally):
"On our first day together, we're not trying to fix anything - just observe calmly.
So let's start: ${dayPlan.core_question.question}${coreChoicesText}"
`}

RULES:
- Weave day info into natural speech, don't list it
- End with the core question
- MAX 200 words
- Wait for response

${addressingNote}
${toneNote}`;

    case "CORE_QUESTION":
      const choicesText = dayPlan.core_question.choices 
        ? `אפשר לבחור: ${dayPlan.core_question.choices.join(' / ')}.`
        : '';
      return `Generate a CORE_QUESTION message.
Ask the core question naturally: "${dayPlan.core_question.question}"
${choicesText}

Be direct. One question only.`;

    case "CLARIFY":
      return `The user is confused. Generate a CLARIFY message.
User said: "${userMessage}"

Structure:
1) Rephrase the core question in simpler words
2) Provide 1 short example
3) Ask a narrowed clarifying question

Example format:
"כוונתי היא ל___ (במילים פשוטות: ___).
דוגמה קצרה: ___.
אז כדי לדייק: האם זה יותר ___ או ___?"

Do NOT repeat the original question word-for-word.`;

    case "INTERPRET":
      const isHebrewInterp = dayPlan.language === "hebrew";
      
      // Check if user gave a minimal response (staying in INTERPRET)
      const isMinimalInterpret = intent === "checkin" || intent === "other";
      
      if (isMinimalInterpret) {
        // User gave minimal response - respond like a mentor, then invite more
        return `The user responded with: "${userMessage}"

Respond like a real mentor - acknowledge what they said, share something meaningful, then invite them to go deeper.

${isHebrewInterp ? `
YOUR APPROACH:
1. Accept where they are (no pressure)
2. Share something grounding or normalizing 
3. Offer a gentle opening to share more

Day focus: ${dayPlan.day_goal}

GOOD EXAMPLE:
"אני שומעת. לפעמים המילים לא באות בקלות - וזה בסדר. 
הרבה אנשים מגיעים לכאן בתחושה שהם לא בטוחים מאיפה להתחיל.
אם היית צריכה לבחור דבר אחד קטן שמפריע לך - מה זה היה?"

BAD EXAMPLE (too pushy):
"ספרי לי עוד. מה את מרגישה?"
` : `
YOUR APPROACH:
1. Accept where they are
2. Share something normalizing
3. Offer gentle opening

GOOD EXAMPLE:
"I hear you. Sometimes the words don't come easily - and that's okay.
Many people come here feeling unsure where to begin.
If you had to pick one small thing that's been bothering you - what would it be?"
`}

RULES:
- Be warm and patient, like a real mentor
- MAX 200 words
- Normalize their experience
- End with a soft invitation

${addressingNote}
${toneNote}`;
      }
      
      // User gave substantive answer - validate and bridge to task
      return `Generate an INTERPRET message with EMOTIONAL VALIDATION.

User just answered the core question: "${userMessage}"

YOUR JOB:
1. VALIDATE EMOTIONALLY - Show you understand their feelings without copying their words literally
2. Give space to what they shared (especially if it's heavy/difficult)
3. Bridge naturally to the task

${isHebrewInterp ? `
BAD EXAMPLE (robotic word-for-word repetition):
"את מרגישה ש'אתה מוותרת על עצמך', ש'בזוגיות זה קשה'." - sounds like a robot!

GOOD EXAMPLE (natural emotional validation):
User said: "בזוגיות. אני מרגישה שאני תמיד מוותרת על עצמי."
Response: "אני שומעת אותך. להרגיש שאת מפסידה את עצמך בתוך מערכת יחסים - זה כבד מאוד. הרבה נשים מכירות את התחושה הזו.
בואי ניקח את זה צעד קטן קדימה."

GOOD EXAMPLE 2:
User said: "בעבודה. אני לא מצליח לעמוד על שלי."
Response: "זה לא פשוט. כשמרגישים שקשה לעמוד על המקום שלנו - זה מקום לא נוח בכלל.
יש לי משהו קטן שאני רוצה שתנסה."

VALIDATION VARIETY (use different phrases each time):
"אני שומעת אותך", "זה לא פשוט", "מובן לי", "זה כבד", "אני מבינה את זה", "זה הגיוני שתרגישי ככה"
` : `
BAD EXAMPLE (robotic word-for-word repetition):
"You feel like 'you give up on yourself', that 'it's hard'." - sounds like a robot!

GOOD EXAMPLE (natural emotional validation):
User said: "In relationships. I always give up on myself."
Response: "I hear you. That feeling of losing yourself inside a relationship - that's really heavy. Many people know that feeling.
Let me take you to a small first step."

VALIDATION VARIETY (use different phrases each time):
"I hear you", "That's not easy", "I understand", "That sounds heavy", "It makes sense you'd feel that way"
`}

RULES:
- Validate emotions naturally (DON'T copy-paste their words in quotes)
- Acknowledge the weight/difficulty if present
- MAX 200 words
- NO day info, NO repeating explanations
- Bridge to task naturally

${addressingNote}
${toneNote}`;

    case "TASK":
      return `Generate a TASK message (MAX 200 WORDS).

Structure:
"${dayPlan.language === 'hebrew' ? 'משימה:' : 'Task:'}
${dayPlan.task.instruction}

${dayPlan.language === 'hebrew' ? 'זמן:' : 'Time:'} ${dayPlan.task.time_minutes} ${dayPlan.language === 'hebrew' ? 'דקות' : 'minutes'}.

${dayPlan.language === 'hebrew' ? 'למה זה חשוב:' : 'Why it matters:'}
${dayPlan.task.why_it_matters}"

CRITICAL RULES:
- Clear, actionable task
- Time estimate
- Why it matters (1 sentence)
- Then WAIT for user to complete

${addressingNote}
${toneNote}`;

    case "TASK_SUPPORT":
      const block = dayPlan.task.common_blocks?.[0];
      return `The user needs help with the task. Generate a TASK_SUPPORT message.
User said: "${userMessage}"

${block ? `Common block: ${block.block}
Clarification: ${block.clarification}
Example: ${block.example}` : ''}

Structure:
"נעשה את זה פשוט:
אפשר לענות בתבנית הזו: '___'.
דוגמה: ___.
רוצה לנסות עכשיו כאן בצ'אט?"

Offer simpler steps OR example answer OR format template.`;

    case "CLOSURE":
      const isHebrewClosure = dayPlan.language === "hebrew";
      return `Generate a warm, personal CLOSURE message for Day ${dayPlan.day}.

The user just completed the task. Their response: "${userMessage}"

YOUR JOB - CREATE A MEANINGFUL DAY REFLECTION:

${isHebrewClosure ? `
**מבנה הסיכום:**

1. **פתיחה עם התלהבות אמיתית** (משפט אחד)
   "מעולה!" או "יפה!" - הכרה בעבודה שנעשתה

2. **שיקוף המסע של היום** (3-4 משפטים)
   סכמי מה עברתם יחד:
   - איפה התחלתם (מה היה הקושי/השאלה הראשונית)
   - מה התגלה בדרך (התובנות שעלו)
   - איפה הגעתם (ההבנה החדשה)
   
   דוגמה:
   "התחלנו עם התחושה הזו של 'משהו לא עובד לי'. דרך הדוגמאות שנתת - על העבודה, על הזוגיות - התחיל להתבהר דפוס: כל פעם שמשהו חשוב מגיע, עולה קול שאומר 'את לא מספיק טובה'. היום שמת על זה אור."

3. **הכרה במאמץ** (משפט אחד)
   לשים מילים על דברים כאלה - זו אומץ.

4. **שאלה פתוחה לסיום**
   "יש לך מה להוסיף?"

**דוגמה מלאה:**
"יפה!

התחלנו היום עם התחושה הזו שמשהו עוצר אותך. דרך מה ששיתפת על הבוס ועל הילדות, התחיל להתבהר דפוס - כל פעם שיש סיכוי להצליח, עולה קול פנימי שאומר 'את לא ראויה'. היום זיהינו אותו יחד ונתנו לו שם.

להסתכל על זה בגובה העיניים - זה לא פשוט. ועשית את זה.

יש לך מה להוסיף?"
` : `
**SUMMARY STRUCTURE:**

1. **Opening with genuine excitement** (one sentence)
   "Great!" or "Beautiful!" - recognition of the work done

2. **Reflecting on today's journey** (3-4 sentences)
   Summarize what you went through together:
   - Where you started (the initial struggle/question)
   - What emerged along the way (the insights that came up)
   - Where you arrived (the new understanding)
   
   Example:
   "We started with that feeling of 'something's not working for me'. Through the examples you shared - about work, about relationships - a pattern started to emerge: every time something important comes up, a voice says 'you're not good enough'. Today you shone a light on it."

3. **Acknowledging the effort** (one sentence)
   Putting words on things like this takes courage.

4. **Open question to close**
   "Is there anything you'd like to add?"

**FULL EXAMPLE:**
"Great!

We started today with that feeling that something's holding you back. Through what you shared about your boss and about childhood, a pattern started to emerge - every time there's a chance to succeed, an inner voice says 'you're not worthy'. Today we identified it together and gave it a name.

Looking at this head-on - that's not easy. And you did it.

Is there anything you'd like to add?"
`}

CONTENT TO WEAVE:
- Day goal: ${dayPlan.day_goal}
- Day title: ${dayPlan.day_title}

RULES:
- Paraphrase naturally (DON'T copy-paste their words in quotes)
- Reflect the JOURNEY - start, middle, end
- Be specific to what THEY shared (not generic)
- Acknowledge the emotional effort they made
- MAX 250 words
- End with invitation to add more
- NO fake praise, NO "great job" at the end

${addressingNote}
${toneNote}`;

    case "DONE":
      const isHebrewDone = dayPlan.language === "hebrew";
      return `The user responded to "Is there anything you'd like to add?" Their response: "${userMessage}"

YOUR JOB:
1. If they shared something new - briefly acknowledge it warmly (1-2 sentences)
2. Give a soft preview of tomorrow
3. Close with warmth

${isHebrewDone ? `
EXAMPLES:
If user shared more: "תודה ששיתפת גם את זה. זה מעמיק את מה שגילינו היום. מחר נמשיך - נבחן מאיפה הקול הזה מגיע ומתי הוא הכי חזק. נתראה 💜"
If user said "לא" or nothing to add: "מושלם. מחר נמשיך - נבחן מאיפה הקול הזה מגיע ומתי הוא הכי חזק. נתראה 💜"
` : `
EXAMPLES:
If user shared more: "Thank you for sharing that too. It deepens what we discovered today. Tomorrow we'll continue - we'll look at where that voice comes from. See you 💜"
If user said "no" or nothing to add: "Perfect. Tomorrow we'll continue - we'll look at where that voice comes from. See you 💜"
`}

CONTENT:
- Tomorrow's preview: ${dayPlan.closure.preview}

RULES:
- MAX 100 words
- Warm, brief, forward-looking
- End with 💜 or similar warmth

${addressingNote}
${toneNote}`;

    default:
      return `Continue the conversation naturally based on the current context.`;
  }
}

export function createDayPlanFromStep(
  step: JourneyStep,
  journey: Journey
): DayPlan | null {
  if (step.dayPlan) {
    return step.dayPlan as DayPlan;
  }
  
  const language = (journey.language as "hebrew" | "english") || "hebrew";
  
  return {
    flow_id: journey.id,
    flow_title: journey.name,
    language,
    tone_profile: {
      style: journey.tone || "warm",
      formality: "neutral",
      verbosity: "concise"
    },
    day: step.dayNumber,
    day_title: step.title,
    day_goal: step.goal || step.title,
    orientation: {
      context: step.explanation || step.description || "",
      rule_of_today: language === "hebrew" 
        ? "היום מתמקדים, לא פותרים הכל"
        : "Today we focus, not solve everything"
    },
    core_question: {
      question: language === "hebrew"
        ? "מה הדבר הראשון שעולה לך כשאת חושבת על הנושא הזה?"
        : "What's the first thing that comes to mind about this topic?",
      answer_mode: "short_text"
    },
    guided_interpretation: {
      pattern_hint: language === "hebrew"
        ? "חפש את הקשר בין התשובה למטרת היום"
        : "Look for connection between answer and day goal",
      bridge_to_task: language === "hebrew"
        ? "זה מחובר למשימה של היום"
        : "This connects to today's task"
    },
    task: {
      task_title: language === "hebrew" ? "משימת היום" : "Today's Task",
      time_minutes: 5,
      action_type: "write",
      instruction: step.task || (language === "hebrew" 
        ? "קחי כמה דקות לחשוב ולכתוב"
        : "Take a few minutes to think and write"),
      task_question: language === "hebrew"
        ? "מה גילית?"
        : "What did you discover?",
      why_it_matters: language === "hebrew"
        ? "כי זה צעד קטן בכיוון הנכון"
        : "Because it's a small step in the right direction",
      completion_signal: language === "hebrew"
        ? "שלחי את התשובה שלך כאן"
        : "Send your answer here"
    },
    closure: {
      acknowledge: step.closingMessage || (language === "hebrew"
        ? "יפה, סיימנו את היום."
        : "Great, we finished today."),
      preview: language === "hebrew"
        ? "מחר נמשיך הלאה."
        : "Tomorrow we continue."
    }
  };
}

// ============================================================
// JOURNEY STATE BUILDER - Structured context for LLM
// ============================================================

export interface JourneyState {
  processName: string;
  currentDay: number;
  totalDays: number;
  currentDayGoal: string;
  currentStage: ConversationState;
  keyInsights: string[];
  currentBelief: string | null;
  taskStatus: "not_started" | "in_progress" | "completed";
  previousDays: {
    day: number;
    summary: string;
    keyInsight: string;
    taskCompleted: boolean;
  }[];
  userIntent: string | null;
  nextResponseGoal: string;
}

export function buildJourneyState(
  participant: Participant,
  journey: Journey,
  dayPlan: DayPlan,
  nextState: ConversationState
): JourneyState {
  const daySummaries = (participant.daySummaries as JourneyState["previousDays"]) || [];
  const journeyInsights = (participant.journeyInsights as string[]) || [];
  
  let taskStatus: JourneyState["taskStatus"] = "not_started";
  if (nextState === "TASK" || nextState === "TASK_SUPPORT") {
    taskStatus = "in_progress";
  } else if (nextState === "CLOSURE" || nextState === "DONE") {
    taskStatus = "completed";
  }
  
  const nextResponseGoal = getNextResponseGoal(nextState, dayPlan);
  
  return {
    processName: journey.name,
    currentDay: participant.currentDay || 1,
    totalDays: journey.duration || 7,
    currentDayGoal: dayPlan.day_goal,
    currentStage: nextState,
    keyInsights: journeyInsights.slice(-5),
    currentBelief: participant.currentBelief || null,
    taskStatus,
    previousDays: daySummaries.slice(-3),
    userIntent: participant.userIntentAnchor || null,
    nextResponseGoal
  };
}

function getNextResponseGoal(state: ConversationState, dayPlan: DayPlan): string {
  const isHebrew = dayPlan.language === "hebrew";
  
  switch (state) {
    case "START":
      return isHebrew 
        ? "פתח את היום בשאלה קצרה על מה הביא את המשתתף לתהליך"
        : "Open the day with a short question about what brought the participant to this process";
    case "MICRO_ONBOARDING":
      return isHebrew
        ? "שאל שאלה קצרה על הכוונה והמוטיבציה של המשתתף"
        : "Ask a short question about the participant's intention and motivation";
    case "ORIENTATION":
      return isHebrew
        ? "הצג את נושא היום ושאל שאלה פתוחה אחת"
        : "Present today's topic and ask one open question";
    case "CORE_QUESTION":
      return isHebrew
        ? "שאל את שאלת הליבה של היום"
        : "Ask the core question of the day";
    case "CLARIFY":
      return isHebrew
        ? "הסבר את השאלה בצורה אחרת, פשוטה יותר"
        : "Explain the question differently, more simply";
    case "INTERPRET":
      return isHebrew
        ? "שקף בקצרה מה שהמשתתף שיתף וקשר למשימה"
        : "Briefly reflect what participant shared and connect to task";
    case "TASK":
      return isHebrew
        ? "תן את המשימה בצורה ברורה וקצרה"
        : "Give the task clearly and briefly";
    case "TASK_SUPPORT":
      return isHebrew
        ? "פשט את המשימה או תן דוגמה"
        : "Simplify the task or give an example";
    case "CLOSURE":
      return isHebrew
        ? "סכם את היום בקצרה ושאל אם יש עוד משהו"
        : "Briefly summarize the day and ask if there's anything else";
    case "DONE":
      return isHebrew
        ? "סגור את היום בחום ותן ציפייה למחר"
        : "Close the day warmly and give expectation for tomorrow";
    default:
      return isHebrew
        ? "המשך את השיחה בצורה טבעית"
        : "Continue the conversation naturally";
  }
}

export function formatJourneyStateForLLM(state: JourneyState, isHebrew: boolean): string {
  const header = isHebrew 
    ? "=== מצב התהליך (זיכרון מערכת) ===" 
    : "=== JOURNEY STATE (System Memory) ===";
  
  const lines = [
    header,
    "",
    isHebrew ? `תהליך: ${state.processName}` : `Process: ${state.processName}`,
    isHebrew ? `יום: ${state.currentDay}/${state.totalDays}` : `Day: ${state.currentDay}/${state.totalDays}`,
    isHebrew ? `מטרת היום: ${state.currentDayGoal}` : `Day Goal: ${state.currentDayGoal}`,
    isHebrew ? `שלב נוכחי: ${state.currentStage}` : `Current Stage: ${state.currentStage}`,
    isHebrew ? `סטטוס משימה: ${state.taskStatus}` : `Task Status: ${state.taskStatus}`,
    ""
  ];
  
  if (state.userIntent) {
    lines.push(isHebrew 
      ? `כוונת המשתתף (למה התחיל): ${state.userIntent}` 
      : `Participant Intent (why started): ${state.userIntent}`);
    lines.push("");
  }
  
  if (state.keyInsights.length > 0) {
    lines.push(isHebrew ? "תובנות מצטברות:" : "Accumulated Insights:");
    state.keyInsights.forEach((insight, i) => {
      lines.push(`  ${i + 1}. ${insight}`);
    });
    lines.push("");
  }
  
  if (state.currentBelief) {
    lines.push(isHebrew 
      ? `אמונה/דפוס שזוהה: ${state.currentBelief}` 
      : `Detected Belief/Pattern: ${state.currentBelief}`);
    lines.push("");
  }
  
  if (state.previousDays.length > 0) {
    lines.push(isHebrew ? "סיכום ימים קודמים:" : "Previous Days Summary:");
    state.previousDays.forEach(day => {
      const status = day.taskCompleted 
        ? (isHebrew ? "✓ הושלם" : "✓ completed") 
        : (isHebrew ? "○ לא הושלם" : "○ not completed");
      lines.push(isHebrew 
        ? `  יום ${day.day}: ${day.summary} [${status}]` 
        : `  Day ${day.day}: ${day.summary} [${status}]`);
      if (day.keyInsight) {
        lines.push(`    → ${day.keyInsight}`);
      }
    });
    lines.push("");
  }
  
  lines.push(isHebrew ? "=== מטרת התגובה הבאה ===" : "=== NEXT RESPONSE GOAL ===");
  lines.push(state.nextResponseGoal);
  lines.push("");
  
  return lines.join("\n");
}
