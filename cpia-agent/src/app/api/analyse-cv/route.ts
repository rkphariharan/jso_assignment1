import { NextRequest, NextResponse } from 'next/server';
import { callClaude, SYSTEM_PROMPTS } from '@/lib/claude';
import { UserProfile } from '@/lib/store';

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

    const raw = await callClaude(SYSTEM_PROMPTS.cvAnalysis, userMessage);

    // Strip any accidental markdown fences
    const clean = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('CV analysis error:', err);
    return NextResponse.json({ error: 'CV analysis failed. Check your API key and try again.' }, { status: 500 });
  }
}
