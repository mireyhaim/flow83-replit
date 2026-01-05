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
  // Flow building questions - user input about their process
  clientChallenges?: string; // What challenges do the clients face?
  profession?: string; // therapist, coach, healer, mentor, counselor, other
  tone?: string; // warm, professional, direct, gentle, motivating, spiritual
  // Mentor style profile (extracted from uploaded content)
  mentorStyle?: MentorStyleProfile;
  // Mentor profile data (from user profile)
  mentorName?: string;
  mentorSpecialty?: string;
  mentorMethodology?: string;
  mentorUniqueApproach?: string;
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

// Helper function to parse client challenges from various formats
function parseClientChallenges(challengeText: string): string[] {
  if (!challengeText || challengeText.trim().length < 3) return [];
  
  const challenges: string[] = [];
  const seen = new Set<string>();
  
  // Normalize text - replace multiple spaces with single space
  let normalized = challengeText.replace(/\s+/g, ' ').trim();
  
  // Check if text contains conjunction patterns that need splitting
  const hasConjunctions = /\s+(וגם|ועם|ו[א-ת]|and|&)\s+/i.test(normalized) || /,\s+[a-zA-Zא-ת]/.test(normalized);
  
  // For short inputs with NO conjunctions, return as-is
  if (normalized.length < 30 && !normalized.includes('\n') && !hasConjunctions) {
    return [normalized];
  }
  
  // Pre-process: Insert SEPARATOR marker at conjunction points
  // We'll just mark the split point - the words after split are preserved
  const SEP = '||SEP||';
  normalized = normalized
    // Hebrew patterns - mark split point
    .replace(/\s+וגם\s+עם\s+/g, SEP)   // " וגם עם X" -> SEP + X (strips conjunction)
    .replace(/\s+וגם\s+/g, SEP)        // " וגם X" -> SEP + X
    .replace(/\s+ועם\s+/g, SEP)        // " ועם X" -> SEP + X
    .replace(/\s+ו(?=[א-ת]{3,})/g, SEP) // " וX" -> SEP + X
    // English patterns
    .replace(/\s+and also\s+/gi, SEP)   // " and also X" -> SEP + X
    .replace(/,\s+and\s+/gi, SEP)       // ", and X" -> SEP + X
    .replace(/\s+and\s+(?=[a-z]{3,})/gi, SEP)  // " and X" -> SEP + X
    .replace(/\s+&\s+/g, SEP)           // " & " -> SEP
    // Comma-separated lists (comma followed by space and word)
    .replace(/,\s+(?=[a-zA-Zא-ת]{3,})/g, SEP);  // ", X" -> SEP + X
  
  // Split by separator or other patterns: newlines, numbered patterns, semicolons
  const splitPattern = /\|\|SEP\|\||\n+|(?<=[^\d])[;，]\s*|\s*\d+[.)]\s+|\s*[-•]\s+/;
  const segments = normalized.split(splitPattern).filter(s => s.trim().length >= 3);
  
  // Helper to clean ONLY leading punctuation, NOT Hebrew/English words
  const cleanSegment = (text: string): string => {
    return text.replace(/^[\d.\-\*\•;\,，]+\s*/, '').trim();
  };
  
  for (const segment of segments) {
    // Clean up the segment - remove only leading punctuation
    let cleaned = cleanSegment(segment);
    
    // If segment is still too long (>150 chars), try to split further
    if (cleaned.length > 150) {
      // Try splitting by sentence boundaries, or challenge keywords
      const subPattern = /[.!?]\s+|;\s*|\s+אתגר\s+|\s+challenge\s+/i;
      const subChallenges = cleaned.split(subPattern).filter(s => s.trim().length >= 3);
      if (subChallenges.length > 1) {
        for (const sub of subChallenges.slice(0, 7)) {
          const core = sub.trim().length > 100 ? sub.substring(0, 100).trim() : sub.trim();
          const key = core.toLowerCase();
          if (core.length >= 3 && !seen.has(key)) {
            seen.add(key);
            challenges.push(core);
          }
        }
        continue;
      }
    }
    
    // Extract the core challenge - first sentence or first 100 chars
    const coreChallenge = cleaned.length > 100 
      ? (cleaned.split(/[.!?:]\s/)[0] || cleaned.substring(0, 100)).trim()
      : cleaned;
    
    const key = coreChallenge.toLowerCase();
    if (coreChallenge.length >= 3 && !seen.has(key)) {
      seen.add(key);
      challenges.push(coreChallenge);
    }
  }
  
  // Fallback: if still no challenges, try splitting by sentences
  if (challenges.length === 0 && challengeText.length >= 3) {
    const sentences = challengeText.split(/[.!?]\s+/).filter(s => s.trim().length >= 3);
    for (const sentence of sentences.slice(0, 7)) {
      const core = sentence.trim().length > 100 ? sentence.substring(0, 100).trim() : sentence.trim();
      if (core.length >= 3) {
        challenges.push(core);
      }
    }
  }
  
  // Ultimate fallback - take first 150 chars as one challenge
  if (challenges.length === 0 && challengeText.trim().length >= 3) {
    challenges.push(challengeText.substring(0, 150).trim());
  }
  
  console.log(`[AI] Parsed ${challenges.length} challenges from text: ${challenges.map(c => c.substring(0, 30) + '...').join(', ')}`);
  return challenges;
}

// Mentor methodology map - comprehensive extraction from uploaded content
export interface MentorMethodologyMap {
  // Core pillars of the mentor's method (3-7 main concepts)
  pillars: {
    name: string;
    description: string;
    keyTeachings: string[];
  }[];
  // Transformation stages the mentor guides through
  transformationStages: {
    stage: number;
    name: string;
    focus: string;
    expectedShift: string;
  }[];
  // Specific practices/exercises from the content
  practices: {
    name: string;
    type: string; // 'meditation', 'journaling', 'reflection', 'action', 'visualization'
    instructions: string;
    purpose: string;
  }[];
  // Mentor's voice characteristics
  voice: {
    toneOfVoice: string;
    signaturePhrases: string[];
    teachingApproach: string;
  };
  // Core philosophy
  philosophy: {
    mainBeliefs: string[];
    worldview: string;
    transformationPromise: string;
  };
  // Language
  language: string;
}

// Legacy interface for backward compatibility
export interface MentorStyleProfile {
  toneOfVoice: string;
  keyPhrases: string[];
  teachingStyle: string;
  corePhilosophy: string;
  contentSummary: string;
  language: string;
  // New: full methodology map
  methodologyMap?: MentorMethodologyMap;
}

