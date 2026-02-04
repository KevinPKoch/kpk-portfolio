import './globals.css';

import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Kevin Philipp Koch – Portfolio',
  description:
    'UX/UI portfolio of Kevin Philipp Koch. Selected work, case studies, and contact information.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Keyboard skip link (WCAG 2.1 – bypass blocks) */}
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>

        {/* Page background outside the bordered canvas */}
        <div className="kpk-page">
          <div className="kpk-canvas">{children}</div>
        </div>
      </body>
    </html>
  );
}
