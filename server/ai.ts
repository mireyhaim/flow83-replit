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

export async function generateJourneyContent(
  intent: JourneyIntent,
  mentorContent: string
): Promise<GeneratedDay[]> {
  const prompt = `You are an expert in creating transformational journeys and courses. A mentor/teacher wants to create a ${intent.duration}-day digital journey for their clients.

JOURNEY DETAILS:
- Name: ${intent.journeyName}
- Goal: ${intent.mainGoal}
- Target Audience: ${intent.targetAudience}
- Desired Feeling at End: ${intent.desiredFeeling || "empowered and transformed"}
- Additional Notes: ${intent.additionalNotes || "none"}

MENTOR'S CONTENT AND METHODOLOGY:
${mentorContent}

Based on the mentor's content and methodology above, create a structured ${intent.duration}-day journey. Each day should be a progressive step toward the goal.

For each day, create:
1. A compelling title for that day
2. A description of what participants will learn/experience
3. Content blocks that can include:
   - "text" blocks (teaching content, explanations)
   - "reflection" blocks (questions for self-reflection)
   - "task" blocks (practical exercises or assignments)
   - "affirmation" blocks (positive statements to internalize)

IMPORTANT: Use the mentor's actual teachings, examples, and methodology. Don't invent new content - extract and structure what the mentor has provided.

Respond in JSON format:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Day title",
      "description": "Brief description of this day's focus",
      "blocks": [
        {"type": "text", "content": {"text": "Teaching content..."}},
        {"type": "reflection", "content": {"question": "Reflection question..."}},
        {"type": "task", "content": {"task": "Exercise or task..."}},
        {"type": "affirmation", "content": {"affirmation": "Positive affirmation..."}}
      ]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert course designer who creates transformational journeys. Always respond with valid JSON only, no additional text."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content generated");
  }

  const parsed = JSON.parse(content);
  return parsed.days as GeneratedDay[];
}

// PRD-compliant chat context
interface ChatContext {
  // Journey context
  journeyName: string;
  dayNumber: number;
  totalDays: number;
  // Current day content
  dayTitle: string;
  dayGoal: string;
  dayTask: string;
  dayExplanation?: string;
  // Mentor personality
  mentorName: string;
  mentorToneOfVoice?: string;
  mentorMethodDescription?: string;
  mentorBehavioralRules?: string;
  // Participant info
  participantName?: string;
  // Memory - last 5 messages only
  recentMessages: { role: string; content: string }[];
  // User summary from previous days (long-term memory)
  userSummary?: {
    challenge?: string;
    emotionalTone?: string;
    insight?: string;
    resistance?: string;
  };
}

// PRD 8.1 - Static system prompt base
const SYSTEM_PROMPT_BASE = `You ARE the mentor in this transformational journey. You are not an AI assistant - you embody the mentor's personality, wisdom, and teaching style completely.

YOUR ROLE:
- You ARE the mentor speaking directly to your participant
- You lead and guide the conversation with warmth and intention
- You teach, inspire, and hold space for transformation
- You initiate topics and guide the participant through today's process

CRITICAL RULES:
- ALWAYS respond in the SAME LANGUAGE the participant is using. If they write in Hebrew, respond in Hebrew. If they write in English, respond in English.
- Speak as yourself (the mentor), not as "the mentor" in third person
- Keep responses warm, personal, and conversational - like texting with a caring guide
- Maximum 120 words per response
- Ask at most ONE reflective question per response to deepen the work

STAY STRICTLY FOCUSED ON TODAY:
- You MUST focus ONLY on today's specific goal and task - do not introduce concepts from future days
- Each day has a unique theme. Day 1 might be about "creating safety and setting intentions", Day 2 about "identifying beliefs", etc.
- Even if the participant's response touches on future topics, gently guide them back to TODAY'S specific focus
- Do NOT discuss "beliefs", "patterns", or other advanced topics if today's goal is about something simpler like "creating a safe space"
- Read TODAY'S GOAL carefully and make sure your response directly supports THAT goal, not general coaching

DAY 1 SPECIAL - BUILDING RELATIONSHIP FIRST:
If this is Day 1, you're meeting this person for the first time. Be a human, not a coach:
- Have a REAL conversation - respond to what they say, show curiosity, share a bit about yourself
- Ask follow-up questions naturally based on their answers (not scripted questions)
- Get to know: What do they do? What brought them here? What do they hope for?
- Reflect back what you hear: "That's interesting..." or "I hear you..."
- DO NOT mention today's "goal" or "task" until you've had at least 3-4 back-and-forth exchanges
- DO NOT ask multiple questions at once - one question per message, like a real conversation
- When ready to transition, do it naturally: "Given what you shared about X, I think this journey will really help with..."
The goal is CONNECTION first, content later

- If participant asks unrelated questions, acknowledge briefly then redirect with care
- If participant tries to skip ahead, explain why the current step matters
- Never diagnose or give clinical advice - stay in your teaching method

GOAL COMPLETION & DAY WRAP-UP:
When you sense the participant has genuinely engaged with today's goal and task (shared insights, completed the exercise, or had a meaningful breakthrough), you should wrap up the day with:
1. A brief, warm summary of what came up in today's conversation (2-3 key insights or themes)
2. Acknowledgment of their effort and growth
3. A small "homework" or intention to carry until next time (something simple and actionable)
4. A warm closing that invites them to return tomorrow

When wrapping up, start your message with "[DAY_COMPLETE]" (hidden marker) so the system knows the day is done.
Do NOT wrap up too early - make sure the participant has actually engaged with the material first.`;

export async function generateChatResponse(
  context: ChatContext,
  userMessage: string
): Promise<string> {
  // PRD 8.2 - Build dynamic prompt
  let dynamicContext = `
MENTOR: ${context.mentorName}
${context.mentorToneOfVoice ? `TONE OF VOICE: ${context.mentorToneOfVoice}` : ""}
${context.mentorMethodDescription ? `METHOD: ${context.mentorMethodDescription}` : ""}
${context.mentorBehavioralRules ? `BEHAVIORAL RULES: ${context.mentorBehavioralRules}` : ""}

JOURNEY: ${context.journeyName}
PROGRESS: Day ${context.dayNumber} of ${context.totalDays}

TODAY'S GOAL: ${context.dayGoal}
TODAY'S TASK: ${context.dayTask}
${context.dayExplanation ? `GUIDANCE: ${context.dayExplanation}` : ""}`;

  // Add user summary if exists (long-term memory)
  if (context.userSummary && Object.values(context.userSummary).some(v => v)) {
    dynamicContext += `

USER CONTEXT (from previous sessions):`;
    if (context.userSummary.challenge) {
      dynamicContext += `\n- Main challenge: ${context.userSummary.challenge}`;
    }
    if (context.userSummary.emotionalTone) {
      dynamicContext += `\n- Emotional state: ${context.userSummary.emotionalTone}`;
    }
    if (context.userSummary.insight) {
      dynamicContext += `\n- Insight reached: ${context.userSummary.insight}`;
    }
    if (context.userSummary.resistance) {
      dynamicContext += `\n- Resistance noted: ${context.userSummary.resistance}`;
    }
  }

  const systemPrompt = SYSTEM_PROMPT_BASE + "\n\n" + dynamicContext;

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
    max_tokens: 200, // PRD 9.1 - max tokens 150-200
  });

  const aiContent = response.choices[0].message.content;
  console.log("AI response received:", aiContent ? `${aiContent.substring(0, 100)}...` : "EMPTY");

  // If AI returns empty, provide a contextual fallback
  if (!aiContent) {
    console.warn("AI returned empty content, using fallback");
    return context.dayGoal 
      ? `בואי נתחיל את היום. היום אנחנו מתמקדים ב: ${context.dayGoal}. איך את מרגישה לגבי זה?`
      : "אני כאן איתך. איך את מרגישה היום?";
  }
  
  return aiContent;
}

export async function generateFlowDays(intent: JourneyIntent): Promise<GeneratedDaySimple[]> {
  const prompt = `You are an expert in creating transformational journeys and personal development programs. Create a ${intent.duration}-day flow for the following:

FLOW DETAILS:
- Name: ${intent.journeyName}
- Main Goal: ${intent.mainGoal}
- Target Audience: ${intent.targetAudience}
- Desired Feeling: ${intent.desiredFeeling || "empowered and transformed"}
- Additional Context: ${intent.additionalNotes || "none"}

For each day, create:
1. A title (short, inspiring name for the day)
2. A goal (what the participant will achieve today - 1-2 sentences)
3. An explanation (teaching content, insights, or guidance - 2-3 paragraphs)
4. A task (practical exercise or action to take - be specific)

Make each day build on the previous one, creating a clear progression toward the main goal.
Keep the tone warm, personal, and supportive.

Respond in JSON format:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Day title",
      "goal": "What the participant will achieve today",
      "explanation": "Teaching content and guidance for this day...",
      "task": "Specific exercise or action to take"
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert course designer who creates transformational journeys. Always respond with valid JSON only."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content generated");
  }

  const parsed = JSON.parse(content);
  return parsed.days as GeneratedDaySimple[];
}

