/**
 * AdminCoursesPage — /admin/courses
 *
 * View, add, and edit the course/taxonomy catalogue.
 * - Add/edit via modal with name, code, subject area, level, computational toggle
 * - Quiz count per course — guards deletion (no delete if quizzes attached)
 * - Computational flag change shows blast-radius warning when quizzes exist
 */
import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Edit2,
  X,
  ShieldCheck,
  Info,
  AlertCircle,
  Check,
  Calculator,
  Clock,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FieldWrapper } from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  courses,
  addCourse,
  updateCourse,
  quizzes as allQuizzes,
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

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

interface CourseFormValues {
  code: string;
  title: string;
  subject_area: string;
  level: string;
  is_computational: boolean;
}

function CourseModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Course;
  onClose: () => void;
  onSaved: (course: Course) => void;
}) {
  const isEdit = Boolean(existing);
  const quizCount = existing ? quizCountForCourse(existing.id) : 0;

  const [values, setValues] = useState<CourseFormValues>({
    code: existing?.code ?? "",
    title: existing?.title ?? "",
    subject_area: existing?.subject_area ?? "",
    level: existing ? String(existing.level) : "",
    is_computational: existing?.is_computational ?? false,
  });
  const [errors, setErrors] = useState<Partial<CourseFormValues>>({});
  const [saving, setSaving] = useState(false);

  const computationalFlipped =
    isEdit && existing && values.is_computational !== existing.is_computational;

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
      subject_area:
        v.subject_area === "" && suggestedDept ? suggestedDept : v.subject_area,
      level:
        v.level === "" && suggestedLevel ? String(suggestedLevel) : v.level,
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
    await new Promise((r) => setTimeout(r, 500));
    const levelNum = (parseInt(values.level, 10) || 100) as
      | 100
      | 200
      | 300
      | 400;
    const saved: Course = {
      id: existing?.id ?? "course_" + Math.random().toString(36).slice(2, 9),
      code: values.code.trim().toUpperCase(),
      title: values.title.trim(),
      subject_area: values.subject_area.trim(),
      level: levelNum,
      is_computational: values.is_computational,
    };
    if (isEdit) updateCourse(saved);
    else addCourse(saved);
    setSaving(false);
    onSaved(saved);
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
              {isEdit ? (
                <Edit2 className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Plus className="w-4 h-4" strokeWidth={2.2} />
              )}
            </div>
            <h2 className="font-heading font-bold text-base text-text">
              {isEdit ? "Edit course" : "Add course"}
            </h2>
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
          {/* Code + Title */}
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
            hint="Auto-filled from code prefix — edit if needed."
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

          {/* Computational toggle */}
          <div>
            <label
              htmlFor="c-comp"
              className={`flex items-start gap-3 cursor-pointer rounded-2xl border p-4 transition-colors ${
                values.is_computational
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/60 bg-surface/30 hover:border-border hover:bg-surface/50"
              }`}
            >
              <div
                className={`mt-0.5 h-5 w-5 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                  values.is_computational
                    ? "bg-primary border-primary"
                    : "border-border"
                }`}
              >
                {values.is_computational && (
                  <Check className="w-3.5 h-3.5 text-cream" strokeWidth={2.5} />
                )}
              </div>
              <input
                id="c-comp"
                type="checkbox"
                checked={values.is_computational}
                onChange={(e) => set("is_computational", e.target.checked)}
                className="sr-only"
              />
              <div>
                <p className="text-sm font-heading font-semibold text-text leading-tight">
                  Computational course
                </p>
                <p className="text-xs text-text-soft mt-0.5 leading-relaxed">
                  Quizzes in this course use per-question timing in timed mode —
                  suitable for Maths, Physics, Statistics, and similar
                  calculation-heavy subjects.
                </p>
              </div>
            </label>

            {/* Blast-radius warning */}
            {computationalFlipped && quizCount > 0 && (
              <div className="flex items-start gap-2 mt-2 px-3 py-2.5 rounded-xl bg-warning-bg border border-warning/20">
                <AlertCircle
                  className="w-4 h-4 text-warning shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-xs text-warning leading-relaxed">
                  Changing this flag affects timing for{" "}
                  <span className="font-semibold">
                    {quizCount} existing {quizCount === 1 ? "quiz" : "quizzes"}
                  </span>{" "}
                  in this course. The change will apply immediately.
                </p>
              </div>
            )}
          </div>
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
            {!saving &&
              (isEdit ? (
                <Edit2 className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              ))}
            {isEdit ? "Save changes" : "Add course"}
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
          {course.is_computational ? (
            <Badge variant="primary" size="sm">
              <Calculator className="w-3 h-3" />
              Computational
            </Badge>
          ) : (
            <Badge variant="muted" size="sm">
              <Clock className="w-3 h-3" />
              Overall timing
            </Badge>
          )}
        </div>
        <p className="text-xs text-text-soft mt-0.5">{course.title}</p>
        <p className="text-xs text-muted mt-0.5">{course.subject_area}</p>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminCoursesPage() {
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | undefined>();
  const [version, setVersion] = useState(0);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  const sortedCourses = useMemo(
    () => [...courses].sort((a, b) => a.code.localeCompare(b.code)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
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

  function openAdd() {
    setEditingCourse(undefined);
    setModalOpen(true);
  }
  function openEdit(c: Course) {
    setEditingCourse(c);
    setModalOpen(true);
  }

  function handleSaved(saved: Course) {
    setModalOpen(false);
    setVersion((v) => v + 1);
    showToast({
      message: editingCourse
        ? `${saved.code} updated.`
        : `${saved.code} added to the catalogue.`,
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge variant="warning" size="sm" dot className="mb-2">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </Badge>
              <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
                Courses
              </h1>
              <p className="mt-1.5 text-sm text-text-soft max-w-xl leading-relaxed">
                Manage the course catalogue creators choose from when publishing
                a quiz. The{" "}
                <span className="font-semibold text-text">Computational</span>{" "}
                flag controls whether quizzes in that course use per-question
                timing.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={openAdd}
              className="shrink-0 mt-1"
            >
              <Plus className="w-4 h-4" />
              Add Course
            </Button>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-surface/50 border border-border/40">
            <Info
              className="w-4 h-4 text-muted shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-xs text-text-soft leading-relaxed">
              Courses with quizzes attached cannot be deleted — edit them
              instead. Changing the computational flag on a course with attached
              quizzes will affect all those quizzes immediately.
            </p>
          </div>

          {/* Course list */}
          <Card padded={false} className="overflow-hidden">
            {/* Column headers */}
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
            {sortedCourses.map((c) => (
              <CourseRow
                key={c.id}
                course={c}
                quizCount={quizCountMap[c.id] ?? 0}
                onEdit={() => openEdit(c)}
              />
            ))}
          </Card>

          <p className="text-xs text-muted text-right">
            {sortedCourses.length} courses in catalogue
          </p>
        </div>
      </PageContainer>

      {modalOpen && (
        <CourseModal
          existing={editingCourse}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
