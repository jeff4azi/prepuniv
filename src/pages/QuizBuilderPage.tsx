/**
 * QuizBuilderPage — /creator/quizzes/new  and  /creator/quizzes/:id/edit
 *
 * Handles both create and edit flows in a single component.
 * No multi-step wizard — the full form is visible and editable at once.
 */
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
} from "react";
import { useParams, useNavigate, Navigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit2,
  Sparkles,
  Bot,
  Copy,
  Check,
  X,
  AlertCircle,
  Info,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FieldWrapper } from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  quizzes as allQuizzes,
  questions as allQuestions,
  courses as allCourses,
  addQuiz,
  updateQuiz,
  appendQuestionsForQuiz,
  replaceQuestionsForQuiz,
  type Quiz,
  type Question,
  type QuestionType,
} from "../mock";
import {
  COURSE_PREFIX_SUBJECT_AREA,
  suggestLevelFromCode,
} from "../mock/courses";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DraftQuestion {
  localId: string; // client-only stable key
  id?: string; // set for pre-existing questions
  type: QuestionType;
  question_text: string;
  options: string[]; // MCQ only
  correct_answer: string; // MCQ: the option text; fill_blank: pipe-joined
  correct_answers: string[]; // fill_blank working list
}

type EditorMode = "none" | "add" | "edit";

interface QuizDetails {
  title: string;
  course_code: string; // e.g. "CSC 122"
  course_title: string; // e.g. "Introduction to Programming" (optional)
  subject_area: string; // e.g. "Computer Science"
  level: string; // "100" | "200" | "300" | "400" | ""
  price_naira: string; // raw input, validated on save
  description: string;
}

const PRICE_MIN = 50;
const PRICE_MAX = 500;
const LOW_VALUE_THRESHOLD_QUESTIONS = 5;

function makeLocalId() {
  return "local_" + Math.random().toString(36).slice(2, 10);
}

function nairaToKobo(naira: number) {
  return Math.round(naira * 100);
}

