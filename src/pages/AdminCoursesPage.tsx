/**
 * AdminCoursesPage — /admin/courses
 *
 * Courses are a LIVING list, built from what creators actually create:
 *   - Creator types a new course code → it auto-lands in this list immediately.
 *   - Creator picks one that already exists → no duplication, that row reuses it.
 *
 * Admins don't add courses or control what creators can create. The admin's
 * job here is DATA-QUALITY cleanup after the fact:
 *   - Fix typos in a course code / title.
 *   - Reassign a course's subject area.
 *   - Correct a course's level (100/200/300/400).
 *   - No timing/duration fields here — quiz time limits are set per quiz by
 *     the creator, not something admins manage at the course level.
 */
import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { BookOpen, Edit2, X, ShieldCheck, Info, Check } from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FieldWrapper } from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  courses,
  updateCourse,
  quizzes as allQuizzes,
  universities,
  type Course,
} from "../mock";
import {
  COURSE_PREFIX_SUBJECT_AREA,
  suggestLevelFromCode,
} from "../mock/courses";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function quizCountForCourse(courseId: string): number {
  return allQuizzes.filter((q) => q.course_id === courseId).length;
}

// ─── Edit modal (no Add modal — creation is creator-driven) ──────────────────

interface CourseFormValues {
  code: string;
  title: string;
  subject_area: string;
  level: string;
}

