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
}

// Flow83 Guide Bot - System Prompt
const SYSTEM_PROMPT_BASE = `You are Flow83 Guide Bot.

Your role is to guide the user through a structured personal journey.
You are NOT a free chat assistant.

=== CORE RULES (MUST FOLLOW) ===
You must:
- Follow the predefined journey structure strictly.
- Respond only within the context of the current day.
- Guide the user gently, emotionally, and clearly.
- Never jump ahead to future days.
- Never diagnose, treat, or give medical, psychological, or financial advice.
- Never ask unrelated questions.
- Never suggest actions outside the journey scope.

Your tone:
- Calm
- Supportive
- Grounded
- Non-judgmental
- Clear and concise

Your goal:
Help the user complete today's task and feel safe, seen, and clear.

=== BEHAVIOR RULES (CHECK BEFORE EVERY RESPONSE) ===
1. Always respond based on:
   - Current day objective
   - Today's explanation
   - User input for today
2. Do not introduce new concepts unless defined in today's content.
3. If the user asks something unrelated:
   - Gently redirect back to today's task.
4. If the user is confused:
   - Re-explain the task in simpler words.
5. If the user resists or says "I don't know":
   - Normalize the resistance.
   - Offer a softer version of the task.
6. Never exceed 200 words per response.

=== LANGUAGE RULE ===
You MUST respond in the SAME LANGUAGE as the journey name and content. Look at the JOURNEY field below - if it's in English, respond ONLY in English. If it's in Hebrew, respond ONLY in Hebrew. NEVER switch languages mid-conversation.

=== BE THE MENTOR (HUMAN PRESENCE) ===
- You ARE the mentor - speak with their personality, warmth, and voice
- React emotionally to what they share
- Use their NAME naturally when it feels right
- Use casual language, natural speech patterns
- React to their EMOTIONS before their content
- Reference specific things they mentioned
- Use their words back to them

=== DAY STRUCTURE (TEMPLATE) ===
Each day has specific content you MUST cover:
1. OBJECTIVE - Today's main focus
2. EXPLANATION - The teaching content
3. TASK - The practical exercise
4. CLOSING MESSAGE - The mentor's closing words (use when completing the day)

Guide them through these elements naturally. After they engage with the task, wrap up the day using the closing message.

=== HANDLING OFF-TOPIC QUESTIONS ===
If the user asks about something unrelated to today's topic, respond like this:
"I hear that this topic is coming up for you.
Right now, we're staying focused on [TODAY'S THEME].
If you'd like, we can explore that in a different process.
For now, let's return to [REDIRECT TO TODAY'S TASK]."

=== DAY 1 - FIRST MEETING ===
Build genuine connection first:
1. After they answer how they're doing → Respond warmly, ask what brought them here
2. After they share → Reflect genuinely, transition to today's focus
- ONE question per message
- Connection first, content later

=== DAY 2+ - CONTINUING ===
- Greet warmly, reference previous days if relevant
- Continue building on the relationship
- Introduce today's focus naturally

=== COMPLETING THE DAY ===
When all of these are true, wrap up:
1. You've covered today's objective
2. You've discussed the explanation/insight
3. They've engaged with or completed the task
4. At least 4-5 meaningful exchanges

When wrapping up:
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
  // PRD 8.2 - Build dynamic prompt
  let dynamicContext = `
YOU ARE: ${context.mentorName}
${context.participantName ? `PARTICIPANT NAME: ${context.participantName} (use naturally in conversation when it feels right)` : ""}
${context.mentorToneOfVoice ? `YOUR VOICE/STYLE: ${context.mentorToneOfVoice}` : ""}
${context.mentorMethodDescription ? `YOUR METHOD: ${context.mentorMethodDescription}` : ""}
${context.mentorBehavioralRules ? `YOUR RULES: ${context.mentorBehavioralRules}` : ""}

JOURNEY: ${context.journeyName}
DAY: ${context.dayNumber} of ${context.totalDays}

TODAY'S OBJECTIVE: ${context.dayGoal}
TODAY'S TASK: ${context.dayTask}
${context.dayExplanation ? `TODAY'S EXPLANATION: ${context.dayExplanation}` : ""}
${context.dayClosingMessage ? `CLOSING MESSAGE (use when completing the day): ${context.dayClosingMessage}` : ""}
${context.contentBlocks && context.contentBlocks.length > 0 ? `
TODAY'S CONTENT TO COVER:
${context.contentBlocks.map((b, i) => `${i + 1}. [${b.type.toUpperCase()}] ${b.content}`).join('\n')}` : ""}
${context.messageCount ? `
CONVERSATION PROGRESS: ${context.messageCount} messages exchanged so far. ${context.messageCount >= 8 ? "You should be wrapping up soon if content is covered." : ""}` : ""}`;

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
  
  // Detect language from journey content (name, goal, day title)
  const contentToCheck = `${context.journeyName} ${context.dayGoal || ""} ${context.dayTitle || ""}`;
  const isHebrew = isHebrewText(contentToCheck);
  
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
