"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StudyFrame } from "@/components/StudyFrame";
import { hasViewedInformation, markConsentCompleted } from "@/lib/study-session";

const statements = [
  "I have read the participant information.",
  "I understand what the study involves.",
  "I understand that participation is voluntary.",
  "I understand the withdrawal conditions.",
  "I agree to take part anonymously for research purposes.",
  "I wish to participate in this study.",
];

export default function ConsentPage() {
  const router = useRouter();
  const [checks, setChecks] = useState<boolean[]>(statements.map(() => false));
  useEffect(() => { if (!hasViewedInformation()) router.replace("/information"); }, [router]);
  const complete = checks.every(Boolean);
  return <StudyFrame step="Step 2 of 7 — Consent">
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
      <h1 className="text-3xl font-bold text-navy">Consent acknowledgement</h1>
      <p className="mt-4 leading-7 text-slate-600">Please positively confirm every statement before continuing. Do not enter a name, signature, or email address.</p>
      <div className="mt-7 space-y-3">{statements.map((statement, index) => <label key={statement} className="flex cursor-pointer gap-3 rounded-xl border border-line p-4"><input type="checkbox" checked={checks[index]} onChange={(event) => setChecks(values => values.map((value, item) => item === index ? event.target.checked : value))} className="mt-1 h-4 w-4" /><span>{statement}</span></label>)}</div>
      <button type="button" disabled={!complete} onClick={() => { markConsentCompleted(); router.push("/participant-code"); }} className="mt-8 rounded-xl bg-navy px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600">Continue</button>
      <p className="mt-4 text-sm text-slate-500">This temporary acknowledgement controls navigation only and is not stored as research evidence.</p>
    </section>
  </StudyFrame>;
}
