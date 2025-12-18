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

async function generateDaysBatch(
  intent: JourneyIntent,
  mentorContent: string,
  startDay: number,
  endDay: number,
  totalDays: number
): Promise<GeneratedDay[]> {
  const prompt = `You are an expert in creating transformational journeys. Create days ${startDay} to ${endDay} of a ${totalDays}-day journey.

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

Respond in JSON:
{"days": [{"dayNumber": ${startDay}, "title": "...", "description": "...", "goal": "...", "explanation": "...", "task": "...", "blocks": [...]}]}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Expert course designer. Respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4096,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content generated");
  
  return JSON.parse(content).days as GeneratedDay[];
}

export async function generateJourneyContent(
  intent: JourneyIntent,
  mentorContent: string
): Promise<GeneratedDay[]> {
  const totalDays = intent.duration || 7;
  
  // Split into parallel batches for faster generation
  if (totalDays <= 3) {
    // Small journeys: single request
    return generateDaysBatch(intent, mentorContent, 1, totalDays, totalDays);
  } else if (totalDays <= 5) {
    // Medium journeys: 2 parallel requests
    const [batch1, batch2] = await Promise.all([
      generateDaysBatch(intent, mentorContent, 1, 3, totalDays),
      generateDaysBatch(intent, mentorContent, 4, totalDays, totalDays)
    ]);
    return [...batch1, ...batch2].sort((a, b) => a.dayNumber - b.dayNumber);
  } else {
    // 7-day journeys: 3 parallel requests
    const midPoint = Math.ceil(totalDays / 3);
    const [batch1, batch2, batch3] = await Promise.all([
      generateDaysBatch(intent, mentorContent, 1, midPoint, totalDays),
      generateDaysBatch(intent, mentorContent, midPoint + 1, midPoint * 2, totalDays),
      generateDaysBatch(intent, mentorContent, midPoint * 2 + 1, totalDays, totalDays)
    ]);
    return [...batch1, ...batch2, ...batch3].sort((a, b) => a.dayNumber - b.dayNumber);
  }
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
const SYSTEM_PROMPT_BASE = `You ARE the mentor - a real person having a genuine conversation. NOT an AI, NOT a bot, NOT a coach reading from a script. You are THE MENTOR themselves, with all their personality, warmth, and humanity.

BE HUMAN - THIS IS CRITICAL:
- React emotionally to what they share: "וואו, זה מרגש לשמוע", "אני מרגישה אותך", "זה נוגע לי"
- Use their NAME naturally in conversation (not in every message, but when it feels right)
- Share small personal reactions: "זה מזכיר לי...", "אני תמיד אומרת ש..."
- Vary your response style - don't always follow the same pattern
- Use casual language, contractions, natural speech patterns
- Sometimes just acknowledge without asking a question
- React to their EMOTIONS before their content: if they share something hard, empathize first

CONVERSATION STYLE:
- Like texting with a wise, caring friend who happens to be a mentor
- Short sentences, natural rhythm, breathing room
- NO bullet points, NO numbered lists, NO formal structure
- One thought leads naturally to another
- Maximum 100 words per response - keep it conversational
- NEVER sound like you're reading from a script or following a formula

RESPOND TO WHAT THEY ACTUALLY SAY:
- Reference specific things they mentioned
- Use their words back to them
- Ask follow-up questions based on what THEY said, not scripted questions
- If they share something emotional, stay with that emotion before moving on

LANGUAGE RULES:
- ALWAYS respond in the SAME LANGUAGE they use (Hebrew → Hebrew, English → English)
- Match their formality level and tone

STAY FOCUSED ON TODAY:
- Focus on today's specific goal - don't jump to future days
- But weave in today's content naturally, don't announce it
- If they mention future topics, gently guide back: "זה מעניין, נגיע לזה בהמשך. עכשיו אני סקרנית לשמוע..."

DAY 1 - FIRST MEETING:
This is your first time meeting them. Build genuine connection:
1. After they answer "מה שלומך" → Respond warmly, then: "אשמח שתספרי לי על עצמך, זה יעזור לי להכיר אותך יותר"
2. After they share about themselves → Reflect what you heard genuinely, then ask what brought them here
3. After they share hopes → Validate warmly, THEN naturally transition to today's focus
- Don't rush! Connection first, content later
- ONE question per message, respond to their answer before asking the next

DAY 2+ - CONTINUING RELATIONSHIP:
- Greet them warmly, maybe reference something from previous days
- You already know them - continue building on that relationship
- Introduce today's focus naturally in conversation

NEVER DO:
- Multiple questions in one message
- Bullet points or numbered lists
- Formal/clinical language
- "Today we will focus on..." (too robotic)
- Ignoring their emotions to push content
- Generic responses that could apply to anyone

GOAL COMPLETION:
When they've genuinely engaged with today's work, wrap up naturally:
- Summarize what came up (in your words, personally)
- Acknowledge their effort
- Give simple homework/intention
- Warm closing inviting them back
- Start with "[DAY_COMPLETE]" marker (system use only)
Don't wrap up early - make sure they've actually done the work.`;

export async function generateChatResponse(
  context: ChatContext,
  userMessage: string
): Promise<string> {
  // PRD 8.2 - Build dynamic prompt
  let dynamicContext = `
YOU ARE: ${context.mentorName}
${context.participantName ? `PARTICIPANT NAME: ${context.participantName} (use naturally in conversation when it feels right)` : ""}
${context.mentorToneOfVoice ? `YOUR VOICE/STYLE: ${context.mentorToneOfVoice}` : ""}
${context.mentorMethodDescription ? `YOUR METHOD: ${context.mentorMethodDescription}` : ""}
${context.mentorBehavioralRules ? `YOUR RULES: ${context.mentorBehavioralRules}` : ""}

JOURNEY: ${context.journeyName}
DAY: ${context.dayNumber} of ${context.totalDays}

TODAY'S THEME: ${context.dayGoal}
TODAY'S ACTIVITY: ${context.dayTask}
${context.dayExplanation ? `BACKGROUND: ${context.dayExplanation}` : ""}`;

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

async function generateSimpleDaysBatch(
  intent: JourneyIntent,
  startDay: number,
  endDay: number,
  totalDays: number
): Promise<GeneratedDaySimple[]> {
  const prompt = `Create days ${startDay}-${endDay} of a ${totalDays}-day transformation journey.

FLOW: ${intent.journeyName}
GOAL: ${intent.mainGoal}
AUDIENCE: ${intent.targetAudience}
${intent.additionalNotes ? `CONTEXT: ${intent.additionalNotes}` : ""}

${startDay === 1 ? "Day 1 = foundation/introduction." : ""}
${endDay === totalDays ? `Day ${endDay} = powerful conclusion.` : ""}

For each day: title, goal (1-2 sentences), explanation (2-3 paragraphs), task (specific exercise).

JSON: {"days": [{"dayNumber": 1, "title": "...", "goal": "...", "explanation": "...", "task": "..."}]}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Expert course designer. Respond with valid JSON only." },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 3000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content generated");
  
  return JSON.parse(content).days as GeneratedDaySimple[];
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
  steps: Array<{
    title: string;
    goal: string;
    explanation: string;
  }>;
}

