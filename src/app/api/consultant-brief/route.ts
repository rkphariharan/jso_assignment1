import { NextRequest, NextResponse } from 'next/server';
import { callClaude, SYSTEM_PROMPTS } from '@/lib/claude';
import { CVAnalysis, AgentAnalysis, UserProfile } from '@/lib/store';
import { buildFallbackConsultantBrief } from '@/lib/analysisFallback';

export async function POST(req: NextRequest) {
  try {
    const { cv, agent, profile }: { cv: CVAnalysis; agent: AgentAnalysis; profile: UserProfile } = await req.json();

    const userMessage = `
Prepare a pre-session consultant brief for:

User: ${profile.name} (${profile.userType})
Target: ${profile.targetRole} — ${profile.targetLevel}
Overall readiness: ${agent.overallScore}/100
ATS score: ${cv.atsScore}/100 | Job strategy: ${cv.jobSearchScore}/100 | Portfolio: ${agent.portfolioScore}/100

CV strengths: ${cv.strengths.join('; ')}
CV weaknesses: ${cv.weaknesses.join('; ')}

Top blockers: ${agent.topBlockers.join('; ')}

Priority actions the agent recommended:
${agent.priorityActions.slice(0, 5).map((a, i) => `${i + 1}. ${a.title} — ${a.reason}`).join('\n')}

Skill gaps: ${agent.skillGapPlan.map(s => s.skill).join(', ')}

GitHub insights summary: ${agent.githubInsights.map(g => `${g.area}: ${g.status}`).join('; ')}

Please write a brief that:
1. Summarises the user's current position and biggest risks
2. Highlights what they have already done / completed
3. Identifies the key coaching focus for this session
4. Flags anything that requires human judgment over AI guidance
5. Suggests 2-3 specific questions the consultant should explore

Write in a professional but direct tone. Use markdown formatting.
`.trim();

    try {
      const brief = await callClaude(SYSTEM_PROMPTS.consultantBrief, userMessage);
      return NextResponse.json({ brief }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    } catch (modelErr) {
      console.warn('Consultant brief fallback used:', modelErr);
      const brief = buildFallbackConsultantBrief(cv, agent, profile);
      return NextResponse.json({ brief }, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
  } catch (err) {
    console.error('Consultant brief error:', err);
    return NextResponse.json({ error: 'Brief generation failed.' }, { status: 500 });
  }
}