// Analyze a chunk of mentor content - extract pillars, practices, and teachings
async function analyzeContentChunkDeep(content: string, chunkNumber: number, totalChunks: number, languageName: string): Promise<{
  pillars: { name: string; keyTeachings: string[] }[];
  practices: { name: string; type: string; instructions: string }[];
  phrases: string[];
  beliefs: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: `You are an expert at extracting methodology and teaching structures from educational content. Write all output in ${languageName}. Respond with valid JSON only.` 
      },
      { 
        role: "user", 
        content: `Analyze this mentor's content (part ${chunkNumber}/${totalChunks}) and extract:

1. pillars: Core concepts/pillars of their methodology. For each, give the concept name and 2-3 key teachings.
2. practices: Any specific exercises, meditations, journaling prompts, or activities they describe. Include name, type (meditation/journaling/reflection/action/visualization), and brief instructions.
3. phrases: Unique expressions, quotes, or phrases the mentor uses (exact quotes when possible).
4. beliefs: Core beliefs or worldview statements the mentor expresses.

Content to analyze:
${content}

Respond in JSON:
{
  "pillars": [{"name": "concept name", "key_teachings": ["teaching 1", "teaching 2"]}],
  "practices": [{"name": "practice name", "type": "meditation|journaling|reflection|action|visualization", "instructions": "brief instructions"}],
  "phrases": ["exact phrase 1", "exact phrase 2"],
  "beliefs": ["belief 1", "belief 2"]
}` 
      }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 1500,
  });

  const result = response.choices[0].message.content;
  if (!result) {
    return { pillars: [], practices: [], phrases: [], beliefs: [] };
  }
  
  try {
    const parsed = JSON.parse(result);
    return {
      pillars: (parsed.pillars || []).map((p: any) => ({
        name: p.name || "",
        keyTeachings: p.key_teachings || []
      })),
      practices: (parsed.practices || []).map((p: any) => ({
        name: p.name || "",
        type: p.type || "reflection",
        instructions: p.instructions || ""
      })),
      phrases: parsed.phrases || [],
      beliefs: parsed.beliefs || []
    };
  } catch {
    return { pillars: [], practices: [], phrases: [], beliefs: [] };
  }
}

// Analyze full mentor content and create a comprehensive methodology map
export async function analyzeMentorContent(content: string, language?: string): Promise<MentorStyleProfile> {
  if (!content || content.trim().length < 100) {
    return {
      toneOfVoice: "",
      keyPhrases: [],
      teachingStyle: "",
      corePhilosophy: "",
      contentSummary: "",
      language: language || "en"
    };
  }

  const detectedLanguage = language || (isHebrewText(content) ? "he" : "en");
  const languageName = detectedLanguage === "he" ? "Hebrew" : "English";

  // Split content into larger chunks for deeper analysis
  const chunkSize = 12000;
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.substring(i, i + chunkSize));
  }

  console.log(`[AI] Deep analyzing mentor content: ${content.length} chars in ${chunks.length} chunks`);

  // Collect all extracted elements from chunks
  const allPillars: { name: string; keyTeachings: string[] }[] = [];
  const allPractices: { name: string; type: string; instructions: string }[] = [];
  const allPhrases: string[] = [];
  const allBeliefs: string[] = [];

  // Analyze chunks in parallel batches
  for (let i = 0; i < chunks.length; i += 3) {
    const batch = chunks.slice(i, i + 3);
    const results = await Promise.all(
      batch.map((chunk, idx) => analyzeContentChunkDeep(chunk, i + idx + 1, chunks.length, languageName))
    );
    
    for (const result of results) {
      allPillars.push(...result.pillars);
      allPractices.push(...result.practices);
      allPhrases.push(...result.phrases);
      allBeliefs.push(...result.beliefs);
    }
  }

  // Deduplicate and consolidate pillars
  const pillarMap = new Map<string, string[]>();
  for (const pillar of allPillars) {
    const existing = pillarMap.get(pillar.name) || [];
    pillarMap.set(pillar.name, [...existing, ...pillar.keyTeachings]);
  }
  const consolidatedPillars = Array.from(pillarMap.entries())
    .map(([name, teachings]) => ({
      name,
      keyTeachings: Array.from(new Set(teachings)).slice(0, 5)
    }))
    .slice(0, 7);

  // Deduplicate practices
  const practiceMap = new Map<string, { type: string; instructions: string }>();
  for (const practice of allPractices) {
    if (practice.name && !practiceMap.has(practice.name)) {
      practiceMap.set(practice.name, { type: practice.type, instructions: practice.instructions });
    }
  }
  const consolidatedPractices = Array.from(practiceMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .slice(0, 10);

  const uniquePhrases = Array.from(new Set(allPhrases)).slice(0, 15);
  const uniqueBeliefs = Array.from(new Set(allBeliefs)).slice(0, 10);

  console.log(`[AI] Extracted: ${consolidatedPillars.length} pillars, ${consolidatedPractices.length} practices, ${uniquePhrases.length} phrases`);

  // Create final synthesis with transformation stages
  const synthesisPrompt = `Based on the following extracted elements from a mentor's educational content, create a comprehensive methodology synthesis.

=== CORE PILLARS/CONCEPTS ===
${consolidatedPillars.map(p => `• ${p.name}: ${p.keyTeachings.join(", ")}`).join("\n")}

=== PRACTICES & EXERCISES ===
${consolidatedPractices.map(p => `• ${p.name} (${p.type}): ${p.instructions}`).join("\n")}

=== SIGNATURE PHRASES ===
${uniquePhrases.join("\n")}

=== CORE BELIEFS ===
${uniqueBeliefs.join("\n")}

=== ORIGINAL CONTENT EXCERPTS ===
${content.substring(0, 4000)}

---

Create a comprehensive methodology profile in ${languageName}:

1. pillars: List the 5-7 main pillars of this methodology. Each with name, description, and key teachings.
2. transformation_stages: Design 4-7 stages of transformation that a participant would go through. Each with stage number, name, focus area, and expected internal shift.
3. practices: List 5-8 specific practices/exercises with name, type, detailed instructions, and purpose.
4. voice: Describe the mentor's tone, list 5-10 signature phrases, and describe their teaching approach.
5. philosophy: List 3-5 main beliefs, describe their worldview, and articulate the transformation promise.

Make this detailed and specific to THIS mentor's actual methodology, not generic coaching concepts.

Respond in JSON.`;

  const synthesisResponse = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: `You are an expert at analyzing and synthesizing educational methodologies. You create detailed, specific profiles that capture a mentor's unique approach. Write all output in ${languageName}. Respond with valid JSON only.` 
      },
      { role: "user", content: synthesisPrompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 4000,
  });

  const synthesisResult = synthesisResponse.choices[0].message.content;
  if (!synthesisResult) {
    return createFallbackProfile(content, detectedLanguage, uniquePhrases, uniqueBeliefs);
  }

  try {
    const parsed = JSON.parse(synthesisResult);
    console.log("[AI] Full methodology map created successfully");
    
    // Build the methodology map
    const methodologyMap: MentorMethodologyMap = {
      pillars: (parsed.pillars || []).map((p: any) => ({
        name: p.name || "",
        description: p.description || "",
        keyTeachings: p.key_teachings || p.keyTeachings || []
      })),
      transformationStages: (parsed.transformation_stages || []).map((s: any) => ({
        stage: s.stage || s.stage_number || 0,
        name: s.name || "",
        focus: s.focus || s.focus_area || "",
        expectedShift: s.expected_shift || s.expectedShift || ""
      })),
      practices: (parsed.practices || []).map((p: any) => ({
        name: p.name || "",
        type: p.type || "reflection",
        instructions: p.instructions || p.detailed_instructions || "",
        purpose: p.purpose || ""
      })),
      voice: {
        toneOfVoice: parsed.voice?.tone || parsed.voice?.tone_of_voice || "",
        signaturePhrases: parsed.voice?.signature_phrases || parsed.voice?.phrases || uniquePhrases,
        teachingApproach: parsed.voice?.teaching_approach || ""
      },
      philosophy: {
        mainBeliefs: parsed.philosophy?.main_beliefs || parsed.philosophy?.beliefs || uniqueBeliefs,
        worldview: parsed.philosophy?.worldview || "",
        transformationPromise: parsed.philosophy?.transformation_promise || ""
      },
      language: detectedLanguage
    };

    // Return profile with methodology map
    return {
      toneOfVoice: methodologyMap.voice.toneOfVoice,
      keyPhrases: methodologyMap.voice.signaturePhrases,
      teachingStyle: methodologyMap.voice.teachingApproach,
      corePhilosophy: methodologyMap.philosophy.worldview,
      contentSummary: buildContentSummary(methodologyMap),
      language: detectedLanguage,
      methodologyMap
    };
  } catch (error) {
    console.error("[AI] Error parsing synthesis result:", error);
    return createFallbackProfile(content, detectedLanguage, uniquePhrases, uniqueBeliefs);
  }
}

