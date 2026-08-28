"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";
import { markInformationViewed } from "@/lib/study-session";

export default function InformationPage() {
  const router = useRouter();
  const continueToConsent = () => { markInformationViewed(); router.push("/consent"); };
  return <StudyFrame step="Step 1 of 7 — Information">
    <article className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
      <h1 className="text-3xl font-bold text-navy">Participant Information</h1>
      <p className="mt-4 leading-7 text-slate-600">This MSc research project investigates how people understand explanations produced by AI systems making credit-risk decisions, including their relationship to UK FCA Consumer Duty principles. It does not claim FCA approval or compliance.</p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <section><h2 className="font-semibold text-ink">What will I do?</h2><p className="mt-2 text-sm leading-6 text-slate-600">You will review one fictional credit scenario, see one explanation, and continue to the approved questionnaire. Participation takes approximately 15–20 minutes and no technical AI knowledge is required.</p></section>
        <section><h2 className="font-semibold text-ink">Is participation voluntary?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Yes. You may stop at any time before submitting the questionnaire. Because responses are anonymous, they cannot practically be identified and withdrawn after submission.</p></section>
        <section><h2 className="font-semibold text-ink">What information is collected?</h2><p className="mt-2 text-sm leading-6 text-slate-600">The application does not collect names, student IDs, email addresses, demographics, or personal financial information. The scenario is fictional and is not a personal financial decision.</p></section>
        <section><h2 className="font-semibold text-ink">How is study data handled?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Anonymous questionnaire data will be handled securely through approved university processes. This study has university ethics approval.</p></section>
      </div>
      <details className="mt-7 rounded-xl border border-line bg-surface p-5"><summary className="cursor-pointer font-semibold text-navy">View full approved-information summary</summary><div className="mt-4 space-y-3 text-sm leading-6 text-slate-600"><p>Participation is fully online and involves a single fictional research example. The example does not represent a real applicant and no explanation should be treated as financial advice.</p><p>Participation is voluntary. You can leave the application before questionnaire submission without giving a reason. Once an anonymous questionnaire is submitted, the research team cannot reliably identify an individual response for withdrawal.</p><p>For questions, contact researcher Muhammad Fahad Saeed at c5038678@hallam.shu.ac.uk or supervisor Dr Salem Mansour at S.Mansour@shu.ac.uk.</p></div></details>
      <button type="button" onClick={continueToConsent} className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white">Continue to consent <ArrowRight className="h-4 w-4" /></button>
    </article>
  </StudyFrame>;
}
