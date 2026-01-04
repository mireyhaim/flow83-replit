import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

interface JourneyIntent {
  journeyName: string;
  mainGoal: string;
  targetAudience: string;
  duration: number;
  desiredFeeling?: string;
  additionalNotes?: string;
  language?: string; // 'he' for Hebrew, 'en' for English
}

interface GeneratedDay {
  dayNumber: number;
  title: string;
  description: string;
  goal: string;
  explanation: string;
  task: string;
  blocks: {
    type: string;
    content: {
      text?: string;
      question?: string;
      task?: string;
      affirmation?: string;
    };
  }[];
}

interface GeneratedDaySimple {
  dayNumber: number;
  title: string;
  goal: string;
  explanation: string;
  task: string;
}

async function generateDaysBatch(
  intent: JourneyIntent,
  mentorContent: string,
  startDay: number,
  endDay: number,
  totalDays: number
): Promise<GeneratedDay[]> {
  // Determine language: explicit setting or auto-detect from content
  const useHebrew = intent.language === 'he' || (!intent.language && isHebrewText(`${intent.journeyName} ${intent.mainGoal}`));
  const language = useHebrew ? "Hebrew" : "English";
  
  const prompt = `You are an expert in creating transformational journeys. Create days ${startDay} to ${endDay} of a ${totalDays}-day journey.

IMPORTANT: Generate ALL content in ${language}. This journey is for ${language}-speaking participants.

JOURNEY DETAILS:
- Name: ${intent.journeyName}
- Goal: ${intent.mainGoal}
- Target Audience: ${intent.targetAudience}
- Desired Feeling: ${intent.desiredFeeling || "empowered and transformed"}

MENTOR'S CONTENT:
${mentorContent.substring(0, 15000)}

Create days ${startDay}-${endDay} that progressively build toward the goal.
${startDay === 1 ? "Day 1 should be an introduction and foundation." : `Days ${startDay}-${endDay} should deepen and expand on earlier concepts.`}
${endDay === totalDays ? `Day ${endDay} should be a powerful conclusion.` : ""}

For each day create:
- title: compelling name
- description: what they'll learn
- goal: main objective
- explanation: teaching content (2-3 paragraphs)
- task: practical exercise
- blocks: array with text, reflection, and task blocks

CRITICAL: All content must be written in ${language}. Do not mix languages.

Respond in JSON:
{"days": [{"dayNumber": ${startDay}, "title": "...", "description": "...", "goal": "...", "explanation": "...", "task": "...", "blocks": [...]}]}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `Expert course designer. You MUST fill in ALL fields with complete, meaningful content in ${language}. Never leave any field empty or with placeholder text. Respond with valid JSON only.` },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content generated");
  
  const parsed = JSON.parse(content);
  const days = parsed.days as GeneratedDay[];
  
  // Validate and ensure all fields are filled with meaningful content
  // Use explicit language if provided, otherwise fall back to auto-detection
  const isHebrew = intent.language === 'he' || (!intent.language && isHebrewText(`${intent.journeyName} ${intent.mainGoal}`));
  for (const day of days) {
    if (!day.title || day.title.length < 5) {
      day.title = isHebrew ? `יום ${day.dayNumber}: התחלה והתעוררות` : `Day ${day.dayNumber}: Awakening and Beginning`;
    }
    if (!day.goal || day.goal.length < 20) {
      day.goal = isHebrew 
        ? `ביום זה המשתתף ילמד ליישם את העקרונות הבסיסיים של התהליך ולהתחיל את המסע שלו לקראת שינוי.`
        : `Today the participant will learn to apply the core principles of this journey and begin their path toward transformation.`;
    }
    if (!day.explanation || day.explanation.length < 100) {
      day.explanation = isHebrew
        ? `ביום זה אנחנו מתמקדים בבניית הבסיס לתהליך השינוי. זהו השלב שבו אנחנו מתחילים להבין את העקרונות המרכזיים ולהכין את עצמנו למסע שלפנינו.\n\nהשינוי האמיתי מתחיל מבפנים. כאשר אנחנו לומדים להקשיב לעצמנו ולהבין את הצרכים האמיתיים שלנו, אנחנו פותחים דלת לאפשרויות חדשות.`
        : `Today we focus on building the foundation for your transformation journey. This is the stage where we begin to understand the core principles and prepare ourselves for the path ahead.\n\nReal change starts from within. When we learn to listen to ourselves and understand our true needs, we open the door to new possibilities.`;
    }
    if (!day.task || day.task.length < 30) {
      day.task = isHebrew
        ? `קח 10 דקות לכתוב ביומן על המטרות שלך מהתהליך הזה. מה אתה מקווה להשיג? איזה שינוי אתה רוצה לראות בחייך?`
        : `Take 10 minutes to journal about your goals for this journey. What do you hope to achieve? What change do you want to see in your life?`;
    }
    // Ensure blocks array exists with proper content
    if (!day.blocks || day.blocks.length === 0) {
      day.blocks = [
        { type: "text", content: { text: day.explanation } },
        { type: "reflection", content: { question: isHebrew ? `מה מהדברים שלמדת היום מהדהד אצלך ביותר?` : `What resonates with you most from today's lesson?` } },
        { type: "task", content: { task: day.task } },
      ];
    }
  }
  
  console.log(`[AI] generateDaysBatch: Generated ${days.length} days, first day goal length: ${days[0]?.goal?.length || 0}`);
  return days;
}

