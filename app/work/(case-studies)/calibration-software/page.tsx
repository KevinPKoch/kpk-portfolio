import type { Metadata } from "next";
import CalibrationSoftwareCaseStudy from "./calibrationsoftware";

export const metadata: Metadata = {
  title: "EESZY — Calibration Software Case Study",
  description:
    "Case study: building a scalable calibration management software foundation — research, persona-driven feature mapping, and a production-ready design system.",
  openGraph: {
    title: "EESZY Calibration Software — UX/UI Case Study",
    description:
      "A deep dive into setting up a calibration management product with a scalable design system, accessibility principles, and strong cross-functional delivery.",
    type: "article",
  },
};

export default function Page() {
  return <CalibrationSoftwareCaseStudy />;
}