export async function generateLandingPageContent(
  journey: JourneyDataForLanding
): Promise<LandingPageContent> {
  const stepsContent = journey.steps
    .map(s => `Day: ${s.title}\nGoal: ${s.goal}\n${s.explanation}`)
    .join("\n\n");

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
- ctaText: Button text (e.g., "Begin Your Journey")

2. AUDIENCE SECTION (who this is for):
- sectionTitle: "Is This For You?"
- description: Who would benefit most
- profiles: 4 audience profiles, each with:
  - icon: one of "Heart", "Compass", "Sparkles", "Moon", "Sun", "Star"
  - title: Profile name
  - description: Why this person would benefit
- disclaimer: One sentence about who this is NOT for

3. PAIN POINTS SECTION (what they're feeling):
- sectionTitle: "You might be feeling..."
- points: 4 pain points, each with:
  - label: One word (e.g., "Stuck", "Overwhelmed", "Disconnected", "Longing")
  - description: 2-3 sentences describing this feeling
- closingMessage: Encouraging message that validates their feelings

4. TRANSFORMATION SECTION (what they'll achieve):
- sectionTitle: "What awaits you"
- description: What transformation looks like
- outcomes: 6 specific outcomes they'll achieve
- quote: Inspiring quote from the mentor perspective

5. TESTIMONIALS (generate exactly 3 realistic fake testimonials):
Each with:
- name: First name only (use English names)
- text: 2-3 sentence testimonial about their transformation
- feeling: Short phrase describing their experience (e.g., "Found clarity", "Reconnected with purpose")

6. CTA SECTION:
- tagline: "Your Next Step"
- headline: Final call to action headline
- description: Encouraging final message
- buttonText: Primary button text
- note: Reassuring note

Make all content feel warm, authentic, human. Avoid corporate language.
IMPORTANT: Always write ALL content in English, regardless of the input language.

Return valid JSON matching this structure exactly.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: "You are an expert copywriter who creates warm, authentic landing page content for transformational journeys. ALWAYS write in English regardless of the input language. Respond with valid JSON only." 
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