export async function generateJourneyContent(
  intent: JourneyIntent,
  mentorContent: string
): Promise<GeneratedDay[]> {
  const totalDays = intent.duration || 7;
  
  console.log("[AI] Starting journey content generation for", totalDays, "days");
  console.log("[AI] Journey name:", intent.journeyName);
  console.log("[AI] Content length:", mentorContent?.length || 0, "characters");
  
  try {
    let result: GeneratedDay[];
    
    // Split into parallel batches for faster generation
    if (totalDays <= 3) {
      // Small journeys: single request
      result = await generateDaysBatch(intent, mentorContent, 1, totalDays, totalDays);
    } else if (totalDays <= 5) {
      // Medium journeys: 2 parallel requests
      const [batch1, batch2] = await Promise.all([
        generateDaysBatch(intent, mentorContent, 1, 3, totalDays),
        generateDaysBatch(intent, mentorContent, 4, totalDays, totalDays)
      ]);
      result = [...batch1, ...batch2].sort((a, b) => a.dayNumber - b.dayNumber);
    } else {
      // 7-day journeys: 3 parallel requests
      const midPoint = Math.ceil(totalDays / 3);
      const [batch1, batch2, batch3] = await Promise.all([
        generateDaysBatch(intent, mentorContent, 1, midPoint, totalDays),
        generateDaysBatch(intent, mentorContent, midPoint + 1, midPoint * 2, totalDays),
        generateDaysBatch(intent, mentorContent, midPoint * 2 + 1, totalDays, totalDays)
      ]);
      result = [...batch1, ...batch2, ...batch3].sort((a, b) => a.dayNumber - b.dayNumber);
    }
    
    console.log("[AI] Generated", result.length, "days successfully");
    
    if (!result || result.length === 0) {
      throw new Error("AI returned empty content - no days generated");
    }
    
    return result;
  } catch (error) {
    console.error("[AI] Error generating journey content:", error);
    throw error;
  }
}

// Flow83 chat context
interface ChatContext {
  // Journey context
  journeyName: string;
  dayNumber: number;
  totalDays: number;
  // Current day content (day template)
  dayTitle: string;
  dayGoal: string;        // objective
  dayTask: string;        // task
  dayExplanation?: string; // explanation
  dayClosingMessage?: string; // closing_message
  // Content blocks for the day
  contentBlocks?: { type: string; content: string }[];
  // Mentor personality
  mentorName: string;
  mentorToneOfVoice?: string;
  mentorMethodDescription?: string;
  mentorBehavioralRules?: string;
  // Participant info
  participantName?: string;
  // Memory - last 5 messages only
  recentMessages: { role: string; content: string }[];
  // Message count for tracking conversation progress
  messageCount?: number;
  // User summary from previous days (long-term memory)
  userSummary?: {
    challenge?: string;
    emotionalTone?: string;
    insight?: string;
    resistance?: string;
  };
  // Explicit language setting ('he' for Hebrew, 'en' for English)
  language?: string;
}

