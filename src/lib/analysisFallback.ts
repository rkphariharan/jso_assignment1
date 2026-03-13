import { AgentAnalysis, CVAnalysis, UserProfile } from '@/lib/store';

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function countMatches(words: string[], terms: string[]): number {
  const set = new Set(words);
  return terms.reduce((count, term) => (set.has(term) ? count + 1 : count), 0);
}

function detectSection(cvText: string, section: string): boolean {
  return new RegExp(`\\b${section}\\b`, 'i').test(cvText);
}

function firstN(items: string[], max: number): string[] {
  return items.filter(Boolean).slice(0, max);
}

export function buildFallbackCvAnalysis(cvText: string, profile: UserProfile): CVAnalysis {
  const words = normalizeWords(cvText);
  const uniqueWordCount = new Set(words).size;
  const lengthScore = Math.min(30, Math.round(uniqueWordCount / 20));
  const hasSummary = detectSection(cvText, 'summary') || detectSection(cvText, 'profile');
  const hasExperience = detectSection(cvText, 'experience');
  const hasSkills = detectSection(cvText, 'skills');
  const hasProjects = detectSection(cvText, 'project') || detectSection(cvText, 'portfolio');
  const hasEducation = detectSection(cvText, 'education');

  const roleKeywords = normalizeWords(profile.targetRole || '').filter(word => word.length > 2);
  const roleMatchCount = countMatches(words, roleKeywords);
  const roleScore = Math.min(20, roleMatchCount * 5);

  const impactPatterns = [/\b\d+%\b/, /\bimproved\b/i, /\bincreased\b/i, /\breduced\b/i, /\bdelivered\b/i];
  const impactHits = impactPatterns.reduce((count, pattern) => (pattern.test(cvText) ? count + 1 : count), 0);

  const atsScore = clampScore(
    lengthScore +
      roleScore +
      (hasSummary ? 10 : 0) +
      (hasExperience ? 15 : 0) +
      (hasSkills ? 10 : 0) +
      (hasEducation ? 10 : 0),
  );

  const jobSearchScore = clampScore(
    30 + roleScore + (hasProjects ? 10 : 0) + (hasExperience ? 15 : 0) + Math.min(20, impactHits * 5),
  );

  const impactScore = clampScore(25 + Math.min(50, impactHits * 10) + (hasProjects ? 10 : 0));

  const strengths: string[] = [];
  if (hasExperience) strengths.push('Work experience section is present and readable.');
  if (hasSkills) strengths.push('Skills are explicitly listed for keyword matching.');
  if (hasProjects) strengths.push('Projects/portfolio evidence is included.');
  if (impactHits >= 2) strengths.push('Resume includes measurable outcomes and impact language.');
  if (roleMatchCount >= 2) strengths.push(`Role alignment is visible for ${profile.targetRole}.`);

  const weaknesses: string[] = [];
  if (!hasSummary) weaknesses.push('Add a short professional summary aligned to your target role.');
  if (!hasExperience) weaknesses.push('Experience section is missing or unclear.');
  if (!hasProjects) weaknesses.push('Add projects that prove practical execution skills.');
  if (impactHits < 2) weaknesses.push('Quantify outcomes with metrics (%, $, time, scale).');
  if (roleMatchCount === 0) weaknesses.push('Target-role keywords are not visible enough in your CV text.');

  const baselineMissing = ['leadership', 'ownership', 'stakeholder', 'delivery', 'results'];
  const missingKeywords = firstN(
    [...roleKeywords, ...baselineMissing].filter(keyword => keyword.length > 2 && !words.includes(keyword)),
    10,
  );

  return {
    rawText: cvText,
    atsScore,
    jobSearchScore,
    impactScore,
    strengths: firstN(strengths, 6),
    weaknesses: firstN(weaknesses, 6),
    missingKeywords,
  };
}

