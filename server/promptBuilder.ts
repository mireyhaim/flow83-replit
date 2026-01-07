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
    he: `המשימה שלך: להחזיר בקצרה את מה שהמשתתף שיתף.
משפט אחד בלבד שמראה שאתה שומע.
מיד אחרי - הוסף משמעות או כיוון (לא שאלה).`,
    en: `Your task: Briefly mirror what they shared.
One sentence only that shows you hear them.
Immediately after - add meaning or direction (not a question).`
  },
  
  add_meaning: {
    he: `המשימה שלך: להוסיף משמעות למה שהם שיתפו.
לפרש את מה שהם אמרו, לחבר למשהו עמוק יותר.
לא לחזור על מילות הרגש שלהם - להמשיך הלאה.
לא לשאול שאלה. רק לתת פרשנות שמקדמת.`,
    en: `Your task: Add meaning to what they shared.
Interpret what they said, connect to something deeper.
Don't repeat their emotion words - move forward.
Don't ask a question. Just give interpretation that advances.`
  },
  
  give_direction: {
    he: `המשימה שלך: להוביל קדימה.
לחבר למטרת היום ולתהליך הכולל.
לא לחזור על מה שהם אמרו - להתקדם.
לא לשאול שאלה. רק לתת כיוון ברור.`,
    en: `Your task: Lead forward.
Connect to today's goal and the overall journey.
Don't repeat what they said - move ahead.
Don't ask a question. Just give clear direction.`
  },
  
  ask_question: {
    he: `המשימה שלך: לשאול שאלה אחת קצרה.
שאלה על החוויה שלהם, לא על הרגש.
משפט אחד בלבד.`,
    en: `Your task: Ask one short question.
A question about their experience, not their feelings.
One sentence only.`
  },
  
  validate: {
    he: `המשימה שלך: אישור קצר וקרקעי.
לא שבחים. רק "אני שומע/ת" או "זה לא פשוט".
משפט אחד ואז להמשיך להוביל.`,
    en: `Your task: Brief, grounded acknowledgment.
No praise. Just "I hear you" or "that's not easy".
One sentence then continue leading.`
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
"אני פה" או "קח/י את הזמן".
משפט אחד קצר מאוד.`,
    en: `Your task: Give space. Minimal acknowledgment.
"I'm here" or "take your time".
One very short sentence.`
  },
  
  give_task: {
    he: `המשימה שלך: לתת את המשימה בבהירות.
לחבר בקצרה למה שהם שיתפו, ואז לתת את המשימה.
לא להסביר למה. לא לשאול. רק לתת ולעצור.`,
    en: `Your task: Give the task clearly.
Connect briefly to what they shared, then give the task.
Don't explain why. Don't ask. Just give it and stop.`
  },
  
  close_day: {
    he: `המשימה שלך: לסגור את היום בחום.
להתחיל עם [DAY_COMPLETE]
לציין דבר אחד ספציפי שהם עשו היום.
לסיים בקצרה. "נתראה מחר".
בלי שבחים מוגזמים.`,
    en: `Your task: Close the day warmly.
Start with [DAY_COMPLETE]
Name one specific thing they did today.
End briefly. "See you tomorrow".
No excessive praise.`
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
4. להישאר בשפה ${isHebrew ? 'עברית' : 'אנגלית'}.
5. לא לשאול שאלה אלא אם זו הפעולה המבוקשת.
6. להוביל את התהליך, לא להגיב.`
    : `1. Maximum 80 words.
2. One intention only. Not two or three things.
3. Never use blacklisted phrases.
4. Stay in ${isHebrew ? 'Hebrew' : 'English'}.
5. Do NOT ask a question unless that's the requested action.
6. Lead the process, don't just respond.`;

  // Blacklist
  prompt += `\n\n=== ${isHebrew ? 'ביטויים אסורים' : 'BANNED PHRASES'} ===\n`;
  prompt += blacklist.map(p => `- "${p}"`).join('\n');
  
  // Add banned emotion words if provided (to prevent repetition)
  if (decision.context.bannedWords && decision.context.bannedWords.length > 0) {
    prompt += isHebrew
      ? `\n\n=== מילים לא לחזור עליהן ===\n`
      : `\n\n=== WORDS NOT TO REPEAT ===\n`;
    prompt += decision.context.bannedWords.map(w => `- "${w}"`).join('\n');
    prompt += isHebrew
      ? `\nחשוב: לא לחזור על מילות הרגש האלה. המשתתף כבר שיתף אותן. להתקדם.`
      : `\nImportant: Do NOT repeat these emotion words. The participant already shared them. Move forward.`;
  }
  
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