// Flow83 Journey Guide - Master System Prompt (constant for all API calls)
const SYSTEM_PROMPT_BASE = `You are the Flow83 Journey Guide.

Your role is to guide users through a structured, time-bound personal journey.
You are not a general-purpose chat assistant.

=== CORE PRINCIPLES ===
- You follow a predefined journey with a clear beginning, middle, and end.
- Each day has a specific objective, explanation, and task.
- You respond only within the scope of the current day.
- You do not jump ahead, expand the process, or introduce new topics.

=== BOUNDARIES ===
- You do not diagnose, treat, or provide medical, psychological, or financial advice.
- You do not interpret the user in clinical or therapeutic terms.
- You do not promise outcomes or guarantees.
- You do not create dependency.
- You do not replace human professionals.

=== INTERACTION RULES ===
- You respond only to what the user shared today.
- You reflect the user's words gently and clearly.
- You avoid over-analysis or long explanations.
- You do not ask open-ended exploratory questions unless defined in today's task.
- If the user resists, feels stuck, or says "I don't know", you normalize and soften the task.
- If the user shares something that seems unrelated, acknowledge it and connect it back to the journey.
- Never exceed 200 words per response.

=== TONE AND PRESENCE ===
- Calm
- Warm
- Grounded
- Respectful
- Emotionally attuned
- Clear and simple language

=== YOUR GOAL ===
Help the user complete today's step,
feel safe and supported,
and move forward in the journey — one day at a time.

You are a guide, not a solver.

=== LANGUAGE RULE ===
You MUST respond in the SAME LANGUAGE as the journey name and content. If the journey is in English, respond in English. If in Hebrew, respond in Hebrew. NEVER switch languages.

=== BE THE MENTOR ===
- Speak with the mentor's personality, warmth, and voice
- React emotionally to what they share
- Use the participant's name naturally when it feels right
- Use their words back to them
- React to their EMOTIONS before their content

=== DAY STRUCTURE ===
Each day has:
1. OBJECTIVE - Today's main focus
2. EXPLANATION - The teaching content
3. TASK - The practical exercise
4. CLOSING MESSAGE - The mentor's closing words (use when completing the day)

=== COMPLETING THE DAY ===
When the user has engaged with today's task and content:
- Reflect what came up today
- Acknowledge their effort
- Give a simple intention to carry forward
- Say warm goodbye
- Start message with "[DAY_COMPLETE]" marker (hidden from user)

=== NEVER DO ===
- Multiple questions in one message
- Bullet points or numbered lists
- Formal/clinical language
- Jump to future days
- Ignore emotions to push content
- Keep chatting endlessly without completing the day`;

