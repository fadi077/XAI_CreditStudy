"use client";

import { useParams } from "next/navigation";

function getGroup(code: string): string {
  const match = code.toUpperCase().match(/^P0?(\d+)$/);
  if (!match) return "Unknown Group";

  const num = parseInt(match[1], 10);
  if (num >= 1 && num <= 4) return "SHAP Group";
  if (num >= 5 && num <= 7) return "LIME Group";
  if (num >= 8 && num <= 10) return "DiCE Group";
  return "Unknown Group";
}

export default function Explanation() {
  const params = useParams();
  const code = (params.code as string) ?? "";
  const group = getGroup(code);

  function handleContinue() {
    window.open("https://forms.office.com/PLACEHOLDER", "_blank");
  }

  return (
    <div>
      <p>Participant code: {code}</p>
      <p>Group: {group}</p>
      <button type="button" onClick={handleContinue}>
        Continue to Questionnaire
      </button>
    </div>
  );
}