function buildContentSummary(map: MentorMethodologyMap): string {
  const pillarsSection = map.pillars.length > 0 
    ? `עמודי התווך: ${map.pillars.map(p => `${p.name} - ${p.description}`).join("; ")}`
    : "";
  
  const stagesSection = map.transformationStages.length > 0
    ? `שלבי טרנספורמציה: ${map.transformationStages.map(s => `${s.stage}. ${s.name} (${s.focus})`).join("; ")}`
    : "";
    
  const practicesSection = map.practices.length > 0
    ? `תרגילים: ${map.practices.map(p => `${p.name} (${p.type})`).join(", ")}`
    : "";
    
  return [pillarsSection, stagesSection, practicesSection, map.philosophy.transformationPromise].filter(Boolean).join("\n\n");
}

function createFallbackProfile(content: string, language: string, phrases: string[], beliefs: string[]): MentorStyleProfile {
  return {
    toneOfVoice: "",
    keyPhrases: phrases,
    teachingStyle: "",
    corePhilosophy: beliefs.join(". "),
    contentSummary: content.substring(0, 8000),
    language
  };
}

// Calculate consistent day-to-pillar/stage/practice mapping
function getDayAssignments(
  map: MentorMethodologyMap,
  dayNumber: number,
  totalDays: number
): { pillar: MentorMethodologyMap['pillars'][0] | null, stage: MentorMethodologyMap['transformationStages'][0] | null, practice: MentorMethodologyMap['practices'][0] | null } {
  const daysPerPillar = map.pillars.length > 0 ? Math.max(1, Math.ceil(totalDays / map.pillars.length)) : 1;
  const daysPerStage = map.transformationStages.length > 0 ? Math.max(1, Math.ceil(totalDays / map.transformationStages.length)) : 1;
  
  const pillarIndex = map.pillars.length > 0 
    ? Math.min(Math.floor((dayNumber - 1) / daysPerPillar), map.pillars.length - 1)
    : -1;
  const pillar = pillarIndex >= 0 ? map.pillars[pillarIndex] : null;
  
  const stageIndex = map.transformationStages.length > 0
    ? Math.min(Math.floor((dayNumber - 1) / daysPerStage), map.transformationStages.length - 1)
    : -1;
  const stage = stageIndex >= 0 ? map.transformationStages[stageIndex] : null;
  
  const practiceIndex = map.practices.length > 0
    ? (dayNumber - 1) % map.practices.length
    : -1;
  const practice = practiceIndex >= 0 ? map.practices[practiceIndex] : null;
  
  return { pillar, stage, practice };
}

// Build journey blueprint that allocates days to pillars and practices
function buildJourneyBlueprint(
  methodologyMap: MentorMethodologyMap,
  totalDays: number,
  startDay: number,
  endDay: number
): string {
  if (methodologyMap.pillars.length === 0) return "";
  
  let blueprint = `=== JOURNEY BLUEPRINT (Days ${startDay}-${endDay}) ===\n`;
  
  for (let day = startDay; day <= endDay; day++) {
    const { pillar, stage, practice } = getDayAssignments(methodologyMap, day, totalDays);
    
    blueprint += `\nDAY ${day}:\n`;
    if (pillar) {
      blueprint += `- Focus Pillar: "${pillar.name}" - ${pillar.description}\n`;
      blueprint += `- Key Teachings: ${pillar.keyTeachings.slice(0, 3).join("; ")}\n`;
    }
    if (stage) {
      blueprint += `- Transformation Stage: "${stage.name}" - ${stage.focus}\n`;
      blueprint += `- Expected Shift: ${stage.expectedShift}\n`;
    }
    if (practice) {
      blueprint += `- REQUIRED Practice: "${practice.name}" (${practice.type})\n`;
      blueprint += `- Practice Instructions: ${practice.instructions}\n`;
      blueprint += `- Practice Purpose: ${practice.purpose}\n`;
    }
  }
  
  return blueprint;
}

