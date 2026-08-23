import { ArrowDown, ArrowUp, CheckCircle2, MinusCircle } from "lucide-react";
import type { CaseExplanation, ExplanationMethod, TopFactor } from "@/lib/api";
import { SHOW_PREDICTION_PROBABILITY } from "@/lib/study-config";

const riskLabel = (value: number) => value === 1 ? "Higher-risk classification" : "Lower-risk classification";

function Factors({ factors, method }: { factors: TopFactor[]; method: "SHAP" | "LIME" }) {
  const maximum = Math.max(...factors.map((factor) => Math.abs(factor.contribution)), 1e-9);
  return <div className="mt-6 space-y-4">{factors.map((factor) => {
    const positive = factor.contribution >= 0;
    const Icon = positive ? ArrowUp : ArrowDown;
    return <div key={`${factor.rank}-${factor.feature}`} className="rounded-xl border border-line p-4">
      <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-ink">{method === "LIME" && factor.rule ? factor.rule : factor.display_feature}</p>{factor.display_value !== null && <p className="mt-1 text-sm text-slate-500">Example value: {String(factor.display_value)}</p>}</div><span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700"><Icon className="h-4 w-4" />{factor.direction || (positive ? "towards higher risk" : "towards lower risk")}</span></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`Relative contribution for ${factor.display_feature}`}><div className={`h-full rounded-full ${positive ? "bg-[#C05621]" : "bg-[#2A7D4F]"}`} style={{ width: `${Math.max(8, Math.abs(factor.contribution) / maximum * 100)}%` }} /></div>
    </div>;
  })}</div>;
}

const Unavailable = () => <p role="alert" className="mt-5 rounded-xl border border-line bg-surface p-5">This explanation is currently unavailable.</p>;

export function ExplanationView({ explanation, method }: { explanation: CaseExplanation; method: ExplanationMethod }) {
  return <>
    <div className="mt-7 rounded-xl bg-navy p-5 text-white"><p className="text-sm text-[#B8C4E0]">Automated prediction</p><p className="mt-1 text-xl font-semibold">{riskLabel(explanation.prediction.predicted_class)}</p>{SHOW_PREDICTION_PROBABILITY && <p className="mt-1 text-sm">Model probability: {(explanation.prediction.predicted_probability * 100).toFixed(1)}%</p>}</div>
    <h2 className="mt-8 text-2xl font-bold text-navy">Your explanation</h2>
    {method === "SHAP" && (explanation.shap.available ? <><p className="mt-2 text-slate-600">These factors contributed most to the model&apos;s prediction. They are associations used by the model, not guarantees or causes.</p><Factors factors={explanation.shap.top_factors} method="SHAP" /></> : <Unavailable />)}
    {method === "LIME" && (explanation.lime.available ? <><p className="mt-2 text-slate-600">These factors were most influential around this example. They describe the model locally and do not imply causation.</p><Factors factors={explanation.lime.top_factors} method="LIME" /></> : <Unavailable />)}
    {method === "DiCE" && (explanation.dice.available ? <div className="mt-5 rounded-xl border border-line p-5"><p className="flex items-center gap-2 font-semibold text-[#2A7D4F]"><CheckCircle2 className="h-5 w-5" />Valid alternative found</p><p className="mt-2 text-slate-600">Under the model, this alternative set of values changes the prediction to a {riskLabel(1 - explanation.prediction.predicted_class).toLowerCase()}.</p><div className="mt-5 space-y-3">{explanation.dice.changes.map((change) => <div key={change.feature} className="grid gap-1 rounded-lg bg-surface p-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center"><span><strong>{change.display_feature}</strong><br /><span className="text-sm text-slate-500">{String(change.original_value)}</span></span><span aria-hidden className="text-accent">→</span><span className="font-medium">{String(change.counterfactual_value)}</span></div>)}</div><p className="mt-4 text-sm text-slate-500">Changes are limited to each configured {explanation.dice.actionability_terminology}.</p></div> : <div className="mt-5 flex gap-3 rounded-xl border border-line bg-surface p-5"><MinusCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" /><p>No valid alternative was returned under the configured explanation constraints for this example.</p></div>)}
  </>;
}
