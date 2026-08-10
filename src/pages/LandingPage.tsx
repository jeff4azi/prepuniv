import { useEffect, useState } from "react";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { LandingTopNav } from "../components/LandingTopNav";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Reveal } from "../hooks/useReveal";
import { Avatar } from "../components/Avatar";
import type { Quiz, Course, Profile } from "../mock/types";
import {
  fetchPublishedQuizzes,
  fetchCourses,
  fetchAllProfiles,
} from "../lib/queries";

// ---------- HERO ----------
function Hero() {
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
                  <div className="flex -space-x-2">
                    <Avatar name="Tolu A." size="sm" />
                    <Avatar name="Amesoma O." size="sm" />
                    <Avatar name="Emeka N." size="sm" />
                    <Avatar name="Zainab A." size="sm" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-warning text-[13px]">
                      {"★★★★★"}
                    </div>
                    <p className="text-xs text-muted">Loved by 12k+ learners</p>
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

function HeroMock() {
  return (
    <div className="relative">
      <div className="absolute -top-6 -left-6 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -bottom-8 -right-4 h-48 w-48 rounded-full bg-secondary/20 blur-3xl" />
      <div className="relative">
        <Card className="relative shadow-elevated border border-primary/10 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-surface/40">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-primary text-cream flex items-center justify-center shrink-0">
                <FileText className="w-4.5 h-4.5" strokeWidth={2.2} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold font-heading tracking-wider uppercase text-muted mb-0.5">
                  GST 121 · Use of English · 2026
                </p>
                <p className="font-heading font-semibold text-sm text-text truncate">
                  Full Mock — 100 questions
                </p>
              </div>
            </div>
            <Badge variant="success" dot size="sm">
              Live
            </Badge>
          </div>
          <div className="px-5 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-heading font-semibold tracking-wider uppercase text-muted">
                Question 23 of 100
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold font-heading text-warning bg-warning-bg px-2.5 py-1 rounded-lg border border-warning/15">
                <Zap className="w-3.5 h-3.5" /> 18:42
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden mb-6">
              <div className="h-full w-[23%] rounded-full bg-primary" />
            </div>
            <h4 className="font-heading font-semibold text-base sm:text-lg text-text leading-snug mb-5">
              Choose the option that best completes the sentence:
              <br />
              <span className="text-text-soft font-normal">
                &ldquo;The committee _____ reached_____ final report last
                Friday.&rdquo;
              </span>
            </h4>
            <ol className="space-y-2.5">
              {[
                {
                  k: "A",
                  t: "have submitted their",
                  correct: false,
                  selected: false,
                },
                {
                  k: "B",
                  t: "has submitted its",
                  correct: true,
                  selected: true,
                },
                {
                  k: "C",
                  t: "have submitted its",
                  correct: false,
                  selected: false,
                },
                {
                  k: "D",
                  t: "has submitted their",
                  correct: false,
                  selected: false,
                },
              ].map(function mapOpt(opt) {
                const selected = !!opt.selected;
                const rowBase =
                  "group flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all cursor-pointer";
                const rowTone = selected
                  ? "bg-primary/10 border-primary/30 shadow-soft"
                  : "bg-cream border-border/60 hover:border-border hover:bg-surface/40";
                const letterBase =
                  "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg font-heading font-bold text-[13px] shrink-0";
                const letterTone = selected
                  ? "bg-primary text-cream"
                  : "bg-surface text-secondary";
                return (
                  <div key={opt.k} className={rowBase + " " + rowTone}>
                    <span className={letterBase + " " + letterTone}>
                      {opt.k}
                    </span>
                    <span className="pt-0.5 text-sm text-text">{opt.t}</span>
                    {selected && (
                      <Check className="w-4 h-4 text-primary shrink-0 mt-1 ml-auto" />
                    )}
                  </div>
                );
              })}
            </ol>
            <div className="mt-6 flex items-center justify-between pt-5 border-t border-border/50">
              <div className="flex items-center gap-2">
                <Avatar name="Dr. Amaka Okafor" size="xs" />
                <span className="text-xs text-muted">
                  by{" "}
                  <span className="font-semibold text-text-soft">
                    Dr. Amaka O.
                  </span>
                </span>
              </div>
              <Button size="sm" className="h-9 px-3">
                Submit
              </Button>
            </div>
          </div>
        </Card>
        <Card className="mt-4 sm:mt-5 -ml-4 sm:-ml-10 relative w-[82%] sm:w-[70%] shadow-card">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-success-bg text-success flex items-center justify-center shrink-0">
              <Award className="w-7 h-7" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-heading uppercase tracking-wider font-semibold text-muted mb-1">
                Last attempt · Score
              </p>
              <div className="flex items-end gap-2">
                <p className="font-heading font-bold text-2xl sm:text-3xl text-text leading-none">
                  81<sub className="text-muted font-semibold text-sm">/100</sub>
                </p>
                <Badge variant="success" size="sm">
                  <Zap className="w-3 h-3" />
                  +9 pts better
                </Badge>
              </div>
              <p className="text-xs text-muted mt-1.5">
                You unlocked this quiz forever. Retake anytime.
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
              <BadgePoundSterling className="w-3 h-3 -ml-0.5" />
              {quiz.price.toLocaleString()}
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
                  <Avatar name={creator.full_name} size="xs" />
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
        <Link to="/signup" className="block border-t border-border/60">
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
function ForCreators() {
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
              {[
                {
                  icon: ListChecks,
                  k: "2,400+",
                  t: "Quizzes published",
                  s: "Across all subject areas and course levels",
                  v: "primary" as const,
                },
                {
                  icon: Users,
                  k: "750+",
                  t: "Verified creators",
                  s: "Teachers, lecturers, top students",
                  v: "secondary" as const,
                },
                {
                  icon: BadgePoundSterling,
                  k: "₦48M+",
                  t: "Paid to creators",
                  s: "Monthly payouts since launch",
                  v: "success" as const,
                },
                {
                  icon: Award,
                  k: "4.9/5",
                  t: "Creator satisfaction",
                  s: "Based on 400+ reviews",
                  v: "warning" as const,
                },
              ].map(function mapMetric(m, i) {
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
                    <p className="font-heading font-bold tracking-tight text-3xl text-text">
                      {m.k}
                    </p>
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
              sub: "Wallet top-ups via Paystack",
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

// ---------- CTA BANNER ----------
function CtaBanner() {
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
                Join 12,000+ Nigerian students already using PrepUniv to
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
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-soft">
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
          </nav>
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
  return (
    <div className="min-h-dvh w-full bg-background text-text">
      <LandingTopNav />
      <Hero />
      <HowItWorks />
      <FeaturedQuizzes />
      <ForCreators />
      <TrustBar />
      <CtaBanner />
      <Footer />
    </div>
  );
}
