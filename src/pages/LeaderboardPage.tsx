import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, Users, PlayCircle, Star } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Avatar } from "../components/Avatar";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import {
  quizzes as allQuizzes,
  courses as allCourses,
  quizAttempts as allAttempts,
} from "../mock";
import {
  getMockUserName,
  formatDisplayName,
  isCreatorUser,
} from "../mock/mockUsers";

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

// ─── Types ────────────────────────────────────────────────────────────────────

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
    // 1st — warm gold using primary tones
    ring: "ring-2 ring-primary/60",
    bg: "bg-primary/10",
    text: "text-primary",
    label: "1st",
    badgeBg: "bg-primary text-cream",
    rowBg: "bg-primary/5 border-primary/20",
  },
  {
    // 2nd — secondary/muted silver-adjacent
    ring: "ring-2 ring-secondary/50",
    bg: "bg-secondary/10",
    text: "text-secondary",
    label: "2nd",
    badgeBg: "bg-secondary text-cream",
    rowBg: "bg-secondary/5 border-secondary/15",
  },
  {
    // 3rd — warm muted bronze-adjacent
    ring: "ring-2 ring-muted/50",
    bg: "bg-muted/10",
    text: "text-muted",
    label: "3rd",
    badgeBg: "bg-muted text-cream",
    rowBg: "bg-muted/5 border-muted/15",
  },
] as const;

// ─── Main page ────────────────────────────────────────────────────────────────

export function LeaderboardPage() {
  const { id: quizId } = useParams<{ id: string }>();
  const { currentUser } = useAuth();

  const quiz = useMemo(() => allQuizzes.find((q) => q.id === quizId), [quizId]);
  const course = useMemo(
    () => allCourses.find((c) => c.id === quiz?.course_id),
    [quiz],
  );

  // All attempts for this quiz
  const quizAttempts = useMemo(
    () => allAttempts.filter((a) => a.quiz_id === quizId),
    [quizId],
  );

  // Best attempt per user — score desc, tiebreak by time asc, then date asc
  const leaderboard = useMemo((): LeaderboardEntry[] => {
    const bestByUser = new Map<
      string,
      { score: number; timeTaken?: number; completedAt: string }
    >();

    for (const a of quizAttempts) {
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
      const fullName = getMockUserName(userId);
      const isCurrentUser = userId === currentUser.id;
      return {
        rank: idx + 1,
        userId,
        fullName,
        displayName: formatDisplayName(fullName, isCurrentUser),
        score: data.score,
        timeTaken: data.timeTaken,
        completedAt: data.completedAt,
        isCurrentUser,
        isCreator: isCreatorUser(userId),
      };
    });
  }, [quizAttempts, currentUser.id]);

  const currentUserEntry = leaderboard.find((e) => e.isCurrentUser);
  const hasAttempted = !!currentUserEntry;
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

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
              Ranked by best score per learner.
              {leaderboard.length > 0 &&
                ` ${leaderboard.length} learner${leaderboard.length !== 1 ? "s" : ""} on the board.`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Users className="w-4 h-4 text-muted" />
            <span className="text-sm font-heading font-semibold text-text-soft">
              {quiz.attempt_count.toLocaleString()} attempts
            </span>
          </div>
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
                You haven't attempted this quiz yet
              </p>
              <p className="text-[12px] text-text-soft mt-0.5 leading-relaxed">
                Take it to see your rank — you might be closer to the top than
                you think.
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
              No attempts yet
            </h2>
            <p className="mt-2 text-sm text-text-soft max-w-xs mx-auto leading-relaxed">
              Be the first to take this quiz and top the leaderboard.
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
                {/* Header */}
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
                    <RankRow key={entry.userId} entry={entry} />
                  ))}
                </div>
              </Card>
            )}

            {/* ── Current user's position if they appear ─────────────── */}
            {currentUserEntry && currentUserEntry.rank > 3 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface/60 border border-border/50">
                <Trophy
                  className="w-4 h-4 text-secondary shrink-0"
                  strokeWidth={2}
                />
                <p className="text-sm text-text-soft">
                  You're currently ranked{" "}
                  <span className="font-heading font-bold text-text">
                    #{currentUserEntry.rank}
                  </span>{" "}
                  with{" "}
                  <span className="font-heading font-bold text-text">
                    {currentUserEntry.score}%
                  </span>
                  {currentUserEntry.timeTaken && (
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
}: {
  entry: LeaderboardEntry;
  medal: (typeof MEDAL_CONFIG)[number];
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
      {/* Medal */}
      <div
        className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 font-heading font-bold text-[13px] ${medal.badgeBg}`}
      >
        {entry.rank}
      </div>

      {/* Avatar */}
      <Avatar
        name={entry.fullName}
        size="sm"
        className={entry.rank <= 3 ? medal.ring : ""}
      />

      {/* Name + meta */}
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
          {entry.timeTaken && ` · ${formatTime(entry.timeTaken)}`}
        </p>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <p
          className={`font-heading font-bold text-lg leading-none ${medal.text}`}
        >
          {entry.score}%
        </p>
      </div>
    </div>
  );
}

// ─── RankRow (4th and below) ──────────────────────────────────────────────────

function RankRow({ entry }: { entry: LeaderboardEntry }) {
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
      {/* Rank number */}
      <span className="text-[13px] font-heading font-bold text-muted w-7 shrink-0 text-center">
        {entry.rank}
      </span>

      {/* Avatar */}
      <Avatar name={entry.fullName} size="xs" />

      {/* Name + badges */}
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
          {entry.timeTaken && ` · ${formatTime(entry.timeTaken)}`}
        </p>
      </div>

      {/* Score */}
      <div className="shrink-0 text-right">
        <p className="font-heading font-bold text-[14px] text-text leading-none">
          {entry.score}%
        </p>
      </div>
    </div>
  );
}
