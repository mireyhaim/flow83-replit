/**
 * PromptBuilder - Constructs AI prompts from Director decisions
 * 
 * The Director decides WHAT to do.
 * The PromptBuilder tells the AI HOW to phrase it.
 * The AI only handles natural language generation.
 */

import { DirectorDecision, DirectorAction, ConversationPhase } from './conversationDirector';

// Phrase blacklist - artificial therapeutic language to avoid
const BLACKLISTED_PHRASES_HE = [
  'זה נפלא',
  'נהדר',
  'מעולה',
  'איזה יופי',
  'עשית עבודה נהדרת',
  'כל הכבוד',
  'וואו',
  'אני גאה בך',
  'מדהים',
  'פנטסטי',
  'מושלם',
  'בדיוק מה שצריך',
  'אין עליך',
  'תודה שאת משתפת',
  'תודה על השיתוף',
];

const BLACKLISTED_PHRASES_EN = [
  "that's wonderful",
  "that's amazing",
  "excellent",
  "great job",
  "how nice",
  "wonderful",
  "fantastic",
  "perfect",
  "i'm proud of you",
  "exactly what you needed",
  "thank you for sharing",
  "thanks for sharing",
  "well done",
  "awesome",
];

// Action-specific prompt templates
const ACTION_PROMPTS: Record<DirectorAction, { he: string; en: string }> = {
  reflect: {
    he: `המשימה שלך: להחזיר בקצרה את מה שהמשתתף שיתף, בלי לשפוט ובלי להוסיף.
אמור 1-2 משפטים שמראים שאתה שומע. זה הכל.
לא לשאול שאלה. לא להציע. רק לשקף.`,
    en: `Your task: Briefly mirror back what the participant shared, without judging or adding.
Say 1-2 sentences that show you heard them. That's it.
Don't ask a question. Don't suggest. Just reflect.`
  },
  
  ask_question: {
    he: `המשימה שלך: לשאול שאלה אחת קצרה.
שאלה שמזמינה להעמיק, לא שאלה סגורה.
משפט אחד בלבד. לא יותר.`,
    en: `Your task: Ask one short question.
A question that invites deeper exploration, not a yes/no question.
One sentence only. No more.`
  },
  
  validate: {
    he: `המשימה שלך: אישור קצר וקרקעי.
לא שבחים. לא "נהדר". רק "אני שומע" או "זה לא פשוט" או "משהו זז פה".
משפט אחד.`,
    en: `Your task: Brief, grounded acknowledgment.
No praise. Not "great". Just "I hear you" or "that's not easy" or "something is shifting".
One sentence.`
  },
  
  micro_task: {
    he: `המשימה שלך: לתת משימה זעירה מיידית.
דבר קטן שאפשר לעשות עכשיו: לעצור, לנשום, לשים לב לגוף.
משפט אחד עם הזמנה ברורה.`,
    en: `Your task: Give a tiny immediate action.
Something small they can do now: pause, breathe, notice their body.
One sentence with a clear invitation.`
  },
  
  summarize: {
    he: `המשימה שלך: לסכם בקצרה מה קרה היום.
לא רשימה. לא שבחים. רק משפט אחד שמכיל את המהות.`,
    en: `Your task: Briefly summarize what happened today.
Not a list. Not praise. Just one sentence that captures the essence.`
  },
  
  silence: {
    he: `המשימה שלך: לתת מקום. אישור מינימלי.
"אני פה" או "קח/י את הזמן" - משהו שמאפשר שקט.
משפט אחד קצר מאוד.`,
    en: `Your task: Give space. Minimal acknowledgment.
"I'm here" or "take your time" - something that allows quiet.
One very short sentence.`
  },
  
  give_task: {
    he: `המשימה שלך: לתת את המשימה בבהירות.
משפט אחד עם המשימה. משפט אחד שמחבר למה שהם שיתפו.
לא להסביר למה. לא לשאול מה הם חושבים. רק לתת ולעצור.`,
    en: `Your task: Give the task clearly.
One sentence with the task. One sentence connecting to what they shared.
Don't explain why. Don't ask what they think. Just give it and stop.`
  },
  
  close_day: {
    he: `המשימה שלך: לסגור את היום בחום.
להתחיל עם [DAY_COMPLETE]
לציין דבר אחד ספציפי שהם עשו היום.
לסיים בקצרה. "נתראה מחר" או משהו דומה.
בלי שבחים מוגזמים. בלי סיכום ארוך.`,
    en: `Your task: Close the day warmly.
Start with [DAY_COMPLETE]
Name one specific thing they did today.
End briefly. "See you tomorrow" or similar.
No excessive praise. No long summary.`
  }
};

// Grounded alternatives to use instead of blacklisted phrases
const GROUNDED_ALTERNATIVES = {
  he: [
    'אני שומע/ת אותך',
    'זה לא פשוט',
    'משהו זז פה',
    'שים/י לב ל...',
    'אני פה',
    'ממשיכים',
  ],
  en: [
    'I hear you',
    "That's not easy",
    'Something is shifting here',
    'Notice...',
    "I'm here",
    "Let's continue",
  ]
};

interface PromptContext {
  mentorName: string;
  participantName?: string;
  mentorTone?: string;
  journeyName: string;
  dayNumber: number;
  totalDays: number;
  dayGoal: string;
  dayTask: string;
  recentMessages: { role: string; content: string }[];
  language: 'he' | 'en';
}

/**
 * Build the system prompt based on Director's decision
 */
