/**
 * ConversationDirector - System-led conversation control
 * 
 * The AI does NOT lead the process. The SYSTEM does.
 * This module decides WHAT happens in the conversation.
 * The AI only decides HOW to phrase it.
 */

// Action types the Director can command
export type DirectorAction = 
  | 'reflect'        // Mirror back what user said (USE ONCE ONLY)
  | 'add_meaning'    // Interpret emotion, connect to deeper insight
  | 'give_direction' // Move toward today's goal, lead without asking
  | 'ask_question'   // Ask ONE deepening question
  | 'validate'       // Simple acknowledgment (NOT praise)
  | 'micro_task'     // Give a small, specific task
  | 'summarize'      // Summarize what happened today
  | 'silence'        // Just acknowledge, don't push
  | 'give_task'      // Present the day's main task
  | 'close_day';     // Warm closing, mark day complete

// The decision the Director makes
export interface DirectorDecision {
  action: DirectorAction;
  phase: ConversationPhase;
  nextPhase: ConversationPhase | null;
  context: {
    // What the AI should focus on in its response
    focusPoint?: string;
    // Specific instruction for this action
    instruction?: string;
    // Content to include (e.g., the task text)
    content?: string;
    // Whether this completes the day
    completesDay?: boolean;
    // Emotion word that was reflected (to avoid repeating)
    emotionToReflect?: string;
    // Words to ban from response (to prevent repetition)
    bannedWords?: string[];
  };
  reason: string;
}

// Conversation phases (same as existing)
export type ConversationPhase = 'intro' | 'reflection' | 'task' | 'integration';

// Mentor style profiles with action weights
export interface MentorProfile {
  style: 'practical' | 'emotional' | 'spiritual' | 'structured';
  actionWeights: ActionWeights;
}

// Action weights determine probability of each action
interface ActionWeights {
  reflect: number;
  add_meaning: number;
  give_direction: number;
  ask_question: number;
  validate: number;
  micro_task: number;
  silence: number;
}

// Base weights per mentor style
// Key insight: reflect is low because we only reflect ONCE, then move to meaning/direction
const STYLE_WEIGHTS: Record<MentorProfile['style'], ActionWeights> = {
  practical: {
    reflect: 0.1,
    add_meaning: 0.15,
    give_direction: 0.25,
    ask_question: 0.1,
    validate: 0.1,
    micro_task: 0.25,
    silence: 0.05
  },
  emotional: {
    reflect: 0.15,
    add_meaning: 0.3,
    give_direction: 0.2,
    ask_question: 0.15,
    validate: 0.1,
    micro_task: 0.05,
    silence: 0.05
  },
  spiritual: {
    reflect: 0.1,
    add_meaning: 0.35,
    give_direction: 0.15,
    ask_question: 0.1,
    validate: 0.1,
    micro_task: 0.1,
    silence: 0.1
  },
  structured: {
    reflect: 0.1,
    add_meaning: 0.15,
    give_direction: 0.3,
    ask_question: 0.15,
    validate: 0.1,
    micro_task: 0.15,
    silence: 0.05
  }
};

// Tone modifiers - adjust base weights based on tone of voice
const TONE_MODIFIERS: Record<string, Partial<ActionWeights>> = {
  warm: {
    add_meaning: 0.1,    // More meaning
    validate: 0.05,      // More validation
    silence: 0.05        // More space
  },
  professional: {
    give_direction: 0.1, // More direction
    micro_task: 0.05     // More tasks
  },
  motivating: {
    give_direction: 0.1, // More direction
    micro_task: 0.1,     // More tasks
    validate: 0.05       // More validation
  },
  spiritual: {
    add_meaning: 0.15,   // Much more meaning
    silence: 0.1         // More space
  },
  direct: {
    give_direction: 0.15, // Much more direction
    micro_task: 0.1,      // More tasks
    reflect: -0.05,       // Less reflection
    silence: -0.05        // Less silence
  },
  gentle: {
    add_meaning: 0.1,    // More meaning
    silence: 0.1,        // More space
    micro_task: -0.1     // Less tasks
  }
};

// Emotion detection result with both root and all related words
export interface EmotionMatch {
  root: string;           // The root for comparison (e.g., 'רגש')
  surfaceWord: string;    // The actual word found (e.g., 'מתרגשת')
  allForms: string[];     // All related words to ban (e.g., ['מתרגש', 'מתרגשת', 'התרגשות', ...])
}

