'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import ScoreRing from '@/components/ScoreRing';
import { store, UserProfile, CVAnalysis, AgentAnalysis } from '@/lib/store';
import { categoryColor, scoreBg, scoreColor } from '@/lib/utils';
import { ArrowRight, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cv, setCv] = useState<CVAnalysis | null>(null);
  const [agent, setAgent] = useState<AgentAnalysis | null>(null);

  useEffect(() => {
    setProfile(store.loadProfile());
    setCv(store.loadCVAnalysis());
    setAgent(store.loadAgentAnalysis());
  }, []);

  const completedTasks = agent?.priorityActions.filter(a => a.completed).length ?? 0;
  const totalTasks = agent?.priorityActions.length ?? 0;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile ? `Welcome back, ${profile.name}` : 'Career Portfolio Intelligence Agent'}
          </h1>
          <p className="text-gray-500 mt-1">
            {profile
              ? `Target: ${profile.targetRole} · ${profile.targetLevel}`
              : 'Upload your CV to get started.'}
          </p>
        </div>

        {/* No data state */}
        {!cv && (
          <div className="card p-10 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="text-brand-400" size={40} />
            <h2 className="text-lg font-semibold text-gray-800">No analysis yet</h2>
            <p className="text-gray-500 max-w-sm">
              Start by uploading your CV and filling in your target role. The agent will generate your full career improvement strategy.
            </p>
            <Link href="/upload" className="btn-primary mt-2">
              Upload CV <ArrowRight size={15} className="inline ml-1" />
            </Link>
          </div>
        )}

        {/* Score Overview */}
        {cv && agent && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'CV Score',         score: cv.atsScore,           hint: 'ATS + Structure' },
                { label: 'Job Strategy',     score: cv.jobSearchScore,     hint: 'Role targeting' },
                { label: 'Portfolio',        score: agent.portfolioScore,  hint: 'GitHub / projects' },
                { label: 'Overall Readiness',score: agent.overallScore,    hint: 'Combined signal' },
              ].map(({ label, score, hint }) => (
                <div key={label} className={`card p-5 flex flex-col items-center gap-2 border ${scoreBg(score)}`}>
                  <ScoreRing score={score} size={80} />
                  <span className="text-sm font-semibold text-gray-700">{label}</span>
                  <span className="text-xs text-gray-400">{hint}</span>
                </div>
              ))}
            </div>

            {/* Top Blockers */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Top Blockers</h2>
              <ul className="space-y-2">
                {agent.topBlockers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Priority Actions */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Next Best Actions</h2>
                <span className="text-xs text-gray-400">{completedTasks}/{totalTasks} done</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalTasks ? (completedTasks / totalTasks) * 100 : 0}%` }}
                />
              </div>
              <ul className="space-y-3">
                {agent.priorityActions.slice(0, 5).map(action => (
                  <li
                    key={action.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${action.completed ? 'opacity-50 bg-gray-50' : 'bg-white'}`}
                  >
                    {action.completed
                      ? <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      : <Clock size={16} className="text-brand-400 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-800">{action.title}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColor(action.category)}`}>
                          {action.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{action.reason}</p>
                      <p className="text-xs text-brand-600 mt-0.5">Expected: {action.expectedImpact}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3 mt-5">
                <Link href="/roadmap" className="btn-primary text-sm">
                  View Full Roadmap <ArrowRight size={13} className="inline ml-1" />
                </Link>
                <Link href="/agent" className="btn-secondary text-sm">
                  Re-run Analysis
                </Link>
              </div>
            </div>

            {/* Explainability Panel */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Why These Recommendations?</h2>
              <p className="text-xs text-gray-400 mb-3">Audit trail — based on your CV analysis, target role, and portfolio signals.</p>
              <ul className="space-y-2">
                {agent.explainabilityNotes.map((note, i) => (
                  <li key={i} className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 border border-gray-100">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
