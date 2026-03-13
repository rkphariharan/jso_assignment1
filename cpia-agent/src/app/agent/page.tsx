'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import ScoreRing from '@/components/ScoreRing';
import { store, AgentAnalysis, CVAnalysis, UserProfile } from '@/lib/store';
import { Loader2, Brain, RefreshCw, ArrowRight, Github } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { priorityColor, statusColor, categoryColor } from '@/lib/utils';
import Link from 'next/link';

export default function AgentPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cv, setCv] = useState<CVAnalysis | null>(null);
  const [agent, setAgent] = useState<AgentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile(store.loadProfile());
    setCv(store.loadCVAnalysis());
    setAgent(store.loadAgentAnalysis());
  }, []);

  const runAgent = async () => {
    if (!cv || !profile) { toast.error('Upload your CV first.'); router.push('/upload'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/agent-analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Agent analysis failed');
      store.saveAgentAnalysis(data);
      setAgent(data);
      toast.success('Agent analysis complete!');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Brain size={22} className="text-brand-500" /> Agent Analysis
            </h1>
            <p className="text-gray-500 mt-1">
              Career Portfolio Intelligence Agent synthesising all your signals.
            </p>
          </div>
          <button onClick={runAgent} disabled={loading} className="btn-primary flex items-center gap-2">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Running...</>
              : agent
              ? <><RefreshCw size={15} /> Re-analyse</>
              : <><Brain size={15} /> Run Agent</>
            }
          </button>
        </div>

        {!cv && (
          <div className="card p-10 text-center space-y-3">
            <p className="text-gray-500">No CV data found. Please upload your CV first.</p>
            <Link href="/upload" className="btn-primary inline-flex items-center gap-2">
              Go to Upload <ArrowRight size={14} />
            </Link>
          </div>
        )}

        {loading && (
          <div className="card p-16 flex flex-col items-center gap-4 text-center">
            <Loader2 size={40} className="animate-spin text-brand-400" />
            <p className="text-gray-600 font-medium">Agent is analysing your full career portfolio...</p>
            <p className="text-gray-400 text-sm">CV signals + job strategy + portfolio + skill gaps</p>
          </div>
        )}

        {agent && !loading && (
          <>
            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-5 flex flex-col items-center gap-2">
                <ScoreRing score={agent.overallScore} size={90} />
                <span className="text-sm font-semibold text-gray-700">Overall Readiness</span>
              </div>
              <div className="card p-5 flex flex-col items-center gap-2">
                <ScoreRing score={agent.portfolioScore} size={90} />
                <span className="text-sm font-semibold text-gray-700">Portfolio Score</span>
              </div>
              <div className="card p-5 flex flex-col items-center gap-2">
                <ScoreRing score={agent.skillGapScore} size={90} />
                <span className="text-sm font-semibold text-gray-700">Skill Readiness</span>
              </div>
            </div>

            {/* Priority Actions */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Priority Actions (by impact)</h2>
              <div className="space-y-3">
                {agent.priorityActions.map((action, i) => (
                  <div key={action.id} className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-800">{action.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColor(action.category)}`}>
                          {action.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{action.reason}</p>
                      <p className="text-xs text-emerald-600 mt-1 font-medium">Impact: {action.expectedImpact}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/roadmap" className="btn-primary inline-flex items-center gap-2 mt-5 text-sm">
                View Weekly Roadmap <ArrowRight size={13} />
              </Link>
            </div>

            {/* GitHub Insights */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                <Github size={17} /> Portfolio Analysis
              </h2>
              {profile?.githubUrl && (
                <p className="text-xs text-gray-400 mb-4">{profile.githubUrl}</p>
              )}
              <div className="space-y-3">
                {agent.githubInsights.map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100">
                    <span className={`text-xs font-semibold mt-0.5 shrink-0 ${statusColor(insight.status)}`}>
                      {insight.status === 'good' ? '✓' : insight.status === 'needs-work' ? '!' : '✗'}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-700">{insight.area}</span>
                      <p className="text-xs text-gray-500 mt-0.5">{insight.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Skill Gap Plan */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Skill Gap Roadmap</h2>
              <div className="space-y-3">
                {agent.skillGapPlan.map((item, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-gray-800">{item.skill}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">{item.timeline}</span>
                    </div>
                    <p className="text-xs text-gray-500">Proof-of-work: {item.proofOfWork}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Explainability */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-2">Governance — Why This Analysis</h2>
              <p className="text-xs text-gray-400 mb-3">
                All recommendations are traceable. Here is the evidence and reasoning used.
              </p>
              <ul className="space-y-2">
                {agent.explainabilityNotes.map((note, i) => (
                  <li key={i} className="text-sm text-gray-600 bg-brand-50 border border-brand-100 rounded-lg px-4 py-2">
                    {note}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-3">
                Generated: {agent.generatedAt} · Model: claude-opus-4-5 · Override available via HR Consultant page.
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
