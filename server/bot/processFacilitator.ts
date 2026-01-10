import type { Journey, JourneyStep, Participant } from "@shared/schema";

export type ConversationState = 
  | "START" 
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
  "אני שומע אותך",
  "אני שומעת אותך",
  "זה יכול להיות",
  "יש כאן אנרגיה",
  "האמת שלך",
  "זה הכל להיום",
  "אני שמח",
  "אני שמחה",
  "זה נפלא",
  "נהדר!",
  "תודה ששיתפת",
  "זה מאוד מובן",
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

export function detectUserIntent(
  userMessage: string, 
  currentState: ConversationState
): FacilitatorOutput["log"]["detected_intent"] {
  const msg = userMessage.toLowerCase();
  
  if (CONFUSION_TRIGGERS_HEBREW.some(t => msg.includes(t))) {
    return "confused";
  }
  
  if (TASK_HELP_TRIGGERS_HEBREW.some(t => msg.includes(t))) {
    return "task_help";
  }
  
  if (SKIP_TRIGGERS_HEBREW.some(t => msg.includes(t))) {
    return "skip";
  }
  
  if (currentState === "CORE_QUESTION") {
    return "answer_core";
  }
  
  if (currentState === "TASK" && msg.length > 20) {
    return "completed";
  }
  
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
  if (intent === "confused" && clarifyCount < 2) {
    return "CLARIFY";
  }
  
  if (intent === "task_help" && taskSupportCount < 1 && 
      (currentState === "TASK" || currentState === "INTERPRET")) {
    return "TASK_SUPPORT";
  }
  
  switch (currentState) {
    case "START":
      return "ORIENTATION";
    
    case "ORIENTATION":
      return "CORE_QUESTION";
    
    case "CORE_QUESTION":
      if (intent === "answer_core" || intent === "emotional") {
        return "INTERPRET";
      }
      return "CORE_QUESTION";
    
    case "CLARIFY":
      return "CORE_QUESTION";
    
    case "INTERPRET":
      return "TASK";
    
    case "TASK":
      if (intent === "completed") {
        return "CLOSURE";
      }
      return "TASK";
    
    case "TASK_SUPPORT":
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
  
  return `You are a Process Facilitator (not a therapist, not a friend).
Your job: lead the user through a structured daily journey with clarity and momentum.
You sound human: direct, warm, confident, practical.

FLOW: ${journey.name}
LANGUAGE: ${language}
TONE: ${dayPlan.tone_profile.style}

NON-NEGOTIABLE RULES:
1) Follow the daily sequence strictly.
2) One Core Question per day. Additional questions only for clarification.
3) Never repeat the exact same instruction twice. If user asks "what do you mean?", rephrase with simpler explanation + example.
4) Never drift into open-ended therapy. Avoid long empathy mirroring.
5) Always connect back to day_goal: "${dayPlan.day_goal}"
6) Keep responses concise unless user is confused.
7) If user gives long emotional share: acknowledge briefly (1 sentence) and pivot to next step.
8) No generic filler phrases.

BANNED BEHAVIORS:
- "Write your truths" or vague spiritual instructions
- Endless reflection loops
- Asking "tell me more" as default
- Diagnosing mental health
- Overusing "I hear you / I feel you"

${dayPlan.persona_signature ? `PERSONA: ${dayPlan.persona_signature}` : ''}

DAY ${dayPlan.day}: ${dayPlan.day_title}
GOAL: ${dayPlan.day_goal}
RULE OF TODAY: ${dayPlan.orientation.rule_of_today}`;
}

export function buildStatePrompt(
  state: ConversationState,
  dayPlan: DayPlan,
  userMessage: string,
  intent: FacilitatorOutput["log"]["detected_intent"]
): string {
  switch (state) {
    case "ORIENTATION":
      return `Generate an ORIENTATION message (2-4 sentences max).
Include: day number (${dayPlan.day}), day_goal, context, and rule_of_today.

Structure:
"יום ${dayPlan.day}. היום אנחנו מתמקדים ב: ${dayPlan.day_goal}.
${dayPlan.orientation.context}
הכלל להיום: ${dayPlan.orientation.rule_of_today}."

Keep it direct and practical. No fluff.`;

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
      return `Generate an INTERPRET message based on user's answer.
User said: "${userMessage}"
Pattern hint: ${dayPlan.guided_interpretation.pattern_hint}
Bridge to task: ${dayPlan.guided_interpretation.bridge_to_task}

Structure:
"מה שאמרת מצביע על ___.
זה חשוב כי בהקשר של ${dayPlan.day_goal}, זה בדרך כלל אומר ___.
בואי נעבור למשימה של היום."

Be specific to what the user said. No generic therapy language.`;

    case "TASK":
      return `Generate a TASK message.

Task details:
- Title: ${dayPlan.task.task_title}
- Time: ${dayPlan.task.time_minutes} minutes
- Instruction: ${dayPlan.task.instruction}
- Question: ${dayPlan.task.task_question}
- Why it matters: ${dayPlan.task.why_it_matters}
- Completion signal: ${dayPlan.task.completion_signal}

Structure:
"משימת היום (כ-${dayPlan.task.time_minutes} דקות):
${dayPlan.task.instruction}
השאלה היחידה: ${dayPlan.task.task_question}
למה זה חשוב היום: ${dayPlan.task.why_it_matters}
כשתסיימי: ${dayPlan.task.completion_signal}"`;

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
      return `Generate a CLOSURE message (2 sentences max).

Acknowledge: ${dayPlan.closure.acknowledge}
Preview: ${dayPlan.closure.preview}

Structure:
"${dayPlan.closure.acknowledge}
${dayPlan.closure.preview}"

Keep it warm but brief.`;

    case "DONE":
      return `The day is complete. Generate a brief closing that encourages the user to return tomorrow.`;

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