// Conversation state for tracking
export interface ConversationState {
  phase: ConversationPhase;
  messageCountInPhase: number;
  totalMessageCount: number;
  questionsAskedInPhase: number;
  reflectionsDone: number;           // Track how many times we reflected
  lastReflectedEmotion: string | null; // Emotion ROOT we already reflected - for comparison
  lastReflectedWords: string[];      // ALL forms of the emotion to ban - for prompts
  userSharedEmotion: boolean;
  userIndicatedCompletion: boolean;
  dayTask: string;
  dayGoal: string;
}

// Keywords for detecting user emotional sharing
// Hebrew emotion roots (3-letter roots) for better matching across inflections
const EMOTION_ROOTS_HE = [
  // Core emotion words - feel/feeling
  { root: 'רגש', words: ['מרגיש', 'מרגישה', 'הרגשה', 'רגש', 'מרגישים'] },
  { root: 'קשה', words: ['קשה', 'קשים', 'קשות'] },
  { root: 'כאב', words: ['כואב', 'כואבת', 'כאב', 'מכאיב', 'מכאיבה'] },
  { root: 'שמח', words: ['שמח', 'שמחה', 'שמחות', 'שמחים'] },
  { root: 'עצב', words: ['עצוב', 'עצובה', 'עצב', 'עצובים', 'עצבני', 'עצבנית', 'עצבנות', 'עצבניים'] },
  { root: 'פחד', words: ['מפחד', 'מפחדת', 'פחד', 'מפחדים', 'פוחד', 'פוחדת', 'פוחדים'] },
  // Excitement - separate group for התרגש vs מרגיש
  { root: 'התרגש', words: ['מתרגש', 'מתרגשת', 'התרגשות', 'מתרגשים', 'התרגשתי'] },
  { root: 'עיף', words: ['עייף', 'עייפה', 'עייפות', 'עייפים'] },
  { root: 'תסכל', words: ['מתוסכל', 'מתוסכלת', 'תסכול', 'מתוסכלים'] },
  { root: 'לחץ', words: ['לחוץ', 'לחוצה', 'לחץ', 'לחוצים'] },
  { root: 'בדד', words: ['בודד', 'בודדה', 'בדידות', 'בודדים'] },
  { root: 'חרד', words: ['חרד', 'חרדה', 'חרדות', 'מחרידה', 'חרדתי'] },
  { root: 'כעס', words: ['כועס', 'כועסת', 'כעס', 'כעסים', 'כעסתי'] },
  { root: 'דאג', words: ['דואג', 'דואגת', 'דאגה', 'מודאג', 'מודאגת', 'מודאגים'] },
  // Additional common emotion adjectives
  { root: 'נרגש', words: ['נרגש', 'נרגשת', 'נרגשים', 'נרגשות'] },
  { root: 'מבולבל', words: ['מבולבל', 'מבולבלת', 'בלבול', 'מבולבלים'] },
  { root: 'מתוח', words: ['מתוח', 'מתוחה', 'מתח', 'מתוחים'] },
  { root: 'אכזב', words: ['מאוכזב', 'מאוכזבת', 'אכזבה', 'מאוכזבים'] },
  { root: 'תקוה', words: ['מקווה', 'מקווה', 'תקווה', 'מקווים'] },
  { root: 'רגוע', words: ['רגוע', 'רגועה', 'רוגע', 'רגועים'] },
  { root: 'נסער', words: ['נסער', 'נסערת', 'סערה', 'נסערים'] }
];

const EMOTION_KEYWORDS_HE = EMOTION_ROOTS_HE.flatMap(e => e.words);
const EMOTION_KEYWORDS_EN = ['feel', 'feeling', 'hard', 'hurts', 'happy', 'sad', 'scared', 'excited', 'tired', 'frustrated', 'stressed', 'lonely', 'worried', 'anxious', 'angry'];

// Keywords for detecting task completion
const COMPLETION_KEYWORDS_HE = ['עשיתי', 'סיימתי', 'ניסיתי', 'הצלחתי', 'עבר', 'הבנתי', 'עובד'];
const COMPLETION_KEYWORDS_EN = ['done', 'did', 'finished', 'tried', 'completed', 'worked', 'understand', 'got it'];