// PRD-compliant day opening message
export async function generateDayOpeningMessage(context: Omit<ChatContext, "recentMessages" | "userSummary">): Promise<string> {
  const isFirstDay = context.dayNumber === 1;
  const participantGreeting = context.participantName ? context.participantName : "";
  
  if (isFirstDay) {
    // Day 1: Use EXACT format the user specified - this is a digital mentor introducing itself
    // Format: היי [שם], אני [שם המנטור הדיגיטלי]. פיתחו אותי עם כל התוכן של [שם המנטור] ואני אשמח להעביר אותך תהליך [שם התהליך]. היום אנחנו ביום הראשון לתהליך ואשמח להכיר אותך קצת. אז קודם כל מה שלומך?
    const greeting = participantGreeting ? `היי ${participantGreeting}` : "היי";
    return `${greeting}, אני ${context.mentorName} הדיגיטלי.
פיתחו אותי עם כל התוכן והידע של ${context.mentorName} ואני אשמח להעביר אותך את התהליך "${context.journeyName}".
היום אנחנו ביום הראשון לתהליך ואשמח להכיר אותך קצת.
אז קודם כל, מה שלומך?`;
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
- CRITICAL: Write in the same language as the goal above`;

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
    return `בוקר טוב! היום נתמקד ב${context.dayGoal}. איך את מרגישה?`;
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
