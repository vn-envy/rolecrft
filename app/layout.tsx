import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rolecrft — Craft Your Way In',
  description: 'AI-powered career intelligence with Supabase-backed workspaces and auth.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
