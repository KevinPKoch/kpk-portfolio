import type { ReactNode } from 'react';

import CaseStudyShell from './CaseStudyShell';

export default function Layout({ children }: { children: ReactNode }) {
  return <CaseStudyShell>{children}</CaseStudyShell>;
}