async function generateDaysBatch(
  intent: JourneyIntent,
  mentorContent: string,
  startDay: number,
  endDay: number,
  totalDays: number
): Promise<GeneratedDay[]> {
  const useHebrew = intent.language === 'he' || (!intent.language && isHebrewText(`${intent.journeyName} ${intent.mainGoal}`));
  const language = useHebrew ? "Hebrew" : "English";
  
  // Build rich methodology section if available
  let methodologySection = "";
  let journeyBlueprint = "";
  
  if (intent.mentorStyle?.methodologyMap) {
    const map = intent.mentorStyle.methodologyMap;
    
    // Build the journey blueprint for these specific days
    journeyBlueprint = buildJourneyBlueprint(map, totalDays, startDay, endDay);
    
    methodologySection = `
=== MENTOR'S METHODOLOGY MAP ===

CORE PILLARS OF THE METHOD:
${map.pillars.map((p, i) => `${i + 1}. ${p.name}: ${p.description}\n   Key Teachings: ${p.keyTeachings.join("; ")}`).join("\n")}

TRANSFORMATION STAGES:
${map.transformationStages.map(s => `Stage ${s.stage}: ${s.name} - ${s.focus}\n   Expected Shift: ${s.expectedShift}`).join("\n")}

SPECIFIC PRACTICES TO INCLUDE:
${map.practices.map(p => `• ${p.name} (${p.type}): ${p.instructions}\n  Purpose: ${p.purpose}`).join("\n")}

MENTOR'S VOICE:
- Tone: ${map.voice.toneOfVoice}
- Teaching Approach: ${map.voice.teachingApproach}
- SIGNATURE PHRASES (use these exact phrases in the content):
${map.voice.signaturePhrases.map(p => `  "${p}"`).join("\n")}

CORE PHILOSOPHY:
- Worldview: ${map.philosophy.worldview}
- Main Beliefs: ${map.philosophy.mainBeliefs.join("; ")}
- Transformation Promise: ${map.philosophy.transformationPromise}

${journeyBlueprint}

CRITICAL INSTRUCTIONS:
1. You ARE this mentor. Write in their exact voice and use their signature phrases.
2. Each day MUST focus on the assigned pillar and include the assigned practice.
3. The explanation MUST teach from the mentor's actual methodology, not generic coaching.
4. Include specific exercises and reflections from the mentor's practices list.
5. Reference the mentor's beliefs and philosophy throughout.
6. Never generate generic content - everything must come from this methodology.
`;
  } else if (intent.mentorStyle) {
    // Fallback to old style if no methodology map
    const style = intent.mentorStyle;
    methodologySection = `
=== MENTOR'S STYLE ===
Tone: ${style.toneOfVoice}
Teaching Style: ${style.teachingStyle}
Philosophy: ${style.corePhilosophy}
Key Phrases: ${style.keyPhrases?.join(", ")}
Content Summary: ${style.contentSummary}

Write ALL content in this mentor's voice.
`;
  }
  
  // Include content excerpts for DIRECT QUOTING - not just style reference
  const contentLength = mentorContent.length;
  let contentExcerpts = "";
  if (contentLength > 100) {
    // Take meaningful excerpts from different parts of the content
    const excerptSize = Math.min(2500, contentLength);
    const beginning = mentorContent.substring(0, excerptSize);
    const hasMiddle = contentLength > 5000;
    const middle = hasMiddle ? mentorContent.substring(Math.floor(contentLength / 2) - 1000, Math.floor(contentLength / 2) + 1000) : "";
    
    // Adjust quote requirements based on content length
    const quoteRequirement = contentLength > 1000 
      ? "Include at least 2-3 direct quotes per day from this content"
      : "Include at least 1 direct quote per day from this content";
    
    contentExcerpts = `
=== MENTOR'S ORIGINAL CONTENT - USE DIRECTLY! ===
The following is ACTUAL content from the mentor. You MUST:
1. Quote directly from this content (use "..." for direct quotes)
2. Reference specific concepts, examples, and stories mentioned here
3. Use the exact terminology and phrasing the mentor uses
4. ${quoteRequirement}

BEGINNING OF MENTOR'S CONTENT:
${beginning}
${hasMiddle ? `
MORE FROM MENTOR'S CONTENT:
${middle}
` : ""}

CRITICAL: Do not paraphrase or genericize. Copy actual phrases, examples, and teachings from the above content into your output.
`;
  }
  
  // Build mentor profile section from profile data
  let mentorProfileSection = "";
  if (intent.mentorName || intent.mentorSpecialty || intent.mentorMethodology || intent.mentorUniqueApproach) {
    mentorProfileSection = `
=== MENTOR PROFILE ===
${intent.mentorName ? `Name: ${intent.mentorName}` : ""}
${intent.mentorSpecialty ? `Specialty: ${intent.mentorSpecialty}` : ""}
${intent.mentorMethodology ? `Methods/Approaches: ${intent.mentorMethodology}` : ""}
${intent.mentorUniqueApproach ? `Unique Approach: ${intent.mentorUniqueApproach}` : ""}

Use this mentor information to:
1. Reference the mentor by name when appropriate (e.g., "As ${intent.mentorName || 'the mentor'} teaches...")
2. Incorporate their specific methods and approaches into the content
3. Reflect their unique perspective in the explanations
`;
  }
  
  const prompt = `You are creating a deep, transformational ${totalDays}-day journey using the mentor's ACTUAL methodology.

IMPORTANT: Generate ALL content in ${language}.

JOURNEY DETAILS:
- Name: ${intent.journeyName}
- Goal: ${intent.mainGoal}
- Target Audience: ${intent.targetAudience}
- Desired Feeling: ${intent.desiredFeeling || "empowered and transformed"}
${intent.profession ? `- Mentor Profession: ${intent.profession}` : ""}
${intent.tone ? `- Desired Tone: ${intent.tone}` : ""}
${mentorProfileSection}${methodologySection}${contentExcerpts}
${intent.clientChallenges ? `
=== CLIENT CHALLENGES TO ADDRESS (MANDATORY) ===
${intent.clientChallenges}

CRITICAL REQUIREMENT - YOU MUST:
1. Each day MUST explicitly name and address one or more of these specific challenges in the title, goal, or explanation
2. Use the EXACT language the mentor used to describe these challenges (e.g., "בחירה מתוך פחד", "חוסר בהירות פנימית")
3. The explanation MUST include a sentence like: "היום נתמקד באתגר של..." or "Today we address the challenge of..."
4. Connect the methodology to solving THIS SPECIFIC challenge, not just general growth
5. The task/practice MUST help the participant work through this specific challenge

EXAMPLE for Day 1 addressing "בחירה מתוך פחד ולא מתוך רצון":
- Goal: "היום נתמקד באתגר הראשון - 'בחירה מתוך פחד ולא מתוך רצון'. נלמד לזהות מתי את פועלת מפחד..."
- Explanation should open with: "אחד האתגרים המרכזיים שזיהינו הוא בחירה מתוך פחד..."
` : ""}

CREATE DAYS ${startDay}-${endDay}:

=== TRANSFORMATION ARC - CRITICAL FOR REAL GROWTH ===
This is NOT a series of independent lessons. This is ONE continuous journey where each day builds on the previous.

DAY STRUCTURE BASED ON JOURNEY LENGTH:
${totalDays === 7 ? `
- Day 1: OPENING - Set intention, introduce the journey topic "${intent.mainGoal}", create safety and trust
- Days 2-3: AWARENESS - Deepen understanding, identify patterns, explore resistance  
- Days 4-5: BREAKTHROUGH - Challenge old beliefs, practice new ways, take action
- Days 6-7: INTEGRATION - Embody changes, celebrate progress, plan forward
` : `
- Day 1: OPENING - Set intention, introduce "${intent.mainGoal}", identify what needs to change
- Day 2: DEEP WORK - Core transformation, breakthrough moment, new perspective
- Day 3: INTEGRATION - Embody the change, create lasting habits, close the journey
`}

MANDATORY DAY-TO-DAY CONNECTIONS:
${startDay > 1 ? `- Days ${startDay}-${endDay} MUST reference what happened in previous days
- Start each day with: "אתמול/בימים הקודמים גילינו ש..." or "Yesterday/In previous days we discovered..."
- Build on previous insights - don't start fresh each day` : ""}
- End each day with a hint about tomorrow (except the last day): "מחר נמשיך לחקור..." or "Tomorrow we'll continue..."
- Create a sense of continuous journey, like weekly sessions with a real mentor

TOPIC ANCHORING - KEEP "${intent.journeyName}" CENTRAL:
- Every day must explicitly connect back to the main goal: "${intent.mainGoal}"
- The topic should appear in each day's goal and explanation
- Participants should feel they're making progress on THIS specific issue, not generic growth

For each day you MUST include:
- title: compelling name that reflects the pillar/stage focus
- description: what they'll experience (1-2 sentences)
- goal: specific objective tied to the pillar
- explanation: 3-4 paragraphs of teaching content that:
  * Opens by connecting to yesterday's work (except Day 1)
  * Explains the day's pillar using the mentor's EXACT language and quotes
  * Includes 2-3 direct quotes from the mentor's original content (use "..." marks)
  * References specific examples, stories, or concepts from the mentor's materials
  * Anchors everything back to the flow topic: "${intent.mainGoal}"
  * Ends with a bridge to tomorrow's work (except last day)
- task: the specific practice assigned for this day (from the blueprint)
- blocks: array with these block types:
  * type "text" with content.text for teaching content
  * type "reflection" with content.question for self-inquiry
  * type "task" with content.task for the practice

All blocks MUST have a "type" field. Valid types: text, reflection, task, meditation, journaling.

CRITICAL: All content in ${language}. Use the mentor's exact voice, phrases, and methodology. NO generic coaching content.

Respond in JSON:
{"days": [{"dayNumber": ${startDay}, "title": "...", "description": "...", "goal": "...", "explanation": "...", "task": "...", "blocks": [{"type": "text", "content": {"text": "..."}}, ...]}]}`;

  const systemPrompt = intent.mentorStyle?.methodologyMap 
    ? `You embody this specific mentor's voice and methodology. Create transformational content using ONLY their pillars, practices, phrases, and philosophy. Every sentence should sound like it came from their actual teachings. Fill ALL fields with rich, meaningful content in ${language}. Each block MUST have a "type" field. Respond with valid JSON only.`
    : `Expert transformational course designer. Fill ALL fields with meaningful content in ${language}. Each block MUST have a "type" field. Respond with valid JSON only.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 6000,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error("No content generated");
  
  const parsed = JSON.parse(content);
  const days = parsed.days as GeneratedDay[];
  
  // Use explicit language if provided, otherwise fall back to auto-detection
  const isHebrew = intent.language === 'he' || (!intent.language && isHebrewText(`${intent.journeyName} ${intent.mainGoal}`));
  const map = intent.mentorStyle?.methodologyMap;
  
  // Validate and enrich each day using methodology map
  for (const day of days) {
    // Get assigned pillar, stage, and practice using the consistent mapping function
    const { pillar, stage, practice } = map 
      ? getDayAssignments(map, day.dayNumber, totalDays)
      : { pillar: null, stage: null, practice: null };
    
    // Generate methodology-based fallback content if fields are missing
    if (!day.title || day.title.length < 5) {
      if (pillar) {
        day.title = isHebrew ? `יום ${day.dayNumber}: ${pillar.name}` : `Day ${day.dayNumber}: ${pillar.name}`;
      } else {
        day.title = isHebrew ? `יום ${day.dayNumber}` : `Day ${day.dayNumber}`;
      }
    }
    
    if (!day.goal || day.goal.length < 20) {
      if (pillar && stage) {
        day.goal = isHebrew 
          ? `ביום זה נתמקד ב"${pillar.name}" - ${pillar.description}. נעבוד בשלב "${stage.name}" ונחווה ${stage.expectedShift}.`
          : `Today we focus on "${pillar.name}" - ${pillar.description}. We'll work on the "${stage.name}" stage and experience ${stage.expectedShift}.`;
      } else if (pillar) {
        day.goal = isHebrew 
          ? `ביום זה נלמד על "${pillar.name}" - ${pillar.description}. נתרגל את ${pillar.keyTeachings.slice(0, 2).join(" ו")}.`
          : `Today we explore "${pillar.name}" - ${pillar.description}. We'll practice ${pillar.keyTeachings.slice(0, 2).join(" and ")}.`;
      } else {
        day.goal = isHebrew 
          ? `יום ${day.dayNumber} במסע - להתקדם לעבר ${intent.mainGoal}.`
          : `Day ${day.dayNumber} of the journey - progressing toward ${intent.mainGoal}.`;
      }
    }
    
    if (!day.explanation || day.explanation.length < 100) {
      const parts: string[] = [];
      
      if (pillar) {
        parts.push(isHebrew
          ? `היום נתמקד בעקרון "${pillar.name}" - ${pillar.description}.\n\nזהו אחד מעמודי התווך המרכזיים של הגישה הזו. ${pillar.keyTeachings.map(t => `• ${t}`).join("\n")}`
          : `Today we focus on the principle of "${pillar.name}" - ${pillar.description}.\n\nThis is one of the core pillars of this approach. ${pillar.keyTeachings.map(t => `• ${t}`).join("\n")}`
        );
      }
      
      if (stage) {
        parts.push(isHebrew
          ? `אנחנו נמצאים בשלב "${stage.name}" - ${stage.focus}. המטרה היא ${stage.expectedShift}.`
          : `We are in the "${stage.name}" stage - ${stage.focus}. The goal is ${stage.expectedShift}.`
        );
      }
      
      if (map?.philosophy.worldview) {
        parts.push(map.philosophy.worldview);
      }
      
      day.explanation = parts.join("\n\n") || day.goal;
    }
    
    if (!day.task || day.task.length < 30) {
      if (practice) {
        day.task = isHebrew
          ? `התרגיל של היום: "${practice.name}" (${practice.type})\n\n${practice.instructions}\n\nמטרת התרגיל: ${practice.purpose}`
          : `Today's practice: "${practice.name}" (${practice.type})\n\n${practice.instructions}\n\nPurpose: ${practice.purpose}`;
      } else if (pillar) {
        day.task = isHebrew
          ? `התבונן על "${pillar.name}" בחייך. איפה אתה רואה את העיקרון הזה? כתוב 3 דוגמאות קונקרטיות.`
          : `Reflect on "${pillar.name}" in your life. Where do you see this principle? Write 3 concrete examples.`;
      } else {
        day.task = isHebrew
          ? `קח 10 דקות להתבוננות פנימית. מה עולה לך מהתוכן של היום?`
          : `Take 10 minutes for inner reflection. What comes up for you from today's content?`;
      }
    }
    
    // Ensure blocks array exists with methodology-based content
    if (!day.blocks || day.blocks.length === 0) {
      const blocks: any[] = [
        { type: "text", content: { text: day.explanation } }
      ];
      
      if (practice) {
        blocks.push({ 
          type: practice.type as string, 
          content: { 
            text: `${practice.name}: ${practice.instructions}`,
            task: practice.instructions 
          } 
        });
      }
      
      blocks.push({ 
        type: "reflection", 
        content: { 
          question: pillar 
            ? (isHebrew ? `איך "${pillar.name}" מתבטא בחייך? מה אתה מגלה?` : `How does "${pillar.name}" show up in your life? What are you discovering?`)
            : (isHebrew ? `מה מהדהד אצלך מהתוכן של היום?` : `What resonates with you from today's content?`)
        } 
      });
      
      blocks.push({ type: "task", content: { task: day.task } });
      
      day.blocks = blocks;
    }
    
    // Validate and enhance: ensure pillar, stage, practice, and signature phrase are referenced
    let dayContent = `${day.title} ${day.goal} ${day.explanation} ${day.task}`.toLowerCase();
    
    const hasPillarReference = pillar ? dayContent.includes(pillar.name.toLowerCase().substring(0, Math.min(10, pillar.name.length))) : true;
    const hasStageReference = stage ? dayContent.includes(stage.name.toLowerCase().substring(0, Math.min(10, stage.name.length))) : true;
    const hasPracticeReference = practice ? dayContent.includes(practice.name.toLowerCase().substring(0, Math.min(10, practice.name.length))) : true;
    
    console.log(`[AI] Day ${day.dayNumber} validation: pillar=${pillar?.name || 'none'}, stage=${stage?.name || 'none'}, practice=${practice?.name || 'none'}, pillar_ref=${hasPillarReference}, stage_ref=${hasStageReference}, practice_ref=${hasPracticeReference}`);
    
    // Enrich with missing pillar reference
    if (!hasPillarReference && pillar) {
      const pillarPrefix = isHebrew 
        ? `היום נתמקד ב"${pillar.name}" - ${pillar.description}. ${pillar.keyTeachings[0] || ""}\n\n`
        : `Today we focus on "${pillar.name}" - ${pillar.description}. ${pillar.keyTeachings[0] || ""}\n\n`;
      day.explanation = pillarPrefix + day.explanation;
      console.log(`[AI] Enhanced day ${day.dayNumber} with pillar: ${pillar.name}`);
    }
    
    // Enrich with missing stage reference
    if (!hasStageReference && stage) {
      const stagePrefix = isHebrew
        ? `אנחנו בשלב "${stage.name}" - ${stage.focus}. המטרה בשלב זה: ${stage.expectedShift}.\n\n`
        : `We are in the "${stage.name}" stage - ${stage.focus}. The goal at this stage: ${stage.expectedShift}.\n\n`;
      day.goal = stagePrefix + day.goal;
      console.log(`[AI] Enhanced day ${day.dayNumber} with stage: ${stage.name}`);
    }
    
    // Enrich with missing practice reference
    if (!hasPracticeReference && practice) {
      const practiceAddition = isHebrew
        ? `\n\nהתרגיל המרכזי: "${practice.name}" - ${practice.instructions}`
        : `\n\nCore practice: "${practice.name}" - ${practice.instructions}`;
      day.task = day.task + practiceAddition;
      console.log(`[AI] Enhanced day ${day.dayNumber} with practice: ${practice.name}`);
    }
    
    // Add signature phrase if available and not already present
    let signaturePhrase: string | null = null;
    if (map && map.voice.signaturePhrases.length > 0) {
      const phraseIndex = (day.dayNumber - 1) % map.voice.signaturePhrases.length;
      signaturePhrase = map.voice.signaturePhrases[phraseIndex] || null;
      if (signaturePhrase && !dayContent.includes(signaturePhrase.toLowerCase().substring(0, Math.min(15, signaturePhrase.length)))) {
        day.explanation = day.explanation + `\n\n"${signaturePhrase}"`;
        console.log(`[AI] Added signature phrase to day ${day.dayNumber}`);
      }
    }
    
    // CRITICAL: Check and enrich with client challenges
    // Parse client challenges using the helper function
    const mainChallenges = parseClientChallenges(intent.clientChallenges || "");
    
    if (mainChallenges.length > 0) {
        // Assign challenge to this day (cycle through challenges)
        const challengeIndex = (day.dayNumber - 1) % mainChallenges.length;
        const assignedChallenge = mainChallenges[challengeIndex];
        
        // Check if the challenge is referenced
        const challengeKeywords = assignedChallenge.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const hasChallengeRef = challengeKeywords.some(keyword => dayContent.includes(keyword));
        
        console.log(`[AI] Day ${day.dayNumber} challenge: "${assignedChallenge}" (found: ${hasChallengeRef})`);
        
        if (!hasChallengeRef && assignedChallenge.length > 5) {
          // Add challenge context to the goal
          const challengePrefix = isHebrew
            ? `היום נתמקד באתגר: "${assignedChallenge}"\n\n`
            : `Today we address the challenge: "${assignedChallenge}"\n\n`;
          day.goal = challengePrefix + day.goal;
          
          // Add challenge opener to explanation
          const challengeOpener = isHebrew
            ? `אחד האתגרים המרכזיים שזיהינו הוא "${assignedChallenge}". בואי נבין איך זה מתחבר לתהליך שלך.\n\n`
            : `One of the key challenges we identified is "${assignedChallenge}". Let's understand how this connects to your process.\n\n`;
          day.explanation = challengeOpener + day.explanation;
          
          console.log(`[AI] Enhanced day ${day.dayNumber} with client challenge: ${assignedChallenge}`);
        }
    }
    
    // CRITICAL: Synchronize blocks with the enriched content
    // Rebuild blocks to ensure they contain the pillar, stage, practice, challenge, and signature phrase
    if (day.blocks && day.blocks.length > 0 && map) {
      const enrichedBlocks: typeof day.blocks = [];
      
      // Add challenge context block at the very top if we have challenges
      const blockChallenges = parseClientChallenges(intent.clientChallenges || "");
      if (blockChallenges.length > 0) {
        const challengeIndex = (day.dayNumber - 1) % blockChallenges.length;
        const assignedChallenge = blockChallenges[challengeIndex];
        if (assignedChallenge.length > 5) {
          enrichedBlocks.push({
            type: "text",
            content: {
              text: isHebrew
                ? `🎯 האתגר של היום: "${assignedChallenge}"\n\nהיום נעבוד על אתגר זה באמצעות הכלים והתרגילים שנלמד.`
                : `🎯 Today's Challenge: "${assignedChallenge}"\n\nToday we'll work on this challenge using the tools and practices we'll learn.`
            }
          });
        }
      }
      
      // Add stage context block if we have a stage
      if (stage) {
        enrichedBlocks.push({
          type: "text",
          content: {
            text: isHebrew
              ? `📍 שלב במסע: "${stage.name}"\n${stage.focus}\n\nהשינוי הצפוי: ${stage.expectedShift}`
              : `📍 Journey Stage: "${stage.name}"\n${stage.focus}\n\nExpected Shift: ${stage.expectedShift}`
          }
        });
      }
      
      // Main content block: use the (now enriched) explanation
      enrichedBlocks.push({ type: "text", content: { text: day.explanation } });
      
      // Add practice block if we have an assigned practice
      if (practice) {
        enrichedBlocks.push({
          type: practice.type || "task",
          content: {
            text: `${practice.name}: ${practice.instructions}`,
            task: `${practice.name}\n\n${practice.instructions}\n\n${isHebrew ? 'מטרה' : 'Purpose'}: ${practice.purpose}`
          }
        });
      }
      
      // Add reflection block with pillar and stage reference
      enrichedBlocks.push({
        type: "reflection",
        content: {
          question: pillar && stage
            ? (isHebrew ? `בשלב "${stage.name}", איך "${pillar.name}" מתבטא בחייך? מה אתה מגלה?` : `In the "${stage.name}" stage, how does "${pillar.name}" show up in your life? What are you discovering?`)
            : pillar
            ? (isHebrew ? `איך "${pillar.name}" מתבטא בחייך כרגע? מה אתה מגלה?` : `How does "${pillar.name}" show up in your life right now? What are you discovering?`)
            : (isHebrew ? `מה מהדהד אצלך מהתוכן של היום?` : `What resonates with you from today's content?`)
        }
      });
      
      // Add task block with (now enriched) task
      enrichedBlocks.push({ type: "task", content: { task: day.task } });
      
      day.blocks = enrichedBlocks;
      console.log(`[AI] Rebuilt blocks for day ${day.dayNumber} with ${enrichedBlocks.length} methodology-based blocks (stage: ${stage?.name || 'none'})`);
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
  // Current conversation phase (intro | reflection | task | integration)
  currentPhase?: 'intro' | 'reflection' | 'task' | 'integration';
}

