// Central store for agent state — uses localStorage so data persists across pages without a DB

export type UserProfile = {
  name: string;
  targetRole: string;
  targetLevel: string;
  userType: 'student' | 'graduate' | 'experienced';
  githubUrl: string;
};

export type CVAnalysis = {
  rawText: string;
  atsScore: number;
  jobSearchScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  impactScore: number;
};

export type AgentAnalysis = {
  overallScore: number;
  portfolioScore: number;
  skillGapScore: number;
  topBlockers: string[];
  priorityActions: PriorityAction[];
  weeklyRoadmap: Week[];
  githubInsights: GitHubInsight[];
  skillGapPlan: SkillGapItem[];
  explainabilityNotes: string[];
  generatedAt: string;
};

export type PriorityAction = {
  id: string;
  title: string;
  reason: string;
  expectedImpact: string;
  completed: boolean;
  category: 'cv' | 'portfolio' | 'jobsearch' | 'skills';
};

export type Week = {
  week: number;
  theme: string;
  tasks: string[];
};

export type GitHubInsight = {
  area: string;
  status: 'good' | 'needs-work' | 'missing';
  recommendation: string;
};

export type SkillGapItem = {
  skill: string;
  priority: 'high' | 'medium' | 'low';
  proofOfWork: string;
  timeline: string;
};

const KEYS = {
  profile: 'cpia_profile',
  cvAnalysis: 'cpia_cv',
  agentAnalysis: 'cpia_agent',
};

function save<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

function load<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export const store = {
  saveProfile: (p: UserProfile) => save(KEYS.profile, p),
  loadProfile: () => load<UserProfile>(KEYS.profile),

  saveCVAnalysis: (cv: CVAnalysis) => save(KEYS.cvAnalysis, cv),
  loadCVAnalysis: () => load<CVAnalysis>(KEYS.cvAnalysis),

  saveAgentAnalysis: (a: AgentAnalysis) => save(KEYS.agentAnalysis, a),
  loadAgentAnalysis: () => load<AgentAnalysis>(KEYS.agentAnalysis),

  clearAll: () => {
    if (typeof window === 'undefined') return;
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  },
};
