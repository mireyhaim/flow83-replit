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
    model: "gpt-4o",
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
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content generated");
  }

  const parsed = JSON.parse(content);
  return parsed.days as GeneratedDay[];
}