export function buildFallbackAgentAnalysis(cv: CVAnalysis, profile: UserProfile): AgentAnalysis {
  const portfolioScore = clampScore(profile.githubUrl ? cv.impactScore * 0.6 + 25 : cv.impactScore * 0.5 + 10);
  const skillGapScore = clampScore(100 - Math.min(50, cv.missingKeywords.length * 6));
  const overallScore = clampScore(cv.atsScore * 0.35 + cv.jobSearchScore * 0.35 + portfolioScore * 0.3);

  const topBlockers = firstN(
    [
      cv.weaknesses[0] || 'CV positioning is not yet fully aligned to target role.',
      profile.githubUrl
        ? 'Portfolio evidence needs clearer hiring-signal presentation.'
        : 'No GitHub/Bitbucket portfolio URL provided for technical credibility.',
      cv.missingKeywords.length
        ? `Skill-gap signals detected: ${cv.missingKeywords.slice(0, 3).join(', ')}.`
        : 'Job-search strategy can be strengthened with targeted outreach and tailoring.',
    ],
    3,
  );

  const priorityActions: AgentAnalysis['priorityActions'] = [
    {
      id: 'action-cv-tailor',
      title: 'Tailor CV for target role keywords',
      reason: 'Improves ATS ranking and recruiter relevance in first-screen review.',
      expectedImpact: 'Higher shortlist conversion within 1-2 weeks.',
      completed: false,
      category: 'cv',
    },
    {
      id: 'action-portfolio-proof',
      title: 'Add 2 portfolio projects with measurable outcomes',
      reason: 'Portfolio quality is a key assignment signal for hiring readiness.',
      expectedImpact: 'Stronger project credibility in interviews.',
      completed: false,
      category: 'portfolio',
    },
    {
      id: 'action-jobsearch',
      title: 'Create weekly targeted application and networking plan',
      reason: 'Improves job-search score and consistency of outreach.',
      expectedImpact: 'More qualified interview opportunities.',
      completed: false,
      category: 'jobsearch',
    },
    {
      id: 'action-skill-gap',
      title: 'Close top 3 skill gaps with proof-of-work artifacts',
      reason: 'Bridges mismatch between current profile and target level expectations.',
      expectedImpact: 'Better role-fit confidence and interview performance.',
      completed: false,
      category: 'skills',
    },
  ];

  const weeklyRoadmap: AgentAnalysis['weeklyRoadmap'] = [
    {
      week: 1,
      theme: 'Baseline and role alignment',
      tasks: ['Rewrite CV summary for role-fit', 'Map JD keywords to CV bullet points', 'Set weekly job-search targets'],
    },
    {
      week: 2,
      theme: 'Portfolio credibility sprint',
      tasks: ['Publish or polish 1 project repository', 'Add README with outcomes and metrics', 'Link portfolio evidence in CV'],
    },
    {
      week: 3,
      theme: 'Skill-gap execution',
      tasks: ['Complete one focused mini-project', 'Document learning proof and decisions', 'Practice 5 role-specific interview questions'],
    },
    {
      week: 4,
      theme: 'Interview and application optimization',
      tasks: ['Run mock interview loop', 'Refine outreach message templates', 'Review KPI progress and re-prioritize actions'],
    },
  ];

  const githubInsights: AgentAnalysis['githubInsights'] = [
    {
      area: 'Repository presentation',
      status: profile.githubUrl ? 'needs-work' : 'missing',
      recommendation: profile.githubUrl
        ? 'Add clear README, setup steps, and measurable outcomes for key repositories.'
        : 'Add GitHub/Bitbucket URL and showcase at least 2 role-relevant projects.',
    },
    {
      area: 'Project impact narrative',
      status: cv.impactScore >= 65 ? 'good' : 'needs-work',
      recommendation: 'Highlight business/user impact, not only tech stack.',
    },
  ];

  const skillGapPlan: AgentAnalysis['skillGapPlan'] = firstN(cv.missingKeywords, 4).map((skill, index) => ({
    skill,
    priority: index < 2 ? 'high' : 'medium',
    proofOfWork: `Build a mini deliverable demonstrating ${skill} in your target role context.`,
    timeline: index < 2 ? '1-2 weeks' : '2-3 weeks',
  }));

  if (skillGapPlan.length === 0) {
    skillGapPlan.push({
      skill: 'Role-specific depth',
      priority: 'medium',
      proofOfWork: 'Add one advanced project or case-study aligned to your target job family.',
      timeline: '2 weeks',
    });
  }

  const explainabilityNotes = [
    'Scores combine CV ATS quality, job-search readiness, portfolio signal, and missing-skill indicators.',
    'Recommendations are generated from detected resume structure and target-role alignment gaps.',
    'No experience has been invented; actions focus on evidence-building and clarity improvements.',
  ];

  return {
    overallScore,
    portfolioScore,
    skillGapScore,
    topBlockers,
    priorityActions,
    weeklyRoadmap,
    githubInsights,
    skillGapPlan,
    explainabilityNotes,
    generatedAt: new Date().toISOString(),
  };
}

export function buildFallbackConsultantBrief(cv: CVAnalysis, agent: AgentAnalysis, profile: UserProfile): string {
  const firstAction = agent.priorityActions[0]?.title ?? 'Refine CV role alignment';
  const topSkills = agent.skillGapPlan.slice(0, 3).map(item => item.skill).join(', ') || 'role-specific depth';

  return [
    `## Consultant Pre-Session Brief`,
    ``,
    `**Candidate:** ${profile.name} (${profile.userType})`,
    `**Target:** ${profile.targetRole} — ${profile.targetLevel}`,
    `**Readiness Snapshot:** Overall ${agent.overallScore}/100 · ATS ${cv.atsScore}/100 · Job Search ${cv.jobSearchScore}/100 · Portfolio ${agent.portfolioScore}/100`,
    ``,
    `### Current Position and Risks`,
    `- Primary blockers: ${agent.topBlockers.join(' ')}`,
    `- Resume strengths: ${cv.strengths.slice(0, 3).join('; ') || 'Basic structure present.'}`,
    `- Main risk: inconsistent proof-of-work and role-specific narrative in hiring flow.`,
    ``,
    `### Coaching Focus for This Session`,
    `1. Prioritize action: ${firstAction}.`,
    `2. Validate top skill gaps: ${topSkills}.`,
    `3. Define a 2-week evidence plan to increase interview conversion.`,
    ``,
    `### Human Judgment Flags`,
    `- Validate realism of timeline based on candidate availability and constraints.`,
    `- Balance breadth vs depth in project portfolio according to target role.`,
    `- Adjust strategy if confidence, communication, or domain context is a major blocker.`,
    ``,
    `### Questions to Explore`,
    `- Which role family is highest priority for the next 30 days, and why?`,
    `- Which project best proves business impact today, and what is missing?`,
    `- What support is needed to complete the top 2 actions this month?`,
  ].join('\n');
}