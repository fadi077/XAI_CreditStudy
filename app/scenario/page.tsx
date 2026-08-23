"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import { STUDY_SCENARIO_ID } from "@/lib/study-config";
import { readStudySession } from "@/lib/study-session";

export default function Scenario() {
  const router = useRouter();
  useEffect(() => {
    const session = readStudySession();
    if (!session) { router.replace("/"); return; }
  }, [router]);

  return (
    <StudyFrame step="Step 2 of 4 — Scenario">
      <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">Fictional research scenario</p>
        <h1 className="mt-2 text-3xl font-bold text-navy">Alex&apos;s application</h1>
        <div className="mt-6 rounded-xl border border-line bg-surface p-5 text-base leading-7 text-slate-700 sm:p-6">
          <p>Alex is a 32-year-old applicant who applied for a £8,000 personal loan over 36 months. Alex earns £24,000 per year, has been in their current job for 14 months, and has two existing credit accounts. Alex has missed two loan repayments in the past 18 months. The AI system rejected the application.</p>
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-600">This scenario was created for research and does not describe a real applicant. It is not financial advice.</p>
        <button type="button" onClick={() => router.push(`/explanation/${STUDY_SCENARIO_ID}`)} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">Continue <ArrowRight className="h-4 w-4" /></button>
      </section>
    </StudyFrame>
  );
}
