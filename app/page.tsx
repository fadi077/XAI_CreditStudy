"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  BookOpen,
  MessageSquareText,
  ClipboardList,
  Clock,
  GraduationCap,
  ArrowRight,
  Lock,
  Check,
  ChevronRight,
} from "lucide-react";
import { ApiError, getParticipantAssignment } from "@/lib/api";
import { saveStudySession } from "@/lib/study-session";

const howItWorks = [
  {
    step: "01",
    icon: BookOpen,
    title: "Read Scenario",
    description:
      "Review one fictional loan application and the AI system's decision",
    accent: "#4F8EF7",
    accentSoft: "rgba(79, 142, 247, 0.12)",
  },
  {
    step: "02",
    icon: MessageSquareText,
    title: "View Explanation",
    description:
      "See how the AI explains its decision in one of three ways",
    accent: "#2A7D4F",
    accentSoft: "rgba(42, 125, 79, 0.12)",
  },
  {
    step: "03",
    icon: ClipboardList,
    title: "Share Feedback",
    description: "Answer 12 quick questions about what you just read",
    accent: "#E8A838",
    accentSoft: "rgba(232, 168, 56, 0.14)",
  },
];

const keyFacts = [
  {
    icon: Clock,
    title: "15–20 Minutes",
    description: "One session, no follow-up required",
    accent: "#1E2761",
    hoverAccent: "#2D3A8C",
  },
  {
    icon: Shield,
    title: "Fully Anonymous",
    description: "No personal details collected at any point",
    accent: "#2A7D4F",
    hoverAccent: "#35925D",
  },
  {
    icon: GraduationCap,
    title: "Ethics Review",
    description: "University ethics approval obtained",
    accent: "#4F8EF7",
    hoverAccent: "#6BA3F9",
  },
];

const trustBadges = ["Participant code only", "No personal details", "Anonymous"];

function FadeIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`fade-section ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  function handleCodeChange(value: string) {
    const upper = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setCode(upper.slice(0, 3));
    if (error) setError("");
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();

    if (!/^P(?:0[1-9]|10)$/.test(trimmed)) {
      setError("Please enter a valid participant code (P01–P10).");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const assignment = await getParticipantAssignment(trimmed);
      saveStudySession(assignment.participant_code, assignment.assigned_method);
      router.push("/scenario");
    } catch (requestError) {
      setError(requestError instanceof ApiError && requestError.status === 404
        ? "That participant code was not recognised. Please check the code and try again."
        : "The study is temporarily unavailable. Please try again shortly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top accent line */}
      <div className="h-[3px] w-full bg-accent" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/95 shadow-[0_1px_8px_rgba(30,39,97,0.08)] backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="group flex cursor-default items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy shadow-sm transition-transform duration-300 ease-out group-hover:scale-105">
              <Shield className="h-5 w-5 text-white" strokeWidth={2.25} />
            </div>
            <span className="text-base font-bold tracking-tight text-navy transition-colors duration-300 ease-out group-hover:text-accent sm:text-lg">
              XAI Credit Study
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden text-sm text-slate-500 sm:inline">
              Sheffield Hallam University
            </span>
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-navy sm:text-xs">
              SHU
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section
          className="animate-hero-gradient relative flex min-h-[420px] items-center overflow-hidden"
          style={{
            backgroundImage:
              "linear-gradient(135deg, #1E2761 0%, #2D3A8C 40%, #1E2761 70%, #2D3A8C 100%)",
          }}
        >
          {/* Dot grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <span className="animate-pill-glow mb-6 inline-flex items-center rounded-full border border-accent/40 bg-white/10 px-4 py-1.5 text-sm font-medium text-[#A8C5FA] backdrop-blur-sm">
                Step 1 of 4 — Welcome
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Understanding AI Credit Decisions
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#B8C4E0] sm:text-lg">
                A research study comparing how AI systems explain loan decisions
                to everyday people
              </p>
            </div>

            {/* Floating stat badges */}
            <div className="pointer-events-none absolute bottom-6 left-4 hidden sm:block lg:left-8">
              <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy shadow-[0_4px_20px_rgba(0,0,0,0.18)] sm:text-sm">
                One fictional research scenario
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-6 right-4 hidden sm:block lg:right-8">
              <div className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-navy shadow-[0_4px_20px_rgba(0,0,0,0.18)] sm:text-sm">
                3 XAI methods compared
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white py-14 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                How It Works
              </h2>
              <p className="mt-3 text-slate-500">
                Three simple steps from start to finish
              </p>
            </FadeIn>

            <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
              {howItWorks.map((item, index) => {
                const Icon = item.icon;
                return (
                  <FadeIn key={item.step} delay={index * 100} className="relative">
                    {/* Connector arrow between cards — desktop only */}
                    {index < howItWorks.length - 1 && (
                      <div
                        className="pointer-events-none absolute -right-7 top-1/2 z-10 hidden -translate-y-1/2 text-slate-300 lg:block"
                        aria-hidden
                      >
                        <ChevronRight className="h-6 w-6" strokeWidth={1.75} />
                      </div>
                    )}
                    <div
                      className="group relative h-full overflow-hidden rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover sm:p-8"
                      style={{ borderLeftWidth: 4, borderLeftColor: item.accent }}
                    >
                      <span
                        className="pointer-events-none absolute -right-1 -top-2 select-none text-6xl font-bold leading-none"
                        style={{ color: item.accent, opacity: 0.15 }}
                        aria-hidden
                      >
                        {item.step}
                      </span>
                      <div className="relative mb-5 flex items-start justify-between">
                        <div
                          className="flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 ease-out group-hover:scale-105"
                          style={{
                            backgroundColor: item.accentSoft,
                            color: item.accent,
                          }}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2.25} />
                        </div>
                      </div>
                      <h3 className="relative text-lg font-semibold text-ink">
                        {item.title}
                      </h3>
                      <p className="relative mt-2 text-sm leading-relaxed text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        {/* Key facts */}
        <section
          className="relative overflow-hidden bg-surface py-14 sm:py-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, rgba(30,39,97,0.02) 0px, rgba(30,39,97,0.02) 1px, transparent 1px, transparent 10px)",
          }}
        >
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
              <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
                Key Facts
              </h2>
              <p className="mt-3 text-slate-500">
                What you need to know before you begin
              </p>
            </FadeIn>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {keyFacts.map((fact, index) => {
                const Icon = fact.icon;
                return (
                  <FadeIn key={fact.title} delay={index * 100}>
                    <div className="group h-full rounded-2xl border border-line bg-card p-6 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-card-hover sm:p-8">
                      <div
                        className="mb-5 flex items-center justify-center rounded-xl text-white transition-colors duration-300 ease-out"
                        style={{
                          width: 64,
                          height: 64,
                          backgroundColor: fact.accent,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            fact.hoverAccent;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = fact.accent;
                        }}
                      >
                        <Icon size={48} strokeWidth={1.75} />
                      </div>
                      <h3 className="text-lg font-semibold text-ink">
                        {fact.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500">
                        {fact.description}
                      </p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </section>

        {/* Participant code */}
        <section className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="relative mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl p-[2px]">
                {/* Animated rotating gradient border */}
                <div
                  className="animate-border-spin pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #1E2761, #4F8EF7, #2D3A8C, #4F8EF7, #1E2761)",
                  }}
                  aria-hidden
                />
                <div className="relative rounded-[14px] bg-card p-5 shadow-card sm:p-6">
                  <div className="text-center">
                    <h2 className="text-xl font-bold tracking-tight text-navy sm:text-2xl">
                      Enter Your Participant Code
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                      Your code was provided in the recruitment email
                    </p>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="mt-5 space-y-3.5"
                    noValidate
                  >
                    <div>
                      <label htmlFor="participant-code" className="sr-only">
                        Participant code
                      </label>
                      <div className="relative">
                        <Lock
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                          strokeWidth={2}
                        />
                        <input
                          id="participant-code"
                          type="text"
                          value={code}
                          onChange={(e) => handleCodeChange(e.target.value)}
                          placeholder="e.g. P01"
                          autoComplete="off"
                          spellCheck={false}
                          aria-invalid={Boolean(error)}
                          aria-describedby={error ? "code-error" : undefined}
                          disabled={submitting}
                          className={`w-full rounded-xl border bg-surface py-3.5 pl-11 pr-4 text-center text-lg font-semibold tracking-[0.2em] text-ink placeholder:tracking-normal placeholder:text-slate-400 transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                            error
                              ? "border-red-400 focus:border-red-400 focus:ring-red-200"
                              : "border-line focus:border-accent focus:ring-accent/40"
                          }`}
                        />
                      </div>
                      {error && (
                        <p
                          id="code-error"
                          role="alert"
                          className="mt-2 text-center text-sm font-medium text-red-600"
                        >
                          {error}
                        </p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-shine group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-navy to-accent px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all duration-300 ease-out hover:bg-gradient-to-l hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 active:scale-[0.98]"
                    >
                      {submitting ? "Checking code…" : "Begin Study"}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5" />
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {trustBadges.map((badge) => (
                        <span
                          key={badge}
                          className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-slate-600"
                        >
                          <Check
                            className="h-3 w-3 text-[#2A7D4F]"
                            strokeWidth={3}
                          />
                          {badge}
                        </span>
                      ))}
                    </div>
                  </form>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>
      </main>

      {/* Footer accent divider */}
      <div className="h-[3px] w-full bg-accent" />
      <footer className="bg-navy">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:px-6 lg:grid-cols-3 lg:px-8 lg:gap-8">
          <div className="text-center lg:text-left">
            <p className="font-medium text-white">Researcher</p>
            <p className="mt-1 text-[#B8C4E0]">Muhammad Fahad Saeed</p>
            <a
              href="mailto:c5038678@hallam.shu.ac.uk"
              className="mt-0.5 inline-block text-accent transition-all duration-300 ease-out hover:text-white hover:drop-shadow-[0_0_8px_rgba(79,142,247,0.85)]"
            >
              c5038678@hallam.shu.ac.uk
            </a>
          </div>
          <div className="text-center">
            <p className="font-medium text-white">Supervisor</p>
            <p className="mt-1 text-[#B8C4E0]">Dr Salem Mansour</p>
            <a
              href="mailto:S.Mansour@shu.ac.uk"
              className="mt-0.5 inline-block text-accent transition-all duration-300 ease-out hover:text-white hover:drop-shadow-[0_0_8px_rgba(79,142,247,0.85)]"
            >
              S.Mansour@shu.ac.uk
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 lg:justify-end">
            <Shield className="h-4 w-4 text-accent" strokeWidth={2.25} />
            <p className="text-[#B8C4E0]">
              © 2026 Sheffield Hallam University
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
