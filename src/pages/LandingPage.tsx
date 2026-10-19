import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import {
  Search,
  Wallet as WalletIcon,
  Infinity,
  Check,
  ShieldCheck,
  Zap,
  BadgePoundSterling,
  Lock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Users,
  Award,
  BookOpen,
  ListChecks,
  BookMarked,
  Share2,
  Star,
  MessageSquareQuote,
} from "lucide-react";
import { Link } from "react-router-dom";
import { LandingTopNav } from "../components/LandingTopNav";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Reveal } from "../hooks/useReveal";
import { Avatar } from "../components/Avatar";
import type { Quiz, Course, Profile } from "../types";
import {
  fetchPublishedQuizzes,
  fetchCourses,
  fetchAllProfiles,
  fetchPlatformStats,
  fetchPlatformRating,
  fetchCreatorRatingSummary,
  fetchFeaturedTestimonials,
  type PlatformStats,
  type PlatformRating,
  type Testimonial,
} from "../lib/queries";
import {
  formatCompactNumber,
  formatCompactNaira,
} from "../lib/format";

// ---------- HERO ----------
interface HeroProps {
  stats: PlatformStats | null;
  platformRating: PlatformRating | null;
  creators: Profile[];
  statsLoading: boolean;
}

function Hero({ stats, platformRating, creators, statsLoading }: HeroProps) {
  const userCount = stats ? formatCompactNumber(stats.total_registered_users) : null;
  const avgRating = platformRating && platformRating.avg_rating > 0
    ? platformRating.avg_rating.toFixed(1)
    : null;
  const reviewCount = platformRating && platformRating.total_reviews > 0
    ? formatCompactNumber(platformRating.total_reviews)
    : null;

  // Top 4 approved creators for avatar chips (Approach A: prioritize creators with real photos, rotating on refresh)
  const topCreators = useMemo(() => {
    const approved = creators.filter((c) => c.is_approved_creator);
    const withPhotos = approved.filter(
      (c) => Boolean(c.avatar_url && c.avatar_url.trim().length > 0)
    );
    const withoutPhotos = approved.filter(
      (c) => !c.avatar_url || c.avatar_url.trim().length === 0
    );

    // Shuffle so different verified creators with real photos get featured across visits
    const shuffledWithPhotos = [...withPhotos].sort(() => Math.random() - 0.5);
    const shuffledWithoutPhotos = [...withoutPhotos].sort(() => Math.random() - 0.5);

    // Prioritize creators with photos first, then backfill with any remaining approved creators
    return [...shuffledWithPhotos, ...shuffledWithoutPhotos].slice(0, 4);
  }, [creators]);

  return (
    <section className="relative w-full overflow-hidden">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-16 sm:pb-20 lg:pb-28">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <Reveal className="lg:col-span-6 xl:col-span-6">
            <div>
              <Badge variant="primary" className="mb-5" size="md">
                <Sparkles className="w-3 h-3" />
                Course quizzes · Verified creators · Instant results
              </Badge>
              <h1 className="font-heading font-bold tracking-tight text-text leading-[1.05] text-4xl sm:text-5xl lg:text-[56px]">
                Practice like the real exam.
                <br />
                <span className="text-primary">Pay small, learn fast.</span>
              </h1>
              <p className="mt-5 sm:mt-6 text-base sm:text-lg text-text-soft max-w-xl leading-relaxed">
                PrepUniv is Nigeria's marketplace for course-specific CBT
                practice quizzes made by real lecturers and top students. Pay a
                tiny per-quiz fee (₦50 – ₦500), see your score instantly, and
                retake forever.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link to="/signup">
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="w-[18px] h-[18px]" />}
                  >
                    Get Started
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button size="lg" variant="outline">
                    <Search className="w-[18px] h-[18px]" />
                    Browse Quizzes
                  </Button>
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                <div className="flex items-center gap-3">
                  {/* Avatar chips: real approved creators if loaded, fallback to placeholders */}
                  <div className="flex -space-x-2">
                    {statsLoading || topCreators.length === 0 ? (
                      <>
                        <Avatar name="T" size="sm" />
                        <Avatar name="A" size="sm" />
                        <Avatar name="E" size="sm" />
                        <Avatar name="Z" size="sm" />
                      </>
                    ) : (
                      topCreators.map((c) => (
                        <Link
                          key={c.id}
                          to={`/profile/creator/${c.id}`}
                          title={`View ${c.full_name}'s creator profile`}
                          className="inline-block transition-transform hover:scale-115 hover:z-10 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-full"
                        >
                          <Avatar
                            name={c.full_name}
                            src={c.avatar_url ?? undefined}
                            size="sm"
                          />
                        </Link>
                      ))
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-warning text-[13px]">
                      {avgRating ? (
                        <>
                          <Star className="w-3 h-3 fill-warning" />
                          <span className="font-semibold">{avgRating}</span>
                          {reviewCount && (
                            <span className="text-muted text-[11px] ml-0.5">· {reviewCount} reviews</span>
                          )}
                        </>
                      ) : (
                        "★★★★★"
                      )}
                    </div>
                    {statsLoading ? (
                      <div className="h-3 w-28 rounded bg-border/50 animate-pulse mt-1" />
                    ) : (
                      <p className="text-xs text-muted">
                        Loved by {userCount ?? "thousands of"}+ learners
                      </p>
                    )}
                  </div>
                </div>
                <div className="h-10 w-px bg-border/70 hidden sm:block" />
                <ul className="space-y-1.5 text-sm text-text-soft">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    Pay once — keep forever
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    Instant results + review
                  </li>
                </ul>
              </div>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-6 xl:col-span-6" delay={120} y={28}>
            <HeroMock />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ---------- HERO MOCK: interactive quiz card ----------
const MOCK_QUESTIONS = [
  {
    q: "Choose the option that best completes the sentence:",
    sub: "\u201cThe committee _____ submitted _____ final report last Friday.\u201d",
    opts: [
      { k: "A", t: "have submitted their", correct: false },
      { k: "B", t: "has submitted its",    correct: true  },
      { k: "C", t: "have submitted its",   correct: false },
      { k: "D", t: "has submitted their",  correct: false },
    ],
  },
  {
    q: "Which word is an antonym of \u201cbenevolent\u201d?",
    sub: "",
    opts: [
      { k: "A", t: "Generous",   correct: false },
      { k: "B", t: "Charitable", correct: false },
      { k: "C", t: "Malevolent", correct: true  },
      { k: "D", t: "Cordial",    correct: false },
    ],
  },
  {
    q: "Identify the grammatically correct sentence.",
    sub: "",
    opts: [
      { k: "A", t: "Neither of the boys have done it.",  correct: false },
      { k: "B", t: "Each of the students are present.",  correct: false },
      { k: "C", t: "The jury has reached its verdict.",  correct: true  },
      { k: "D", t: "The team have lost their match.",    correct: false },
    ],
  },
];

const TOTAL_QS = 100;
const INIT_SECS = 18 * 60 + 42; // 18:42

function HeroMock() {
  const [qIdx, setQIdx]           = useState(0);
  const [selected, setSelected]   = useState<string | null>(null);
  const [revealed, setRevealed]   = useState(false);
  const [secs, setSecs]           = useState(INIT_SECS);
  const [score, setScore]         = useState(81);
  const advanceTimer              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef              = useRef<ReturnType<typeof setInterval> | null>(null);

  // live countdown
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setSecs((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  const isLow = secs < 120;

  const question = MOCK_QUESTIONS[qIdx % MOCK_QUESTIONS.length];
  // question number shown: starts at 23 and advances
  const qNum = 23 + qIdx;
  const progress = Math.min(((qNum - 1) / TOTAL_QS) * 100, 100);

  const handleSelect = useCallback((k: string) => {
    if (selected !== null) return; // already answered
    setSelected(k);
    setRevealed(true);
    const isCorrect = question.opts.find((o) => o.k === k)?.correct ?? false;
    if (isCorrect) setScore((prev) => prev + 1);
    // auto-advance after 1.6s
    advanceTimer.current = setTimeout(() => {
      setSelected(null);
      setRevealed(false);
      setQIdx((i) => i + 1);
    }, 1600);
  }, [selected, question]);

  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // Circular countdown ring maths — r=26, 72×72 svg
  const CIRC = 2 * Math.PI * 26;
  const elapsed = INIT_SECS - secs;
  const dashOffset = CIRC * (1 - elapsed / INIT_SECS);

  return (
    <div className="relative">
      <div className="absolute -top-6 -left-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-8 -right-4 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
      <div className="relative">
        <Card className="relative shadow-elevated border border-primary/10 p-0 overflow-hidden">

          {/* ── Premium header band ── */}
          <div
            className="relative px-5 pt-5 pb-4 overflow-hidden rounded-t-[inherit]"
            style={{
              background: "linear-gradient(135deg, var(--color-primary) 0%, color-mix(in srgb, var(--color-primary) 70%, var(--color-secondary)) 100%)",
            }}
          >
            {/* Decorative blur orbs inside header */}
            <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-8 h-16 w-16 rounded-full bg-white/5 blur-xl pointer-events-none" />

            <div className="relative flex items-center justify-between gap-4">
              {/* Left — course info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                  </div>
                  <span className="text-[10px] font-heading font-bold tracking-widest uppercase text-white/70">
                    GST 121 · Use of English
                  </span>
                </div>
                <p className="font-heading font-bold text-white text-base leading-tight truncate">
                  Full Mock Examination
                </p>
                <p className="text-white/60 text-[11px] mt-0.5 font-medium">
                  100 questions · 2026 session
                </p>
              </div>

              {/* Right — circular SVG countdown */}
              <div className="relative shrink-0 flex items-center justify-center" style={{ width: 72, height: 72 }}>
                {/* Track ring */}
                <svg width="72" height="72" className="absolute inset-0 -rotate-90">
                  <circle
                    cx="36" cy="36" r="26"
                    fill="none"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="3"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="36" cy="36" r="26"
                    fill="none"
                    stroke={isLow ? "#ff6b6b" : "rgba(255,255,255,0.9)"}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={CIRC}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.4s" }}
                  />
                </svg>
                {/* Time text */}
                <div className="relative text-center">
                  <p
                    className="font-heading font-bold leading-none text-[11px] tabular-nums"
                    style={{ color: isLow ? "#ff6b6b" : "white" }}
                  >
                    {m}:{s}
                  </p>
                  <p className="text-white/45 text-[8px] font-semibold tracking-widest uppercase mt-0.5">
                    left
                  </p>
                </div>
              </div>
            </div>

            {/* Progress bar — lives inside the header band */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white/80 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-heading font-semibold text-white/60 shrink-0 tabular-nums">
                Q{qNum}/{TOTAL_QS}
              </span>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-5 sm:px-6 pt-5 pb-6">
            {/* Question text */}
            <h4 className="font-heading font-semibold text-base sm:text-lg text-text leading-snug mb-5">
              {question.q}
              {question.sub && (
                <>
                  <br />
                  <span className="text-text-soft font-normal">&ldquo;{question.sub}&rdquo;</span>
                </>
              )}
            </h4>

            {/* Options */}
            <ol className="space-y-2">
              {question.opts.map((opt) => {
                const isSelected = selected === opt.k;
                const isCorrect  = opt.correct;
                const show       = revealed;

                let rowTone = "bg-surface/30 border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer";
                if (show && isSelected && isCorrect)
                  rowTone = "bg-success/10 border-success/40 cursor-default";
                else if (show && isSelected && !isCorrect)
                  rowTone = "bg-danger/10 border-danger/30 cursor-default";
                else if (show && isCorrect)
                  rowTone = "bg-success/10 border-success/40 cursor-default";
                else if (show)
                  rowTone = "bg-surface/30 border-border/40 opacity-50 cursor-default";

                let letterTone = "bg-surface text-secondary";
                if (show && isSelected && isCorrect)
                  letterTone = "bg-success text-cream";
                else if (show && isSelected && !isCorrect)
                  letterTone = "bg-danger text-cream";
                else if (show && isCorrect)
                  letterTone = "bg-success text-cream";

                return (
                  <div
                    key={opt.k}
                    onClick={() => handleSelect(opt.k)}
                    className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all duration-200 select-none ${
                      isSelected ? "scale-[1.01]" : "hover:scale-[1.005]"
                    } ${rowTone}`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg font-heading font-bold text-[13px] shrink-0 transition-colors duration-200 ${letterTone}`}
                    >
                      {opt.k}
                    </span>
                    <span className="text-sm text-text flex-1">{opt.t}</span>
                    {show && isCorrect && (
                      <Check className="w-4 h-4 text-success shrink-0 ml-auto" />
                    )}
                  </div>
                );
              })}
            </ol>

            {/* Footer */}
            <div className="mt-5 flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Avatar name="Dr. Amaka Okafor" size="xs" />
                <span className="text-xs text-muted">
                  by{" "}
                  <span className="font-semibold text-text-soft">Dr. Amaka O.</span>
                </span>
              </div>
              <div className="text-xs">
                {revealed ? (
                  <span
                    className={`font-semibold ${
                      question.opts.find((o) => o.k === selected)?.correct
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {question.opts.find((o) => o.k === selected)?.correct
                      ? "✓ Correct!"
                      : "✗ Wrong"}
                  </span>
                ) : (
                  <span className="text-muted italic">Pick an answer</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Score chip */}
        <Card className="mt-4 sm:mt-5 -ml-4 sm:-ml-10 relative w-[82%] sm:w-[70%] shadow-card">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-success-bg text-success flex items-center justify-center shrink-0">
              <Award className="w-7 h-7" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-heading uppercase tracking-wider font-semibold text-muted mb-1">
                Live score · This attempt
              </p>
              <div className="flex items-end gap-2">
                <p className="font-heading font-bold text-2xl sm:text-3xl text-text leading-none">
                  {score}<sub className="text-muted font-semibold text-sm">/{qNum - 1}</sub>
                </p>
                <Badge variant="success" size="sm">
                  <Zap className="w-3 h-3" />
                  Improving!
                </Badge>
              </div>
              <p className="text-xs text-muted mt-1.5">
                Unlocked forever · Retake anytime.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ---------- HOW IT WORKS ----------
const STEPS = [
  {
    icon: Search,
    title: "Find a quiz",
    desc: "Browse by subject area and course code, or open a shared link from a friend or creator. Filter by price, level, or creator.",
    tone: "primary" as const,
  },
  {
    icon: WalletIcon,
    title: "Pay a small fee",
    desc: "Top up your wallet once, then spend as little as ₦50 per quiz. No subscriptions, no auto-renewals — ever.",
    tone: "secondary" as const,
  },
  {
    icon: Infinity,
    title: "Practice anytime",
    desc: "Once you pay for a quiz, it stays unlocked in your library forever. Retake it as many times as you want until you nail it.",
    tone: "success" as const,
    highlight: true,
  },
];

function HowItWorks() {
  return (
    <section className="w-full bg-surface/45 border-y border-border/50">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <Reveal className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <Badge variant="muted" className="mb-4">
            How it works
          </Badge>
          <h2 className="font-heading font-bold tracking-tight text-text text-3xl sm:text-4xl lg:text-5xl">
            Three small steps.{" "}
            <span className="text-primary">Zero surprises.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-soft">
            Skip the heavy subscriptions and expired access codes. On PrepUniv,
            every quiz you buy is yours — forever.
          </p>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 lg:gap-8">
          {STEPS.map(function mapStep(s, i) {
            const Icon = s.icon;
            const toneClass =
              s.tone === "primary"
                ? "bg-primary/10 text-primary border-primary/20"
                : s.tone === "secondary"
                  ? "bg-secondary/10 text-secondary border-secondary/20"
                  : "bg-success-bg text-success border-success/20";
            const numBg =
              s.tone === "primary"
                ? "bg-primary text-cream"
                : s.tone === "secondary"
                  ? "bg-secondary text-cream"
                  : "bg-success text-cream";
            const highlightClass = s.highlight
              ? "ring-1 ring-primary/20 shadow-elevated"
              : "";
            const cardClass = "relative h-full p-7 sm:p-8 " + highlightClass;
            return (
              <Reveal key={s.title} delay={i * 120}>
                <Card hover padded={false} className={cardClass}>
                  <div className="flex items-start justify-between mb-6">
                    <div
                      className={
                        "h-14 w-14 rounded-2xl border " +
                        toneClass +
                        " flex items-center justify-center shadow-soft"
                      }
                    >
                      <Icon className="w-7 h-7" strokeWidth={2} />
                    </div>
                    <span
                      className={
                        "inline-flex h-9 w-9 items-center justify-center rounded-xl font-heading font-bold text-sm shadow-soft " +
                        numBg
                      }
                    >
                      0{i + 1}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-text text-xl tracking-tight mb-2.5">
                    {s.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] leading-relaxed text-text-soft">
                    {s.desc}
                  </p>
                  {s.highlight && (
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-heading font-semibold px-3 py-1.5">
                      <Infinity className="w-3.5 h-3.5" />
                      Permanent library · key differentiator
                    </div>
                  )}
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- FEATURED QUIZZES ----------

function FeaturedQuizCardSkeleton() {
  return (
    <Card padded={false} className="h-full flex flex-col animate-pulse">
      <div className="p-5 sm:p-6 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 w-20 rounded-lg bg-surface" />
          <div className="h-5 w-16 rounded-lg bg-surface" />
        </div>
        <div className="h-6 w-full rounded-lg bg-surface" />
        <div className="h-4 w-3/4 rounded-lg bg-surface" />
        <div className="mt-auto pt-5 space-y-2.5">
          <div className="h-4 w-28 rounded-lg bg-surface" />
          <div className="h-4 w-36 rounded-lg bg-surface" />
        </div>
      </div>
      <div className="border-t border-border/60 px-5 py-4">
        <div className="h-10 w-full rounded-xl bg-surface" />
      </div>
    </Card>
  );
}

function FeaturedQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchPublishedQuizzes(),
      fetchCourses(),
      fetchAllProfiles(),
    ]).then(([qs, cs, ps]) => {
      if (cancelled) return;
      setQuizzes(qs);
      setCourses(cs);
      setProfiles(ps);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const courseById = Object.fromEntries(courses.map((c) => [c.id, c]));
  const creatorById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const featured = quizzes.filter((q) => q.is_published).slice(0, 6);

  return (
    <section className="w-full">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10 sm:mb-14">
          <Reveal>
            <Badge variant="primary" className="mb-4">
              <BookMarked className="w-3 h-3" />
              Popular this week
            </Badge>
            <h2 className="font-heading font-bold tracking-tight text-text text-3xl sm:text-4xl lg:text-5xl">
              Featured quizzes
            </h2>
            <p className="mt-3 text-base sm:text-lg text-text-soft max-w-xl">
              Handpicked quizzes from verified PrepUniv's top creators across
              the most-taken topics.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <Link to="/browse">
              <Button variant="outline">
                See all quizzes
                <ArrowRight className="w-[18px] h-[18px]" />
              </Button>
            </Link>
          </Reveal>
        </div>

        {loading ? (
          <>
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
              <div className="grid grid-flow-col auto-cols-[82%] sm:auto-cols-[60%] gap-4 sm:gap-5 pb-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <FeaturedQuizCardSkeleton key={i} />
                ))}
              </div>
            </div>
            <div className="hidden lg:grid lg:grid-cols-3 gap-5 xl:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <FeaturedQuizCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
              <div className="grid grid-flow-col auto-cols-[82%] sm:auto-cols-[60%] gap-4 sm:gap-5 pb-2">
                {featured.map((q, i) => (
                  <FeaturedQuizCard
                    key={q.id}
                    quiz={q}
                    course={courseById[q.course_id]}
                    creator={creatorById[q.creator_id]}
                    delay={i * 60}
                  />
                ))}
              </div>
            </div>
            <div className="hidden lg:grid lg:grid-cols-3 gap-5 xl:gap-6">
              {featured.map((q, i) => (
                <FeaturedQuizCard
                  key={q.id}
                  quiz={q}
                  course={courseById[q.course_id]}
                  creator={creatorById[q.creator_id]}
                  delay={i * 80}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FeaturedQuizCard({
  quiz,
  course,
  creator,
  delay = 0,
}: {
  quiz: Quiz;
  course?: Course;
  creator?: Profile;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <Card hover padded={false} className="h-full flex flex-col">
        <div className="p-5 sm:p-6 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <Badge variant="secondary" size="sm">
              {course?.code ?? "Quiz"}
            </Badge>
            <Badge variant="primary" size="sm">
              ₦{(quiz.price / 100).toLocaleString()}
            </Badge>
          </div>
          <h3 className="font-heading font-bold text-lg sm:text-xl text-text tracking-tight leading-snug mb-3">
            {quiz.title}
          </h3>
          <ul className="mt-auto pt-5 space-y-2.5 text-sm text-text-soft">
            <li className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-muted" />
              <span className="font-medium text-text">
                {quiz.question_count}
              </span>{" "}
              questions
            </li>
            <li className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-muted" />
              {creator ? (
                <>
                  <Avatar
                    name={creator.full_name}
                    src={creator.avatar_url ?? undefined}
                    size="xs"
                  />
                  <span className="font-medium text-text truncate">
                    {creator.full_name.split(" ").slice(0, 2).join(" ")}
                  </span>
                </>
              ) : (
                <span>Verified creator</span>
              )}
            </li>
          </ul>
        </div>
        <Link
          to={`/quiz/${quiz.id}`}
          className="block border-t border-border/60"
        >
          <div className="px-5 py-4 flex items-center justify-between group">
            <div>
              <p className="text-[11px] font-heading uppercase tracking-wider font-semibold text-muted mb-0.5">
                Sign up to attempt
              </p>
              <p className="text-sm font-semibold font-heading text-primary group-hover:underline">
                Start practicing →
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-cream transition-colors">
              <ArrowRight className="w-[18px] h-[18px]" />
            </div>
          </div>
        </Link>
      </Card>
    </Reveal>
  );
}

// ---------- FOR CREATORS ----------
interface ForCreatorsProps {
  stats: PlatformStats | null;
  creatorRating: PlatformRating | null;
  statsLoading: boolean;
}

function ForCreators({ stats, creatorRating, statsLoading }: ForCreatorsProps) {
  return (
    <section className="w-full bg-surface/50 border-y border-border/50">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <Reveal className="lg:col-span-5">
            <Badge variant="secondary" className="mb-5">
              <Sparkles className="w-3 h-3" />
              For creators
            </Badge>
            <h2 className="font-heading font-bold tracking-tight text-text text-3xl sm:text-4xl lg:text-5xl leading-[1.1]">
              Turn your notes &amp; past questions into{" "}
              <span className="text-secondary">passive income.</span>
            </h2>
            <p className="mt-5 text-base sm:text-lg text-text-soft leading-relaxed max-w-lg">
              Whether you're a lecturer, a teacher, or a top student who's
              already cracked the exam, PrepUniv gives you the tools to publish
              your quiz in minutes — and get paid every time someone buys it.
            </p>
            <ul className="mt-7 space-y-3.5">
              {[
                "65% revenue share on every quiz sale",
                "Simple, 2-step application. Most get approved in 48 hours",
                "Built-in analytics: see attempts, scores, and top-performing questions",
                "Monthly payouts direct to your Nigerian bank account",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 h-6 w-6 rounded-lg bg-secondary/15 text-secondary shrink-0 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" strokeWidth={2.6} />
                  </span>
                  <span className="text-[15px] text-text-soft">{t}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Link to="/apply-creator">
                <Button
                  size="lg"
                  variant="secondary"
                  rightIcon={<ArrowRight className="w-[18px] h-[18px]" />}
                >
                  Apply to become a creator
                </Button>
              </Link>
              <Link to="/browse">
                <Button size="lg" variant="ghost">
                  Browse creator quizzes
                </Button>
              </Link>
            </div>
          </Reveal>
          <Reveal className="lg:col-span-7" delay={150}>
            <div className="grid sm:grid-cols-2 gap-5">
              {([
                {
                  icon: ListChecks,
                  k: statsLoading
                    ? null
                    : (stats
                        ? formatCompactNumber(stats.total_published_quizzes) + "+"
                        : "2,400+"),
                  t: "Quizzes published",
                  s: "Across all subject areas and course levels",
                  v: "primary" as const,
                },
                {
                  icon: Users,
                  k: statsLoading
                    ? null
                    : (stats
                        ? formatCompactNumber(stats.total_verified_creators) + "+"
                        : "750+"),
                  t: "Verified creators",
                  s: "Teachers, lecturers, top students",
                  v: "secondary" as const,
                },
                {
                  icon: BadgePoundSterling,
                  k: statsLoading
                    ? null
                    : (stats
                        ? formatCompactNaira(stats.total_paid_to_creators) + "+"
                        : "₦48M+"),
                  t: "Paid to creators",
                  s: "Monthly payouts since launch",
                  v: "success" as const,
                  sub: null as string | null,
                },
                {
                  icon: Award,
                  k: statsLoading
                    ? null
                    : (creatorRating && creatorRating.avg_rating > 0
                        ? creatorRating.avg_rating.toFixed(1) + "/5"
                        : "4.9/5"),
                  t: "Creator satisfaction",
                  s: statsLoading
                    ? "Based on creator reviews"
                    : (creatorRating && creatorRating.total_reviews > 0
                        ? `Based on ${formatCompactNumber(creatorRating.total_reviews)}+ reviews`
                        : "Based on creator reviews"),
                  v: "warning" as const,
                },
              ] as Array<{
                icon: React.ElementType;
                k: string | null;
                t: string;
                s: string;
                v: "primary" | "secondary" | "success" | "warning";
              }>).map(function mapMetric(m, i) {
                const Icon = m.icon;
                const variant =
                  m.v === "primary"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : m.v === "secondary"
                      ? "bg-secondary/10 text-secondary border-secondary/20"
                      : m.v === "success"
                        ? "bg-success-bg text-success border-success/20"
                        : "bg-warning-bg text-warning border-warning/20";
                const cardClass =
                  "p-6 h-full " + (i % 2 ? "sm:translate-y-6" : "");
                const iconWrapClass =
                  "h-11 w-11 rounded-xl border " +
                  variant +
                  " flex items-center justify-center mb-5";
                return (
                  <Card key={m.t} padded={false} className={cardClass}>
                    <div className={iconWrapClass}>
                      <Icon className="w-5.5 h-5.5" strokeWidth={2.1} />
                    </div>
                    {m.k === null ? (
                      <div className="h-9 w-24 rounded-lg bg-border/40 animate-pulse mb-1" />
                    ) : (
                      <p className="font-heading font-bold tracking-tight text-3xl text-text">
                        {m.k}
                      </p>
                    )}
                    <p className="mt-1 font-heading font-semibold text-text text-base">
                      {m.t}
                    </p>
                    <p className="mt-1 text-sm text-muted">{m.s}</p>
                  </Card>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ---------- TRUST / SECURITY ----------
function TrustBar() {
  return (
    <section className="w-full border-y border-border/50 bg-cream">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {[
            {
              icon: ShieldCheck,
              label: "Verified creators",
              sub: "All creators are reviewed before publishing",
            },
            {
              icon: Lock,
              label: "Secure payments",
              sub: "Wallet top-ups via Flutterwave",
            },
            {
              icon: Infinity,
              label: "Lifetime access",
              sub: "Pay once, retake forever",
            },
            {
              icon: Zap,
              label: "Instant results",
              sub: "Score and review right after submission",
            },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <p className="font-heading font-semibold text-sm text-text">
                  {label}
                </p>
                <p className="text-xs text-muted mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------- TESTIMONIALS ----------
function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) return null;
  return (
    <section className="w-full">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <Reveal className="text-center mb-12">
          <Badge variant="primary" className="mb-4">
            <MessageSquareQuote className="w-3 h-3" />
            Real learners, real results
          </Badge>
          <h2 className="font-heading font-bold tracking-tight text-text text-3xl sm:text-4xl lg:text-5xl">
            What students are saying
          </h2>
        </Reveal>
        {/* Mobile: horizontal scroll; Desktop: 3-col grid */}
        <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="grid grid-flow-col auto-cols-[82%] sm:auto-cols-[60%] gap-4 sm:gap-5 pb-2">
            {testimonials.map((t) => (
              <TestimonialCard key={t.id} t={t} />
            ))}
          </div>
        </div>
        <div className="hidden lg:grid lg:grid-cols-3 gap-5 xl:gap-6">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <Reveal>
      <Card padded={false} className="p-5 h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <Avatar
            name={t.reviewer_name}
            src={t.reviewer_avatar_url ?? undefined}
            size="sm"
          />
          <div className="flex items-center gap-0.5 text-warning">
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-warning" />
            ))}
          </div>
        </div>
        {t.review_text && (
          <p className="text-sm text-text-soft leading-relaxed flex-1 mb-3">
            &ldquo;{t.review_text}&rdquo;
          </p>
        )}
        <p className="text-xs font-semibold text-text font-heading">
          {t.reviewer_name}
        </p>
      </Card>
    </Reveal>
  );
}

// ---------- CTA BANNER ----------
function CtaBanner({ stats }: { stats: PlatformStats | null }) {
  const userCount = stats ? formatCompactNumber(stats.total_registered_users) : "12,000";
  return (
    <section className="w-full">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <Reveal>
          <Card className="relative overflow-hidden text-center p-10 sm:p-14 lg:p-20 border-primary/20 shadow-elevated">
            <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-secondary/10 blur-3xl pointer-events-none" />
            <div className="relative">
              <Badge variant="primary" className="mb-5">
                <Sparkles className="w-3 h-3" />
                Start for free
              </Badge>
              <h2 className="font-heading font-bold tracking-tight text-text text-3xl sm:text-4xl lg:text-5xl">
                Ready to ace your exams?
              </h2>
              <p className="mt-4 text-base sm:text-lg text-text-soft max-w-xl mx-auto">
                Join {userCount}+ Nigerian students already using PrepUniv to
                practice smarter and score higher.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <Link to="/signup">
                  <Button
                    size="lg"
                    rightIcon={<ArrowRight className="w-[18px] h-[18px]" />}
                  >
                    Create free account
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button size="lg" variant="outline">
                    <BookOpen className="w-[18px] h-[18px]" />
                    Browse quizzes
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}

// ---------- FOOTER ----------
const XBrandIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

function Footer() {
  return (
    <footer className="w-full border-t border-border/50 bg-surface/40">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-primary text-cream flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="font-heading font-bold text-text text-lg">
              PrepUniv
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-text-soft">
            <Link to="/browse" className="hover:text-text transition-colors">
              Browse
            </Link>
            <Link
              to="/apply-creator"
              className="hover:text-text transition-colors"
            >
              Become a Creator
            </Link>
            <Link to="/terms" className="hover:text-text transition-colors">
              Terms
            </Link>
            <Link to="/privacy" className="hover:text-text transition-colors">
              Privacy
            </Link>
            <a
              href="https://x.com/PrepUnivijnv"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PrepUniv on X"
              className="inline-flex items-center gap-1.5 hover:text-text transition-colors active:scale-[0.98]"
            >
              <XBrandIcon className="w-4 h-4" />
              <span className="font-medium">@PrepUnivijnv</span>
            </a>
          </nav>
        </div>
        <div className="mt-6 sm:mt-8 pt-5 border-t border-border/40">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} PrepUniv. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ---------- PAGE EXPORT ----------
export function LandingPage() {
  usePageTitle("PrepUniv — CBT & Exam Prep for Nigerian Students", {
    full: true,
  });

  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [platformRating, setPlatformRating] = useState<PlatformRating | null>(null);
  const [creatorRating, setCreatorRating] = useState<PlatformRating | null>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [creators, setCreators] = useState<Profile[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchPlatformStats(),
      fetchPlatformRating(),
      fetchCreatorRatingSummary(),
      fetchFeaturedTestimonials(6),
      fetchAllProfiles(),
    ]).then(([s, pr, cr, tl, ps]) => {
      if (cancelled) return;
      setStats(s);
      setPlatformRating(pr);
      setCreatorRating(cr);
      setTestimonials(tl);
      setCreators(ps);
      setStatsLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-dvh w-full bg-background text-text">
      <LandingTopNav />
      <Hero
        stats={stats}
        platformRating={platformRating}
        creators={creators}
        statsLoading={statsLoading}
      />
      <HowItWorks />
      <FeaturedQuizzes />
      <ForCreators
        stats={stats}
        creatorRating={creatorRating}
        statsLoading={statsLoading}
      />
      <TrustBar />
      <Testimonials testimonials={testimonials} />
      <CtaBanner stats={stats} />
      <Footer />
    </div>
  );
}