function koboToNaira(kobo: number) {
  return kobo / 100;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function QuizBuilderPage() {
  const { id: editId } = useParams<{ id?: string }>();
  const isEdit = Boolean(editId);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();

  // Gate (all hooks must run first)
  const isApproved = currentUser.is_approved_creator;

  // Load existing quiz data for edit mode
  const existingQuiz = useMemo(
    () => (editId ? allQuizzes.find((q) => q.id === editId) : undefined),
    [editId],
  );
  const existingQuestions = useMemo(
    () => (editId ? allQuestions.filter((q) => q.quiz_id === editId) : []),
    [editId],
  );

  // ── Quiz details state ──
  const [details, setDetails] = useState<QuizDetails>(() => {
    const existingCourse = existingQuiz
      ? allCourses.find((c) => c.id === existingQuiz.course_id)
      : undefined;
    return {
      title: existingQuiz?.title ?? "",
      course_code: existingCourse?.code ?? "",
      course_title: existingCourse?.title ?? "",
      subject_area: existingCourse?.subject_area ?? "",
      level: existingCourse ? String(existingCourse.level) : "",
      price_naira: existingQuiz ? String(koboToNaira(existingQuiz.price)) : "",
      description: existingQuiz?.description ?? "",
    };
  });
  const [detailErrors, setDetailErrors] = useState<Partial<QuizDetails>>({});

  // ── Questions state ──
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>(() =>
    existingQuestions.map((q) => ({
      localId: makeLocalId(),
      id: q.id,
      type: q.type,
      question_text: q.question_text,
      options: q.options ?? ["", "", "", ""],
      correct_answer: q.correct_answer,
      correct_answers:
        q.type === "fill_blank"
          ? q.correct_answer.split("|").filter(Boolean)
          : [],
    })),
  );

  // ── Question editor state ──
  const [editorMode, setEditorMode] = useState<EditorMode>("none");
  const [editingLocalId, setEditingLocalId] = useState<string | null>(null);
  const [editorType, setEditorType] = useState<QuestionType>("mcq");
  const [editorText, setEditorText] = useState("");
  const [editorOptions, setEditorOptions] = useState(["", "", "", ""]);
  const [editorCorrect, setEditorCorrect] = useState(""); // MCQ
  const [editorAnswers, setEditorAnswers] = useState<string[]>([]); // fill_blank
  const [editorAnswerInput, setEditorAnswerInput] = useState("");
  const [editorErrors, setEditorErrors] = useState<Record<string, string>>({});

  // ── AI Import modal ──
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // ── Saving state ──
  const [saving, setSaving] = useState(false);

  // ── Validation ──
  const [saveAttempted, setSaveAttempted] = useState(false);

  const priceNaira = parseFloat(details.price_naira);
  const priceValid =
    details.price_naira !== "" &&
    !isNaN(priceNaira) &&
    priceNaira >= PRICE_MIN &&
    priceNaira <= PRICE_MAX;
  const priceOutOfRange =
    details.price_naira !== "" &&
    !isNaN(priceNaira) &&
    (priceNaira < PRICE_MIN || priceNaira > PRICE_MAX);

  const formValid =
    details.title.trim() !== "" &&
    details.course_code.trim() !== "" &&
    priceValid &&
    draftQuestions.length >= 1;

  const lowValueWarning =
    draftQuestions.length > 0 &&
    draftQuestions.length < LOW_VALUE_THRESHOLD_QUESTIONS &&
    priceValid &&
    priceNaira > 200;

  if (!isApproved) return <Navigate to="/creator/apply" replace />;

  // ─── Question editor helpers ──────────────────────────────────────────────

  function openAddEditor() {
    setEditorMode("add");
    setEditingLocalId(null);
    setEditorType("mcq");
    setEditorText("");
    setEditorOptions(["", "", "", ""]);
    setEditorCorrect("");
    setEditorAnswers([]);
    setEditorAnswerInput("");
    setEditorErrors({});
  }

  function openEditEditor(q: DraftQuestion) {
    setEditorMode("edit");
    setEditingLocalId(q.localId);
    setEditorType(q.type);
    setEditorText(q.question_text);
    setEditorOptions(
      q.options.length === 4 ? [...q.options] : ["", "", "", ""],
    );
    setEditorCorrect(q.correct_answer);
    setEditorAnswers([...q.correct_answers]);
    setEditorAnswerInput("");
    setEditorErrors({});
  }

  function closeEditor() {
    setEditorMode("none");
    setEditingLocalId(null);
    setEditorErrors({});
  }

  function validateEditor(): boolean {
    const errs: Record<string, string> = {};
    if (!editorText.trim()) errs.text = "Question text is required.";
    if (editorType === "mcq") {
      editorOptions.forEach((opt, i) => {
        if (!opt.trim())
          errs[`opt_${i}`] =
            `Option ${String.fromCharCode(65 + i)} is required.`;
      });
      if (!editorCorrect) errs.correct = "Select the correct answer.";
      else if (!editorOptions.includes(editorCorrect))
        errs.correct = "Correct answer must match one of the options.";
    } else {
      if (editorAnswers.length === 0)
        errs.answers = "Add at least one acceptable answer.";
    }
    setEditorErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function commitEditor() {
    if (!validateEditor()) return;
    const q: DraftQuestion = {
      localId: editingLocalId ?? makeLocalId(),
      type: editorType,
      question_text: editorText.trim(),
      options: editorType === "mcq" ? editorOptions.map((o) => o.trim()) : [],
      correct_answer:
        editorType === "mcq" ? editorCorrect : editorAnswers.join("|"),
      correct_answers: editorType === "fill_blank" ? editorAnswers : [],
    };
    if (editorMode === "add") {
      setDraftQuestions((prev) => [...prev, q]);
    } else {
      setDraftQuestions((prev) =>
        prev.map((p) => (p.localId === editingLocalId ? q : p)),
      );
    }
    closeEditor();
  }

  function deleteQuestion(localId: string) {
    setDraftQuestions((prev) => prev.filter((q) => q.localId !== localId));
    if (editingLocalId === localId) closeEditor();
  }

  function moveQuestion(localId: string, dir: -1 | 1) {
    setDraftQuestions((prev) => {
      const idx = prev.findIndex((q) => q.localId === localId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function addAnswerChip() {
    const val = editorAnswerInput.trim();
    if (!val) return;
    if (!editorAnswers.includes(val)) {
      setEditorAnswers((prev) => [...prev, val]);
      if (editorErrors.answers) setEditorErrors((e) => ({ ...e, answers: "" }));
    }
    setEditorAnswerInput("");
  }

  function handleAnswerKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addAnswerChip();
    } else if (
      e.key === "Backspace" &&
      editorAnswerInput === "" &&
      editorAnswers.length > 0
    ) {
      setEditorAnswers((prev) => prev.slice(0, -1));
    }
  }

  // ─── Save flow ────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaveAttempted(true);
    if (!formValid) return;
    setSaving(true);

    await new Promise((r) => setTimeout(r, 600));

    const quizId =
      isEdit && editId
        ? editId
        : "quiz_" + Math.random().toString(36).slice(2, 9);
    const now = new Date().toISOString();

    // Resolve or create a matching course_id for this code
    const codeNorm = details.course_code.trim().toUpperCase();
    const levelNum = (parseInt(details.level, 10) || 100) as
      | 100
      | 200
      | 300
      | 400;
    let matchedCourse = allCourses.find(
      (c) => c.code.toUpperCase() === codeNorm,
    );
    if (!matchedCourse) {
      // Create a transient course entry for this new code
      matchedCourse = {
        id: "course_" + Math.random().toString(36).slice(2, 9),
        code: details.course_code.trim(),
        title: details.course_title.trim() || details.course_code.trim(),
        subject_area: details.subject_area.trim() || "General Studies",
        level: levelNum,
        is_computational: false,
      };
      allCourses.push(matchedCourse);
    }

    const savedQuiz: Quiz = {
      id: quizId,
      creator_id: currentUser.id,
      course_id: matchedCourse.id,
      title: details.title.trim(),
      description: details.description.trim(),
      price: nairaToKobo(priceNaira),
      is_published: existingQuiz?.is_published ?? true,
      question_count: draftQuestions.length,
      attempt_count: existingQuiz?.attempt_count ?? 0,
      created_at: existingQuiz?.created_at ?? now,
    };

    const savedQuestions: Question[] = draftQuestions.map((dq, i) => ({
      id: dq.id ?? `${quizId}_q${String(i + 1).padStart(2, "0")}`,
      quiz_id: quizId,
      type: dq.type,
      question_text: dq.question_text,
      options: dq.type === "mcq" ? dq.options : undefined,
      correct_answer: dq.correct_answer,
    }));

    if (isEdit) {
      updateQuiz(savedQuiz);
      replaceQuestionsForQuiz(quizId, savedQuestions);
    } else {
      addQuiz(savedQuiz);
      appendQuestionsForQuiz(savedQuestions);
    }

    setSaving(false);
    showToast({
      message: isEdit
        ? "Quiz updated successfully."
        : "Quiz created and published.",
    });
    setTimeout(() => navigate("/creator/quizzes"), 900);
  }

  // ─── Append questions from AI import ─────────────────────────────────────

  function appendAIQuestions(questions: DraftQuestion[]) {
    setDraftQuestions((prev) => [...prev, ...questions]);
  }

  const courseHint = details.course_code
    ? `${details.course_code}${details.course_title ? ` — ${details.course_title}` : ""}`
    : undefined;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      )}

      <PageContainer className="!max-w-[900px] pb-32">
        <div className="space-y-6">
          {/* ── Page header ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <Link to="/creator/quizzes">
              <button className="h-9 w-9 rounded-xl flex items-center justify-center bg-cream border border-border/50 text-text-soft hover:text-text hover:bg-surface transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="secondary" size="sm" dot>
                  <Sparkles className="w-3 h-3" />
                  Creator mode
                </Badge>
              </div>
              <h1 className="font-heading font-bold text-xl lg:text-2xl text-text tracking-tight leading-tight">
                {isEdit ? "Edit quiz" : "Create new quiz"}
              </h1>
            </div>
          </div>

          {/* ── 1. Quiz Details ───────────────────────────────────────── */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Edit2 className="w-4 h-4" strokeWidth={2} />
              </div>
              <h2 className="font-heading font-bold text-base text-text">
                Quiz details
              </h2>
            </div>
            <div className="space-y-4">
              {/* Title */}
              <FieldWrapper
                id="qb-title"
                label="Title"
                error={
                  saveAttempted && !details.title.trim()
                    ? "Title is required."
                    : undefined
                }
              >
                <input
                  id="qb-title"
                  type="text"
                  placeholder="e.g. CSC 122 — Loops & Arrays Practice"
                  value={details.title}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, title: e.target.value }))
                  }
                  className="w-full h-11 px-4 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text placeholder:text-muted transition-all"
                />
              </FieldWrapper>

              {/* Course Code + Course Title row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrapper
                  id="qb-code"
                  label="Course Code"
                  error={
                    saveAttempted && !details.course_code.trim()
                      ? "Course code is required."
                      : undefined
                  }
                >
                  <input
                    id="qb-code"
                    type="text"
                    placeholder="e.g. CSC 122"
                    value={details.course_code}
                    onChange={(e) => {
                      const code = e.target.value;
                      // Auto-suggest subject area from code prefix
                      const prefix = code.trim().split(/\s+/)[0]?.toUpperCase();
                      const suggestedArea =
                        COURSE_PREFIX_SUBJECT_AREA[prefix] ?? "";
                      // Auto-suggest level from code number
                      const suggestedLevel = suggestLevelFromCode(code);
                      setDetails((d) => ({
                        ...d,
                        course_code: code,
                        subject_area:
                          d.subject_area === "" || suggestedArea
                            ? suggestedArea
                            : d.subject_area,
                        level:
                          d.level === "" && suggestedLevel
                            ? String(suggestedLevel)
                            : d.level,
                      }));
                    }}
                    className="w-full h-11 px-4 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text placeholder:text-muted transition-all uppercase"
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="qb-course-title"
                  label="Course Title (optional)"
                >
                  <input
                    id="qb-course-title"
                    type="text"
                    placeholder="e.g. Introduction to Programming"
                    value={details.course_title}
                    onChange={(e) =>
                      setDetails((d) => ({
                        ...d,
                        course_title: e.target.value,
                      }))
                    }
                    className="w-full h-11 px-4 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text placeholder:text-muted transition-all"
                  />
                </FieldWrapper>
              </div>

              {/* Subject Area + Level + Price row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FieldWrapper
                  id="qb-subject-area"
                  label="Subject Area"
                  hint="Auto-filled from code prefix — edit if needed."
                >
                  <input
                    id="qb-subject-area"
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={details.subject_area}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, subject_area: e.target.value }))
                    }
                    className="w-full h-11 px-4 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text placeholder:text-muted transition-all"
                  />
                </FieldWrapper>

                <FieldWrapper
                  id="qb-level"
                  label="Level"
                  hint="Auto-suggested from code — override if needed."
                >
                  <div className="relative">
                    <select
                      id="qb-level"
                      value={details.level}
                      onChange={(e) =>
                        setDetails((d) => ({ ...d, level: e.target.value }))
                      }
                      className="w-full h-11 px-4 pr-10 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text appearance-none cursor-pointer transition-all"
                    >
                      <option value="">Select level…</option>
                      <option value="100">100L</option>
                      <option value="200">200L</option>
                      <option value="300">300L</option>
                      <option value="400">400L</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  </div>
                </FieldWrapper>

                <FieldWrapper
                  id="qb-price"
                  label="Price (₦)"
                  error={
                    saveAttempted && !priceValid && details.price_naira !== ""
                      ? priceOutOfRange
                        ? `Price must be between ₦${PRICE_MIN} and ₦${PRICE_MAX}.`
                        : "Enter a valid price."
                      : saveAttempted && details.price_naira === ""
                        ? "Price is required."
                        : undefined
                  }
                  hint={
                    priceOutOfRange
                      ? `Must be ₦${PRICE_MIN}–₦${PRICE_MAX}.`
                      : `Range: ₦${PRICE_MIN}–₦${PRICE_MAX} per access`
                  }
                >
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-heading font-semibold text-muted pointer-events-none">
                      ₦
                    </span>
                    <input
                      id="qb-price"
                      type="number"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={1}
                      placeholder={`${PRICE_MIN}–${PRICE_MAX}`}
                      value={details.price_naira}
                      onChange={(e) =>
                        setDetails((d) => ({
                          ...d,
                          price_naira: e.target.value,
                        }))
                      }
                      className={`w-full h-11 pl-8 pr-4 rounded-xl bg-cream border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text placeholder:text-muted transition-all ${priceOutOfRange ? "border-danger/60 focus:ring-danger/30 focus:border-danger" : "border-border"}`}
                    />
                  </div>
                </FieldWrapper>
              </div>

              {/* Description */}
              <FieldWrapper
                id="qb-desc"
                label="Description"
                hint="Shown on the quiz detail page — help buyers understand what they're getting."
              >
                <textarea
                  id="qb-desc"
                  rows={3}
                  placeholder="Describe what this quiz covers, who it's for, and what makes it worth buying…"
                  value={details.description}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, description: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-sm font-heading text-text placeholder:text-muted transition-all resize-none leading-relaxed"
                />
              </FieldWrapper>

              {/* Timing note */}
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-surface/50 border border-border/40">
                <Info
                  className="w-4 h-4 text-muted shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-xs text-text-soft leading-relaxed">
                  <span className="font-semibold text-text">
                    No timer setting here.
                  </span>{" "}
                  Time limits are calculated automatically based on question
                  count and course type when a learner starts the quiz —
                  computational courses (e.g. Maths, Physics, Statistics) get
                  per-question timing; others get an overall time limit.
                </p>
              </div>
            </div>
          </Card>

          {/* ── 2. Question Builder ───────────────────────────────────── */}
          <Card padded={false}>
            {/* Section header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <h2 className="font-heading font-bold text-base text-text">
                  Questions{" "}
                  <span className="text-muted font-normal text-sm">
                    ({draftQuestions.length})
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAiModalOpen(true)}
                  className="h-9 px-3 rounded-xl text-[12px] font-heading font-semibold border border-secondary/30 bg-secondary/8 text-secondary hover:bg-secondary/12 transition-colors flex items-center gap-1.5"
                >
                  <Bot className="w-3.5 h-3.5" />
                  Format with AI
                </button>
                <button
                  onClick={openAddEditor}
                  disabled={editorMode !== "none"}
                  className="h-9 px-3 rounded-xl text-[12px] font-heading font-semibold bg-primary text-cream hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add question
                </button>
              </div>
            </div>

            {/* Validation warning */}
            {saveAttempted && draftQuestions.length === 0 && (
              <div className="mx-5 mt-4 flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-danger-bg border border-danger/25">
                <AlertCircle
                  className="w-4 h-4 text-danger shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-sm font-heading font-medium text-danger">
                  Add at least one question before saving.
                </p>
              </div>
            )}

            {/* Low-value soft warning */}
            {lowValueWarning && (
              <div className="mx-5 mt-4 flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-warning-bg border border-warning/25">
                <AlertCircle
                  className="w-4 h-4 text-warning shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <p className="text-sm font-heading font-medium text-warning">
                  This quiz has only {draftQuestions.length} question
                  {draftQuestions.length !== 1 ? "s" : ""} priced at ₦
                  {priceNaira.toFixed(0)} — consider adding more questions or
                  lowering the price so buyers feel it's fair value.
                </p>
              </div>
            )}

            {/* Question rows */}
            {draftQuestions.length === 0 && editorMode === "none" ? (
              <div className="py-12 flex flex-col items-center text-center px-5">
                <div className="h-14 w-14 rounded-3xl bg-secondary/10 text-secondary flex items-center justify-center mb-3 shadow-card">
                  <Plus className="w-7 h-7" strokeWidth={1.9} />
                </div>
                <p className="font-heading font-semibold text-text mb-1">
                  No questions yet
                </p>
                <p className="text-sm text-text-soft max-w-xs leading-relaxed mb-4">
                  Add questions manually, or paste them into any AI tool with our
                  reformatting prompt to import them in one click.
                </p>
                <button
                  onClick={openAddEditor}
                  className="h-9 px-4 rounded-xl text-sm font-heading font-semibold bg-primary text-cream hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add first question
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {draftQuestions.map((q, idx) => (
                  <QuestionRow
                    key={q.localId}
                    question={q}
                    index={idx}
                    total={draftQuestions.length}
                    isEditing={editingLocalId === q.localId}
                    onEdit={() => openEditEditor(q)}
                    onDelete={() => deleteQuestion(q.localId)}
                    onMoveUp={() => moveQuestion(q.localId, -1)}
                    onMoveDown={() => moveQuestion(q.localId, 1)}
                  />
                ))}
              </div>
            )}

            {/* Inline question editor */}
            {editorMode !== "none" && (
              <div className="border-t border-border/50">
                <QuestionEditor
                  mode={editorMode}
                  type={editorType}
                  text={editorText}
                  options={editorOptions}
                  correct={editorCorrect}
                  answers={editorAnswers}
                  answerInput={editorAnswerInput}
                  errors={editorErrors}
                  onTypeChange={(t) => {
                    setEditorType(t);
                    setEditorErrors({});
                  }}
                  onTextChange={setEditorText}
                  onOptionChange={(i, v) =>
                    setEditorOptions((o) => {
                      const n = [...o];
                      n[i] = v;
                      return n;
                    })
                  }
                  onCorrectChange={setEditorCorrect}
                  onAnswerInputChange={setEditorAnswerInput}
                  onAnswerKeyDown={handleAnswerKeyDown}
                  onAddAnswerChip={addAnswerChip}
                  onRemoveAnswerChip={(a) =>
                    setEditorAnswers((p) => p.filter((x) => x !== a))
                  }
                  onSave={commitEditor}
                  onCancel={closeEditor}
                />
              </div>
            )}
          </Card>
          <div className="hidden lg:block h-5" />
        </div>
      </PageContainer>

      {/* ── Sticky save bar ───────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border/50 safe-bottom lg:pl-65">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {saveAttempted && !formValid && (
              <p className="text-xs text-danger font-heading font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                {!details.title.trim()
                  ? "Title is required."
                  : !details.course_code.trim()
                    ? "Course code is required."
                    : !priceValid
                      ? `Price must be ₦${PRICE_MIN}–₦${PRICE_MAX}.`
                      : "Add at least one question."}
              </p>
            )}
            {!saveAttempted && (
              <p className="text-xs text-text-soft">
                {isEdit
                  ? "Saving will update the live quiz."
                  : "Saving will publish immediately."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/creator/quizzes">
              <Button variant="ghost" size="md">
                Discard
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              isLoading={saving}
              onClick={handleSave}
              disabled={saving}
              className="min-w-[120px]"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Save quiz"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── AI Question Reformat modal ────────────────────────────────────── */}
      {aiModalOpen && (
        <AIImportModal
          courseHint={courseHint}
          onClose={() => setAiModalOpen(false)}
          onAppend={appendAIQuestions}
        />
      )}
    </>
  );
}