// Conversation Phase Types
export type ConversationPhase = 'intro' | 'reflection' | 'task' | 'integration';

// Phase transition result
export interface PhaseTransitionResult {
  shouldTransition: boolean;
  nextPhase: ConversationPhase | null;
  reason: string;
}

// Flow83 Conversation State Machine - Human Mentor System Prompt (constant base)
const MENTOR_SYSTEM_PROMPT_BASE = `You are a human mentor guiding one person through a personal growth process.

You are NOT a chatbot.
You do NOT rush.
You speak naturally, like a real person in a 1:1 session.

=== CORE BEHAVIOR ===
- Respond emotionally FIRST, before giving any instructions
- Sound supportive, grounded, and human
- Keep responses SHORT and conversational (max 120 words)
- ONE response = ONE intention
- Ask at MOST one question per message
- ALWAYS respond to what the user just said before moving forward
- Never explain + task + summarize in one message

=== BOUNDARIES ===
- You do not diagnose, treat, or provide medical/psychological advice
- You do not promise outcomes or guarantees
- You stay within the scope of today's journey day
- You do not jump ahead to future days

=== TONE ===
- Calm, warm, grounded
- Emotionally attuned
- Clear and simple language
- Use the participant's name naturally

=== LANGUAGE RULE ===
Respond in the SAME LANGUAGE as the journey content. If Hebrew, respond in Hebrew. If English, respond in English.`;

