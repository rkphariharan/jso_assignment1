'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Upload, Brain, Map, Users, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

const nav = [
  { href: '/',           label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/upload',     label: 'Upload CV',       icon: Upload },
  { href: '/agent',      label: 'Agent Analysis',  icon: Brain },
  { href: '/roadmap',    label: 'My Roadmap',      icon: Map },
  { href: '/consultant', label: 'HR Consultant',   icon: Users },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col py-6 px-4 gap-1">
      <div className="mb-8 px-2">
        <span className="text-xl font-bold text-brand-600 tracking-tight">JSO</span>
        <span className="text-xs text-gray-400 block">Career Intelligence Agent</span>
      </div>
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={clsx(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
            path === href
              ? 'bg-brand-50 text-brand-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
          )}
        >
          <Icon size={17} />
          {label}
          {path === href && <ChevronRight size={14} className="ml-auto text-brand-400" />}
        </Link>
      ))}
      <div className="mt-auto px-2 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400">Powered by AariyaTech UK</p>
        <p className="text-xs text-gray-300">JSO Phase-2 Prototype</p>
      </div>
    </aside>
  );
}
