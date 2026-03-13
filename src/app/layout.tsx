import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'CPIA — Career Portfolio Intelligence Agent | JSO',
  description:
    'AI-powered career portfolio diagnostics: CV score, job search strategy, GitHub portfolio analysis, skill gap roadmap — built on JSO principles.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