// Keywords that signal user wants to move forward (stop asking questions)
const MOVE_FORWARD_KEYWORDS_HE = ['לא יודעת', 'לא יודע', 'אולי', 'יכול להיות', 'נגיד', 'אממ', 'לא בטוח', 'לא בטוחה', 'בוא נמשיך', 'מה עכשיו', 'מה הלאה', 'תמשיך'];
const MOVE_FORWARD_KEYWORDS_EN = ["don't know", 'maybe', 'perhaps', 'not sure', 'let\'s continue', 'move on', 'what now', 'what next'];

/**
 * Detect if user wants to move forward (stop reflection/questions)
 */
function detectMoveForwardSignal(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const keywords = isHebrew(message) ? MOVE_FORWARD_KEYWORDS_HE : MOVE_FORWARD_KEYWORDS_EN;
  return keywords.some(keyword => lowerMessage.includes(keyword) || message.includes(keyword));
}

/**
 * Detect if message contains Hebrew text
 */
function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Detect emotional content in user message
 */
function detectEmotionalContent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const keywords = isHebrew(message) ? EMOTION_KEYWORDS_HE : EMOTION_KEYWORDS_EN;
  return keywords.some(keyword => lowerMessage.includes(keyword) || message.includes(keyword));
}

/**
 * Detect completion indicators in user message
 */
function detectCompletionIndicator(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const keywords = isHebrew(message) ? COMPLETION_KEYWORDS_HE : COMPLETION_KEYWORDS_EN;
  return keywords.some(keyword => lowerMessage.includes(keyword) || message.includes(keyword));
}

/**
 * Normalize weights to ensure they sum to 1.0
 */
function normalizeWeights(weights: ActionWeights): ActionWeights {
  const total = Object.values(weights).reduce((sum, w) => sum + Math.max(0, w), 0);
  if (total === 0) return STYLE_WEIGHTS.emotional; // Fallback
  
  return {
    reflect: Math.max(0, weights.reflect) / total,
    add_meaning: Math.max(0, weights.add_meaning) / total,
    give_direction: Math.max(0, weights.give_direction) / total,
    ask_question: Math.max(0, weights.ask_question) / total,
    validate: Math.max(0, weights.validate) / total,
    micro_task: Math.max(0, weights.micro_task) / total,
    silence: Math.max(0, weights.silence) / total
  };
}

/**
 * Extract full emotion match from user message
 * Returns root (for comparison), surface word (for logging), and all forms (for banning)
 */
function extractEmotionMatch(message: string): EmotionMatch | null {
  const lowerMessage = message.toLowerCase();
  
  // Check Hebrew emotion roots first
  for (const emotionGroup of EMOTION_ROOTS_HE) {
    for (const word of emotionGroup.words) {
      if (message.includes(word)) {
        return {
          root: emotionGroup.root,
          surfaceWord: word,
          allForms: emotionGroup.words
        };
      }
    }
  }
  
  // Check English keywords
  for (const keyword of EMOTION_KEYWORDS_EN) {
    if (lowerMessage.includes(keyword)) {
      return {
        root: keyword,
        surfaceWord: keyword,
        allForms: [keyword]
      };
    }
  }
  
  return null;
}

/**
 * Simple check - just returns the root for backward compatibility
 */
function extractEmotionWord(message: string): string | null {
  const match = extractEmotionMatch(message);
  return match ? match.root : null;
}

/**
 * Get mentor profile from style and tone
 * Combines base style weights with tone modifiers for personalized behavior
 */
export function getMentorProfile(style: string, tone?: string): MentorProfile {
  const validStyles: MentorProfile['style'][] = ['practical', 'emotional', 'spiritual', 'structured'];
  const normalizedStyle = validStyles.includes(style as any) ? style as MentorProfile['style'] : 'emotional';
  
  // Start with base weights for the style
  const baseWeights = { ...STYLE_WEIGHTS[normalizedStyle] };
  
  // Apply tone modifiers if tone is specified
  if (tone && TONE_MODIFIERS[tone]) {
    const modifiers = TONE_MODIFIERS[tone];
    for (const [action, modifier] of Object.entries(modifiers)) {
      if (action in baseWeights) {
        baseWeights[action as keyof ActionWeights] += modifier;
      }
    }
  }
  
  // Normalize to ensure weights sum to 1.0 and no negative values
  const finalWeights = normalizeWeights(baseWeights);
  
  return {
    style: normalizedStyle,
    actionWeights: finalWeights
  };
}

/**
 * Select action based on weights (weighted random selection)
 */
