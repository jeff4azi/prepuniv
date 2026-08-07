/**
 * AdminUniversitiesPage — /admin/universities
 *
 * Manage the list of supported universities used during account creation,
 * course grouping, quiz grouping, and user scoping.
 *
 * Admins can:
 *   - Add a new university
 *   - Edit an existing university's name, abbreviation, and state
 *   - Remove a university (only if no users, courses, or quizzes are linked)
 */
import { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import {
  GraduationCap,
  Edit2,
  Trash2,
  Plus,
  ShieldCheck,
  X,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { FieldWrapper } from "../components/Form";
import { Toast, useToast } from "../components/Toast";
import { useAuth } from "../context/AuthContext";
import {
  universities,
  courses,
  quizzes,
  profiles,
  type University,
} from "../mock";

// ─── Mock mutations ───────────────────────────────────────────────────────────
// The universities array is exported as a mutable reference from mock/universities.ts
// so we can push/splice directly (same pattern as courses/quizzes).

function addUniversity(uni: University): void {
  universities.push(uni);
}

function updateUniversity(updated: University): void {
  const idx = universities.findIndex((u) => u.id === updated.id);
  if (idx !== -1) universities[idx] = updated;
}

function removeUniversity(id: string): void {
  const idx = universities.findIndex((u) => u.id === id);
  if (idx !== -1) universities.splice(idx, 1);
}

// ─── Dependency checks ────────────────────────────────────────────────────────

function universityStats(uniId: string) {
  return {
    users: profiles.filter((p) => p.university_id === uniId).length,
    courses: courses.filter((c) => c.university_id === uniId).length,
    quizzes: quizzes.filter((q) => q.university_id === uniId).length,
  };
}

// ─── Form values ──────────────────────────────────────────────────────────────

interface UniversityFormValues {
  name: string;
  abbreviation: string;
  state: string;
}

const EMPTY_FORM: UniversityFormValues = {
  name: "",
  abbreviation: "",
  state: "",
};

function validate(v: UniversityFormValues): Partial<UniversityFormValues> {
  const e: Partial<UniversityFormValues> = {};
  if (!v.name.trim()) e.name = "Name is required.";
  if (!v.abbreviation.trim()) e.abbreviation = "Abbreviation is required.";
  if (!v.state.trim()) e.state = "State is required.";
  return e;
}

// ─── Add / Edit modal ─────────────────────────────────────────────────────────

function UniversityModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: University;
  onClose: () => void;
  onSaved: (u: University) => void;
}) {
  const isEdit = Boolean(existing);
  const [values, setValues] = useState<UniversityFormValues>(
    existing
      ? {
          name: existing.name,
          abbreviation: existing.abbreviation,
          state: existing.state,
        }
      : EMPTY_FORM,
  );
  const [errors, setErrors] = useState<Partial<UniversityFormValues>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof UniversityFormValues>(k: K, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  }

  async function handleSave() {
    const errs = validate(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const saved: University = {
      id: existing?.id ?? "uni_" + Math.random().toString(36).slice(2, 9),
      name: values.name.trim(),
      abbreviation: values.abbreviation.trim().toUpperCase(),
      state: values.state.trim(),
    };
    if (isEdit) updateUniversity(saved);
    else addUniversity(saved);
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
            <div>
              <h2 className="font-heading font-bold text-base text-text">
                {isEdit ? "Edit university" : "Add university"}
              </h2>
              {isEdit && (
                <p className="text-xs text-muted mt-0.5">
                  {existing!.abbreviation}
                </p>
              )}
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
          <FieldWrapper id="u-name" label="University name" error={errors.name}>
            <input
              id="u-name"
              type="text"
              placeholder="e.g. University of Lagos"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputBase}
            />
          </FieldWrapper>

          <div className="grid grid-cols-2 gap-3">
            <FieldWrapper
              id="u-abbr"
              label="Abbreviation"
              error={errors.abbreviation}
            >
              <input
                id="u-abbr"
                type="text"
                placeholder="e.g. UNILAG"
                value={values.abbreviation}
                onChange={(e) =>
                  set("abbreviation", e.target.value.toUpperCase())
                }
                className={
                  inputBase + " uppercase tracking-wider font-semibold"
                }
              />
            </FieldWrapper>
            <FieldWrapper id="u-state" label="State" error={errors.state}>
              <input
                id="u-state"
                type="text"
                placeholder="e.g. Lagos"
                value={values.state}
                onChange={(e) => set("state", e.target.value)}
                className={inputBase}
              />
            </FieldWrapper>
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
            {!saving && <Check className="w-4 h-4" />}
            {isEdit ? "Save changes" : "Add university"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteConfirm({
  university,
  onConfirm,
  onCancel,
  loading,
}: {
  university: University;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-sm bg-cream rounded-3xl shadow-elevated p-6 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-danger-bg text-danger flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="text-center space-y-1.5">
          <h2 className="font-heading font-bold text-base text-text">
            Remove {university.abbreviation}?
          </h2>
          <p className="text-sm text-text-soft leading-relaxed">
            <span className="font-heading font-semibold text-text">
              {university.name}
            </span>{" "}
            will be removed from the supported universities list. This can't be
            undone.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="ghost"
            size="md"
            className="flex-1"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1 bg-danger! text-cream! hover:bg-danger/90!"
            isLoading={loading}
            onClick={onConfirm}
          >
            {!loading && <Trash2 className="w-4 h-4" />}
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── University row ───────────────────────────────────────────────────────────

function UniversityRow({
  university,
  onEdit,
  onDelete,
}: {
  university: University;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const stats = useMemo(() => universityStats(university.id), [university.id]);
  const canDelete =
    stats.users === 0 && stats.courses === 0 && stats.quizzes === 0;

  return (
    <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30 last:border-0 hover:bg-surface/20 transition-colors">
      {/* Icon */}
      <div className="h-10 w-10 rounded-xl bg-primary/8 text-primary flex items-center justify-center shrink-0">
        <GraduationCap className="w-5 h-5" strokeWidth={2} />
      </div>

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-heading font-bold text-sm text-text">
            {university.name}
          </span>
          <Badge variant="secondary" size="sm">
            {university.abbreviation}
          </Badge>
        </div>
        <p className="text-xs text-text-soft mt-0.5">{university.state}</p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 shrink-0">
        <div className="text-right">
          <p className="font-heading font-semibold text-sm text-text">
            {stats.users}
          </p>
          <p className="text-[10px] text-muted">
            user{stats.users !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading font-semibold text-sm text-text">
            {stats.courses}
          </p>
          <p className="text-[10px] text-muted">
            course{stats.courses !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-heading font-semibold text-sm text-text">
            {stats.quizzes}
          </p>
          <p className="text-[10px] text-muted">
            quiz{stats.quizzes !== 1 ? "zes" : ""}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="h-9 px-3 rounded-xl text-xs font-heading font-semibold border border-border/60 bg-cream text-text hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={!canDelete}
          title={
            canDelete
              ? "Remove this university"
              : "Cannot remove — users, courses, or quizzes are linked to this university"
          }
          className="h-9 w-9 rounded-xl flex items-center justify-center border border-border/60 text-muted hover:border-danger/40 hover:text-danger hover:bg-danger-bg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-border/60 disabled:hover:text-muted disabled:hover:bg-transparent"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-14 px-4">
      <div className="h-14 w-14 rounded-3xl bg-cream border border-border/50 text-muted flex items-center justify-center mb-4 shadow-card">
        <GraduationCap className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="font-heading font-bold text-base text-text">
        No universities yet
      </h3>
      <p className="mt-1.5 text-sm text-text-soft max-w-xs leading-relaxed">
        Add a university to make it available in the account creation dropdown.
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function AdminUniversitiesPage() {
  const { currentUser } = useAuth();
  const [toast, showToast, dismissToast] = useToast();
  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<University | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<University | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [version, setVersion] = useState(0);

  if (currentUser.role !== "admin") return <Navigate to="/home" replace />;

  // Re-derive the list on every version bump so mutations are reflected
  const list = useMemo(
    () => [...universities].sort((a, b) => a.name.localeCompare(b.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  function openAdd() {
    setEditTarget(undefined);
    setModalMode("add");
  }

  function openEdit(u: University) {
    setEditTarget(u);
    setModalMode("edit");
  }

  function handleSaved(saved: University) {
    setModalMode(null);
    setEditTarget(undefined);
    setVersion((v) => v + 1);
    showToast({
      message:
        modalMode === "edit"
          ? `${saved.abbreviation} has been updated.`
          : `${saved.name} added successfully.`,
      variant: "success",
    });
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 450));
    removeUniversity(deleteTarget.id);
    setDeleting(false);
    const name = deleteTarget.abbreviation;
    setDeleteTarget(undefined);
    setVersion((v) => v + 1);
    showToast({ message: `${name} has been removed.` });
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Badge variant="warning" size="sm" dot className="mb-2">
                <ShieldCheck className="w-3 h-3" />
                Admin
              </Badge>
              <h1 className="font-heading text-2xl lg:text-[28px] font-bold text-text tracking-tight leading-tight">
                Universities
              </h1>
              <p className="mt-1.5 text-sm text-text-soft max-w-2xl leading-relaxed">
                {list.length} supported{" "}
                {list.length === 1 ? "university" : "universities"}. This list
                drives the university selector on account creation and scopes
                all courses, quizzes, and users.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={openAdd}
              className="shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add university
            </Button>
          </div>

          {/* Info note */}
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-surface/50 border border-border/40">
            <Info
              className="w-4 h-4 text-muted shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <p className="text-xs text-text-soft leading-relaxed">
              A university can only be removed if it has no linked users,
              courses, or quizzes. Reassign or delete those first if you need to
              remove one. The trash icon is disabled on rows that still have
              dependencies.
            </p>
          </div>

          {/* List */}
          <Card padded={false} className="overflow-hidden">
            {/* Column headers */}
            <div className="hidden sm:flex items-center gap-3 px-5 py-2.5 border-b border-border/40 bg-surface/30">
              <div className="w-10 shrink-0" />
              <div className="flex-1 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                University
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="w-10 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted text-right">
                  Users
                </div>
                <div className="w-14 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted text-right">
                  Courses
                </div>
                <div className="w-12 text-[11px] font-heading font-semibold uppercase tracking-wider text-muted text-right">
                  Quizzes
                </div>
              </div>
              <div className="w-28 shrink-0" />
            </div>

            {list.length === 0 ? (
              <EmptyState />
            ) : (
              list.map((u) => (
                <UniversityRow
                  key={u.id}
                  university={u}
                  onEdit={() => openEdit(u)}
                  onDelete={() => setDeleteTarget(u)}
                />
              ))
            )}
          </Card>

          <p className="text-xs text-muted text-right">
            {list.length} {list.length === 1 ? "university" : "universities"} in
            the system
          </p>
        </div>
      </PageContainer>

      {/* Add / Edit modal */}
      {modalMode && (
        <UniversityModal
          existing={editTarget}
          onClose={() => {
            setModalMode(null);
            setEditTarget(undefined);
          }}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirm
          university={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(undefined)}
          loading={deleting}
        />
      )}
    </>
  );
}
