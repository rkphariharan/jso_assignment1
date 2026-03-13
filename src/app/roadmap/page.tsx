'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { store, AgentAnalysis, PriorityAction } from '@/lib/store';
import { CheckCircle2, Circle, Map, Calendar } from 'lucide-react';
import { categoryColor } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

export default function RoadmapPage() {
  const [agent, setAgent] = useState<AgentAnalysis | null>(null);

  useEffect(() => {
    setAgent(store.loadAgentAnalysis());
  }, []);

  const toggleTask = (id: string) => {
    if (!agent) return;
    const updated: AgentAnalysis = {
      ...agent,
      priorityActions: agent.priorityActions.map((a: PriorityAction) =>
        a.id === id ? { ...a, completed: !a.completed } : a,
      ),
    };
    store.saveAgentAnalysis(updated);
    setAgent(updated);
    const action = updated.priorityActions.find((a: PriorityAction) => a.id === id);
    if (action?.completed) toast.success('Task marked complete!');
  };

  const completedCount = agent?.priorityActions.filter((a: PriorityAction) => a.completed).length ?? 0;
  const totalCount = agent?.priorityActions.length ?? 0;
  const pct = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Map size={22} className="text-brand-500" /> My Career Roadmap
          </h1>
          <p className="text-gray-500 mt-1">
            Your personalised execution plan. Mark tasks as done to track progress.
          </p>
        </div>

        {!agent && (
          <div className="card p-10 text-center space-y-3">
            <p className="text-gray-500">No roadmap yet. Run the Agent Analysis first.</p>
            <Link href="/agent" className="btn-primary inline-block">Go to Agent</Link>
          </div>
        )}

        {agent && (
          <>
            {/* Progress */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-800">Overall Progress</h2>
                <span className="text-sm font-bold text-brand-600">{pct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-brand-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">{completedCount} of {totalCount} actions completed</p>
            </div>

            {/* Weekly Plan */}
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar size={16} className="text-brand-400" /> 4-Week Execution Plan
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agent.weeklyRoadmap.map(week => (
                  <div key={week.week} className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                        W{week.week}
                      </span>
                      <span className="font-semibold text-gray-800 text-sm">{week.theme}</span>
                    </div>
                    <ul className="space-y-2">
                      {week.tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-300 mt-2 shrink-0" />
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Checklist */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-800 mb-4">Action Checklist</h2>
              <p className="text-xs text-gray-400 mb-4">Click any task to mark it complete. Progress is saved automatically.</p>
              <div className="space-y-2">
                {agent.priorityActions.map((action: PriorityAction) => (
                  <button
                    key={action.id}
                    onClick={() => toggleTask(action.id)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      action.completed
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-gray-200 hover:border-brand-200 hover:bg-brand-50'
                    }`}
                  >
                    {action.completed
                      ? <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
                      : <Circle size={18} className="text-gray-300 mt-0.5 shrink-0" />
                    }
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-medium ${action.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {action.title}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColor(action.category)}`}>
                          {action.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{action.reason}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
