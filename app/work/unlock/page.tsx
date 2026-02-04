import type { Metadata } from "next";
import UnlockClientPage from "./UnlockClientPage";
import UnlockShell from "../(case-studies)/CaseStudyShell";
import Footer from "@/app/components/Footer";

export const metadata: Metadata = {
  title: "Protected Case Study",
  robots: { index: false, follow: false },
};

// wichtig für `output: "export"`
export const dynamic = "force-static";

export default function Page() {
  return (
    // Important: Do NOT paint an extra background layer here.
    // The site-wide canvas grid is rendered via .kpk-canvas::before in globals.css.
    // Any opaque background on this page would cover those grid lines.
    <main className="relative min-h-screen text-(--text)">
      <div className="mx-auto min-h-screen w-full max-w-[var(--canvas-max)] px-[var(--grid-margin)]">
        <UnlockShell>
          <div className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-[420px] flex-col justify-center pt-24 pb-16">
            <UnlockClientPage />
          </div>

          <Footer />
        </UnlockShell>
      </div>
    </main>
  );
}