// Phase-specific prompts
const PHASE_PROMPTS = {
  intro: `=== CURRENT PHASE: INTRO ===

Your role in this phase:
- Gently introduce the intention of the day
- Create emotional safety and connection
- Ask ONE soft opening question to understand where they're at

CRITICAL: Do NOT give tasks yet. Do NOT explain the full day content.
Just warmly welcome them and ask how they're arriving today.`,

  reflection: `=== CURRENT PHASE: REFLECTION ===

Your role in this phase:
- Reflect back what the user shared
- Name one emotion or pattern you notice in their words
- Ask ONE deep but gentle question to go deeper

CRITICAL: Do NOT give tasks yet. Stay with their experience.
Help them feel heard and understood before moving forward.`,

  task: `=== CURRENT PHASE: TASK ===

Your role in this phase:
- Give ONE small, clear task from today's content
- Explain briefly why this task fits what they shared
- Keep it simple and grounded

The user is ready for the task. Give it clearly and supportively.
When they complete it or engage meaningfully, acknowledge their effort.`,

  integration: `=== CURRENT PHASE: INTEGRATION ===

Your role in this phase:
- Acknowledge the user's effort today
- Summarize ONE key insight from the conversation
- Prepare them emotionally for rest or the next day
- Give a warm closing

This is the end of today's session. Be conclusive but warm.
Start your message with the hidden marker [DAY_COMPLETE] (user won't see this).`
};

