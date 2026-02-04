"use client";

import { useSearchParams } from "next/navigation";
import UnlockClient from "./UnlockClient";

export default function UnlockClientPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/work/calibration-software";

  return <UnlockClient next={next} />;
}