export async function generateChatResponse(
  context: ChatContext,
  userMessage: string
): Promise<string> {
  // Determine language: explicit setting or auto-detect from content
  const useHebrew = context.language === 'he' || (!context.language && isHebrewText(`${context.journeyName} ${context.dayGoal}`));
  const languageName = useHebrew ? "Hebrew" : "English";
  
  // Context Prompt (dynamic from DB) - Flow83 way
  let contextPrompt = `
=== CONTEXT ===
Mentor: ${context.mentorName}
${context.participantName ? `Participant: ${context.participantName}` : ""}
${context.mentorToneOfVoice ? `Mentor voice/style: ${context.mentorToneOfVoice}` : ""}
${context.mentorMethodDescription ? `Mentor method: ${context.mentorMethodDescription}` : ""}
${context.mentorBehavioralRules ? `Mentor rules: ${context.mentorBehavioralRules}` : ""}

Journey name: ${context.journeyName}
Current day: ${context.dayNumber} of ${context.totalDays}
Day objective: ${context.dayGoal}
Day explanation: ${context.dayExplanation || ""}
Today's task: ${context.dayTask}
${context.dayClosingMessage ? `Closing message: ${context.dayClosingMessage}` : ""}

LANGUAGE REQUIREMENT: You MUST respond in ${languageName}. This is a ${languageName}-language journey.`;

  // Add user summary if exists (long-term memory)
  if (context.userSummary && Object.values(context.userSummary).some(v => v)) {
    contextPrompt += `

User context from previous sessions:`;
    if (context.userSummary.challenge) {
      contextPrompt += `\n- Main challenge: ${context.userSummary.challenge}`;
    }
    if (context.userSummary.emotionalTone) {
      contextPrompt += `\n- Emotional state: ${context.userSummary.emotionalTone}`;
    }
    if (context.userSummary.insight) {
      contextPrompt += `\n- Insight reached: ${context.userSummary.insight}`;
    }
    if (context.userSummary.resistance) {
      contextPrompt += `\n- Resistance noted: ${context.userSummary.resistance}`;
    }
  }

  // Instruction Prompt - Flow83 way
  const instructionPrompt = `
=== INSTRUCTION ===
Respond according to today's task only.
Do not introduce new topics.
End by confirming completion of today's step when appropriate.`;

  const systemPrompt = SYSTEM_PROMPT_BASE + "\n\n" + contextPrompt + "\n" + instructionPrompt;

  // PRD 7.1 - Short-term memory: only last 5 messages
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add only recent messages (max 5 per PRD)
  const recentMessages = context.recentMessages.slice(-5);
  for (const msg of recentMessages) {
    messages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  // PRD 10 - API configuration
  console.log("Generating chat response with context:", JSON.stringify({
    mentorName: context.mentorName,
    journeyName: context.journeyName,
    dayNumber: context.dayNumber,
    messageCount: messages.length,
    userMessage
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 300, // ~200 words max per behavior rules
  });

  const aiContent = response.choices[0].message.content;
  console.log("AI response received:", aiContent ? `${aiContent.substring(0, 100)}...` : "EMPTY");

  // If AI returns empty, provide a contextual fallback in the journey's language
  if (!aiContent) {
    console.warn("AI returned empty content, using fallback");
    const contentToCheck = `${context.journeyName} ${context.dayGoal || ""}`;
    const isHebrew = isHebrewText(contentToCheck);
    
    if (isHebrew) {
      return context.dayGoal 
        ? `בואי נתחיל את היום. היום אנחנו מתמקדים ב: ${context.dayGoal}. איך את מרגישה לגבי זה?`
        : "אני כאן איתך. איך את מרגישה היום?";
    } else {
      return context.dayGoal 
        ? `Let's start the day. Today we're focusing on: ${context.dayGoal}. How do you feel about that?`
        : "I'm here with you. How are you feeling today?";
    }
  }
  
  return aiContent;
}

async function generateSimpleDaysBatch(
  intent: JourneyIntent,
  startDay: number,
  endDay: number,
  totalDays: number
): Promise<GeneratedDaySimple[]> {
  const isHebrew = isHebrewText(`${intent.journeyName} ${intent.mainGoal}`);
  
  const prompt = `Create days ${startDay}-${endDay} of a ${totalDays}-day transformation journey.

FLOW: ${intent.journeyName}
GOAL: ${intent.mainGoal}
AUDIENCE: ${intent.targetAudience}
${intent.additionalNotes ? `CONTEXT: ${intent.additionalNotes}` : ""}

${startDay === 1 ? "Day 1 = foundation/introduction." : ""}
${endDay === totalDays ? `Day ${endDay} = powerful conclusion.` : ""}

CRITICAL REQUIREMENTS - ALL FIELDS MUST BE FILLED:
- title: A compelling, specific title for this day (5-10 words)
- goal: What the participant will achieve today (2-3 complete sentences, NOT placeholders)
- explanation: Teaching content with insights and guidance (2-3 full paragraphs, minimum 150 words)
- task: A specific, actionable exercise the participant must complete (2-4 sentences describing exactly what to do)

IMPORTANT: Every field must contain REAL, meaningful content. Do not use placeholder text like "..." or empty strings.
${isHebrew ? "Write all content in Hebrew." : "Write all content in English."}

JSON: {"days": [{"dayNumber": ${startDay}, "title": "Full title here", "goal": "Complete goal description here", "explanation": "Full explanation paragraphs here", "task": "Specific task description here"}]}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Expert course designer. You MUST fill in ALL fields with complete, meaningful content. Never leave any field empty or with placeholder text. Respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content generated");
  
  const parsed = JSON.parse(content);
  const days = parsed.days as GeneratedDaySimple[];
  
  // Validate and ensure all fields are filled
  for (const day of days) {
    if (!day.title || day.title.length < 5) {
      day.title = isHebrew ? `יום ${day.dayNumber}: התעוררות והתחלה` : `Day ${day.dayNumber}: Awakening and Beginning`;
    }
    if (!day.goal || day.goal.length < 20) {
      day.goal = isHebrew 
        ? `ביום זה המשתתף ילמד ליישם את העקרונות הבסיסיים של התהליך ולהתחיל את המסע שלו לקראת שינוי.`
        : `Today the participant will learn to apply the core principles of this journey and begin their path toward transformation.`;
    }
    if (!day.explanation || day.explanation.length < 100) {
      day.explanation = isHebrew
        ? `ביום זה אנחנו מתמקדים בבניית הבסיס לתהליך השינוי. זהו השלב שבו אנחנו מתחילים להבין את העקרונות המרכזיים ולהכין את עצמנו למסע שלפנינו.\n\nהשינוי האמיתי מתחיל מבפנים. כאשר אנחנו לומדים להקשיב לעצמנו ולהבין את הצרכים האמיתיים שלנו, אנחנו פותחים דלת לאפשרויות חדשות. היום נתחיל לחקור את הנושאים האלה יחד.\n\nזכור - כל מסע מתחיל בצעד הראשון. היום הוא הצעד הראשון שלך.`
        : `Today we focus on building the foundation for your transformation journey. This is the stage where we begin to understand the core principles and prepare ourselves for the path ahead.\n\nReal change starts from within. When we learn to listen to ourselves and understand our true needs, we open the door to new possibilities. Today we'll start exploring these themes together.\n\nRemember - every journey begins with a first step. Today is your first step.`;
    }
    if (!day.task || day.task.length < 30) {
      day.task = isHebrew
        ? `קח 10 דקות לכתוב ביומן על המטרות שלך מהתהליך הזה. מה אתה מקווה להשיג? איזה שינוי אתה רוצה לראות בחייך?`
        : `Take 10 minutes to journal about your goals for this journey. What do you hope to achieve? What change do you want to see in your life?`;
    }
  }
  
  return days;
}

