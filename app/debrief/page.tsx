"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import { hasViewedQuestionnaireTransition, readStudySession } from "@/lib/study-session";

export default function Debrief() {
  const router = useRouter();
  useEffect(() => { if (!readStudySession() || !hasViewedQuestionnaireTransition()) router.replace("/information"); }, [router]);
  return <StudyFrame step="Step 7 of 7 — Debrief">
    <section className="rounded-2xl border border-line bg-white p-6 text-center shadow-card sm:p-10"><CheckCircle2 className="mx-auto h-12 w-12 text-[#2A7D4F]" /><h1 className="mt-5 text-3xl font-bold text-navy">Thank you for participating</h1><div className="mx-auto mt-5 max-w-2xl space-y-4 leading-7 text-slate-600"><p>This study compares SHAP, LIME and DiCE explanations of an AI credit-risk decision.</p><p>The scenario was entirely fictional and did not relate to your own financial circumstances. It was not financial advice.</p><p>Questionnaire responses are anonymous and study results will be reported in aggregate. This page does not reveal other participants&apos; explanation assignments.</p><p>For questions, contact researcher Muhammad Fahad Saeed at <a className="text-accent underline" href="mailto:c5038678@hallam.shu.ac.uk">c5038678@hallam.shu.ac.uk</a> or supervisor Dr Salem Mansour at <a className="text-accent underline" href="mailto:S.Mansour@shu.ac.uk">S.Mansour@shu.ac.uk</a>.</p></div></section>
  </StudyFrame>;
}
