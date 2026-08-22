"use client";

import { useRouter } from "next/navigation";

export default function Scenario() {
  const router = useRouter();

  function handleContinue() {
    const code = localStorage.getItem("participantCode");
    if (!code) return;
    router.push(`/explanation/${code}`);
  }

  return (
    <div>
      <button type="button" onClick={handleContinue}>
        Continue
      </button>
    </div>
  );
}
