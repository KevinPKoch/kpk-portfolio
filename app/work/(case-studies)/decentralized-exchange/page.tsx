import type { Metadata } from "next";
import DecentralizedDerivatives from "./DecentralizedDerivatives";

export const metadata: Metadata = {
  title: "Decentralized Exchange Case Study",
  description:
    "Case study of a decentralized derivatives exchange. Focus on UX/UI design, design systems, and performance-driven frontend development for high-frequency trading environments.",

  openGraph: {
    title: "Decentralized Exchange - UX/UI Case Study",
    description:
      "A deep dive into the design and development of a decentralized derivatives trading platform, focusing on clarity, performance, and scalable UX systems.",
    type: "article",
  },
};

export default function Page() {
  return <DecentralizedDerivatives />;
}