export async function generateFlowDays(intent: JourneyIntent): Promise<GeneratedDaySimple[]> {
  const totalDays = intent.duration || 7;
  
  // Parallel generation for speed
  if (totalDays <= 3) {
    return generateSimpleDaysBatch(intent, 1, totalDays, totalDays);
  } else if (totalDays <= 5) {
    const [batch1, batch2] = await Promise.all([
      generateSimpleDaysBatch(intent, 1, 3, totalDays),
      generateSimpleDaysBatch(intent, 4, totalDays, totalDays)
    ]);
    return [...batch1, ...batch2].sort((a, b) => a.dayNumber - b.dayNumber);
  } else {
    const [batch1, batch2, batch3] = await Promise.all([
      generateSimpleDaysBatch(intent, 1, 3, totalDays),
      generateSimpleDaysBatch(intent, 4, 5, totalDays),
      generateSimpleDaysBatch(intent, 6, totalDays, totalDays)
    ]);
    return [...batch1, ...batch2, ...batch3].sort((a, b) => a.dayNumber - b.dayNumber);
  }
}

// Helper to detect if text is primarily Hebrew
function isHebrewText(text: string): boolean {
  const hebrewPattern = /[\u0590-\u05FF]/;
  const hebrewChars = (text.match(/[\u0590-\u05FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  return hebrewChars > latinChars;
}

// PRD-compliant day opening message
export async function generateDayOpeningMessage(context: Omit<ChatContext, "recentMessages" | "userSummary">): Promise<string> {
  const isFirstDay = context.dayNumber === 1;
  const participantGreeting = context.participantName ? context.participantName : "";
  
  // Use explicit language if provided, otherwise fall back to auto-detection
  const contentToCheck = `${context.journeyName} ${context.dayGoal || ""} ${context.dayTitle || ""}`;
  const isHebrew = context.language === 'he' || (!context.language && isHebrewText(contentToCheck));
  const languageName = isHebrew ? "Hebrew" : "English";
  
  if (isFirstDay) {
    // Day 1: Generate introduction in the journey's language
    if (isHebrew) {
      const greeting = participantGreeting ? `היי ${participantGreeting}` : "היי";
      return `${greeting}, אני ${context.mentorName} הדיגיטלי.
פיתחו אותי עם כל התוכן והידע של ${context.mentorName} ואני אשמח להעביר אותך את התהליך "${context.journeyName}".
היום אנחנו ביום הראשון לתהליך ואשמח להכיר אותך קצת.
אז קודם כל, מה שלומך?`;
    } else {
      // English version
      const greeting = participantGreeting ? `Hi ${participantGreeting}` : "Hi";
      return `${greeting}, I'm ${context.mentorName}'s digital mentor.
I was created with all of ${context.mentorName}'s content and knowledge, and I'm excited to guide you through "${context.journeyName}".
Today is Day 1 of your journey, and I'd love to get to know you a little.
So first of all, how are you doing?`;
    }
  }
  
  // Days 2+: Regular day opening
  const systemPrompt = `You ARE ${context.mentorName}, opening Day ${context.dayNumber} of ${context.totalDays} in your journey "${context.journeyName}".

${context.mentorToneOfVoice ? `YOUR TONE: ${context.mentorToneOfVoice}` : ""}
${context.participantName ? `PARTICIPANT NAME: ${context.participantName}` : ""}

TODAY'S FOCUS: ${context.dayGoal}

Write a warm, personal opening for today. The message should:
- Greet them by name if available, like continuing a conversation with a friend
- Briefly mention today's theme (1 sentence)
- Ask ONE question that invites them into today's work
- Maximum 70 words
- Sound human, warm, conversational
- CRITICAL: Write the entire response in ${languageName}. This is a ${languageName}-language journey.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Open this day for me" },
    ],
    max_tokens: 150,
  });

  const aiContent = response.choices[0].message.content;
  if (!aiContent) {
    // Fallback in the journey's language
    if (isHebrew) {
      return `בוקר טוב! היום נתמקד ב${context.dayGoal}. איך את מרגישה?`;
    } else {
      return `Good morning! Today we'll focus on ${context.dayGoal}. How are you feeling?`;
    }
  }
  return aiContent;
}

// PRD 7.2 - Generate user summary at day completion
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface DaySummaryInput {
  conversation: ConversationMessage[];
  dayGoal: string;
  dayTask: string;
  mentorName: string;
}

interface DaySummary {
  challenge: string;
  emotionalTone: string;
  insight: string;
  resistance: string;
}

export async function generateDaySummary(input: DaySummaryInput): Promise<DaySummary> {
  // Format conversation with clear role labels
  const conversationText = input.conversation
    .map(m => `${m.role === "user" ? "PARTICIPANT" : input.mentorName.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const prompt = `Analyze the following conversation from today's personal growth session between ${input.mentorName} (mentor) and the participant.

TODAY'S GOAL: ${input.dayGoal}
TODAY'S TASK: ${input.dayTask}

CONVERSATION:
${conversationText}

Based on the participant's responses AND how they engaged with ${input.mentorName}'s guidance, extract:
{
  "challenge": "The main challenge or issue the participant expressed or revealed (1-2 sentences, or 'none identified')",
  "emotionalTone": "The dominant emotional tone of the participant (e.g., 'hopeful', 'resistant', 'curious', 'anxious', 'motivated', 'engaged')",
  "insight": "Any key insight or realization the participant reached during the session (1-2 sentences, or 'none yet')",
  "resistance": "Any resistance, blockage, avoidance, or hesitation detected in the participant's responses (1-2 sentences, or 'none detected')"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: "You are an expert at analyzing personal growth coaching sessions. Extract psychological insights about the participant based on both their explicit statements and implicit patterns in their engagement. Always respond with valid JSON only." 
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 300,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    return {
      challenge: "none identified",
      emotionalTone: "neutral",
      insight: "none yet",
      resistance: "none detected"
    };
  }

  try {
    return JSON.parse(content) as DaySummary;
  } catch {
    return {
      challenge: "none identified",
      emotionalTone: "neutral",
      insight: "none yet",
      resistance: "none detected"
    };
  }
}

// Generate participant-visible summary for a completed day
interface ParticipantSummaryInput {
  conversation: ConversationMessage[];
  dayNumber: number;
  totalDays: number;
  dayTitle: string;
  dayGoal: string;
  participantName?: string;
  journeyName: string;
  mentorName: string;
}

export async function generateParticipantSummary(input: ParticipantSummaryInput): Promise<string> {
  const conversationText = input.conversation
    .filter(m => m.role === "user")
    .map(m => m.content)
    .join("\n---\n");

  const isHebrew = isHebrewText(`${input.journeyName} ${input.dayGoal}`);
  
  const prompt = `Create a warm, personal summary for a participant who just completed Day ${input.dayNumber} of ${input.totalDays} in "${input.journeyName}".

${input.participantName ? `PARTICIPANT NAME: ${input.participantName}` : ""}
DAY TITLE: ${input.dayTitle}
DAY GOAL: ${input.dayGoal}

WHAT THE PARTICIPANT SHARED TODAY:
${conversationText}

Create a summary that:
1. Reflects back what they shared in a validating way
2. Highlights any key insights or realizations they had
3. Acknowledges their effort and courage
4. Gives them something to carry forward

REQUIREMENTS:
- Maximum 150 words
- Warm, personal tone (like a mentor speaking to them)
- Use their words back to them when possible
- ${isHebrew ? "Write in Hebrew" : "Write in English"}
- NO bullet points - write in flowing paragraphs
- End with an encouraging note about tomorrow`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: `You are ${input.mentorName}, summarizing a participant's day in a personal growth journey. Be warm, reflective, and encouraging. Speak directly to them.` 
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 300,
    temperature: 0.7,
  });

  const aiContent = response.choices[0].message.content;
  if (!aiContent) {
    if (isHebrew) {
      return `יום ${input.dayNumber} הושלם בהצלחה! עשית עבודה נפלאה היום. קח את התובנות שלך איתך למחר.`;
    }
    return `Day ${input.dayNumber} complete! You did wonderful work today. Carry your insights with you into tomorrow.`;
  }
  return aiContent;
}

