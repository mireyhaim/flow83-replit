/**
 * ConversationDirector - System-led conversation control
 * 
 * The AI does NOT lead the process. The SYSTEM does.
 * This module decides WHAT happens in the conversation.
 * The AI only decides HOW to phrase it.
 */

// Action types the Director can command
export type DirectorAction = 
  | 'reflect'       // Mirror back what user said
  | 'ask_question'  // Ask ONE deepening question
  | 'validate'      // Simple acknowledgment (NOT praise)
  | 'micro_task'    // Give a small, specific task
  | 'summarize'     // Summarize what happened today
  | 'silence'       // Just acknowledge, don't push
  | 'give_task'     // Present the day's main task
  | 'close_day';    // Warm closing, mark day complete

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
  ask_question: number;
  validate: number;
  micro_task: number;
  silence: number;
}

// Base weights per mentor style
const STYLE_WEIGHTS: Record<MentorProfile['style'], ActionWeights> = {
  practical: {
    reflect: 0.2,
    ask_question: 0.2,
    validate: 0.1,
    micro_task: 0.4,
    silence: 0.1
  },
  emotional: {
    reflect: 0.35,
    ask_question: 0.3,
    validate: 0.15,
    micro_task: 0.1,
    silence: 0.1
  },
  spiritual: {
    reflect: 0.3,
    ask_question: 0.25,
    validate: 0.1,
    micro_task: 0.15,
    silence: 0.2
  },
  structured: {
    reflect: 0.15,
    ask_question: 0.25,
    validate: 0.15,
    micro_task: 0.35,
    silence: 0.1
  }
};

// Tone modifiers - adjust base weights based on tone of voice
const TONE_MODIFIERS: Record<string, Partial<ActionWeights>> = {
  warm: {
    reflect: 0.1,      // More reflection
    validate: 0.05,    // More validation
    silence: 0.05      // More space
  },
  professional: {
    micro_task: 0.1,   // More tasks
    ask_question: 0.05 // More questions
  },
  motivating: {
    micro_task: 0.15,  // Much more tasks
    validate: 0.05     // More validation
  },
  spiritual: {
    silence: 0.15,     // Much more silence/space
    reflect: 0.1       // More reflection
  },
  direct: {
    micro_task: 0.1,   // More tasks
    reflect: -0.05,    // Less reflection
    silence: -0.05     // Less silence
  },
  gentle: {
    silence: 0.1,      // More space
    reflect: 0.1,      // More reflection
    micro_task: -0.1   // Less tasks
  }
};

// Conversation state for tracking
export interface ConversationState {
  phase: ConversationPhase;
  messageCountInPhase: number;
  totalMessageCount: number;
  questionsAskedInPhase: number;
  userSharedEmotion: boolean;
  userIndicatedCompletion: boolean;
  dayTask: string;
  dayGoal: string;
}

// Keywords for detecting user emotional sharing
const EMOTION_KEYWORDS_HE = ['מרגיש', 'קשה', 'כואב', 'שמח', 'עצוב', 'מפחד', 'מתרגש', 'עייף', 'מתוסכל', 'לחוץ', 'בודד'];
const EMOTION_KEYWORDS_EN = ['feel', 'feeling', 'hard', 'hurts', 'happy', 'sad', 'scared', 'excited', 'tired', 'frustrated', 'stressed', 'lonely'];

// Keywords for detecting task completion
const COMPLETION_KEYWORDS_HE = ['עשיתי', 'סיימתי', 'ניסיתי', 'הצלחתי', 'עבר', 'הבנתי', 'עובד'];
const COMPLETION_KEYWORDS_EN = ['done', 'did', 'finished', 'tried', 'completed', 'worked', 'understand', 'got it'];

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
    ask_question: Math.max(0, weights.ask_question) / total,
    validate: Math.max(0, weights.validate) / total,
    micro_task: Math.max(0, weights.micro_task) / total,
    silence: Math.max(0, weights.silence) / total
  };
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
 * The main Director function - decides what happens next
 * This is the SYSTEM making decisions, not the AI
 */
export function makeDecision(
  state: ConversationState,
  userMessage: string,
  mentorProfile: MentorProfile
): DirectorDecision {
  const hasEmotion = detectEmotionalContent(userMessage);
  const hasCompletion = detectCompletionIndicator(userMessage);
  const messageLength = userMessage.length;

  // PHASE: INTRO
  if (state.phase === 'intro') {
    // If user responds with more than minimal content, move to reflection
    if (messageLength > 15 || hasEmotion) {
      return {
        action: 'reflect',
        phase: 'intro',
        nextPhase: 'reflection',
        context: {
          focusPoint: 'what the user just shared',
          instruction: 'Mirror back their emotional state briefly'
        },
        reason: 'User shared enough to begin reflection'
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
    // After 2-3 exchanges in reflection, or strong emotional share, move to task
    if (state.messageCountInPhase >= 2 || (hasEmotion && messageLength > 40)) {
      return {
        action: 'give_task',
        phase: 'reflection',
        nextPhase: 'task',
        context: {
          content: state.dayTask,
          instruction: 'Present the task clearly, connect briefly to what they shared'
        },
        reason: 'Sufficient reflection, time to introduce task'
      };
    }
    
    // Select weighted action based on mentor style
    const action = selectWeightedAction(mentorProfile.actionWeights);
    
    // Limit questions per phase
    if (action === 'ask_question' && state.questionsAskedInPhase >= 2) {
      return {
        action: 'reflect',
        phase: 'reflection',
        nextPhase: null,
        context: {
          focusPoint: 'what they just shared',
          instruction: 'Simply mirror back, no question'
        },
        reason: 'Already asked enough questions in this phase'
      };
    }
    
    return {
      action,
      phase: 'reflection',
      nextPhase: null,
      context: {
        focusPoint: 'their emotional state and words',
        instruction: action === 'ask_question' 
          ? 'Ask ONE deepening question' 
          : action === 'micro_task'
          ? 'Suggest one tiny immediate action (breathe, notice, pause)'
          : 'Mirror what they said without adding much'
      },
      reason: `Selected ${action} based on mentor profile (${mentorProfile.style})`
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
          instruction: 'Acknowledge their engagement with the task, prepare to close'
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
          instruction: 'Restate the task once, briefly. No apology.'
        },
        reason: 'User unclear on task, restating'
      };
    }
    
    // Otherwise, select based on profile
    const action = selectWeightedAction(mentorProfile.actionWeights);
    
    return {
      action: action === 'micro_task' ? 'validate' : action,
      phase: 'task',
      nextPhase: null,
      context: {
        instruction: 'Acknowledge briefly, wait for them to engage with task'
      },
      reason: 'In task phase, minimal intervention'
    };
  }

  // PHASE: INTEGRATION
  if (state.phase === 'integration') {
    // Always close the day in integration
    return {
      action: 'close_day',
      phase: 'integration',
      nextPhase: null,
      context: {
        completesDay: true,
        instruction: 'Warm closing. Name one thing they did today. Brief.'
      },
      reason: 'Integration phase - closing day'
    };
  }

  // Fallback
  return {
    action: 'validate',
    phase: state.phase,
    nextPhase: null,
    context: {
      instruction: 'Simple acknowledgment'
    },
    reason: 'Fallback decision'
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
    userSharedEmotion: false,
    userIndicatedCompletion: false,
    dayTask,
    dayGoal
  };
}
