import Link from "next/link";
import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import { PILOT_MODE } from "@/lib/study-config";

export function StudyFrame({ children, step }: { children: ReactNode; step: string }) {
  return (
    <div className="min-h-screen bg-surface">
      <div className="h-[3px] bg-accent" />
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 rounded-lg font-bold text-navy focus:outline-none focus:ring-2 focus:ring-accent">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy text-white"><Shield className="h-5 w-5" /></span>
            XAI Credit Study
          </Link>
          <span className="text-sm font-medium text-slate-500">{step}</span>
        </div>
      </header>
      {PILOT_MODE && <div role="status" className="border-b border-amber-300 bg-amber-100 px-4 py-3 text-center text-sm font-semibold text-amber-950">Non-participant pilot mode — no research data will be collected or submitted.</div>}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}
