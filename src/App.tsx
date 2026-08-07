import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Sidebar, TopBar, BottomNav } from "./components/Navigation";
import { AccountSheet } from "./components/AccountMenu";
import { DevRoleSwitcher } from "./components/DevRoleSwitcher";
import {
  HomePage,
  BrowsePage,
  WalletPage,
  HistoryPage,
  SettingsPage,
  LibraryPage,
  CreatorDashboardPage,
  CreatorQuizzesPage,
  CreatorQuizzesNewPage,
  CreatorQuizEditPage,
  CreatorQuizAnalyticsPage,
  CreatorPayoutsPage,
  CreatorReportsPage,
  AdminDashboardPage,
  AdminApplicationsPage,
  AdminPayoutsPage,
  AdminReportsPage,
  AdminUsersPage,
  AdminCoursesPage,
  AdminQuizzesPage,
  AdminUniversitiesPage,
} from "./pages";
import { LandingPage } from "./pages/LandingPage";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { QuizDetailPage } from "./pages/QuizDetailPage";
import { AttemptPage } from "./pages/AttemptPage";
import { AttemptResultPage } from "./pages/AttemptResultPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { CreatorApplyPage } from "./pages/CreatorApplyPage";
import { CreatorProfilePage } from "./pages/CreatorProfilePage";
import { useEffect } from "react";

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [display, setDisplay] = useState(children);
  const [phase, setPhase] = useState<"idle" | "enter">("idle");

  useEffect(() => {
    setPhase("idle");
    const t1 = setTimeout(() => {
      setDisplay(children);
      setPhase("enter");
    }, 80);
    return () => clearTimeout(t1);
  }, [location.pathname, children]);

  return (
    <div
      className={`relative transition-all duration-200 ease-out ${
        phase === "idle" ? "opacity-0" : "opacity-100"
      }`}
      style={{ top: phase === "idle" ? "4px" : "0" }}
    >
      {display}
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function AppShell() {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <div className="min-h-dvh w-full bg-background text-text flex">
      <ScrollToTop />
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:min-h-screen">
        <TopBar onOpenAccountMenu={() => setAccountMenuOpen(true)} />
        <main className="flex-1 w-full pb-24 lg:pb-0">
          <PageTransition>
            <Routes>
              <Route path="/home" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />

              <Route path="/quiz/:id" element={<QuizDetailPage />} />
              <Route
                path="/quiz/:id/leaderboard"
                element={<LeaderboardPage />}
              />
              <Route
                path="/profile/creator/:id"
                element={<CreatorProfilePage />}
              />

              <Route path="/creator" element={<CreatorDashboardPage />} />
              <Route path="/creator/apply" element={<CreatorApplyPage />} />
              <Route path="/creator/quizzes" element={<CreatorQuizzesPage />} />
              <Route
                path="/creator/quizzes/new"
                element={<CreatorQuizzesNewPage />}
              />
              <Route
                path="/creator/quizzes/:id/edit"
                element={<CreatorQuizEditPage />}
              />
              <Route
                path="/creator/quizzes/:id/analytics"
                element={<CreatorQuizAnalyticsPage />}
              />
              <Route path="/creator/payouts" element={<CreatorPayoutsPage />} />
              <Route path="/creator/reports" element={<CreatorReportsPage />} />

              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route
                path="/admin/applications"
                element={<AdminApplicationsPage />}
              />
              <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/courses" element={<AdminCoursesPage />} />
              <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />
              <Route
                path="/admin/universities"
                element={<AdminUniversitiesPage />}
              />

              <Route path="*" element={<HomePage />} />
            </Routes>
          </PageTransition>
        </main>
        <BottomNav onOpenAccountMenu={() => setAccountMenuOpen(true)} />
      </div>

      {/* Single unified Account Menu sheet (mobile only; desktop uses the sidebar popover) */}
      <AccountSheet
        open={accountMenuOpen}
        onClose={() => setAccountMenuOpen(false)}
      />
      <DevRoleSwitcher />
    </div>
  );
}

/** Attempt routes render full-screen — no sidebar, topbar, or bottom nav. */
function AttemptShell() {
  return (
    <Routes>
      <Route path="/attempt/:id" element={<AttemptPage />} />
      <Route path="/attempt/:id/result" element={<AttemptResultPage />} />
    </Routes>
  );
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/apply-creator"
        element={<Navigate to="/creator/apply" replace />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  );
}

function RoutingSwitch() {
  const loc = useLocation();

  const publicPaths = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];
  const isPublic = publicPaths.includes(loc.pathname);
  const isAttempt = /^\/attempt\//.test(loc.pathname);

  if (isPublic) return <PublicRoutes />;
  if (isAttempt) return <AttemptShell />;
  return <AppShell />;
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RoutingSwitch />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
