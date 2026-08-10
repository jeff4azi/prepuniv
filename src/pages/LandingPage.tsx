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
import { quizzes, courses, profiles } from "../mock";
import { Reveal } from "../hooks/useReveal";
import { Avatar } from "../components/Avatar";

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
                const rowClass = rowBase + " " + rowTone;
                const letterBase =
                  "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg font-heading font-bold text-[13px] shrink-0";
                const letterTone = selected
                  ? "bg-primary text-cream"
                  : "bg-surface text-secondary";
                const letterClass = letterBase + " " + letterTone;
                return (
                  <div key={opt.k} className={rowClass}>
                    <span className={letterClass}>{opt.k}</span>
                    <span className="pt-0.5 text-sm text-text">{opt.t}</span>
                    {selected && (
                      <Check className="w-4 h-4 text-primary shrink-0 mt-1 ml-auto" />
                    )}
                  </div>
                );
              })}
            </ol>

            <div className="mt-6 flex items-center justify-between pt-5 border-t border-border/50 mt-6">
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
function FeaturedQuizzes() {
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

        <div className="lg:hidden -mx-4 px-4 overflow-x-auto no-scrollbar">
          <div className="grid grid-flow-col auto-cols-[82%] sm:auto-cols-[60%] gap-4 sm:gap-5 pb-2">
            {featured.map((q, i) => (
              <QuizCard
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
            <QuizCard
              key={q.id}
              quiz={q}
              course={courseById[q.course_id]}
              creator={creatorById[q.creator_id]}
              delay={i * 80}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function QuizCard({
  quiz,
  course,
  creator,
  delay = 0,
}: {
  quiz: (typeof quizzes)[number];
  course?: (typeof courses)[number];
  creator?: (typeof profiles)[number];
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

// ---------- TRUST ----------
const TRUST = [
  {
    icon: ShieldCheck,
    title: "Verified creators",
    desc: "Every creator is reviewed by our team before quizzes go live.",
    tint: "primary" as const,
  },
  {
    icon: Zap,
    title: "Instant results & review",
    desc: "See your score immediately with full answer review the moment you finish.",
    tint: "secondary" as const,
  },
  {
    icon: BadgePoundSterling,
    title: "Small, fair pricing",
    desc: "₦50 – ₦500 per quiz. No subscriptions. No hidden fees.",
    tint: "success" as const,
  },
  {
    icon: Lock,
    title: "Secure payments",
    desc: "Payments and payouts handled by Flutterwave — trusted across Africa.",
    tint: "warning" as const,
  },
];

function Trust() {
  return (
    <section className="w-full">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <Reveal className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <Badge variant="muted" className="mb-4">
            Why PrepUniv
          </Badge>
          <h2 className="font-heading font-bold tracking-tight text-text text-3xl sm:text-4xl lg:text-5xl">
            A platform you can <span className="text-primary">trust.</span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-text-soft">
            Built in Nigeria, for Nigerian students and teachers — with the
            little details that actually matter.
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {TRUST.map(function mapTrust(t, i) {
            const Icon = t.icon;
            const tint =
              t.tint === "primary"
                ? "bg-primary/10 text-primary border-primary/20"
                : t.tint === "secondary"
                  ? "bg-secondary/10 text-secondary border-secondary/20"
                  : t.tint === "success"
                    ? "bg-success-bg text-success border-success/20"
                    : "bg-warning-bg text-warning border-warning/20";
            const iconWrapClass =
              "h-12 w-12 rounded-2xl border " +
              tint +
              " flex items-center justify-center mb-5 shadow-soft";
            return (
              <Reveal key={t.title} delay={i * 90}>
                <Card padded={false} className="p-6 h-full">
                  <div className={iconWrapClass}>
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-text tracking-tight mb-2">
                    {t.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-soft">
                    {t.desc}
                  </p>
                </Card>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- FINAL CTA ----------
function FinalCTA() {
  return (
    <section className="w-full">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
        <Reveal>
          <Card padded={false} className="overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-hover" />
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-cream/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
            <div className="relative px-6 sm:px-10 lg:px-14 py-14 sm:py-18 lg:py-20 text-center">
              <Badge
                variant="success"
                size="md"
                className="mb-6 !bg-cream/15 !text-cream !border-cream/30"
              >
                <Sparkles className="w-3 h-3" />
                Start in 60 seconds
              </Badge>
              <h2 className="font-heading font-bold tracking-tight text-cream text-3xl sm:text-4xl lg:text-5xl leading-[1.1] max-w-3xl mx-auto">
                Your next top score is one quiz away.
              </h2>
              <p className="mt-5 text-base sm:text-lg text-cream/80 max-w-xl mx-auto leading-relaxed">
                Join 12,000+ Nigerian students using PrepUniv to walk into their
                course exams calm, prepared, and confident.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <Link to="/signup">
                  <Button
                    size="lg"
                    className="!bg-cream !text-primary hover:!bg-cream/90 !shadow-elevated"
                  >
                    Create free account
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </Button>
                </Link>
                <Link to="/browse">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="!text-cream !border !border-cream/30 hover:!bg-cream/10"
                  >
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
  const cols = [
    {
      title: "Product",
      links: [
        { t: "Browse quizzes", to: "/browse" },
        { t: "Become a creator", to: "/apply-creator" },
        { t: "Pricing", to: "/browse" },
      ],
    },
    {
      title: "Company",
      links: [
        { t: "About", to: "#" },
        { t: "Contact", to: "#" },
        { t: "Press & blog", to: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { t: "Terms of service", to: "/terms" },
        { t: "Privacy policy", to: "/privacy" },
        { t: "Creator agreement", to: "/creator/agreement" },
      ],
    },
  ];

  return (
    <footer className="w-full border-t border-border/60 bg-surface/40">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-8">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-8 pb-12 sm:pb-14 border-b border-border/60">
          <div className="lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <img
                src={new URL("../assets/prepUniv.png", import.meta.url).href}
                alt="PrepUniv"
                className="h-9 w-9 rounded-xl object-contain"
              />
              <span className="font-heading font-bold text-2xl tracking-tight text-primary">
                PrepUniv
              </span>
            </Link>
            <p className="text-sm sm:text-[15px] text-text-soft max-w-sm leading-relaxed">
              Practice quizzes made by Nigeria's best lecturers and students.
              Pay small, keep forever. The smarter way to ace your course exams.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="h-10 w-10 rounded-xl bg-cream border border-border/60 text-secondary flex items-center justify-center hover:bg-surface transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-[18px] h-[18px]" />
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-xl bg-cream border border-border/60 text-secondary flex items-center justify-center hover:bg-surface transition-colors"
                aria-label="X / Twitter"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-[17px] h-[17px]"
                >
                  <path d="M18.244 2H21.5l-7.51 8.58L22.75 22h-6.96l-4.55-5.96L5.77 22H2.51l8.04-9.18L1.5 2h7.16l4.1 5.43 5.48-5.43Zm-1.153 18h1.965L7.02 3.92H4.92l12.17 16.08Z" />
                </svg>
              </a>
              <a
                href="#"
                className="h-10 w-10 rounded-xl bg-cream border border-border/60 text-secondary flex items-center justify-center hover:bg-surface transition-colors"
                aria-label="Instagram"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-[18px] h-[18px]"
                >
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                </svg>
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {cols.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11px] font-heading font-bold uppercase tracking-[0.14em] text-muted mb-4">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l.t}>
                      {l.to === "#" ? (
                        <a
                          href="#"
                          className="text-sm text-text-soft hover:text-primary transition-colors inline-flex items-center gap-1 group"
                        >
                          {l.t}
                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </a>
                      ) : (
                        <Link
                          to={l.to}
                          className="text-sm text-text-soft hover:text-primary transition-colors inline-flex items-center gap-1 group"
                        >
                          {l.t}
                          <ArrowRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} PrepUniv Technologies. All rights
            reserved. Made with care in Nigeria.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              Payments secured by Flutterwave
            </span>
            <span>·</span>
            <span>support@prepuniv.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---------- PAGE ----------
export function LandingPage() {
  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-background text-text">
      <LandingTopNav />
      <main>
        <Hero />
        <HowItWorks />
        <FeaturedQuizzes />
        <ForCreators />
        <Trust />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
