import Link from "next/link";
import { ArrowRight, Clock, Shield } from "lucide-react";
import { StudyFrame } from "@/components/StudyFrame";

export default function Home() {
  return <StudyFrame step="Welcome">
    <section className="rounded-2xl border border-line bg-white p-6 shadow-card sm:p-10">
      <p className="text-sm font-semibold uppercase tracking-wide text-accent">MSc research study</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Understanding explanations of AI credit decisions</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">You are invited to review one fictional credit scenario, view one AI explanation, and complete the approved questionnaire.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-surface p-5"><Clock className="h-6 w-6 text-accent" /><p className="mt-3 font-semibold text-ink">Approximately 15–20 minutes</p></div>
        <div className="rounded-xl bg-surface p-5"><Shield className="h-6 w-6 text-accent" /><p className="mt-3 font-semibold text-ink">Anonymous and fully online</p></div>
      </div>
      <Link href="/information" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">Read participant information <ArrowRight className="h-4 w-4" /></Link>
    </section>
  </StudyFrame>;
}
