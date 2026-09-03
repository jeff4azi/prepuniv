import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { NetworkProvider, useNetwork } from "./context/NetworkContext";
import { ConnectionLostPage } from "./pages/ConnectionLostPage";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, IfLoggedOut } from "./lib/routeGuard";
import { Sidebar, TopBar, BottomNav } from "./components/Navigation";
import { AccountSheet } from "./components/AccountMenu";
import { TermsPage } from "./pages/TermsPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import {
  HomePage,
  BrowsePage,
  WalletPage,
  HistoryPage,
  SettingsPage,
  LibraryPage,
  NotificationsPage,
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
  AdminNotificationsPage,
} from "./pages";
import { AdminQuizContentPage } from "./pages/AdminQuizContentPage";
import { AccountSuspendedPage } from "./pages/AccountSuspendedPage";
import { LandingPage } from "./pages/LandingPage";
import { SignupPage } from "./pages/SignupPage";
import { LoginPage } from "./pages/LoginPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ConfirmEmailPage } from "./pages/ConfirmEmailPage";
import { CreatorAgreementPage } from "./pages/CreatorAgreementPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { QuizDetailPage } from "./pages/QuizDetailPage";
import { AttemptPage } from "./pages/AttemptPage";
import { AttemptResultPage } from "./pages/AttemptResultPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { CreatorApplyPage } from "./pages/CreatorApplyPage";
import { CreatorProfilePage } from "./pages/CreatorProfilePage";
import { SelectUniversityPage } from "./pages/SelectUniversityPage";
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
              <Route
                path="/home"
                element={
                  <RequireAuth>
                    <HomePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/browse"
                element={
                  <RequireAuth>
                    <BrowsePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/library"
                element={
                  <RequireAuth>
                    <LibraryPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/wallet"
                element={
                  <RequireAuth>
                    <WalletPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/history"
                element={
                  <RequireAuth>
                    <HistoryPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <SettingsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/notifications"
                element={
                  <RequireAuth>
                    <NotificationsPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/select-university"
                element={
                  <RequireAuth>
                    <SelectUniversityPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/quiz/:id"
                element={
                  <RequireAuth>
                    <QuizDetailPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/quiz/:id/leaderboard"
                element={
                  <RequireAuth>
                    <LeaderboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile/creator/:id"
                element={
                  <RequireAuth>
                    <CreatorProfilePage />
                  </RequireAuth>
                }
              />

              <Route
                path="/creator"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/apply"
                element={
                  <RequireAuth>
                    <CreatorApplyPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/agreement"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorAgreementPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/quizzes"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorQuizzesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/quizzes/new"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorQuizzesNewPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/quizzes/:id/edit"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorQuizEditPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/quizzes/:id/analytics"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorQuizAnalyticsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/payouts"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorPayoutsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/creator/reports"
                element={
                  <RequireAuth role="approvedCreator">
                    <CreatorReportsPage />
                  </RequireAuth>
                }
              />

              <Route
                path="/admin"
                element={
                  <RequireAuth role="admin">
                    <AdminDashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <RequireAuth role="admin">
                    <AdminApplicationsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/payouts"
                element={
                  <RequireAuth role="admin">
                    <AdminPayoutsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <RequireAuth role="admin">
                    <AdminReportsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RequireAuth role="admin">
                    <AdminUsersPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <RequireAuth role="admin">
                    <AdminCoursesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/quizzes"
                element={
                  <RequireAuth role="admin">
                    <AdminQuizzesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/universities"
                element={
                  <RequireAuth role="admin">
                    <AdminUniversitiesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/notifications"
                element={
                  <RequireAuth role="admin">
                    <AdminNotificationsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/quizzes/:id/content"
                element={
                  <RequireAuth role="admin">
                    <AdminQuizContentPage />
                  </RequireAuth>
                }
              />
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
    </div>
  );
}
function AttemptShell() {
  return (
    <Routes>
      <Route
        path="/attempt/:id"
        element={
          <RequireAuth>
            <AttemptPage />
          </RequireAuth>
        }
      />
      <Route
        path="/attempt/:id/result"
        element={
          <RequireAuth>
            <AttemptResultPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

function OfflineBoundary({ children }: { children: React.ReactNode }) {
  const { isOnline } = useNetwork();
  const location = useLocation();

  if (location.pathname === "/connection-lost") {
    return <ConnectionLostPage />;
  }

  if (!isOnline) {
    return <ConnectionLostPage />;
  }

  return <>{children}</>;
}

function PublicRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <IfLoggedOut>
            <LandingPage />
          </IfLoggedOut>
        }
      />
      <Route
        path="/login"
        element={
          <IfLoggedOut>
            <LoginPage />
          </IfLoggedOut>
        }
      />
      <Route
        path="/signup"
        element={
          <IfLoggedOut>
            <SignupPage />
          </IfLoggedOut>
        }
      />
      <Route
        path="/apply-creator"
        element={<Navigate to="/creator/apply" replace />}
      />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/confirm-email" element={<ConfirmEmailPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/account-suspended" element={<AccountSuspendedPage />} />
      <Route path="/connection-lost" element={<ConnectionLostPage />} />
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
    "/confirm-email",
    "/terms",
    "/privacy",
    "/terms/",
    "/privacy/",
    "/account-suspended",
    "/connection-lost",
  ];
  const isPublic = publicPaths.includes(loc.pathname);
  const isAttempt = /^\/attempt\//.test(loc.pathname);

  // Known app-shell paths — anything else is a 404, rendered shell-free
  const isAppPath =
    /^\/(home|browse|library|wallet|history|settings|notifications|quiz|profile|creator|admin|select-university)/.test(
      loc.pathname,
    );

  if (isPublic) return <PublicRoutes />;
  if (isAttempt) return <AttemptShell />;
  if (isAppPath) return <AppShell />;
  return <NotFoundPage />;
}

export function App() {
  return (
    <BrowserRouter>
      <NetworkProvider>
        <AuthProvider>
          <OfflineBoundary>
            <RoutingSwitch />
          </OfflineBoundary>
        </AuthProvider>
      </NetworkProvider>
    </BrowserRouter>
  );
}

export default App;
