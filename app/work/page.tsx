import { redirect } from "next/navigation";

export default function WorkIndex() {
  // Simple landing for /work to avoid 404s.
  redirect("/work/calibration-software");
}