// Need ChevronDown for the select
function ChevronDown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── QuestionRow ──────────────────────────────────────────────────────────────

function QuestionRow({
  question,
  index,
  total,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: DraftQuestion;
  index: number;
  total: number;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const preview =
    question.question_text.length > 90
      ? question.question_text.slice(0, 90) + "…"
      : question.question_text;

  return (
    <div
      className={`flex items-center gap-3 px-5 py-3.5 min-h-[56px] transition-colors ${isEditing ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-surface/20"}`}
    >
      {/* Index */}
      <span className="text-[12px] font-heading font-bold text-muted w-6 shrink-0 text-center">
        {index + 1}
      </span>

      {/* Text preview */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-heading text-text leading-snug line-clamp-2">
          {preview || <span className="text-muted italic">No text yet</span>}
        </p>
      </div>

      {/* Type badge */}
      <Badge
        variant={question.type === "mcq" ? "primary" : "secondary"}
        size="sm"
        className="shrink-0 hidden sm:inline-flex"
      >
        {question.type === "mcq" ? "MCQ" : "Fill-in"}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Move up"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-text hover:bg-surface/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Move down"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onEdit}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          aria-label="Edit question"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted hover:text-danger hover:bg-danger-bg transition-colors"
          aria-label="Delete question"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── QuestionEditor (inline form) ────────────────────────────────────────────

function QuestionEditor({
  mode,
  type,
  text,
  options,
  correct,
  answers,
  answerInput,
  errors,
  onTypeChange,
  onTextChange,
  onOptionChange,
  onCorrectChange,
  onAnswerInputChange,
  onAnswerKeyDown,
  onAddAnswerChip,
  onRemoveAnswerChip,
  onSave,
  onCancel,
}: {
  mode: EditorMode;
  type: QuestionType;
  text: string;
  options: string[];
  correct: string;
  answers: string[];
  answerInput: string;
  errors: Record<string, string>;
  onTypeChange: (t: QuestionType) => void;
  onTextChange: (v: string) => void;
  onOptionChange: (i: number, v: string) => void;
  onCorrectChange: (v: string) => void;
  onAnswerInputChange: (v: string) => void;
  onAnswerKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onAddAnswerChip: () => void;
  onRemoveAnswerChip: (a: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const inputBase =
    "w-full h-10 px-3.5 rounded-xl bg-cream border text-sm font-heading text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all";
  const errInput = "border-danger/60 focus:ring-danger/30 focus:border-danger";

  return (
    <div className="px-5 py-5 bg-surface/20 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-heading font-semibold text-text">
          {mode === "add" ? "New question" : "Edit question"}
        </p>
        {/* Type selector */}
        <div className="inline-flex items-center p-0.5 rounded-xl bg-surface/60 border border-border/50 gap-0.5">
          {(["mcq", "fill_blank"] as QuestionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTypeChange(t)}
              className={`h-7 px-3 rounded-lg text-[11px] font-heading font-semibold transition-all duration-150 ${type === t ? "bg-primary text-cream shadow-soft" : "text-text-soft hover:text-text"}`}
            >
              {t === "mcq" ? "MCQ" : "Fill-in-blank"}
            </button>
          ))}
        </div>
      </div>

      {/* Question text */}
      <FieldWrapper id="ed-text" label="Question text" error={errors.text}>
        <textarea
          id="ed-text"
          rows={2}
          placeholder={
            type === "mcq"
              ? "Type the question here…"
              : "Type the question here (the blank is implied — don't use underscores or placeholders)"
          }
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-cream border text-sm font-heading text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none leading-relaxed ${errors.text ? errInput : "border-border"}`}
        />
      </FieldWrapper>

      {type === "mcq" ? (
        /* MCQ: 4 options + correct radio */
        <div className="space-y-3">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
            Answer options
          </p>
          <div className="space-y-2">
            {options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isCorrect = correct === opt && opt.trim() !== "";
              return (
                <div key={i} className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="correct-option"
                    id={`opt-radio-${i}`}
                    checked={isCorrect}
                    onChange={() => onCorrectChange(opt)}
                    disabled={!opt.trim()}
                    className="h-4 w-4 accent-primary shrink-0 cursor-pointer"
                    aria-label={`Mark option ${letter} as correct`}
                  />
                  <label
                    htmlFor={`opt-radio-${i}`}
                    className="text-[12px] font-heading font-bold text-muted w-4 shrink-0"
                  >
                    {letter}
                  </label>
                  <input
                    type="text"
                    placeholder={`Option ${letter}`}
                    value={opt}
                    onChange={(e) => {
                      // if this was the correct option, clear correct when text changes
                      if (correct === opt) onCorrectChange("");
                      onOptionChange(i, e.target.value);
                    }}
                    className={`${inputBase} ${errors[`opt_${i}`] ? errInput : "border-border"} ${isCorrect ? "border-success/50 bg-success/5 focus:ring-success/30" : ""}`}
                  />
                </div>
              );
            })}
          </div>
          {errors.correct && (
            <p className="text-xs text-danger flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-danger inline-block" />
              {errors.correct}
            </p>
          )}
          <p className="text-[11px] text-muted leading-relaxed">
            Click the radio button on the left to mark the correct answer.
          </p>
        </div>
      ) : (
        /* Fill-in-blank: chip input for acceptable answers */
        <div className="space-y-2">
          <FieldWrapper
            id="ed-answers"
            label="Acceptable answers"
            error={errors.answers}
            hint="Answers are matched case-insensitively and ignore extra spaces — no need to list every capitalisation. Press Enter or comma to add each answer."
          >
            <div
              className={`min-h-[42px] flex flex-wrap gap-1.5 px-3 py-2 rounded-xl bg-cream border transition-all focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 ${errors.answers ? errInput : "border-border"}`}
            >
              {answers.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 h-6 px-2.5 rounded-lg bg-primary/12 text-primary text-[12px] font-heading font-semibold"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() => onRemoveAnswerChip(a)}
                    className="text-primary/60 hover:text-primary transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                id="ed-answers"
                placeholder={
                  answers.length === 0
                    ? "Type an answer and press Enter…"
                    : "Add another…"
                }
                value={answerInput}
                onChange={(e) => onAnswerInputChange(e.target.value)}
                onKeyDown={onAnswerKeyDown}
                onBlur={onAddAnswerChip}
                className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-heading text-text placeholder:text-muted h-6"
              />
            </div>
          </FieldWrapper>
        </div>
      )}

      {/* Save / Cancel */}
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-xl text-sm font-heading font-semibold border border-border/60 bg-cream text-text hover:bg-surface transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          className="h-9 px-4 rounded-xl text-sm font-heading font-semibold bg-primary text-cream hover:bg-primary/90 transition-colors"
        >
          {mode === "add" ? "Add question" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

// ─── AI Question Reformat Modal ──────────────────────────────────────────────

const AI_PROMPT_TEMPLATE = (
  course: string,
) => `You are a data formatter / extractor for PrepUniv — a quiz marketplace.
Target course: ${course}

I have already written the questions myself (below) — I do NOT need you to create or invent any new questions.
Your ONLY job is to RE-FORMAT my existing question list into the strict JSON schema shown below.

Rules for extraction / formatting:
1. PRESERVE EVERY QUESTION I PROVIDED — do not skip, merge, paraphrase, rewrite, or invent questions. If I gave 12 questions, output exactly 12 objects.
2. Extract verbatim question text, options (for MCQ), and correct answer. Minor typo fixes are allowed ONLY if obvious.
3. For each question, decide the type:
   - "mcq" → if it has multiple-choice / lettered options (A/B/C/D, a./b./c./d., numbered options, bullet options, etc.)
   - "fill_blank" → if it's a short-answer, word blank, complete-the-sentence, one-word, short-phrase answer question
4. correct_answer for MCQ must be the EXACT option text (NOT just the letter/number), and it must be a string that appears in the options array. If the original only marked a letter like "B)", copy the FULL text of option B into both correct_answer and the options list.
5. correct_answer for fill_blank is ALWAYS pipe-separated to include every reasonable acceptable variant (lowercase / Capitalized / UPPERCASE / abbreviations / plural forms / common lenient misspellings). Even if only one answer seems intended, list case variants so students aren't penalized for capitalization. Format: "answer|Answer|ANSWER|abbr"
6. Use _____ (5 underscores) inside fill_blank question_text to show where the answer goes (if the original didn't mark a blank, rephrase tactfully to insert _____ at the natural slot — but keep wording identical otherwise).
7. Output ONLY a raw JSON array. No explanations. No headings. No text before or after the array. No code fences. No markdown.

EXACT schema per object:

MCQ question:
{
  "type": "mcq",
  "question_text": "The full question text here?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": "Option B"
}

Fill-in-the-blank question:
{
  "type": "fill_blank",
  "question_text": "The unit of force is the _____ (named after a famous physicist).",
  "correct_answer": "newton|Newton|N|newtons|Newtons"
}

Example valid output (so you see the TARGET format only — DO NOT include these in my output):
[
  {
    "type": "mcq",
    "question_text": "What is the output of: print(2 ** 3)?",
    "options": ["6", "8", "9", "12"],
    "correct_answer": "8"
  },
  {
    "type": "fill_blank",
    "question_text": "In Python, a function is defined using the _____ keyword.",
    "correct_answer": "def|Def|DEF"
  },
  {
    "type": "fill_blank",
    "question_text": "The _____ data structure stores key-value pairs in Python.",
    "correct_answer": "dictionary|dict|Dictionary|Dict|DICT"
  }
]

— END OF INSTRUCTIONS —

Here are MY questions to be re-formatted (NOT generated). Process every question below exactly as written:
[PASTE YOUR DOCUMENT / QUESTION LIST HERE]`;

type AIStep = "prompt" | "paste";

interface ParsedPreview {
  ok: true;
  questions: DraftQuestion[];
}
interface ParsedError {
  ok: false;
  errors: string[];
}
type ParseResult = ParsedPreview | ParsedError;

function parseAIJson(raw: string): ParseResult {
  let parsed: unknown;
  try {
    // Handle code-fenced responses from AI tools
    const stripped = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/, "")
      .trim();
    parsed = JSON.parse(stripped);
  } catch {
    return {
      ok: false,
      errors: [
        "Invalid JSON — make sure you pasted the full JSON output returned by the AI (not just your raw questions).",
      ],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      errors: [
        "Expected a JSON array at the top level, but got something else.",
      ],
    };
  }

  const questions: DraftQuestion[] = [];
  const errors: string[] = [];

  (parsed as unknown[]).forEach((item, i) => {
    const n = i + 1;
    if (typeof item !== "object" || item === null) {
      errors.push(`Question ${n}: not an object.`);
      return;
    }
    const q = item as Record<string, unknown>;

    if (q.type !== "mcq" && q.type !== "fill_blank") {
      errors.push(
        `Question ${n}: "type" must be "mcq" or "fill_blank", got "${String(q.type)}".`,
      );
      return;
    }
    if (typeof q.question_text !== "string" || !q.question_text.trim()) {
      errors.push(`Question ${n}: missing or empty "question_text".`);
      return;
    }
    if (typeof q.correct_answer !== "string" || !q.correct_answer.trim()) {
      errors.push(`Question ${n}: missing or empty "correct_answer".`);
      return;
    }

    if (q.type === "mcq") {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        errors.push(
          `Question ${n}: "options" must be an array of at least 2 strings.`,
        );
        return;
      }
      const opts = (q.options as unknown[]).map(String);
      if (!opts.includes(q.correct_answer as string)) {
        errors.push(
          `Question ${n}: "correct_answer" ("${q.correct_answer}") does not match any option.`,
        );
        return;
      }
      // Pad/trim to 4 options
      const padded = [...opts, "", "", "", ""].slice(
        0,
        Math.max(opts.length, 4),
      );
      questions.push({
        localId: makeLocalId(),
        type: "mcq",
        question_text: (q.question_text as string).trim(),
        options: padded,
        correct_answer: q.correct_answer as string,
        correct_answers: [],
      });
    } else {
      const parts = (q.correct_answer as string)
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
      if (parts.length === 0) {
        errors.push(
          `Question ${n}: "correct_answer" for fill_blank is empty after parsing.`,
        );
        return;
      }
      questions.push({
        localId: makeLocalId(),
        type: "fill_blank",
        question_text: (q.question_text as string).trim(),
        options: [],
        correct_answer: q.correct_answer as string,
        correct_answers: parts,
      });
    }
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, questions };
}

function AIImportModal({
  courseHint,
  onClose,
  onAppend,
}: {
  courseHint?: string;
  onClose: () => void;
  onAppend: (qs: DraftQuestion[]) => void;
}) {
  const [step, setStep] = useState<AIStep>("prompt");
  const [copied, setCopied] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsed, setParsed] = useState(false);

  const promptText = AI_PROMPT_TEMPLATE(courseHint ?? "the selected course");

  // Close on Escape
  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", h);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleCopy() {
    navigator.clipboard.writeText(promptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  function handleParse() {
    const result = parseAIJson(pasteValue);
    setParseResult(result);
    setParsed(true);
  }

  function handleAppend() {
    if (!parseResult?.ok) return;
    onAppend(parseResult.questions);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet / Dialog */}
      <div className="relative z-10 w-full sm:max-w-xl bg-cream rounded-t-3xl sm:rounded-3xl shadow-elevated flex flex-col max-h-[92dvh]">
        {/* Drag pill (mobile) */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 flex items-center justify-between border-b border-border/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-secondary/12 text-secondary flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-text leading-tight">
                AI Question Reformat
              </h2>
              <p className="text-[11px] text-muted mt-0.5">
                Turn your written question list into PrepUniv JSON format
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step tabs */}
        <div className="px-5 sm:px-6 pt-3 pb-0 flex gap-2 shrink-0">
          <button
            onClick={() => setStep("prompt")}
            className={`h-8 px-3.5 rounded-xl text-[12px] font-heading font-semibold transition-all border ${step === "prompt" ? "bg-primary text-cream border-primary" : "bg-cream border-border/50 text-text-soft hover:text-text"}`}
          >
            1 · Copy prompt
          </button>
          <button
            onClick={() => setStep("paste")}
            className={`h-8 px-3.5 rounded-xl text-[12px] font-heading font-semibold transition-all border ${step === "paste" ? "bg-primary text-cream border-primary" : "bg-cream border-border/50 text-text-soft hover:text-text"}`}
          >
            2 · Paste JSON
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 min-h-0">
          {step === "prompt" ? (
            <>
              <p className="text-sm text-text-soft leading-relaxed">
                Copy the reformatting prompt below, paste it into{" "}
                <span className="font-semibold text-text">
                  ChatGPT, Claude, Gemini
                </span>
                , or any AI tool — then also paste your{" "}
                <span className="font-semibold text-text">
                  existing question list
                </span>{" "}
                (typed notes, pasted textbook questions, etc.) at the very end.
                The AI will return a JSON array — bring it back here into Step 2.
              </p>

              <div className="rounded-2xl bg-surface/60 border border-border/50 overflow-hidden">
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/40 bg-surface/80">
                  <span className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                    AI Prompt
                  </span>
                  <button
                    onClick={handleCopy}
                    className={`h-7 px-3 rounded-lg text-[11px] font-heading font-semibold flex items-center gap-1.5 transition-all ${copied ? "bg-success/15 text-success border border-success/30" : "bg-cream border border-border/60 text-text hover:bg-surface"}`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy prompt
                      </>
                    )}
                  </button>
                </div>
                <pre className="px-4 py-3 text-[11px] text-text-soft font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                  {promptText}
                </pre>
              </div>

              <button
                onClick={() => setStep("paste")}
                className="w-full h-10 rounded-2xl bg-primary text-cream text-sm font-heading font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                AI returned JSON — paste it
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-text-soft leading-relaxed">
                The AI returned a JSON array containing your reformatted
                questions. Paste it below, then click{" "}
                <span className="font-semibold text-text">
                  Parse &amp; Preview
                </span>{" "}
                to check everything before adding them to your quiz.
              </p>

              <FieldWrapper id="ai-paste" label="Paste the AI's JSON output here">
                <textarea
                  id="ai-paste"
                  rows={7}
                  placeholder={
                    '[\n  {\n    "type": "mcq",\n    "question_text": "…",\n    "options": ["A","B","C","D"],\n    "correct_answer": "A"\n  }\n]'
                  }
                  value={pasteValue}
                  onChange={(e) => {
                    setPasteValue(e.target.value);
                    setParsed(false);
                    setParseResult(null);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-cream border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-[12px] font-mono text-text placeholder:text-muted/60 transition-all resize-none leading-relaxed"
                />
              </FieldWrapper>

              <button
                onClick={handleParse}
                disabled={!pasteValue.trim()}
                className="w-full h-10 rounded-2xl bg-secondary text-cream text-sm font-heading font-semibold flex items-center justify-center gap-2 hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Loader2 className="w-4 h-4" />
                Parse &amp; preview
              </button>

              {/* Parse results */}
              {parsed &&
                parseResult &&
                (parseResult.ok ? (
                  <div className="rounded-2xl border border-success/25 bg-success/8 overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center gap-2 border-b border-success/15 bg-success/5">
                      <CheckCircle2
                        className="w-4 h-4 text-success shrink-0"
                        strokeWidth={2.2}
                      />
                      <p className="text-sm font-heading font-semibold text-success">
                        {parseResult.questions.length} reformatted question
                        {parseResult.questions.length !== 1 ? "s" : ""} ready
                        to add
                      </p>
                    </div>
                    <ul className="divide-y divide-success/10 max-h-48 overflow-y-auto">
                      {parseResult.questions.map((q, i) => (
                        <li
                          key={q.localId}
                          className="px-4 py-2.5 flex items-start gap-2.5"
                        >
                          <span className="text-[11px] font-heading font-bold text-muted w-5 shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="flex-1 text-[12px] text-text leading-snug line-clamp-2">
                            {q.question_text}
                          </p>
                          <Badge
                            variant={q.type === "mcq" ? "primary" : "secondary"}
                            size="sm"
                            className="shrink-0"
                          >
                            {q.type === "mcq" ? "MCQ" : "Fill-in"}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-danger/25 bg-danger-bg/30 overflow-hidden">
                    <div className="px-4 py-2.5 flex items-center gap-2 border-b border-danger/15">
                      <AlertCircle
                        className="w-4 h-4 text-danger shrink-0"
                        strokeWidth={2}
                      />
                      <p className="text-sm font-heading font-semibold text-danger">
                        {parseResult.errors.length} problem
                        {parseResult.errors.length !== 1 ? "s" : ""} found
                      </p>
                    </div>
                    <ul className="divide-y divide-danger/10 max-h-40 overflow-y-auto">
                      {parseResult.errors.map((err, i) => (
                        <li
                          key={i}
                          className="px-4 py-2 text-[12px] text-danger leading-snug"
                        >
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-border/40 shrink-0 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="h-10 px-4 rounded-2xl border border-border/60 bg-surface/40 text-sm font-heading font-semibold text-text hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          {step === "paste" && (
            <button
              onClick={handleAppend}
              disabled={!parsed || !parseResult?.ok}
              className="h-10 px-5 rounded-2xl bg-primary text-cream text-sm font-heading font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add these to my quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
