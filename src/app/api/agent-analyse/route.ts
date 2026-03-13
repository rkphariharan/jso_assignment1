import { NextRequest, NextResponse } from 'next/server';
import { callClaude, parseModelJson, SYSTEM_PROMPTS } from '@/lib/claude';
import { CVAnalysis, UserProfile } from '@/lib/store';
import { buildFallbackAgentAnalysis } from '@/lib/analysisFallback';

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

    try {
      const raw = await callClaude(SYSTEM_PROMPTS.agentAnalysis, userMessage);
      const parsed = parseModelJson<Record<string, unknown>>(raw);

      const priorityActionsRaw = Array.isArray(parsed.priorityActions) ? parsed.priorityActions : [];
      const skillGapRaw = Array.isArray(parsed.skillGapPlan) ? parsed.skillGapPlan : [];
      const githubRaw = Array.isArray(parsed.githubInsights) ? parsed.githubInsights : [];
      const roadmapRaw = Array.isArray(parsed.weeklyRoadmap) ? parsed.weeklyRoadmap : [];

      const safe = {
        overallScore: Number(parsed.overallScore ?? 0),
        portfolioScore: Number(parsed.portfolioScore ?? 0),
        skillGapScore: Number(parsed.skillGapScore ?? 0),
        topBlockers: Array.isArray(parsed.topBlockers) ? parsed.topBlockers.filter(Boolean) : [],
        priorityActions: priorityActionsRaw.map((action, index) => {
          const item = (action ?? {}) as Record<string, unknown>;
          return {
            id: String(item.id ?? `action-${index + 1}`),
            title: String(item.title ?? 'Recommended action'),
            reason: String(item.reason ?? 'Improve hiring alignment'),
            expectedImpact: String(item.expectedImpact ?? 'Higher interview conversion'),
            completed: Boolean(item.completed),
            category: ['cv', 'portfolio', 'jobsearch', 'skills'].includes(String(item.category))
              ? String(item.category)
              : 'cv',
          };
        }),
        weeklyRoadmap: roadmapRaw.map((week, index) => {
          const item = (week ?? {}) as Record<string, unknown>;
          return {
            week: Number(item.week ?? index + 1),
            theme: String(item.theme ?? `Week ${index + 1}`),
            tasks: Array.isArray(item.tasks) ? item.tasks.filter(Boolean).map(String) : [],
          };
        }),
        githubInsights: githubRaw.map(insight => {
          const item = (insight ?? {}) as Record<string, unknown>;
          return {
            area: String(item.area ?? 'Portfolio evidence'),
            status: ['good', 'needs-work', 'missing'].includes(String(item.status))
              ? String(item.status)
              : 'needs-work',
            recommendation: String(item.recommendation ?? 'Strengthen this section with measurable outcomes.'),
          };
        }),
        skillGapPlan: skillGapRaw.map(skill => {
          const item = (skill ?? {}) as Record<string, unknown>;
          return {
            skill: String(item.skill ?? 'Core role skill'),
            priority: ['high', 'medium', 'low'].includes(String(item.priority)) ? String(item.priority) : 'medium',
            proofOfWork: String(item.proofOfWork ?? 'Add practical proof-of-work in portfolio and CV.'),
            timeline: String(item.timeline ?? '2 weeks'),
          };
        }),
        explainabilityNotes: Array.isArray(parsed.explainabilityNotes)
          ? parsed.explainabilityNotes.filter(Boolean).map(String)
          : [],
        generatedAt: new Date().toISOString(),
      };

      return NextResponse.json(safe);
    } catch (modelErr) {
      console.warn('Agent analysis fallback used:', modelErr);
      const fallback = buildFallbackAgentAnalysis(cv, profile);
      return NextResponse.json(fallback);
    }
  } catch (err) {
    console.error('Agent analysis error:', err);
    const message = err instanceof Error ? err.message : 'Agent analysis failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
