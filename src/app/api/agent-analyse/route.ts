import { NextRequest, NextResponse } from 'next/server';
import { callClaude, SYSTEM_PROMPTS } from '@/lib/claude';
import { CVAnalysis, UserProfile } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const { cv, profile }: { cv: CVAnalysis; profile: UserProfile } = await req.json();

    if (!cv || !profile) return NextResponse.json({ error: 'CV and profile are required' }, { status: 400 });

    const userMessage = `
User context:
- Name: ${profile.name}
- Type: ${profile.userType}
- Target role: ${profile.targetRole}
- Target level: ${profile.targetLevel}
- GitHub/portfolio: ${profile.githubUrl || 'not provided'}

CV Analysis results:
- ATS Score: ${cv.atsScore}/100
- Job Search Score: ${cv.jobSearchScore}/100
- Impact Score: ${cv.impactScore}/100
- Strengths: ${cv.strengths.join(', ')}
- Weaknesses: ${cv.weaknesses.join(', ')}
- Missing keywords: ${cv.missingKeywords.join(', ')}

CV text excerpt:
---
${cv.rawText?.slice(0, 4000) ?? '(not available)'}
---

Generate a comprehensive career improvement strategy. Return only the JSON.
`.trim();

    const raw = await callClaude(SYSTEM_PROMPTS.agentAnalysis, userMessage);
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);
    parsed.generatedAt = new Date().toISOString();

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Agent analysis error:', err);
    return NextResponse.json({ error: 'Agent analysis failed. Check your API key.' }, { status: 500 });
  }
}