function selectWeightedAction(weights: ActionWeights): DirectorAction {
  const entries = Object.entries(weights) as [DirectorAction, number][];
  const totalWeight = entries.reduce((sum, [_, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const [action, weight] of entries) {
    random -= weight;
    if (random <= 0) {
      return action;
    }
  }
  
  return 'reflect'; // Fallback
}

/**
 * Get adjusted weights after reflection - block further reflection, boost meaning/direction
 */
function getPostReflectionWeights(baseWeights: ActionWeights): ActionWeights {
  const adjusted = { ...baseWeights };
  
  // CRITICAL: After reflecting once, NEVER reflect again
  adjusted.reflect = 0;
  
  // Boost meaning and direction - these are the forward-moving actions
  adjusted.add_meaning = adjusted.add_meaning * 2;
  adjusted.give_direction = adjusted.give_direction * 2;
  
  // Reduce questions - we want to lead, not ask
  adjusted.ask_question = adjusted.ask_question * 0.5;
  
  return normalizeWeights(adjusted);
}

/**
 * The main Director function - decides what happens next
 * This is the SYSTEM making decisions, not the AI
 * 
 * KEY RULE: After reflecting an emotion ONCE, we NEVER repeat it.
 * We must add MEANING or DIRECTION, not more reflection.
 */
export function makeDecision(
  state: ConversationState,
  userMessage: string,
  mentorProfile: MentorProfile
): DirectorDecision {
  const hasEmotion = detectEmotionalContent(userMessage);
  const emotionWord = extractEmotionWord(userMessage);
  const hasCompletion = detectCompletionIndicator(userMessage);
  const messageLength = userMessage.length;
  const wantsToMoveForward = detectMoveForwardSignal(userMessage);
  
  // Check if we already reflected this emotion
  const alreadyReflectedThisEmotion = emotionWord && state.lastReflectedEmotion === emotionWord;
  const hasReflectedEnough = state.reflectionsDone >= 1;
  
  console.log(`[Director] makeDecision: phase=${state.phase}, totalMsgs=${state.totalMessageCount}, msgInPhase=${state.messageCountInPhase}, wantsForward=${wantsToMoveForward}`);
  
  // CRITICAL: If user signals they want to move forward, skip to task immediately
  // This prevents endless philosophical questioning
  if (wantsToMoveForward && state.phase !== 'task' && state.phase !== 'integration') {
    console.log(`[Director] User wants to move forward - giving task`);
    return {
      action: 'give_task',
      phase: state.phase,
      nextPhase: 'task',
      context: {
        content: state.dayTask,
        instruction: 'User wants to move forward. Briefly acknowledge their input, then present today\'s task clearly and practically. Be direct and action-oriented.'
      },
      reason: 'User signaled readiness to move forward - presenting task'
    };
  }
  
  // CRITICAL: After 2 user messages in intro/reflection, force move to task
  // (totalMessageCount includes bot messages, so 4 = 2 user + 2 bot)
  // This prevents endless questioning loops
  if ((state.phase === 'intro' || state.phase === 'reflection') && state.totalMessageCount >= 4) {
    console.log(`[Director] Message limit reached (${state.totalMessageCount}) - giving task`);
    return {
      action: 'give_task',
      phase: state.phase,
      nextPhase: 'task',
      context: {
        content: state.dayTask,
        instruction: 'Enough reflection. Connect briefly to what they shared, then present today\'s task clearly. Be practical and action-oriented.'
      },
      reason: 'Reached message limit for reflection - time to present task'
    };
  }

  // PHASE: INTRO
  if (state.phase === 'intro') {
    // If user responds with enough content, do ONE reflection then move on
    if (messageLength > 15 || hasEmotion) {
      // Get full emotion match to pass all word forms as banned words
      const currentMatch = extractEmotionMatch(userMessage);
      
      return {
        action: 'reflect',
        phase: 'intro',
        nextPhase: 'reflection',
        context: {
          focusPoint: 'what the user just shared',
          instruction: 'Mirror back briefly - ONE sentence. Then immediately add meaning or direction. Do NOT echo their exact emotion words.',
          emotionToReflect: emotionWord || undefined,
          // Pass ALL word forms so AI doesn't echo them back
          bannedWords: currentMatch ? currentMatch.allForms : undefined
        },
        reason: 'User shared enough to begin - reflect once and move forward'
      };
    }
    
    // Very short response - ask gentle opening question
    return {
      action: 'ask_question',
      phase: 'intro',
      nextPhase: null,
      context: {
        instruction: 'Ask one soft question about how they are arriving today'
      },
      reason: 'User response too brief, need more connection'
    };
  }

  // PHASE: REFLECTION
  if (state.phase === 'reflection') {
    // Check if ready to move to task phase - be more aggressive about moving forward
    // Key: After 1 message exchange in reflection, we should present the task
    const readyForTask = state.messageCountInPhase >= 1 || 
                         messageLength > 30 ||
                         state.reflectionsDone >= 1;
    
    if (readyForTask) {
      return {
        action: 'give_task',
        phase: 'reflection',
        nextPhase: 'task',
        context: {
          content: state.dayTask,
          instruction: 'Connect briefly to what they shared, then present the task clearly. Lead forward.'
        },
        reason: 'Sufficient reflection, time to introduce task'
      };
    }
    
    // CRITICAL RULE: If we already reflected, we MUST move forward
    // No more mirroring the same emotion. Add meaning or direction.
    if (hasReflectedEnough || alreadyReflectedThisEmotion) {
      // Get weights that favor forward movement
      const forwardWeights = getPostReflectionWeights(mentorProfile.actionWeights);
      let action = selectWeightedAction(forwardWeights);
      
      // Force to meaning or direction if still getting reflect
      if (action === 'reflect') {
        action = Math.random() > 0.5 ? 'add_meaning' : 'give_direction';
      }
      
      // Collect ALL banned words: previously reflected + current emotion forms
      const currentMatch = extractEmotionMatch(userMessage);
      const allBannedWords = new Set(state.lastReflectedWords);
      if (currentMatch) {
        currentMatch.allForms.forEach(w => allBannedWords.add(w));
      }
      const bannedWordsList = Array.from(allBannedWords);
      
      return {
        action,
        phase: 'reflection',
        nextPhase: null,
        context: {
          focusPoint: state.dayGoal,
          instruction: action === 'add_meaning'
            ? `Interpret what they shared. Connect it to something deeper about their journey. NO questions. Do NOT repeat any emotion words they used.`
            : action === 'give_direction'
            ? `Move toward today's goal: "${state.dayGoal}". Lead them forward. NO questions. Do NOT repeat any emotion words they used.`
            : action === 'micro_task'
            ? 'Give one tiny immediate action (breathe, notice body). NO questions.'
            : 'Acknowledge briefly and move forward. NO questions.',
          bannedWords: bannedWordsList.length > 0 ? bannedWordsList : undefined
        },
        reason: `Already reflected - moving forward with ${action} (no more mirroring)`
      };
    }
    
    // First time seeing emotion - can reflect ONCE
    if (hasEmotion && state.reflectionsDone === 0) {
      // Get full emotion match to pass all word forms as banned words
      const currentMatch = extractEmotionMatch(userMessage);
      
      return {
        action: 'reflect',
        phase: 'reflection',
        nextPhase: null,
        context: {
          focusPoint: 'their emotion',
          instruction: 'Mirror back briefly in ONE sentence, then IMMEDIATELY add meaning or direction in the next sentence. Do NOT ask a question. Do NOT echo their exact emotion words.',
          emotionToReflect: emotionWord || undefined,
          // Pass ALL word forms so AI doesn't echo them back
          bannedWords: currentMatch ? currentMatch.allForms : undefined
        },
        reason: 'First emotional share - reflect once then add meaning'
      };
    }
    
    // No emotion shared yet - select based on profile but never reflect
    const weights = hasReflectedEnough 
      ? getPostReflectionWeights(mentorProfile.actionWeights)
      : mentorProfile.actionWeights;
    
    let action = selectWeightedAction(weights);
    
    // Prevent too many questions
    if (action === 'ask_question' && state.questionsAskedInPhase >= 1) {
      action = 'add_meaning';
    }
    
    // Prevent reflect after already reflecting
    if (action === 'reflect' && hasReflectedEnough) {
      action = 'add_meaning';
    }
    
    return {
      action,
      phase: 'reflection',
      nextPhase: null,
      context: {
        focusPoint: state.dayGoal,
        instruction: action === 'ask_question' 
          ? 'Ask ONE deepening question - make it about their experience, not their feelings'
          : action === 'add_meaning'
          ? `Interpret what they shared. Connect to today's goal: "${state.dayGoal}". NO questions.`
          : action === 'give_direction'
          ? `Lead toward today's goal: "${state.dayGoal}". NO questions.`
          : action === 'micro_task'
          ? 'Suggest one tiny action (breathe, notice body, pause). NO questions.'
          : 'Simple acknowledgment and continue leading.'
      },
      reason: `Selected ${action} - leading the process forward`
    };
  }

  // PHASE: TASK
  if (state.phase === 'task') {
    // If user indicates completion or shares significantly, move to integration
    if (hasCompletion || messageLength > 60) {
      return {
        action: 'summarize',
        phase: 'task',
        nextPhase: 'integration',
        context: {
          instruction: 'Acknowledge their engagement. Name what they did. Prepare to close.'
        },
        reason: 'User engaged with task, moving to integration'
      };
    }
    
    // If user asks what to do, re-clarify task
    const askingWhatToDo = /מה עלי|מה צריך|what should|what do i/i.test(userMessage);
    if (askingWhatToDo) {
      return {
        action: 'give_task',
        phase: 'task',
        nextPhase: null,
        context: {
          content: state.dayTask,
          instruction: 'Restate the task clearly. No apology. Just the task.'
        },
        reason: 'User unclear on task, restating'
      };
    }
    
    // In task phase, guide toward action
    return {
      action: 'give_direction',
      phase: 'task',
      nextPhase: null,
      context: {
        content: state.dayTask,
        instruction: 'Guide them to engage with the task. NO questions. Just direction.'
      },
      reason: 'In task phase, guiding toward action'
    };
  }

  // PHASE: INTEGRATION
  if (state.phase === 'integration') {
    return {
      action: 'close_day',
      phase: 'integration',
      nextPhase: null,
      context: {
        completesDay: true,
        instruction: 'Warm closing. Name ONE thing they did today. Brief. No long summary.'
      },
      reason: 'Integration phase - closing day'
    };
  }

  // Fallback - always move forward
  return {
    action: 'give_direction',
    phase: state.phase,
    nextPhase: null,
    context: {
      instruction: 'Lead forward. Guide the process.'
    },
    reason: 'Fallback - leading forward'
  };
}

/**
 * Update conversation state after a message exchange
 */
export function updateState(
  currentState: ConversationState,
  decision: DirectorDecision,
  userMessage: string
): ConversationState {
  const newState = { ...currentState };
  
  // Update message counts
  newState.totalMessageCount += 1;
  newState.messageCountInPhase += 1;
  
  // Track questions asked
  if (decision.action === 'ask_question') {
    newState.questionsAskedInPhase += 1;
  }
  
  // Track reflections - CRITICAL for preventing reflection loops
  if (decision.action === 'reflect') {
    newState.reflectionsDone += 1;
    // Track the emotion root AND all word forms so we don't repeat any of them
    const emotionMatch = extractEmotionMatch(userMessage);
    if (emotionMatch) {
      newState.lastReflectedEmotion = emotionMatch.root;
      // Accumulate all forms we've seen (don't replace, add to list)
      const existingWords = new Set(newState.lastReflectedWords);
      emotionMatch.allForms.forEach(w => existingWords.add(w));
      newState.lastReflectedWords = Array.from(existingWords);
    }
  }
  
  // Detect emotional sharing
  if (detectEmotionalContent(userMessage)) {
    newState.userSharedEmotion = true;
  }
  
  // Detect completion
  if (detectCompletionIndicator(userMessage)) {
    newState.userIndicatedCompletion = true;
  }
  
  // Phase transition
  if (decision.nextPhase && decision.nextPhase !== currentState.phase) {
    newState.phase = decision.nextPhase;
    newState.messageCountInPhase = 0;
    newState.questionsAskedInPhase = 0;
    // IMPORTANT: Do NOT reset reflectionsDone - we want to track total reflections across all phases
    // This prevents the loop where we reflect again after intro→reflection transition
  }
  
  return newState;
}

/**
 * Initialize conversation state for a new day
 */
export function initializeState(dayTask: string, dayGoal: string): ConversationState {
  return {
    phase: 'intro',
    messageCountInPhase: 0,
    totalMessageCount: 0,
    questionsAskedInPhase: 0,
    reflectionsDone: 0,
    lastReflectedEmotion: null,
    lastReflectedWords: [],
    userSharedEmotion: false,
    userIndicatedCompletion: false,
    dayTask,
    dayGoal
  };
}
