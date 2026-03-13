import Anthropic from '@anthropic-ai/sdk';

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
}

export async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const client = getClient();
  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = message.content[0];
  if (block.type === 'text') return block.text;
  return '';
}

export function parseModelJson<T>(raw: string): T {
  const clean = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(clean) as T;
  } catch {
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace <= firstBrace) {
      throw new Error('Model returned invalid JSON.');
    }
    const candidate = clean.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate) as T;
  }
}

export const SYSTEM_PROMPTS = {
  cvAnalysis: `You are an expert career analyst and ATS specialist working within JSO (Job Search Optimiser).
Your task is to analyse a CV/resume and return a structured JSON assessment.
Rules:
- Be specific and JSO-aligned: focus on recruiter perception, ATS compatibility, impact narrative, and role relevance.
- Do NOT fabricate experience. Only analyse what is provided.
- Return ONLY valid JSON, no markdown fences, no extra text.

Return this exact shape:
{
  "atsScore": <integer 0-100>,
  "jobSearchScore": <integer 0-100>,
  "impactScore": <integer 0-100>,
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "missingKeywords": [<string>, ...]
}`,

  agentAnalysis: `You are the Career Portfolio Intelligence Agent (CPIA) for JSO Phase-2.
You receive: CV analysis data, target role/level, optional GitHub URL, and user type (student/graduate/experienced).
Your job is to synthesise all signals and produce an actionable career improvement strategy.
Rules:
- Be JSO-specific. Reference Career Momentum Dashboard, Boolean scripts, ATS alignment, portfolio credibility.
- Prioritize actions by hiring impact, not effort.
- Do NOT invent experience. Suggest proof-of-work where gaps exist.
- Return ONLY valid JSON, no markdown fences.

Return this exact shape:
{
  "overallScore": <integer 0-100>,
  "portfolioScore": <integer 0-100>,
  "skillGapScore": <integer 0-100>,
  "topBlockers": [<string max 3 items>],
  "priorityActions": [
    {
      "id": "<string>",
      "title": "<string>",
      "reason": "<string>",
      "expectedImpact": "<string>",
      "completed": false,
      "category": "<cv|portfolio|jobsearch|skills>"
    }
  ],
  "weeklyRoadmap": [
    { "week": 1, "theme": "<string>", "tasks": [<string>, ...] },
    { "week": 2, "theme": "<string>", "tasks": [<string>, ...] },
    { "week": 3, "theme": "<string>", "tasks": [<string>, ...] },
    { "week": 4, "theme": "<string>", "tasks": [<string>, ...] }
  ],
  "githubInsights": [
    { "area": "<string>", "status": "<good|needs-work|missing>", "recommendation": "<string>" }
  ],
  "skillGapPlan": [
    { "skill": "<string>", "priority": "<high|medium|low>", "proofOfWork": "<string>", "timeline": "<string>" }
  ],
  "explainabilityNotes": [<string>, ...]
}`,

  consultantBrief: `You are preparing a pre-session brief for an HR consultant on the JSO platform.
Use the user's CV analysis and agent recommendations to create a concise, actionable brief.
Format it as readable plain text with clear sections. No JSON. Keep it under 400 words.`,
};
