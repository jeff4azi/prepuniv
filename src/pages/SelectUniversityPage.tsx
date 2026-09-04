import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "../hooks/usePageTitle";
import { GraduationCap, ArrowRight } from "lucide-react";
import { Button } from "../components/Button";
import { UniversitySelect } from "../components/UniversitySelect";
import { useAuth } from "../context/AuthContext";
import { getDefaultDashboard } from "../lib/routeGuard";
import { fetchUniversities } from "../lib/queries";
import type { University } from "../lib/queries";

export function SelectUniversityPage() {
  const { currentUser, updateProfilePatch, refreshProfile } = useAuth();
  const navigate = useNavigate();

  usePageTitle("Select University");

  const [universities, setUniversities] = useState<University[]>([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUniversities().then(setUniversities);
  }, []);

  // If university_id is (or becomes) set while we're sitting here — e.g.
  // a signup-time selection that was still being saved in the background
  // when RequireAuth first landed us here — move on automatically rather
  // than making the user pick again.
  useEffect(() => {
    if (currentUser.university_id) {
      navigate(getDefaultDashboard(currentUser), { replace: true });
    }
  }, [currentUser, navigate]);

  async function handleConfirm() {
    if (!selected) {
      setError("Please select your university to continue.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: saveErr } = await updateProfilePatch({
      university_id: selected,
    });
    if (saveErr) {
      setError("Failed to save. Please try again.");
      setSaving(false);
      return;
    }
    await refreshProfile();
    navigate(getDefaultDashboard(currentUser), { replace: true });
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        {/* Icon + heading */}
        <div className="text-center space-y-3">
          <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8 text-primary" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl text-text tracking-tight">
              Which university are you at?
            </h1>
            <p className="text-sm text-text-soft mt-2 leading-relaxed">
              PrepUniv shows you quizzes from your own university only. Pick
              yours to get started.
            </p>
          </div>
        </div>

        {/* Selector */}
        <div className="space-y-4">
          <UniversitySelect
            universities={universities}
            value={selected}
            onChange={setSelected}
            label="Your university"
            placeholder="Select your university…"
            error={error ?? undefined}
          />

          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={saving}
            onClick={handleConfirm}
            disabled={!selected || saving}
          >
            {!saving && <ArrowRight className="w-5 h-5" />}
            Continue
          </Button>
        </div>

        <p className="text-center text-xs text-muted leading-relaxed">
          You can change this later in Settings.
        </p>
      </div>
    </div>
  );
}