export function buildSystemPrompt(
  decision: DirectorDecision,
  context: PromptContext
): string {
  const isHebrew = context.language === 'he';
  const actionPrompt = ACTION_PROMPTS[decision.action];
  const taskInstruction = isHebrew ? actionPrompt.he : actionPrompt.en;
  
  const blacklist = isHebrew ? BLACKLISTED_PHRASES_HE : BLACKLISTED_PHRASES_EN;
  const alternatives = isHebrew ? GROUNDED_ALTERNATIVES.he : GROUNDED_ALTERNATIVES.en;
  
  let prompt = isHebrew 
    ? `אתה ${context.mentorName}, מלווה אנושי בתהליך "${context.journeyName}".`
    : `You are ${context.mentorName}, a human mentor guiding "${context.journeyName}".`;

  prompt += isHebrew
    ? `\nיום ${context.dayNumber} מתוך ${context.totalDays}.`
    : `\nDay ${context.dayNumber} of ${context.totalDays}.`;
    
  if (context.participantName) {
    prompt += isHebrew
      ? `\nאת מדבר/ת עם ${context.participantName}.`
      : `\nYou're speaking with ${context.participantName}.`;
  }
  
  if (context.mentorTone) {
    prompt += isHebrew
      ? `\nהסגנון שלך: ${context.mentorTone}.`
      : `\nYour style: ${context.mentorTone}.`;
  }

  // The core instruction from Director
  prompt += `\n\n=== ${isHebrew ? 'ההוראה שלך' : 'YOUR INSTRUCTION'} ===\n`;
  prompt += taskInstruction;
  
  if (decision.context.instruction) {
    prompt += `\n\n${decision.context.instruction}`;
  }
  
  if (decision.context.focusPoint) {
    prompt += isHebrew
      ? `\n\nהתמקד ב: ${decision.context.focusPoint}`
      : `\n\nFocus on: ${decision.context.focusPoint}`;
  }
  
  if (decision.context.content && decision.action === 'give_task') {
    prompt += isHebrew
      ? `\n\nהמשימה להיום: ${decision.context.content}`
      : `\n\nToday's task: ${decision.context.content}`;
  }

  // Strict rules
  prompt += `\n\n=== ${isHebrew ? 'כללים קפדניים' : 'STRICT RULES'} ===\n`;
  prompt += isHebrew
    ? `1. מקסימום 80 מילים.
2. כוונה אחת בלבד. לא שניים או שלושה דברים.
3. לא להשתמש בביטויים האסורים.
4. להישאר בשפה ${isHebrew ? 'עברית' : 'אנגלית'}.`
    : `1. Maximum 80 words.
2. One intention only. Not two or three things.
3. Never use blacklisted phrases.
4. Stay in ${isHebrew ? 'Hebrew' : 'English'}.`;

  // Blacklist
  prompt += `\n\n=== ${isHebrew ? 'ביטויים אסורים' : 'BANNED PHRASES'} ===\n`;
  prompt += blacklist.map(p => `- "${p}"`).join('\n');
  
  // Alternatives
  prompt += `\n\n=== ${isHebrew ? 'השתמש במקום' : 'USE INSTEAD'} ===\n`;
  prompt += alternatives.join(', ');

  return prompt;
}

/**
 * Build messages array for OpenAI API call
 */
export function buildMessages(
  systemPrompt: string,
  context: PromptContext,
  userMessage: string
): { role: 'system' | 'user' | 'assistant'; content: string }[] {
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt }
  ];
  
  // Only include last 2 messages for tight context
  const recent = context.recentMessages.slice(-2);
  for (const msg of recent) {
    messages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    });
  }
  
  messages.push({ role: 'user', content: userMessage });
  
  return messages;
}

/**
 * Post-process AI response to remove any blacklisted phrases
 */
export function sanitizeResponse(response: string, language: 'he' | 'en'): string {
  let sanitized = response;
  const blacklist = language === 'he' ? BLACKLISTED_PHRASES_HE : BLACKLISTED_PHRASES_EN;
  const alternatives = language === 'he' ? GROUNDED_ALTERNATIVES.he : GROUNDED_ALTERNATIVES.en;
  
  for (const phrase of blacklist) {
    const regex = new RegExp(phrase, 'gi');
    if (regex.test(sanitized)) {
      // Replace with a random grounded alternative
      const alternative = alternatives[Math.floor(Math.random() * alternatives.length)];
      sanitized = sanitized.replace(regex, alternative);
      console.log(`[Sanitizer] Replaced "${phrase}" with "${alternative}"`);
    }
  }
  
  return sanitized;
}

/**
 * Trim response to word limit
 */
export function trimResponse(response: string, maxWords: number = 80): string {
  const words = response.split(/\s+/);
  if (words.length <= maxWords) {
    return response;
  }
  
  console.log(`[PromptBuilder] Trimming from ${words.length} to ${maxWords} words`);
  
  const trimmed = words.slice(0, maxWords).join(' ');
  
  // Try to end at sentence boundary
  const lastPeriod = Math.max(
    trimmed.lastIndexOf('.'),
    trimmed.lastIndexOf('?'),
    trimmed.lastIndexOf('!')
  );
  
  if (lastPeriod > trimmed.length * 0.5) {
    return trimmed.slice(0, lastPeriod + 1);
  }
  
  return trimmed;
}

/**
 * Full post-processing pipeline
 */
export function postProcess(response: string, language: 'he' | 'en'): string {
  let processed = response;
  
  // Sanitize blacklisted phrases
  processed = sanitizeResponse(processed, language);
  
  // Trim to word limit
  processed = trimResponse(processed, 80);
  
  return processed;
}
