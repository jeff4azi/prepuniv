import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Users,
  TrendingUp,
  Target,
  BookOpen,
  AlertTriangle,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { MathText } from "../components/MathText";
import { FilterSelect, type SelectOption } from "../components/CustomSelect";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { toAttempt } from "../lib/queries";
import type { QuizAttempt } from "../types";
import { formatNaira } from "./CreatorDashboardPage";

import { apiFetch } from "../lib/api";

interface DbQuiz {
  id: string;
  creator_id: string;
  course_id: string;
  title: string;
  description?: string;
  price: number;
  is_published: boolean;
  question_count?: number;
  attempt_count?: number;
  created_at: string;
}

interface DbCourse {
  id: string;
  name: string;
  code: string;
}

interface DbQuestion {
  id: string;
  quiz_id: string;
  type: string;
  question_text: string;
  order_index: number;
}

interface DbAttemptAnswer {
  question_id: string;
  is_correct: boolean;
}

interface DbQuizVersion {
  id: string;
  quiz_id: string;
  version_number: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  questions_snapshot: any;
  question_count: number;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const NEEDS_REVIEW_THRESHOLD = 40; // % correct

function isoToDateKey(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function formatDateLabel(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00Z");
  return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

// ─── Custom tooltip for recharts ──────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
  valueLabel = "Attempts",
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  valueLabel?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-cream border border-border/60 rounded-xl px-3 py-2 shadow-elevated text-[12px] font-heading">
      <p className="text-muted mb-0.5">{label}</p>
      <p className="font-bold text-text">
        {payload[0].value}{" "}
        <span className="font-normal text-text-soft">{valueLabel}</span>
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function QuizAnalyticsPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const {
    currentUser,
    walletTxns,
    authToken,
    isLoading: authLoading,
  } = useAuth();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<DbQuiz | null>(null);
  const [course, setCourse] = useState<DbCourse | null>(null);
  const [versions, setVersions] = useState<DbQuizVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [quizQuestions, setQuizQuestions] = useState<DbQuestion[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [attemptAnswers, setAttemptAnswers] = useState<DbAttemptAnswer[]>([]);

  useEffect(() => {
    if (!quizId || authLoading || !authToken) return;
    let cancelled = false;

    (async () => {
      setLoading(true);

      // Try backend endpoint first (bypasses RLS & parses quiz_snapshot if needed)
      try {
        const res = await apiFetch<{
          quiz: DbQuiz;
          course: DbCourse;
          versions: DbQuizVersion[];
          questions: DbQuestion[];
          attempts: any[];
          attemptAnswers: DbAttemptAnswer[];
        }>(`/api/quiz/${quizId}/analytics`);

        if (res.status === 200 && res.data) {
          if (!cancelled) {
            setQuiz(res.data.quiz ?? null);
            setCourse(res.data.course ?? null);
            const vList = res.data.versions ?? [];
            setVersions(vList);
            if (vList.length > 0) {
              setSelectedVersionId(vList[0].id); // Default to latest version
            }
            setQuizQuestions(res.data.questions ?? []);
            setAttempts((res.data.attempts ?? []).map(toAttempt));
            setAttemptAnswers(res.data.attemptAnswers ?? []);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        /* fallback to Supabase query */
      }

      // Fallback: Supabase direct query
      const { data: qData } = await supabase
        .from("quizzes")
        .select("*")
        .eq("id", quizId)
        .maybeSingle();

      if (cancelled) return;
      if (!qData) {
        setQuiz(null);
        setLoading(false);
        return;
      }
      setQuiz(qData);

      const [cRes, qRes, aRes, vRes] = await Promise.all([
        qData.course_id
          ? supabase
              .from("courses")
              .select("*")
              .eq("id", qData.course_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from("questions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("order_index", { ascending: true }),
        supabase
          .from("quiz_attempts")
          .select("*")
          .eq("quiz_id", quizId)
          .not("completed_at", "is", null),
        supabase
          .from("quiz_versions")
          .select("*")
          .eq("quiz_id", quizId)
          .order("version_number", { ascending: false }),
      ]);

      if (cancelled) return;

      let questionsList = qRes.data ?? [];
      const rawAttempts = aRes.data ?? [];
      const versionsList = vRes.data ?? [];
      const attemptRows = rawAttempts.map(toAttempt);

      setVersions(versionsList);
      if (versionsList.length > 0) {
        setSelectedVersionId(versionsList[0].id);
      }

      // Fallback: use quiz_versions snapshot if questions table is empty
      if (questionsList.length === 0 && versionsList.length > 0) {
        const latestSnap = versionsList[0].questions_snapshot;
        questionsList =
          typeof latestSnap === "string" ? JSON.parse(latestSnap) : latestSnap;
      }

      setCourse(cRes.data ?? null);
      setQuizQuestions(questionsList);
      setAttempts(attemptRows);

      const attemptIds = attemptRows.map((a) => a.id);
      if (attemptIds.length > 0) {
        const { data: ansData } = await supabase
          .from("attempt_answers")
          .select("question_id, is_correct")
          .in("attempt_id", attemptIds);

        if (!cancelled && ansData) {
          setAttemptAnswers(
            ansData.map((ans) => ({
              question_id: ans.question_id,
              is_correct: !!ans.is_correct,
            })),
          );
        }
      } else {
        setAttemptAnswers([]);
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [quizId, authToken, authLoading]);

  // ── Key stats ──────────────────────────────────────────────────────────────
  const totalAttempts = attempts.length;
  const creatorEarnings = useMemo(() => {
    if (!quiz?.id) return 0;
    return walletTxns
      .filter(
        (t) =>
          t.type === "creator_earning" &&
          (t.status === "completed" || t.status === "success") &&
          t.related_quiz_id === quiz.id,
      )
      .reduce((sum, t) => sum + Math.round(Number(t.amount || 0) * 100), 0);
  }, [quiz?.id, walletTxns]);

  const avgScore = useMemo(() => {
    if (!totalAttempts) return 0;
    return Math.round(
      attempts.reduce((s, a) => s + a.score, 0) / totalAttempts,
    );
  }, [attempts, totalAttempts]);

  const uniqueLearners = useMemo(
    () => new Set(attempts.map((a) => a.user_id)).size,
    [attempts],
  );

  // ── Score distribution ─────────────────────────────────────────────────────
  const scoreDistribution = useMemo(() => {
    const bands = [
      { label: "0–20%", min: 0, max: 20, count: 0 },
      { label: "21–40%", min: 21, max: 40, count: 0 },
      { label: "41–60%", min: 41, max: 60, count: 0 },
      { label: "61–80%", min: 61, max: 80, count: 0 },
      { label: "81–100%", min: 81, max: 100, count: 0 },
    ];
    for (const a of attempts) {
      const band = bands.find((b) => a.score >= b.min && a.score <= b.max);
      if (band) band.count++;
    }
    return bands;
  }, [attempts]);

  // ── Attempts over time (last 60 days, grouped by day) ─────────────────────
  const attemptsOverTime = useMemo(() => {
    if (!attempts.length) return [];
    // Build a date-keyed map
    const map = new Map<string, number>();
    for (const a of attempts) {
      const key = isoToDateKey(a.completed_at ?? a.started_at);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    // Sort keys
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted.map(([dateKey, count]) => ({
      date: formatDateLabel(dateKey),
      dateKey,
      count,
    }));
  }, [attempts]);

  // ── Selected version & Per-question performance ────────────────────────────
  const versionOptions = useMemo<SelectOption<string>[]>(() => {
    const opts: SelectOption<string>[] = versions.map((v, idx) => {
      const qCount =
        v.question_count ??
        (Array.isArray(v.questions_snapshot) ? v.questions_snapshot.length : 0);
      return {
        value: v.id,
        label: `Version ${v.version_number}${idx === 0 ? " (Latest)" : ""} · ${qCount} q`,
      };
    });
    if (versions.length > 1) {
      opts.push({
        value: "all",
        label: "All Versions (Aggregate)",
      });
    }
    return opts;
  }, [versions]);

  const selectedVersion = useMemo(() => {
    if (!selectedVersionId && versions.length > 0) return versions[0];
    if (selectedVersionId === "all") return null;
    return (
      versions.find((v) => v.id === selectedVersionId) ?? versions[0] ?? null
    );
  }, [versions, selectedVersionId]);

  const questionsForPerf = useMemo(() => {
    if (selectedVersion && selectedVersion.questions_snapshot) {
      const snap =
        typeof selectedVersion.questions_snapshot === "string"
          ? JSON.parse(selectedVersion.questions_snapshot)
          : selectedVersion.questions_snapshot;
      if (Array.isArray(snap) && snap.length > 0) return snap;
    }
    return quizQuestions;
  }, [selectedVersion, quizQuestions]);

  const attemptsForPerf = useMemo(() => {
    if (!selectedVersion) return attempts;
    return attempts.filter(
      (a) =>
        a.quiz_version_id === selectedVersion.id ||
        (!a.quiz_version_id && versions.length <= 1),
    );
  }, [selectedVersion, attempts, versions]);

  const questionPerformance = useMemo(() => {
    if (!questionsForPerf.length) return [];

    const attemptIdsSet = new Set(attemptsForPerf.map((a) => a.id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return questionsForPerf.map((q: any, idx: number) => {
      let total = 0;
      let correctCount = 0;

      for (const att of attemptsForPerf) {
        if (att.answers && typeof att.answers === "object") {
          const given = att.answers[q.id];
          if (given !== undefined && given !== null) {
            total++;
            const isCorr =
              String(given).trim().toLowerCase() ===
              String(q.correct_answer || "")
                .trim()
                .toLowerCase();
            if (isCorr) correctCount++;
          }
        }
      }

      if (total === 0) {
        const qAns = attemptAnswers.filter(
          (a) =>
            a.question_id === q.id &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (attemptIdsSet.size === 0 ||
              attemptIdsSet.has((a as any).attempt_id)),
        );
        total = qAns.length;
        correctCount = qAns.filter((a) => a.is_correct).length;
      }

      const pct = total > 0 ? Math.round((correctCount / total) * 100) : null;
      return {
        index: idx + 1,
        id: q.id,
        text: q.question_text || q.text || "",
        type: q.type || "mcq",
        correctPct: pct,
        needsReview: pct !== null && pct < NEEDS_REVIEW_THRESHOLD,
      };
    });
  }, [questionsForPerf, attemptsForPerf, attemptAnswers]);

  // Sort worst-first (null pct goes last)
  const sortedQuestions = useMemo(
    () =>
      [...questionPerformance].sort((a, b) => {
        if (a.correctPct === null) return 1;
        if (b.correctPct === null) return -1;
        return a.correctPct - b.correctPct;
      }),
    [questionPerformance],
  );

  // Gates
  if (!currentUser.is_approved_creator)
    return <Navigate to="/creator/apply" replace />;

  if (loading) {
    return (
      <PageContainer className="!max-w-[1100px]">
        <div className="space-y-6">
          <div className="h-20 rounded-2xl bg-surface/50 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-surface/50 animate-pulse"
              />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-surface/50 animate-pulse" />
        </div>
      </PageContainer>
    );
  }

  if (!quiz) {
    return (
      <PageContainer>
        <Card padded className="py-12 text-center">
          <p className="font-heading font-semibold text-text mb-2">
            Quiz not found
          </p>
          <Link to="/creator/quizzes">
            <Button variant="outline" size="md">
              Back to My Quizzes
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  const isOwner = quiz.creator_id === currentUser.id;

  return (
    <PageContainer className="!max-w-[1100px]">
      <div className="space-y-6 lg:space-y-7">
        {/* 1. Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <Link to="/creator/quizzes" className="shrink-0 mt-0.5">
              <button className="h-9 w-9 rounded-xl flex items-center justify-center bg-cream border border-border/50 text-text-soft hover:text-text hover:bg-surface transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <Badge variant="secondary" size="sm" dot>
                  <Sparkles className="w-3 h-3" />
                  Creator mode
                </Badge>
                {course && (
                  <Badge variant="muted" size="sm">
                    {course.code}
                  </Badge>
                )}
                <Badge
                  variant={quiz.is_published ? "success" : "warning"}
                  size="sm"
                  dot
                >
                  {quiz.is_published ? "Published" : "Draft"}
                </Badge>
              </div>
              <h1 className="font-heading font-bold text-xl lg:text-2xl text-text tracking-tight leading-tight">
                {quiz.title}
              </h1>
              <p className="mt-1 text-sm text-text-soft">
                {quiz.question_count} questions · {formatNaira(quiz.price)} per
                access
              </p>
            </div>
          </div>
          {isOwner && (
            <div className="shrink-0 self-start sm:self-center">
              <Link to={`/creator/quizzes/${quiz.id}/edit`}>
                <Button variant="outline" size="md">
                  <Edit2 className="w-4 h-4" />
                  Edit quiz
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* 2. Key stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Total attempts"
            value={totalAttempts.toLocaleString("en-NG")}
            sub={`${uniqueLearners} unique learner${uniqueLearners !== 1 ? "s" : ""}`}
            iconBg="bg-primary/10 text-primary"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Your earnings"
            value={formatNaira(creatorEarnings)}
            sub="From wallet transactions"
            iconBg="bg-success/10 text-success"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Average score"
            value={totalAttempts ? `${avgScore}%` : "—"}
            sub={
              totalAttempts
                ? `across ${totalAttempts} attempt${totalAttempts !== 1 ? "s" : ""}`
                : "No attempts yet"
            }
            iconBg="bg-secondary/10 text-secondary"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Unique learners"
            value={uniqueLearners.toLocaleString("en-NG")}
            sub={
              totalAttempts > uniqueLearners
                ? `${totalAttempts - uniqueLearners} repeat attempt${totalAttempts - uniqueLearners !== 1 ? "s" : ""}`
                : "No repeats yet"
            }
            iconBg="bg-warning/10 text-warning"
          />
        </div>

        {/* 3 & 4. Charts row */}
        {totalAttempts === 0 ? (
          <Card padded className="py-10 text-center">
            <div className="h-14 w-14 rounded-3xl bg-surface/80 text-muted flex items-center justify-center mb-3 shadow-card ring-1 ring-border/50 mx-auto">
              <TrendingUp className="w-7 h-7" strokeWidth={1.9} />
            </div>
            <p className="font-heading font-semibold text-text">
              No attempt data yet
            </p>
            <p className="mt-1 text-sm text-text-soft max-w-xs mx-auto leading-relaxed">
              Charts and per-question stats will appear once learners start
              attempting this quiz.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5">
            {/* Score distribution */}
            <Card padded={false} className="overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-border/40">
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-1">
                  Score distribution
                </p>
                <p className="font-heading font-semibold text-base text-text leading-tight">
                  How learners are scoring
                </p>
                <p className="text-xs text-text-soft mt-0.5">
                  Count of attempts per score band
                </p>
              </div>
              <div className="px-2 py-4 overflow-x-auto">
                <div className="min-w-[260px]">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={scoreDistribution}
                      margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                      barCategoryGap="30%"
                    >
                      <CartesianGrid
                        vertical={false}
                        stroke="var(--color-border)"
                        strokeOpacity={0.4}
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fontSize: 11,
                          fontFamily: "var(--font-heading)",
                          fill: "var(--color-muted)",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{
                          fontSize: 11,
                          fontFamily: "var(--font-heading)",
                          fill: "var(--color-muted)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip
                        content={(props) => (
                          <ChartTooltip
                            active={props.active}
                            payload={props.payload as Array<{ value: number }>}
                            label={props.label as string}
                            valueLabel="attempts"
                          />
                        )}
                        cursor={{ fill: "var(--color-surface)", opacity: 0.5 }}
                      />
                      <Bar
                        dataKey="count"
                        fill="var(--color-primary)"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Attempts over time */}
            <Card padded={false} className="overflow-hidden">
              <div className="px-5 pt-5 pb-4 border-b border-border/40">
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-1">
                  Attempts over time
                </p>
                <p className="font-heading font-semibold text-base text-text leading-tight">
                  Activity trend
                </p>
                <p className="text-xs text-text-soft mt-0.5">
                  Daily attempt count
                </p>
              </div>
              <div className="px-2 py-4 overflow-x-auto">
                <div className="min-w-[260px]">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={attemptsOverTime}
                      margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        strokeOpacity={0.4}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 10,
                          fontFamily: "var(--font-heading)",
                          fill: "var(--color-muted)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{
                          fontSize: 11,
                          fontFamily: "var(--font-heading)",
                          fill: "var(--color-muted)",
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip
                        content={(props) => (
                          <ChartTooltip
                            active={props.active}
                            payload={props.payload as Array<{ value: number }>}
                            label={props.label as string}
                            valueLabel="attempts"
                          />
                        )}
                        cursor={{
                          stroke: "var(--color-border)",
                          strokeWidth: 1,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-secondary)"
                        strokeWidth={2.5}
                        dot={{
                          r: 4,
                          fill: "var(--color-secondary)",
                          strokeWidth: 0,
                        }}
                        activeDot={{
                          r: 5,
                          fill: "var(--color-primary)",
                          strokeWidth: 0,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* 5. Per-question performance */}
        {sortedQuestions.length > 0 && (
          <Card padded={false} className="overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-1">
                  Per-question performance
                </p>
                <p className="font-heading font-semibold text-base text-text leading-tight">
                  How each question is performing
                </p>
                <p className="text-xs text-text-soft mt-0.5">
                  Worst-performing questions shown first · based on{" "}
                  {attemptsForPerf.length} completed attempt
                  {attemptsForPerf.length !== 1 ? "s" : ""}
                  {selectedVersion
                    ? ` (Version ${selectedVersion.version_number})`
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {versions.length > 0 && (
                  <FilterSelect
                    value={selectedVersionId || (versions[0]?.id ?? "")}
                    onChange={(val) => setSelectedVersionId(val)}
                    options={versionOptions}
                    leadingIcon={<Layers className="w-3.5 h-3.5" />}
                    aria-label="Select quiz version"
                  />
                )}

                {sortedQuestions.some((q) => q.needsReview) && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning-bg border border-warning/25 shrink-0">
                    <AlertTriangle
                      className="w-3.5 h-3.5 text-warning shrink-0"
                      strokeWidth={2}
                    />
                    <span className="text-[12px] font-heading font-semibold text-warning">
                      {sortedQuestions.filter((q) => q.needsReview).length}{" "}
                      question
                      {sortedQuestions.filter((q) => q.needsReview).length !== 1
                        ? "s"
                        : ""}{" "}
                      need review
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="divide-y divide-border/40">
              {sortedQuestions.map((q) => (
                <QuestionPerfRow key={q.id} question={q} />
              ))}
            </div>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  iconBg: string;
}) {
  return (
    <Card padded className="flex flex-col gap-3">
      <div className="flex items-start gap-2.5">
        <div
          className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted leading-tight">
            {label}
          </p>
          <p className="font-heading font-bold text-xl text-text leading-none mt-1 break-words">
            {value}
          </p>
        </div>
      </div>
      <p className="text-xs text-text-soft leading-relaxed">{sub}</p>
    </Card>
  );
}

function QuestionPerfRow({
  question,
}: {
  question: {
    index: number;
    text: string;
    type: string;
    correctPct: number | null;
    needsReview: boolean;
  };
}) {
  const pct = question.correctPct;
  const barColor =
    pct === null
      ? "bg-muted/30"
      : pct >= 70
        ? "bg-success"
        : pct >= 40
          ? "bg-secondary"
          : "bg-danger";

  return (
    <div className="px-5 py-3.5 flex items-center gap-3 sm:gap-4 hover:bg-surface/20 transition-colors">
      {/* Number */}
      <span className="text-[12px] font-heading font-bold text-muted w-5 shrink-0 text-center">
        {question.index}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-[13px] font-heading text-text leading-snug line-clamp-2 flex-1 min-w-0">
            <MathText text={question.text} />
          </p>
          {question.needsReview && (
            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-lg bg-warning/12 text-warning text-[10px] font-heading font-bold uppercase tracking-wide shrink-0">
              <AlertTriangle className="w-2.5 h-2.5" />
              Review
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-2.5 mt-1.5">
          <div className="flex-1 h-1.5 rounded-full bg-border/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: pct !== null ? `${pct}%` : "0%" }}
            />
          </div>
          <span className="text-[12px] font-heading font-bold text-text shrink-0 w-10 text-right">
            {pct !== null ? `${pct}%` : "—"}
          </span>
        </div>
      </div>

      {/* Type badge — hidden on very small screens */}
      <Badge
        variant={question.type === "mcq" ? "primary" : "secondary"}
        size="sm"
        className="shrink-0 hidden sm:inline-flex"
      >
        {question.type === "mcq" ? "MCQ" : "Fill-in"}
      </Badge>
    </div>
  );
}
