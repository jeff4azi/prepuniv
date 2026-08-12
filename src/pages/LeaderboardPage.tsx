import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Users,
  PlayCircle,
  Star,
  Timer,
  TimerOff,
  CalendarClock,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import type { Quiz, Course, QuizAttempt, Profile } from "../mock/types";
import {
  fetchQuiz,
  fetchCourse,
  fetchQuizAttempts,
  fetchProfilesByIds,
} from "../lib/queries";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds?: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
  });
}

function formatDisplayName(fullName: string, isCurrentUser: boolean): string {
  if (isCurrentUser) return fullName;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase() + ".";
  return `${first} ${lastInitial}`;
}

/** Returns the Monday 00:00 UTC of the current ISO week */
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

/** Next Monday 00:00 UTC */
function getWeekEnd(): Date {
  const start = getWeekStart();
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return end;
}

function formatWeekRange(): string {
  const start = getWeekStart();
  const end = new Date(getWeekEnd());
  end.setUTCDate(end.getUTCDate() - 1); // last day of week
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${start.toLocaleDateString("en-NG", opts)} – ${end.toLocaleDateString("en-NG", opts)}`;
}

function formatTimeUntilReset(): string {
  const now = Date.now();
  const end = getWeekEnd().getTime();
  const ms = end - now;
  if (ms <= 0) return "resetting…";
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 1) return `resets in ${d} days`;
  if (d === 1) return "resets tomorrow";
  return `resets in ${h}h`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TabMode = "timed" | "untimed";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  fullName: string;
  score: number;
  timeTaken?: number;
  completedAt: string;
  isCurrentUser: boolean;
  isCreator: boolean;
}

// ─── Medal config for top 3 ───────────────────────────────────────────────────

const MEDAL_CONFIG = [
  {
    ring: "ring-2 ring-primary/60",
    bg: "bg-primary/10",
    text: "text-primary",
    label: "1st",
    badgeBg: "bg-primary text-cream",
    rowBg: "bg-primary/5 border-primary/20",
  },
  {
    ring: "ring-2 ring-secondary/50",
    bg: "bg-secondary/10",
    text: "text-secondary",
    label: "2nd",
    badgeBg: "bg-secondary text-cream",
    rowBg: "bg-secondary/5 border-secondary/15",
  },
  {
    ring: "ring-2 ring-muted/50",
    bg: "bg-muted/10",
    text: "text-muted",
    label: "3rd",
    badgeBg: "bg-muted text-cream",
    rowBg: "bg-muted/5 border-muted/15",
  },
] as const;

// ─── Build leaderboard entries from attempts ──────────────────────────────────

function buildLeaderboard(
  attempts: QuizAttempt[],
  profiles: Map<string, Profile>,
  currentUserId: string,
  mode: TabMode,
): LeaderboardEntry[] {
  const weekStart = getWeekStart();

  // Filter by mode and within this week
  const filtered = attempts.filter((a) => {
    const isMode = mode === "timed" ? a.is_timed : !a.is_timed;
    const inWeek = new Date(a.completed_at ?? a.started_at) >= weekStart;
    return isMode && inWeek;
  });

  // Best attempt per user — score desc, tiebreak time asc, then date asc
  const bestByUser = new Map<
    string,
    { score: number; timeTaken?: number; completedAt: string }
  >();

  for (const a of filtered) {
    const existing = bestByUser.get(a.user_id);
    const better =
      !existing ||
      a.score > existing.score ||
      (a.score === existing.score &&
        (a.time_taken_seconds ?? Infinity) <
          (existing.timeTaken ?? Infinity)) ||
      (a.score === existing.score &&
        a.time_taken_seconds === existing.timeTaken &&
        new Date(a.completed_at) < new Date(existing.completedAt));

    if (better) {
      bestByUser.set(a.user_id, {
        score: a.score,
        timeTaken: a.time_taken_seconds,
        completedAt: a.completed_at,
      });
    }
  }

  const sorted = [...bestByUser.entries()].sort(([, a], [, b]) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = a.timeTaken ?? Infinity;
    const tb = b.timeTaken ?? Infinity;
    if (ta !== tb) return ta - tb;
    return (
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );
  });

  return sorted.map(([userId, data], idx) => {
    const profile = profiles.get(userId);
    const fullName = profile?.full_name ?? "Anonymous User";
    const isCurrentUser = userId === currentUserId;
    const isCreator =
      !!profile?.is_approved_creator ||
      profile?.role === "creator" ||
      profile?.role === "admin";
    return {
      rank: idx + 1,
      userId,
      fullName,
      displayName: formatDisplayName(fullName, isCurrentUser),
      score: data.score,
      timeTaken: data.timeTaken,
      completedAt: data.completedAt,
      isCurrentUser,
      isCreator,
    };
  });
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [tab, setTab] = useState<TabMode>("timed");

  useEffect(() => {
    if (!quizId) return;
    let cancelled = false;
    setLoading(true);

    (async () => {
      const q = await fetchQuiz(quizId);
      if (cancelled) return;
      setQuiz(q);

      const [c, attempts] = await Promise.all([
        q?.course_id ? fetchCourse(q.course_id) : Promise.resolve(null),
        fetchQuizAttempts(quizId),
      ]);
      if (cancelled) return;
      setCourse(c);
      setQuizAttempts(attempts);

      const userIds = attempts.map((a) => a.user_id);
      if (userIds.length) {
        const profMap = await fetchProfilesByIds(userIds);
        if (cancelled) return;
        setProfiles(profMap);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [quizId]);

  // Set default tab based on whether quiz has a time limit
  useEffect(() => {
    if (quiz) setTab(quiz.time_limit_seconds ? "timed" : "untimed");
  }, [quiz]);

  const timedBoard = useMemo(
    () => buildLeaderboard(quizAttempts, profiles, currentUser.id, "timed"),
    [quizAttempts, profiles, currentUser.id],
  );
  const untimedBoard = useMemo(
    () => buildLeaderboard(quizAttempts, profiles, currentUser.id, "untimed"),
    [quizAttempts, profiles, currentUser.id],
  );

  const leaderboard = tab === "timed" ? timedBoard : untimedBoard;
  const currentUserEntry = leaderboard.find((e) => e.isCurrentUser);
  const hasAttempted = !!currentUserEntry;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  if (loading) {
    return (
      <PageContainer className="!max-w-[720px]">
        <Card padded className="py-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-surface animate-pulse mx-auto" />
          <div className="h-5 w-48 rounded-lg bg-surface animate-pulse mx-auto" />
          <div className="h-4 w-64 rounded-lg bg-surface/60 animate-pulse mx-auto" />
        </Card>
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
          <Link to="/browse">
            <Button variant="outline" size="md">
              Back to Browse
            </Button>
          </Link>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="!max-w-[720px]">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-background/90 backdrop-blur-xl border-b border-border/40 mb-6">
        <div className="max-w-[720px] mx-auto flex items-center gap-3 min-w-0">
          <Link to={`/quiz/${quiz.id}`} className="shrink-0">
            <button className="h-9 w-9 rounded-xl flex items-center justify-center bg-cream border border-border/50 text-text-soft hover:text-text hover:bg-surface transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted truncate">
              Leaderboard
            </p>
            <p className="font-heading font-semibold text-[14px] text-text leading-tight truncate">
              {quiz.title}
            </p>
          </div>
          {course && (
            <Badge
              variant="secondary"
              size="sm"
              className="shrink-0 hidden sm:inline-flex"
            >
              {course.code}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {/* ── Page heading ───────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Trophy className="w-5 h-5 text-primary" strokeWidth={2} />
              <h1 className="font-heading font-bold text-xl text-text tracking-tight leading-tight">
                Top Scorers
              </h1>
            </div>
            <p className="text-sm text-text-soft leading-relaxed">
              Weekly rankings — best score per learner, this week only.
              {leaderboard.length > 0 &&
                ` ${leaderboard.length} learner${leaderboard.length !== 1 ? "s" : ""} on the board.`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted" />
              <span className="text-sm font-heading font-semibold text-text-soft">
                {quiz.attempt_count.toLocaleString()} attempts
              </span>
            </div>
          </div>
        </div>

        {/* ── Weekly reset info chip ──────────────────────────────────── */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-surface/60 border border-border/50">
          <CalendarClock className="w-4 h-4 text-muted shrink-0" />
          <p className="text-[12px] font-heading text-text-soft">
            <span className="font-semibold text-text">{formatWeekRange()}</span>
            <span className="ml-2 text-muted">· {formatTimeUntilReset()}</span>
          </p>
        </div>

        {/* ── Timed / Untimed tabs ────────────────────────────────────── */}
        <div className="flex gap-1 p-1 rounded-2xl bg-surface/60 border border-border/50">
          <button
            type="button"
            onClick={() => setTab("timed")}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-heading font-semibold transition-all duration-150 ${
              tab === "timed"
                ? "bg-primary text-cream shadow-soft"
                : "text-text-soft hover:text-text"
            }`}
          >
            <Timer className="w-4 h-4" strokeWidth={2} />
            Timed
            {timedBoard.length > 0 && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  tab === "timed"
                    ? "bg-cream/20 text-cream"
                    : "bg-surface text-muted"
                }`}
              >
                {timedBoard.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("untimed")}
            className={`flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-heading font-semibold transition-all duration-150 ${
              tab === "untimed"
                ? "bg-primary text-cream shadow-soft"
                : "text-text-soft hover:text-text"
            }`}
          >
            <TimerOff className="w-4 h-4" strokeWidth={2} />
            Untimed
            {untimedBoard.length > 0 && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                  tab === "untimed"
                    ? "bg-cream/20 text-cream"
                    : "bg-surface text-muted"
                }`}
              >
                {untimedBoard.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Not-yet-attempted banner ──────────────────────────────── */}
        {!hasAttempted && leaderboard.length > 0 && (
          <div className="flex items-start sm:items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-primary/8 border border-primary/20">
            <Trophy
              className="w-5 h-5 text-primary shrink-0 mt-0.5 sm:mt-0"
              strokeWidth={2}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-heading font-semibold text-text leading-tight">
                You haven&apos;t attempted this quiz{" "}
                {tab === "timed" ? "timed" : "untimed"} yet
              </p>
              <p className="text-[12px] text-text-soft mt-0.5 leading-relaxed">
                Take it this week to get on the board — rankings reset every
                Monday.
              </p>
            </div>
            <Link
              to={`/quiz/${quiz.id}`}
              className="shrink-0 self-start sm:self-center"
            >
              <button className="h-9 px-3.5 rounded-xl text-[12px] font-heading font-semibold bg-primary text-cream hover:bg-primary/90 transition-colors flex items-center gap-1.5 whitespace-nowrap">
                <PlayCircle className="w-3.5 h-3.5" />
                Take quiz
              </button>
            </Link>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {leaderboard.length === 0 ? (
          <Card padded className="py-12 text-center">
            <div className="h-16 w-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-card mx-auto">
              <Trophy className="w-8 h-8" strokeWidth={1.8} />
            </div>
            <h2 className="font-heading font-bold text-xl text-text">
              No {tab} attempts this week
            </h2>
            <p className="mt-2 text-sm text-text-soft max-w-xs mx-auto leading-relaxed">
              {tab === "timed"
                ? "Be the first to complete this quiz timed this week and claim the top spot."
                : "No untimed attempts this week yet. Take it at your own pace and get on the board."}
            </p>
            <Link to={`/quiz/${quiz.id}`} className="inline-block mt-5">
              <Button variant="primary" size="md">
                <PlayCircle className="w-4 h-4" />
                Take this quiz
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* ── Top 3 podium ─────────────────────────────────────── */}
            {top3.length > 0 && (
              <Card padded={false} className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" strokeWidth={2.2} />
                  <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                    Top performers
                  </p>
                </div>
                <div className="divide-y divide-border/30">
                  {top3.map((entry) => {
                    const medal = MEDAL_CONFIG[entry.rank - 1];
                    return (
                      <PodiumRow
                        key={entry.userId}
                        entry={entry}
                        medal={medal}
                        showTime={tab === "timed"}
                      />
                    );
                  })}
                </div>
              </Card>
            )}

            {/* ── Full ranked list ──────────────────────────────────── */}
            {rest.length > 0 && (
              <Card padded={false} className="overflow-hidden">
                <div className="px-5 py-4 border-b border-border/40">
                  <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                    Full rankings
                  </p>
                </div>
                <div className="divide-y divide-border/30">
                  {rest.map((entry) => (
                    <RankRow
                      key={entry.userId}
                      entry={entry}
                      showTime={tab === "timed"}
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* ── Current user's position ─────────────────────────── */}
            {currentUserEntry && currentUserEntry.rank > 3 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/60 border border-border/50">
                <Trophy
                  className="w-4 h-4 text-secondary shrink-0"
                  strokeWidth={2}
                />
                <p className="text-sm text-text-soft">
                  You&apos;re currently ranked{" "}
                  <span className="font-heading font-bold text-text">
                    #{currentUserEntry.rank}
                  </span>{" "}
                  with{" "}
                  <span className="font-heading font-bold text-text">
                    {currentUserEntry.score}%
                  </span>
                  {tab === "timed" && currentUserEntry.timeTaken && (
                    <> in {formatTime(currentUserEntry.timeTaken)}</>
                  )}
                  . Keep practicing to climb higher.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Privacy note ──────────────────────────────────────────── */}
        {leaderboard.length > 0 && (
          <p className="text-center text-[11px] text-muted/70 font-heading leading-relaxed">
            Names shown as First name + initial for privacy. Your own name is
            shown in full.
          </p>
        )}
      </div>
    </PageContainer>
  );
}

// ─── PodiumRow (top 3) ────────────────────────────────────────────────────────

function PodiumRow({
  entry,
  medal,
  showTime,
}: {
  entry: LeaderboardEntry;
  medal: (typeof MEDAL_CONFIG)[number];
  showTime: boolean;
}) {
  const nameNode = entry.isCreator ? (
    <Link
      to={`/profile/creator/${entry.userId}`}
      className="font-heading font-semibold text-[14px] text-text hover:underline underline-offset-2 transition-colors leading-tight"
    >
      {entry.displayName}
    </Link>
  ) : (
    <span className="font-heading font-semibold text-[14px] text-text leading-tight">
      {entry.displayName}
    </span>
  );

  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 px-5 py-3.5 ${entry.isCurrentUser ? "bg-surface/60" : ""}`}
    >
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-heading font-bold text-[13px] ${medal.badgeBg}`}
      >
        {entry.rank}
      </div>
      <Avatar
        name={entry.fullName}
        size="sm"
        className={entry.rank <= 3 ? medal.ring : ""}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {nameNode}
          {entry.isCurrentUser && (
            <Badge variant="primary" size="sm">
              You
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          {formatShortDate(entry.completedAt)}
          {showTime && entry.timeTaken && ` · ${formatTime(entry.timeTaken)}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`font-heading font-bold text-lg leading-none ${medal.text}`}
        >
          {entry.score}%
        </p>
        {showTime && entry.timeTaken && (
          <p className="text-[11px] text-muted mt-0.5">
            {formatTime(entry.timeTaken)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── RankRow (4th and below) ──────────────────────────────────────────────────

function RankRow({
  entry,
  showTime,
}: {
  entry: LeaderboardEntry;
  showTime: boolean;
}) {
  const nameNode = entry.isCreator ? (
    <Link
      to={`/profile/creator/${entry.userId}`}
      className="font-heading font-medium text-[13px] text-text hover:underline underline-offset-2 transition-colors leading-tight"
    >
      {entry.displayName}
    </Link>
  ) : (
    <span className="font-heading font-medium text-[13px] text-text leading-tight">
      {entry.displayName}
    </span>
  );

  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 px-5 py-3 min-h-[56px] hover:bg-surface/20 transition-colors ${
        entry.isCurrentUser ? "bg-surface/50 border-l-2 border-primary" : ""
      }`}
    >
      <span className="text-[13px] font-heading font-bold text-muted w-7 shrink-0 text-center">
        {entry.rank}
      </span>
      <Avatar name={entry.fullName} size="xs" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {nameNode}
          {entry.isCurrentUser && (
            <Badge variant="primary" size="sm">
              You
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          {formatShortDate(entry.completedAt)}
          {showTime && entry.timeTaken && ` · ${formatTime(entry.timeTaken)}`}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-heading font-bold text-[14px] text-text leading-none">
          {entry.score}%
        </p>
        {showTime && entry.timeTaken && (
          <p className="text-[11px] text-muted mt-0.5">
            {formatTime(entry.timeTaken)}
          </p>
        )}
      </div>
    </div>
  );
}