// Legacy system prompt for backwards compatibility
const SYSTEM_PROMPT_BASE = MENTOR_SYSTEM_PROMPT_BASE;

export async function generateChatResponse(
  context: ChatContext,
  userMessage: string
): Promise<string> {
  // Determine language: explicit setting or auto-detect from content
  const useHebrew = context.language === 'he' || (!context.language && isHebrewText(`${context.journeyName} ${context.dayGoal}`));
  const languageName = useHebrew ? "Hebrew" : "English";
  
  // Get current phase (default to intro if not set)
  const currentPhase = context.currentPhase || 'intro';
  const phasePrompt = PHASE_PROMPTS[currentPhase];
  
  // Minimal context - only what's needed for this phase
  let contextPrompt = `
=== CONTEXT ===
Mentor: ${context.mentorName}
${context.participantName ? `Participant: ${context.participantName}` : ""}
${context.mentorToneOfVoice ? `Mentor voice/style: ${context.mentorToneOfVoice}` : ""}

Journey: ${context.journeyName}
Day ${context.dayNumber} of ${context.totalDays}
Day objective: ${context.dayGoal}`;

  // Only include task details in task phase
  if (currentPhase === 'task' || currentPhase === 'integration') {
    contextPrompt += `
Today's task: ${context.dayTask}`;
    if (context.dayExplanation) {
      contextPrompt += `
Day explanation: ${context.dayExplanation}`;
    }
  }
  
  // Include closing message only in integration phase
  if (currentPhase === 'integration' && context.dayClosingMessage) {
    contextPrompt += `
Closing message to use: ${context.dayClosingMessage}`;
  }

  contextPrompt += `

LANGUAGE: Respond in ${languageName}.`;

  // Add user summary if exists (long-term memory) - brief version
  if (context.userSummary && Object.values(context.userSummary).some(v => v)) {
    contextPrompt += `

What you know about this person:`;
    if (context.userSummary.challenge) {
      contextPrompt += ` Challenge: ${context.userSummary.challenge}.`;
    }
    if (context.userSummary.emotionalTone) {
      contextPrompt += ` Mood: ${context.userSummary.emotionalTone}.`;
    }
  }

  // Build the full system prompt: base + phase + context
  const systemPrompt = MENTOR_SYSTEM_PROMPT_BASE + "\n\n" + phasePrompt + "\n\n" + contextPrompt;

  // Only last 3 messages for phase-based conversation (keep it focused)
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: systemPrompt },
  ];

  // Add only last 3 messages to keep context focused
  const recentMessages = context.recentMessages.slice(-3);
  for (const msg of recentMessages) {
    messages.push({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });

  console.log("Generating chat response:", JSON.stringify({
    mentorName: context.mentorName,
    journeyName: context.journeyName,
    dayNumber: context.dayNumber,
    currentPhase,
    messageCount: messages.length
  }));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 200, // ~120 words max for conversational responses
  });

  const aiContent = response.choices[0].message.content;
  console.log("AI response received:", aiContent ? `${aiContent.substring(0, 100)}...` : "EMPTY");

  // Phase-appropriate fallbacks
  if (!aiContent) {
    console.warn("AI returned empty content, using phase fallback");
    const isHebrew = isHebrewText(`${context.journeyName} ${context.dayGoal || ""}`);
    
    const fallbacks: Record<ConversationPhase, { he: string; en: string }> = {
      intro: {
        he: `שלום ${context.participantName || ""}! ברוכים הבאים ליום ${context.dayNumber}. איך את מגיעה היום?`,
        en: `Hi ${context.participantName || ""}! Welcome to day ${context.dayNumber}. How are you arriving today?`
      },
      reflection: {
        he: "תודה ששיתפת. מה עוד עולה לך כשאת חושבת על זה?",
        en: "Thank you for sharing. What else comes up for you when you think about this?"
      },
      task: {
        he: `המשימה להיום: ${context.dayTask}. איך זה מרגיש?`,
        en: `Today's task: ${context.dayTask}. How does that feel?`
      },
      integration: {
        he: "עשית עבודה נפלאה היום. קחי את התובנות איתך ונתראה מחר.",
        en: "You did wonderful work today. Take these insights with you and see you tomorrow."
      }
    };
    
    return isHebrew ? fallbacks[currentPhase].he : fallbacks[currentPhase].en;
  }
  
  return aiContent;
}

// Detect if user response indicates readiness to transition to next phase
export async function detectPhaseTransition(
  currentPhase: ConversationPhase,
  userMessage: string,
  assistantResponse: string,
  dayGoal: string,
  dayTask: string
): Promise<PhaseTransitionResult> {
  // Simple rule-based detection (can be enhanced with AI later)
  const lowerMessage = userMessage.toLowerCase();
  const isHebrew = isHebrewText(userMessage);
  
  // Check for day completion marker in assistant response
  if (assistantResponse.includes('[DAY_COMPLETE]')) {
    return {
      shouldTransition: true,
      nextPhase: null, // Day is complete, move to next day
      reason: 'Day marked complete by assistant'
    };
  }
  
  // Phase transition rules
  switch (currentPhase) {
    case 'intro':
      // User responded to opening question - move to reflection
      if (userMessage.length > 10) {
        return {
          shouldTransition: true,
          nextPhase: 'reflection',
          reason: 'User shared initial response'
        };
      }
      break;
      
    case 'reflection':
      // User engaged with reflection - move to task after 1-2 exchanges
      // Check for emotional sharing or acknowledgment
      const emotionalIndicators = isHebrew 
        ? ['מרגיש', 'קשה', 'טוב', 'רע', 'שמח', 'עצוב', 'מבין', 'כן', 'נכון', 'בדיוק']
        : ['feel', 'hard', 'good', 'bad', 'happy', 'sad', 'understand', 'yes', 'right', 'exactly'];
      
      const hasEmotionalContent = emotionalIndicators.some(indicator => 
        lowerMessage.includes(indicator) || userMessage.includes(indicator)
      );
      
      if (hasEmotionalContent || userMessage.length > 30) {
        return {
          shouldTransition: true,
          nextPhase: 'task',
          reason: 'User engaged emotionally in reflection'
        };
      }
      break;
      
    case 'task':
      // User completed or engaged with task - move to integration
      const completionIndicators = isHebrew
        ? ['עשיתי', 'סיימתי', 'הבנתי', 'ניסיתי', 'עשה', 'עובד', 'מצליח']
        : ['done', 'did', 'finished', 'tried', 'completed', 'understand', 'got it'];
      
      const hasCompletionSignal = completionIndicators.some(indicator =>
        lowerMessage.includes(indicator) || userMessage.includes(indicator)
      );
      
      if (hasCompletionSignal || userMessage.length > 50) {
        return {
          shouldTransition: true,
          nextPhase: 'integration',
          reason: 'User engaged with or completed task'
        };
      }
      break;
      
    case 'integration':
      // After integration, day is complete
      return {
        shouldTransition: true,
        nextPhase: null, // Day complete
        reason: 'Integration phase complete'
      };
  }
  
  return {
    shouldTransition: false,
    nextPhase: null,
    reason: 'Not ready to transition'
  };
}

