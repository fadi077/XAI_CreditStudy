"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getParticipantAssignment } from "@/lib/api";
import { StudyFrame } from "@/components/StudyFrame";
import { hasCompletedConsent, saveStudySession } from "@/lib/study-session";

export default function ParticipantCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (!hasCompletedConsent()) router.replace("/information"); }, [router]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!/^P(0[1-9]|10)$/.test(normalized)) { setError("Enter the participant code P01–P10 provided by the researcher."); return; }
    setSubmitting(true); setError("");
    try {
      const assignment = await getParticipantAssignment(normalized);
      saveStudySession(assignment.participant_code, assignment.assigned_method);
      router.push("/scenario");
    } catch (error) {
      setError(error instanceof ApiError && error.status === 404 ? "This participant code is not valid." : "The study service is temporarily unavailable. Please try again later.");
    } finally { setSubmitting(false); }
  };
  return <StudyFrame step="Step 3 of 7 — Participant code">
    <section className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
      <h1 className="text-3xl font-bold text-navy">Enter your participant code</h1>
      <p className="mt-4 leading-7 text-slate-600">Enter the code randomly allocated to you by the researcher. Participants do not select an explanation method.</p>
      <form onSubmit={submit} className="mt-7" noValidate><label htmlFor="participant-code" className="font-semibold text-ink">Participant code</label><input id="participant-code" value={code} onChange={event => setCode(event.target.value)} placeholder="P01" autoComplete="off" className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-lg font-semibold uppercase tracking-widest" />{error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}<button disabled={submitting} className="mt-6 rounded-xl bg-navy px-6 py-3 font-semibold text-white disabled:bg-slate-300">{submitting ? "Checking code…" : "Continue to scenario"}</button></form>
    </section>
  </StudyFrame>;
}
