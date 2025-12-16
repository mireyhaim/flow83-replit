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
    model: "gpt-5",
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

interface ChatContext {
  journeyName: string;
  dayTitle: string;
  dayDescription: string;
  dayNumber: number;
  mentorBlocks: { type: string; content: any }[];
  messageHistory: { role: string; content: string }[];
}

export async function generateChatResponse(
  context: ChatContext,
  userMessage: string
): Promise<string> {
  const blocksContext = context.mentorBlocks
    .map((b) => {
      if (b.type === "text") return `Content: ${b.content.text || ""}`;
      if (b.type === "reflection") return `Reflection Question: ${b.content.question || ""}`;
      if (b.type === "task") return `Task: ${b.content.task || ""}`;
      if (b.type === "affirmation") return `Affirmation: ${b.content.affirmation || ""}`;
      return "";
    })
    .filter(Boolean)
    .join("\n");

  const historyText = context.messageHistory
    .slice(-10)
    .map((m) => `${m.role === "bot" ? "Bot" : "Participant"}: ${m.content}`)
    .join("\n");

  const systemPrompt = `You are a warm and human digital mentor named Flow 83.
You are having a personal conversation with a participant in a transformational journey.

The Journey: ${context.journeyName}
Day ${context.dayNumber}: ${context.dayTitle}
${context.dayDescription}

Today's content:
${blocksContext}

Important guidelines:
- Speak in a warm, personal, and supportive tone
- Use today's content to guide the conversation
- Ask open-ended questions that invite reflection
- Respond to the participant's answers with empathy and depth
- If the participant shares something personal - acknowledge it and respond to it
- Guide the participant to exercises and tasks when appropriate
- Write short to medium responses (2-4 sentences usually)
- Don't be robotic or generic - be human and present`;

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of context.messageHistory.slice(-10)) {
    messages.push({
      role: msg.role === "bot" ? "assistant" : "user",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages,
    max_completion_tokens: 500,
  });

  return response.choices[0].message.content || "I'm here with you. Tell me more.";
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
    model: "gpt-5",
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

export async function generateDayOpeningMessage(context: Omit<ChatContext, "messageHistory">): Promise<string> {
  const blocksContext = context.mentorBlocks
    .map((b) => {
      if (b.type === "text") return `Content: ${b.content.text || ""}`;
      if (b.type === "reflection") return `Reflection Question: ${b.content.question || ""}`;
      if (b.type === "task") return `Task: ${b.content.task || ""}`;
      if (b.type === "affirmation") return `Affirmation: ${b.content.affirmation || ""}`;
      return "";
    })
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are a warm and human digital mentor named Flow 83.
You are opening a new day in a transformational journey with a participant.

The Journey: ${context.journeyName}
Day ${context.dayNumber}: ${context.dayTitle}
${context.dayDescription}

Today's content:
${blocksContext}

Write an opening message for this day.
The message should:
- Warmly greet the participant
- Briefly explain what we're working on today
- Ask an opening question that starts the conversation
- Be personal and warm, not robotic
- Be medium length (3-5 sentences)`;

  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Create an opening message for this day in the journey" },
    ],
    max_completion_tokens: 300,
  });

  return response.choices[0].message.content || `Welcome to Day ${context.dayNumber}!`;
}