async function generateSimpleDaysBatch(
  intent: JourneyIntent,
  startDay: number,
  endDay: number,
  totalDays: number
): Promise<GeneratedDaySimple[]> {
  const isHebrew = intent.language === 'he' || isHebrewText(`${intent.journeyName} ${intent.mainGoal}`);
  const language = isHebrew ? "Hebrew" : "English";
  
  // Build mentor style section if available
  let mentorStyleSection = "";
  if (intent.mentorStyle) {
    const style = intent.mentorStyle;
    mentorStyleSection = `
=== MENTOR'S STYLE AND METHOD ===
${style.toneOfVoice ? `TONE OF VOICE: ${style.toneOfVoice}` : ""}
${style.teachingStyle ? `TEACHING STYLE: ${style.teachingStyle}` : ""}
${style.corePhilosophy ? `CORE PHILOSOPHY: ${style.corePhilosophy}` : ""}
${style.keyPhrases?.length > 0 ? `KEY PHRASES TO USE: ${style.keyPhrases.join(", ")}` : ""}

=== MENTOR'S FULL CONTENT AND METHOD ===
${style.contentSummary || ""}

IMPORTANT: Write ALL content as if you ARE this mentor. Use their voice, their phrases, their teaching approach. The content should feel like it came directly from them.
`;
  }
  
  // Build mentor profile section from profile data
  let mentorProfileSection = "";
  if (intent.mentorName || intent.mentorSpecialty || intent.mentorMethodology || intent.mentorUniqueApproach) {
    mentorProfileSection = `
=== MENTOR PROFILE ===
${intent.mentorName ? `Name: ${intent.mentorName}` : ""}
${intent.mentorSpecialty ? `Specialty: ${intent.mentorSpecialty}` : ""}
${intent.mentorMethodology ? `Methods/Approaches: ${intent.mentorMethodology}` : ""}
${intent.mentorUniqueApproach ? `Unique Approach: ${intent.mentorUniqueApproach}` : ""}

Use this mentor information to personalize the content and reference their specific methods.
`;
  }
  
  const prompt = `Create days ${startDay}-${endDay} of a ${totalDays}-day transformation journey.

FLOW: ${intent.journeyName}
GOAL: ${intent.mainGoal}
AUDIENCE: ${intent.targetAudience}
${intent.profession ? `MENTOR PROFESSION: ${intent.profession}` : ""}
${intent.tone ? `TONE: ${intent.tone}` : ""}
${intent.additionalNotes ? `CONTEXT: ${intent.additionalNotes}` : ""}
${mentorProfileSection}${mentorStyleSection}
${intent.clientChallenges ? `
=== CLIENT CHALLENGES TO ADDRESS (MANDATORY) ===
${intent.clientChallenges}

CRITICAL REQUIREMENT - YOU MUST:
1. Each day MUST explicitly name and address one or more of these specific challenges in the title, goal, or explanation
2. Use the EXACT language from the challenges (e.g., "בחירה מתוך פחד", "חוסר בהירות פנימית")
3. The explanation MUST include a sentence like: "היום נתמקד באתגר של..." or "Today we address the challenge of..."
4. Connect the methodology to solving THIS SPECIFIC challenge
5. The task MUST help the participant work through this specific challenge

For example, if challenge is "בחירה מתוך פחד ולא מתוך רצון", the goal should say:
"היום נתמקד באתגר 'בחירה מתוך פחד ולא מתוך רצון'. נלמד לזהות מתי אנחנו פועלים מפחד..."
` : ""}

=== TRANSFORMATION ARC - CRITICAL FOR REAL GROWTH ===
This is NOT a series of independent lessons. This is ONE continuous journey where each day builds on the previous.

DAY STRUCTURE BASED ON JOURNEY LENGTH:
${totalDays === 7 ? `
- Day 1: OPENING - Set intention, introduce the journey topic "${intent.mainGoal}", create safety
- Days 2-3: AWARENESS - Deepen understanding, identify patterns, explore resistance  
- Days 4-5: BREAKTHROUGH - Challenge old beliefs, practice new ways, take action
- Days 6-7: INTEGRATION - Embody changes, celebrate progress, plan forward
` : `
- Day 1: OPENING - Set intention, introduce "${intent.mainGoal}", identify what needs to change
- Day 2: DEEP WORK - Core transformation, breakthrough moment, new perspective
- Day 3: INTEGRATION - Embody the change, create lasting habits, close the journey
`}

MANDATORY DAY-TO-DAY CONNECTIONS:
${startDay > 1 ? `- Days ${startDay}-${endDay} MUST reference what happened in previous days
- Start each day with: "אתמול/בימים הקודמים גילינו ש..." or "Yesterday/In previous days we discovered..."
- Build on previous insights - don't start fresh each day` : ""}
- End each day with a hint about tomorrow (except last day): "מחר נמשיך לחקור..." or "Tomorrow we'll continue..."
- Create a sense of continuous journey, like weekly sessions with a real mentor

TOPIC ANCHORING - KEEP THE FLOW TOPIC CENTRAL:
- Every day must explicitly connect back to the main goal: "${intent.mainGoal}"
- The topic should appear in each day's goal and explanation
- Participants should feel they're making progress on THIS specific issue

${startDay === 1 ? "Day 1 = foundation/introduction - set intention and introduce the topic." : ""}
${endDay === totalDays ? `Day ${endDay} = powerful conclusion - integrate everything and close with hope.` : ""}

CRITICAL REQUIREMENTS - ALL FIELDS MUST BE FILLED:
- title: A compelling, specific title for this day (5-10 words)
- goal: What the participant will achieve today (2-3 complete sentences, NOT placeholders)
- explanation: Teaching content with insights and guidance (2-3 full paragraphs, minimum 150 words)${intent.mentorStyle ? ` - MUST:
  * Open by connecting to yesterday's work (except Day 1)
  * Use the mentor's EXACT language and include direct quotes
  * Reference specific examples from the mentor's teachings
  * Anchor back to the flow topic: "${intent.mainGoal}"
  * End with a bridge to tomorrow (except last day)` : ""}
- task: A specific, actionable exercise the participant must complete (2-4 sentences describing exactly what to do)

IMPORTANT: Every field must contain REAL, meaningful content. Do not use placeholder text like "..." or empty strings.
Write ALL content in ${language}.${intent.mentorStyle ? " Use the mentor's unique voice and teaching style throughout." : ""}

JSON: {"days": [{"dayNumber": ${startDay}, "title": "Full title here", "goal": "Complete goal description here", "explanation": "Full explanation paragraphs here", "task": "Specific task description here"}]}`;

  const systemPrompt = intent.mentorStyle 
    ? `You are embodying this mentor's voice and teaching style. Create course content that sounds exactly like them - use their phrases, their approach, their philosophy. Fill ALL fields with complete, meaningful content in ${language}. Respond with valid JSON only.`
    : `Expert course designer. You MUST fill in ALL fields with complete, meaningful content. Never leave any field empty or with placeholder text. Respond with valid JSON only.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
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
