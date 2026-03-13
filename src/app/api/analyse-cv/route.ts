import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseModelJson, SYSTEM_PROMPTS } from '@/lib/claude';
import { UserProfile } from '@/lib/store';
import { buildFallbackCvAnalysis } from '@/lib/analysisFallback';

export async function POST(req: NextRequest) {
  try {
    const { cvText, profile }: { cvText: string; profile: UserProfile } = await req.json();

    if (!cvText?.trim()) return NextResponse.json({ error: 'CV text is required' }, { status: 400 });
    if (!profile?.targetRole) return NextResponse.json({ error: 'Target role is required' }, { status: 400 });

    const userMessage = `
Analyse this CV for a ${profile.userType} targeting "${profile.targetRole}" at "${profile.targetLevel}" level.
${profile.githubUrl ? `GitHub/Bitbucket profile: ${profile.githubUrl}` : ''}

CV TEXT:
---
${cvText.slice(0, 8000)}
---

Return the JSON analysis as specified.
`.trim();

    try {
      const raw = await callClaude(SYSTEM_PROMPTS.cvAnalysis, userMessage);
      const parsed = parseModelJson<Record<string, unknown>>(raw);

      const safe = {
        atsScore: Number(parsed.atsScore ?? 0),
        jobSearchScore: Number(parsed.jobSearchScore ?? 0),
        impactScore: Number(parsed.impactScore ?? 0),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter(Boolean) : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter(Boolean) : [],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.filter(Boolean) : [],
      };

      return NextResponse.json(safe);
    } catch (modelErr) {
      console.warn('CV analysis fallback used:', modelErr);
      const fallback = buildFallbackCvAnalysis(cvText, profile);
      return NextResponse.json(fallback);
    }
  } catch (err) {
    console.error('CV analysis error:', err);
    const message = err instanceof Error ? err.message : 'CV analysis failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