function CourseEditModal({
  existing,
  onClose,
  onSaved,
}: {
  existing: Course;
  onClose: () => void;
  onSaved: (course: Course) => void;
}) {
  const quizCount = quizCountForCourse(existing.id);

  const [values, setValues] = useState<CourseFormValues>({
    code: existing.code,
    title: existing.title,
    subject_area: existing.subject_area,
    level: String(existing.level),
  });
  const [errors, setErrors] = useState<Partial<CourseFormValues>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CourseFormValues>(
    key: K,
    val: CourseFormValues[K],
  ) {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleCodeChange(code: string) {
    const prefix = code.trim().split(/\s+/)[0]?.toUpperCase();
    const suggestedDept = COURSE_PREFIX_SUBJECT_AREA[prefix] ?? "";
    const suggestedLevel = suggestLevelFromCode(code);
    setValues((v) => ({
      ...v,
      code,
      level:
        v.level === "" && suggestedLevel ? String(suggestedLevel) : v.level,
      // Don't auto-overwrite subject area on edit — admins are fixing
      // existing metadata, not creating from scratch. If the subject was
      // already filled, leave it alone.
      subject_area:
        !v.subject_area.trim() && suggestedDept
          ? suggestedDept
          : v.subject_area,
    }));
  }

  function validate(): boolean {
    const e: Partial<CourseFormValues> = {};
    if (!values.code.trim()) e.code = "Course code is required.";
    if (!values.title.trim()) e.title = "Course title is required.";
    if (!values.subject_area.trim())
      e.subject_area = "Subject area is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 450));
    const levelNum = (parseInt(values.level, 10) || existing.level) as
      | 100
      | 200
      | 300
      | 400;
    updateCourse({
      id: existing.id,
      code: values.code.trim().toUpperCase(),
      title: values.title.trim(),
      subject_area: values.subject_area.trim(),
      level: levelNum,
      // Preserve existing computational flag rather than reset it — admins
      // don't need to control timing, but we shouldn't wipe the default
      // that was inferred when the course was first created.
      is_computational: existing.is_computational,
    });
    setSaving(false);
    onSaved({
      ...existing,
      code: values.code.trim().toUpperCase(),
      title: values.title.trim(),
      subject_area: values.subject_area.trim(),
      level: levelNum,
    });
  }

  const inputBase =
    "w-full h-11 px-4 rounded-xl bg-cream border border-border text-sm font-heading text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 w-full sm:max-w-md bg-cream sm:rounded-3xl rounded-t-3xl shadow-elevated flex flex-col max-h-[92dvh] overflow-hidden">
        {/* Drag pill */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5 pb-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Edit2 className="w-4 h-4" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-text">
                Edit course
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {quizCount} {quizCount === 1 ? "quiz" : "quizzes"} attached
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:bg-surface/70 hover:text-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 min-h-0">
          {/* Code + Level */}
          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper id="c-code" label="Course code" error={errors.code}>
              <input
                id="c-code"
                type="text"
                placeholder="e.g. CSC 122"
                value={values.code}
                onChange={(e) => handleCodeChange(e.target.value)}
                className={inputBase + " uppercase"}
              />
            </FieldWrapper>
            <FieldWrapper id="c-level" label="Level">
              <select
                id="c-level"
                value={values.level}
                onChange={(e) => set("level", e.target.value)}
                className={inputBase + " appearance-none cursor-pointer"}
              >
                <option value="">Select…</option>
                <option value="100">100L</option>
                <option value="200">200L</option>
                <option value="300">300L</option>
                <option value="400">400L</option>
              </select>
            </FieldWrapper>
          </div>
          <FieldWrapper id="c-title" label="Course title" error={errors.title}>
            <input
              id="c-title"
              type="text"
              placeholder="e.g. Introduction to Programming"
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              className={inputBase}
            />
          </FieldWrapper>
          <FieldWrapper
            id="c-subject"
            label="Subject area"
            error={errors.subject_area}
          >
            <input
              id="c-subject"
              type="text"
              placeholder="e.g. Computer Science"
              value={values.subject_area}
              onChange={(e) => set("subject_area", e.target.value)}
              className={inputBase}
            />
          </FieldWrapper>
        </div>
        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border/40 flex items-center gap-2.5 shrink-0">
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1"
            isLoading={saving}
            onClick={handleSave}
          >
            {!saving && <Check className="w-4 h-4" />}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Course row ───────────────────────────────────────────────────────────────

function CourseRow({
  course,
  quizCount,
  onEdit,
}: {
  course: Course;
  quizCount: number;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors">
      <div className="h-9 w-9 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0">
        <BookOpen className="w-4 h-4" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading font-semibold text-sm text-text">
            {course.code}
          </span>
          <Badge variant="muted" size="sm">
            {course.level}L
          </Badge>
          <Badge variant="secondary" size="sm">
            {course.subject_area}
          </Badge>
        </div>
        <p className="text-xs text-text-soft mt-0.5 truncate">{course.title}</p>
      </div>
      <div className="text-right shrink-0 hidden sm:block">
        <p className="font-heading font-semibold text-sm text-text">
          {quizCount}
        </p>
        <p className="text-[10px] text-muted">
          quiz{quizCount !== 1 ? "zes" : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 h-9 px-3 rounded-xl text-xs font-heading font-semibold border border-border/60 bg-cream text-text hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5"
      >
        <Edit2 className="w-3.5 h-3.5" /> Edit
      </button>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <BookOpen className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">
        No courses yet
      </h3>
      <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
        Courses will appear here automatically the first time a creator
        publishes a quiz for one.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminCoursesPage() {
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();
  const [version, setVersion] = useState(0);
  const [activeUniId, setActiveUniId] = useState(universities[0].id);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  const sortedCourses = useMemo(
    () =>
      [...courses]
        .filter((c) => c.university_id === activeUniId)
        .sort((a, b) => a.code.localeCompare(b.code)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version, activeUniId],
  );

  const quizCountMap = useMemo(
    () => {
      const m: Record<string, number> = {};
      courses.forEach((c) => {
        m[c.id] = quizCountForCourse(c.id);
      });
      return m;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  const totalAttachedQuizzes = useMemo(
    () => sortedCourses.reduce((s, c) => s + (quizCountMap[c.id] ?? 0), 0),
    [sortedCourses, quizCountMap],
  );

  function handleSaved(saved: Course) {
    setEditingCourse(undefined);
    setVersion((v) => v + 1);
    showToast({
      message: `${saved.code} has been updated.`,
      variant: "success",
    });
  }

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer className="max-w-290!">
        <div className="space-y-5 lg:space-y-6">
          {/* Header */}
          <div>
            <Badge variant="warning" size="sm" dot className="mb-2">
              <ShieldCheck className="w-3 h-3" />
              Admin
            </Badge>
            <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
              Courses
            </h1>
            <p className="mt-1.5 text-sm text-text-soft max-w-2xl leading-relaxed">
              {sortedCourses.length} course
              {sortedCourses.length !== 1 ? "s" : ""} in the catalogue ·{" "}
              {totalAttachedQuizzes} attached quiz
              {totalAttachedQuizzes !== 1 ? "zes" : ""}. This list grows
              automatically whenever a creator publishes a quiz for a new
              course.
            </p>
          </div>

          {/* University tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-surface/50 border border-border/40 w-fit overflow-x-auto no-scrollbar">
            {universities.map((uni) => {
              const count = courses.filter(
                (c) => c.university_id === uni.id,
              ).length;
              return (
                <button
                  key={uni.id}
                  type="button"
                  onClick={() => setActiveUniId(uni.id)}
                  className={`h-9 px-3.5 rounded-xl text-xs font-heading font-semibold transition-all duration-150 flex items-center gap-1.5 shrink-0 ${
                    activeUniId === uni.id
                      ? "bg-cream shadow-soft text-text"
                      : "text-text-soft hover:text-text"
                  }`}
                >
                  {uni.abbreviation}
                  <span className="inline-flex h-5 min-w-5 px-1 items-center justify-center rounded-full text-[10px] font-bold bg-border text-muted">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-surface/50 border border-border/40">
            <Info
              className="w-4 h-4 text-muted shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-xs text-text-soft leading-relaxed">
              Quiz time limits are set <em>per quiz</em> by the creator — not
              managed here. Courses with quizzes attached can't be deleted; edit
              the metadata instead to keep the catalogue consistent.
            </p>
          </div>

          {/* Course list */}
          <Card padded={false} className="overflow-hidden">
            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 border-b border-border/40 bg-surface/30">
              <div className="w-9 shrink-0" />
              <div className="flex-1 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Course
              </div>
              <div className="w-16 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted text-right">
                Quizzes
              </div>
              <div className="w-16" />
            </div>
            {sortedCourses.length === 0 ? (
              <EmptyState />
            ) : (
              sortedCourses.map((c) => (
                <CourseRow
                  key={c.id}
                  course={c}
                  quizCount={quizCountMap[c.id] ?? 0}
                  onEdit={() => setEditingCourse(c)}
                />
              ))
            )}
          </Card>

          <p className="text-xs text-muted text-right">
            {sortedCourses.length} course{sortedCourses.length !== 1 ? "s" : ""}{" "}
            in catalogue
          </p>
        </div>
      </PageContainer>

      {editingCourse && (
        <CourseEditModal
          existing={editingCourse}
          onClose={() => setEditingCourse(undefined)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
