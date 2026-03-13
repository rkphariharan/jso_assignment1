'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import AppShell from '@/components/AppShell';
import { store, UserProfile } from '@/lib/store';
import { Upload, FileText, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const USER_TYPES = [
  { value: 'student',    label: 'Student',              desc: 'Looking for internships or entry-level roles' },
  { value: 'graduate',   label: 'Recent Graduate',      desc: 'Graduated, seeking first professional role' },
  { value: 'experienced',label: 'Experienced Candidate',desc: 'Professional looking for career advancement' },
] as const;

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    targetRole: '',
    targetLevel: '',
    userType: 'graduate',
    githubUrl: '',
  });
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);

    if (f.type === 'application/pdf') {
      // Read PDF as text via FormData to our API
      const fd = new FormData();
      fd.append('file', f);
      const res = await fetch('/api/extract-pdf', { method: 'POST', body: fd });
      const data = await res.json();
      setCvText(data.text ?? '');
    } else {
      const text = await f.text();
      setCvText(text);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/msword': ['.doc', '.docx'] },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (!cvText.trim()) { toast.error('Please upload your CV first.'); return; }
    if (!profile.name || !profile.targetRole || !profile.targetLevel) {
      toast.error('Please fill in your name, target role, and level.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyse-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText, profile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      store.saveProfile(profile);
      store.saveCVAnalysis({ ...data, rawText: cvText });
      toast.success('CV analysed successfully!');
      router.push('/agent');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload Your CV</h1>
          <p className="text-gray-500 mt-1">Paste or upload your CV. The agent will run a full ATS and positioning analysis.</p>
        </div>

        {/* Profile fields */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Your Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label mb-1 block">Your Name</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={profile.name}
                onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Alex Johnson"
              />
            </div>
            <div>
              <label className="label mb-1 block">Target Role</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={profile.targetRole}
                onChange={e => setProfile(p => ({ ...p, targetRole: e.target.value }))}
                placeholder="e.g. Data Analyst"
              />
            </div>
            <div>
              <label className="label mb-1 block">Seniority Level</label>
              <select
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={profile.targetLevel}
                onChange={e => setProfile(p => ({ ...p, targetLevel: e.target.value }))}
              >
                <option value="">Select level</option>
                {['Intern', 'Junior', 'Mid-level', 'Senior', 'Lead', 'Principal'].map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label mb-1 block">GitHub / Bitbucket URL (optional)</label>
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                value={profile.githubUrl}
                onChange={e => setProfile(p => ({ ...p, githubUrl: e.target.value }))}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          <div>
            <label className="label mb-2 block">Your Situation</label>
            <div className="grid grid-cols-3 gap-3">
              {USER_TYPES.map(ut => (
                <button
                  key={ut.value}
                  onClick={() => setProfile(p => ({ ...p, userType: ut.value }))}
                  className={`p-3 rounded-xl border text-left transition-all text-sm ${profile.userType === ut.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="font-medium text-gray-800">{ut.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{ut.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">CV Document</h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-brand-400 bg-brand-50' : 'border-gray-300 hover:border-brand-300'}`}
          >
            <input {...getInputProps()} />
            {file
              ? <div className="flex items-center justify-center gap-2 text-brand-600"><FileText size={20} />{file.name}</div>
              : <div className="space-y-1"><Upload size={28} className="mx-auto text-gray-400" /><p className="text-sm text-gray-500">Drag and drop PDF/TXT, or click to browse</p></div>
            }
          </div>

          {/* Or paste */}
          <div>
            <label className="label mb-1 block">Or paste CV text directly</label>
            <textarea
              rows={8}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
              value={cvText}
              onChange={e => setCvText(e.target.value)}
              placeholder="Paste your full CV text here..."
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading
            ? <><Loader2 size={16} className="animate-spin" /> Analysing CV...</>
            : <><CheckCircle2 size={16} /> Run CV Analysis <ArrowRight size={14} /></>
          }
        </button>
      </div>
    </AppShell>
  );
}
