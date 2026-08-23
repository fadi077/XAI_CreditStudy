"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CircleAlert } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import type { ExplanationMethod } from "@/lib/api";
import { STUDY_SCENARIO_ID, STUDY_STIMULUS_VALIDATED } from "@/lib/study-config";
import { readStudySession } from "@/lib/study-session";

export default function ExplanationPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const scenarioId = decodeURIComponent(params.code ?? "");
  const [method, setMethod] = useState<ExplanationMethod | null>(null);

  useEffect(() => {
    const session = readStudySession();
    if (!session) { router.replace("/"); return; }
    setMethod(session.method);
  }, [router]);

  const validScenario = scenarioId === STUDY_SCENARIO_ID;
  return <StudyFrame step="Step 3 of 4 — Explanation">
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">Fictional research scenario</p>
      <h1 className="mt-2 text-3xl font-bold text-navy">{method ? `${method} explanation` : "Assigned explanation"}</h1>
      {!method && validScenario && <p role="status" className="mt-8 text-slate-500">Preparing your assigned explanation…</p>}
      {!validScenario && <div role="alert" className="mt-8 rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">This study scenario is not available.</div>}
      {validScenario && method && !STUDY_STIMULUS_VALIDATED && <div role="status" className="mt-8 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-semibold">Study explanation stimulus pending final research validation.</p><p className="mt-2 text-sm">This controlled development state will be replaced only after the synthetic stimulus and its assigned explanations are approved.</p></div></div>}
      {validScenario && method && STUDY_STIMULUS_VALIDATED && <p className="mt-8">The approved persisted explanation will appear here.</p>}
      {validScenario && method && <button type="button" onClick={() => router.push("/debrief")} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">Continue to questionnaire transition<ArrowRight className="h-4 w-4" /></button>}
    </section>
  </StudyFrame>;
}