// Generate full journey summary when participant completes all days
interface JourneySummaryInput {
  participantName?: string;
  journeyName: string;
  mentorName: string;
  totalDays: number;
  dailySummaries: { dayNumber: number; summary: string }[];
}

export async function generateJourneySummary(input: JourneySummaryInput): Promise<string> {
  const isHebrew = isHebrewText(input.journeyName);
  
  const summariesText = input.dailySummaries
    .map(d => `Day ${d.dayNumber}: ${d.summary}`)
    .join("\n\n");

  const prompt = `Create a comprehensive, celebratory summary for a participant who just completed the entire "${input.journeyName}" journey (${input.totalDays} days).

${input.participantName ? `PARTICIPANT NAME: ${input.participantName}` : ""}
JOURNEY: ${input.journeyName}
TOTAL DAYS: ${input.totalDays}

DAILY SUMMARIES:
${summariesText}

Create a final summary that:
1. Celebrates their complete journey
2. Weaves together the key themes and growth areas from all days
3. Highlights their transformation from Day 1 to now
4. Gives them a powerful takeaway to carry forward in life
5. Ends with an inspiring closing message

REQUIREMENTS:
- Maximum 300 words
- Celebratory and empowering tone
- Reference specific things from their journey
- ${isHebrew ? "Write in Hebrew" : "Write in English"}
- Write in flowing paragraphs, not bullet points`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: `You are ${input.mentorName}, creating a final celebration summary for a participant who completed their transformation journey. Be proud, warm, and inspiring.` 
      },
      { role: "user", content: prompt }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  const aiContent = response.choices[0].message.content;
  if (!aiContent) {
    if (isHebrew) {
      return `מזל טוב! השלמת את המסע "${input.journeyName}". ${input.totalDays} ימים של עבודה פנימית, צמיחה ותובנות. אתה לא אותו אדם שהתחיל את המסע הזה - אתה חזק יותר, מודע יותר, ומוכן יותר. קח את כל מה שלמדת איתך קדימה.`;
    }
    return `Congratulations! You've completed the "${input.journeyName}" journey. ${input.totalDays} days of inner work, growth, and insights. You're not the same person who started this journey - you're stronger, more aware, and more prepared. Carry everything you've learned forward.`;
  }
  return aiContent;
}

