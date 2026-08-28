export function QuestionnaireAction({ pilotMode, questionnaireUrl }: { pilotMode: boolean; questionnaireUrl: string }) {
  if (pilotMode) return <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-4 font-semibold text-amber-900">Questionnaire submission is disabled in non-participant pilot mode.</div>;
  if (questionnaireUrl) return <a href={questionnaireUrl} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-navy px-6 py-3 font-semibold text-white">Continue to questionnaire</a>;
  return <button disabled className="mt-8 cursor-not-allowed rounded-xl bg-slate-300 px-6 py-3 font-semibold text-slate-600">Questionnaire not yet available</button>;
}
