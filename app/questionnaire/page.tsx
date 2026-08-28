"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import { QuestionnaireAction } from "@/components/QuestionnaireAction";
import { PILOT_MODE, QUESTIONNAIRE_URL } from "@/lib/study-config";
import { markQuestionnaireTransitionViewed, readStudySession } from "@/lib/study-session";

export default function QuestionnairePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  useEffect(() => { const session = readStudySession(); if (!session) { router.replace("/information"); return; } setCode(session.code); markQuestionnaireTransitionViewed(); }, [router]);
  return <StudyFrame step="Step 6 of 7 — Questionnaire">
    <section className="rounded-2xl border border-line bg-white p-6 text-center shadow-card sm:p-10"><ClipboardList className="mx-auto h-12 w-12 text-accent" /><h1 className="mt-5 text-3xl font-bold text-navy">Continue to the questionnaire</h1><p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">The approved Microsoft Forms questionnaire asks about comprehension, trust, fairness, actionability, and an optional written response.</p><div className="mx-auto mt-6 max-w-sm rounded-xl bg-surface p-5"><p className="text-sm text-slate-500">Your participant code</p><p className="mt-1 text-2xl font-bold tracking-widest text-navy">{code || "—"}</p><p className="mt-2 text-sm text-slate-600">Keep this code visible and enter it into the questionnaire where requested.</p></div><QuestionnaireAction pilotMode={PILOT_MODE} questionnaireUrl={QUESTIONNAIRE_URL} /><p className="mt-5 text-sm text-slate-500">No personal information is sent automatically.</p><Link href="/debrief" className="mt-6 inline-block text-sm font-semibold text-accent underline">View study debrief</Link></section>
  </StudyFrame>;
}