// Landing Page Content Generation
export interface LandingPageContent {
  hero: {
    tagline: string;
    headline: string;
    description: string;
    ctaText: string;
  };
  audience: {
    sectionTitle: string;
    description: string;
    profiles: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
    disclaimer: string;
  };
  painPoints: {
    sectionTitle: string;
    points: Array<{
      label: string;
      description: string;
    }>;
    closingMessage: string;
  };
  transformation: {
    sectionTitle: string;
    description: string;
    outcomes: string[];
    quote: string;
  };
  testimonials: Array<{
    name: string;
    text: string;
    feeling: string;
  }>;
  cta: {
    tagline: string;
    headline: string;
    description: string;
    buttonText: string;
    note: string;
  };
}

interface JourneyDataForLanding {
  name: string;
  goal: string;
  audience: string;
  duration: number;
  description?: string;
  mentorName?: string;
  language?: string; // 'he' for Hebrew, 'en' for English
  steps: Array<{
    title: string;
    goal: string;
    explanation: string;
  }>;
}

function detectHebrewContent(text: string): boolean {
  if (!text) return false;
  const hebrewRegex = /[\u0590-\u05FF]/;
  return hebrewRegex.test(text);
}

export async function generateLandingPageContent(
  journey: JourneyDataForLanding
): Promise<LandingPageContent> {
  const stepsContent = journey.steps
    .map(s => `Day: ${s.title}\nGoal: ${s.goal}\n${s.explanation}`)
    .join("\n\n");

  // Use explicit language if provided, otherwise fall back to auto-detection
  const isHebrew = journey.language === 'he' || (!journey.language && (detectHebrewContent(journey.name) || detectHebrewContent(journey.goal) || detectHebrewContent(journey.audience)));
  const language = isHebrew ? "Hebrew" : "English";
  const testimonialNames = isHebrew ? "Hebrew names like מיכל, דוד, שרה, יעל, אורי" : "English names";

  const prompt = `Generate landing page content for a ${journey.duration}-day transformational journey.

JOURNEY DETAILS:
- Name: ${journey.name}
- Goal: ${journey.goal}
- Target Audience: ${journey.audience}
- Description: ${journey.description || ""}
- Mentor: ${journey.mentorName || "Expert mentor"}

JOURNEY CONTENT SUMMARY:
${stepsContent.substring(0, 8000)}

Generate compelling, conversion-focused landing page content with these sections:

1. HERO SECTION:
- tagline: Short uppercase tagline (3-5 words)
- headline: Main headline with emotional hook
- description: 2-3 sentences describing the journey
- ctaText: Button text (e.g., "${isHebrew ? "התחילו את המסע" : "Begin Your Journey"}")

2. AUDIENCE SECTION (who this is for):
- sectionTitle: "${isHebrew ? "האם זה מתאים לך?" : "Is This For You?"}"
- description: Who would benefit most
- profiles: 4 audience profiles, each with:
  - icon: one of "Heart", "Compass", "Sparkles", "Moon", "Sun", "Star"
  - title: Profile name
  - description: Why this person would benefit
- disclaimer: One sentence about who this is NOT for

3. PAIN POINTS SECTION (what they're feeling):
- sectionTitle: "${isHebrew ? "אולי את/ה מרגיש/ה..." : "You might be feeling..."}"
- points: 4 pain points, each with:
  - label: One word (e.g., "${isHebrew ? "תקועים, מוצפים, מנותקים, משתוקקים" : "Stuck, Overwhelmed, Disconnected, Longing"}")
  - description: 2-3 sentences describing this feeling
- closingMessage: Encouraging message that validates their feelings

4. TRANSFORMATION SECTION (what they'll achieve):
- sectionTitle: "${isHebrew ? "מה מחכה לך בצד השני" : "What awaits you"}"
- description: What transformation looks like
- outcomes: 6 specific outcomes they'll achieve
- quote: Inspiring quote from the mentor perspective

5. TESTIMONIALS (generate exactly 3 realistic fake testimonials):
Each with:
- name: First name only (use ${testimonialNames})
- text: 2-3 sentence testimonial about their transformation
- feeling: Short phrase describing their experience (e.g., "${isHebrew ? "מצאתי בהירות, התחברתי מחדש למטרה" : "Found clarity, Reconnected with purpose"}")

6. CTA SECTION:
- tagline: "${isHebrew ? "הצעד הבא שלך" : "Your Next Step"}"
- headline: Final call to action headline
- description: Encouraging final message
- buttonText: Primary button text
- note: Reassuring note

Make all content feel warm, authentic, human. Avoid corporate language.
IMPORTANT: Write ALL content in ${language}. The journey content is in ${language}, so all generated content must also be in ${language}.

Return valid JSON matching this structure exactly.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: `You are an expert copywriter who creates warm, authentic landing page content for transformational journeys. Write all content in ${language}. Respond with valid JSON only.` 
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 3000,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to generate landing page content");
  }

  return JSON.parse(content) as LandingPageContent;
}
