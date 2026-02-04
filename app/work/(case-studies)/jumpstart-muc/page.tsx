import type { Metadata } from "next";
import CaseStudyClient from "./CaseStudyClient";

export const metadata: Metadata = {
  title:
    "Jumpstart-Muc Case Study — App & Responsive Website for Refugees & Immigrants",
  description:
    "Case study: designing an app and responsive website to help refugees and immigrants navigate integration in Germany, with accessibility and a volunteer support network.",
  openGraph: {
    title: "Jumpstart-Muc Case Study",
    description:
      "Designing an app + responsive website for refugees & immigrants in Munich (Jumpstart-Muc, fictitious nonprofit).",
    type: "article",
  },
};

export default function Page() {
  return <CaseStudyClient />;
}
