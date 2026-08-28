"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import { getParticipantStimulus, type ParticipantStimulus } from "@/lib/api";
import { STUDY_SCENARIO_ID } from "@/lib/study-config";
import { readStudySession } from "@/lib/study-session";

export default function Scenario() {
  const router = useRouter();
  const [stimulus, setStimulus] = useState<ParticipantStimulus | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const session = readStudySession();
    if (!session) { router.replace("/information"); return; }
    getParticipantStimulus(session.code).then(setStimulus).catch(() => setError("The approved study scenario is temporarily unavailable."));
  }, [router]);
  return <StudyFrame step="Step 4 of 7 — Scenario">
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">{error}</p>}
      {!stimulus && !error && <p role="status">Loading the fictional scenario…</p>}
      {stimulus && <><h1 className="text-3xl font-bold text-navy">{stimulus.scenario.title}</h1><div className="mt-6 space-y-4 text-base leading-7 text-slate-700">{stimulus.scenario.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div><p className="mt-6 rounded-xl bg-surface p-5 text-sm leading-6 text-slate-600">{stimulus.scenario.notice}</p><button type="button" onClick={() => router.push(`/explanation/${STUDY_SCENARIO_ID}`)} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white">View assigned explanation <ArrowRight className="h-4 w-4" /></button></>}
    </section>
  </StudyFrame>;
}
