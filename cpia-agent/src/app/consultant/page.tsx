'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { store, AgentAnalysis, CVAnalysis, UserProfile } from '@/lib/store';
import { Users, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ConsultantPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cv, setCv] = useState<CVAnalysis | null>(null);
  const [agent, setAgent] = useState<AgentAnalysis | null>(null);
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [override, setOverride] = useState('');
  const [overrideSaved, setOverrideSaved] = useState(false);

  useEffect(() => {
    setProfile(store.loadProfile());
    setCv(store.loadCVAnalysis());
    setAgent(store.loadAgentAnalysis());
  }, []);

  const generateBrief = async () => {
    if (!cv || !agent || !profile) {
      toast.error('Run agent analysis first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/consultant-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv, agent, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Brief generation failed');
      setBrief(data.brief);
      toast.success('Consultant pre-brief generated.');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const saveOverride = () => {
    if (!override.trim()) return;
    setOverrideSaved(true);
    toast.success('Override saved. This would be logged in the audit trail in production.');
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={22} className="text-brand-500" /> HR Consultant Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Pre-session brief for the consultant. Agent augments — consultant decides.
          </p>
        </div>

        {!agent && (
          <div className="card p-10 text-center space-y-3">
            <p className="text-gray-500">No agent analysis found. Run agent analysis first.</p>
          </div>
        )}

        {agent && (
          <>
            {/* User Context Card */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-4">User Context</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="label">Name</span>
                  <p className="text-gray-800 font-medium mt-1">{profile?.name ?? 'Unknown'}</p>
                </div>
                <div>
                  <span className="label">Target Role</span>
                  <p className="text-gray-800 font-medium mt-1">{profile?.targetRole} — {profile?.targetLevel}</p>
                </div>
                <div>
                  <span className="label">User Type</span>
                  <p className="text-gray-800 font-medium mt-1 capitalize">{profile?.userType}</p>
                </div>
                <div>
                  <span className="label">Overall Readiness</span>
                  <p className="text-gray-800 font-bold mt-1 text-brand-600">{agent.overallScore}/100</p>
                </div>
              </div>
            </div>

            {/* Top Blockers */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-3">Top Blockers (Agent Identified)</h2>
              <ul className="space-y-2">
                {agent.topBlockers.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            {/* Generate Brief */}
            <div className="card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Session Pre-Brief</h2>
                <button onClick={generateBrief} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Generating...</>
                    : brief
                    ? <><RefreshCw size={14} /> Regenerate</>
                    : 'Generate Brief'
                  }
                </button>
              </div>
              {brief && (
                <div className="prose prose-sm max-w-none bg-gray-50 rounded-xl p-5 border border-gray-200 text-gray-700">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{brief}</ReactMarkdown>
                </div>
              )}
            </div>

            {/* Human Override */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-800">Consultant Override / Annotation</h2>
              <p className="text-xs text-gray-400">
                Override or annotate any agent recommendation here. This is logged in the audit trail for accountability and to improve future guidance.
              </p>
              <textarea
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                placeholder="Add your override note, correction, or coaching focus here..."
                value={override}
                onChange={e => { setOverride(e.target.value); setOverrideSaved(false); }}
              />
              <div className="flex items-center gap-3">
                <button onClick={saveOverride} className="btn-primary text-sm">
                  Save Override
                </button>
                {overrideSaved && (
                  <span className="text-xs text-emerald-600 font-medium">
                    Saved and logged (audit trail in production).
                  </span>
                )}
              </div>
            </div>

            {/* Governance Note */}
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 text-sm text-brand-800">
              <strong>Governance note:</strong> This brief is AI-generated based on CV analysis, agent scores, and portfolio signals. The consultant has full authority to override any recommendation. All agent outputs, overrides, and session notes would be stored in the audit log in production for accountability and continuous improvement.
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
