import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import {
  Sidebar,
  TopBar,
  BottomNav,
  MenuSheet,
} from './components/Navigation';
import { DevRoleSwitcher } from './components/DevRoleSwitcher';
import {
  HomePage,
  BrowsePage,
  WalletPage,
  HistoryPage,
  SettingsPage,
  MenuPage,
  CreatorDashboardPage,
  CreatorQuizzesPage,
  CreatorPayoutsPage,
  CreatorReportsPage,
  AdminDashboardPage,
  AdminApplicationsPage,
  AdminPayoutsPage,
  AdminReportsPage,
  AdminUsersPage,
  AdminCoursesPage,
  AdminQuizzesPage,
} from './pages';
import { useEffect } from 'react';

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [display, setDisplay] = useState(children);
  const [phase, setPhase] = useState<'idle' | 'enter'>('idle');

  useEffect(() => {
    setPhase('idle');
    const t1 = setTimeout(() => {
      setDisplay(children);
      setPhase('enter');
    }, 80);
    return () => clearTimeout(t1);
  }, [location.pathname, children]);

  return (
    <div
      className={`transition-all duration-200 ease-out ${
        phase === 'idle' ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
      }`}
    >
      {display}
    </div>
  );
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-background text-text flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:min-h-screen">
        <TopBar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1 w-full pb-24 lg:pb-0">
          <PageTransition>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/menu" element={<MenuPage />} />

              <Route path="/creator" element={<CreatorDashboardPage />} />
              <Route path="/creator/quizzes" element={<CreatorQuizzesPage />} />
              <Route path="/creator/payouts" element={<CreatorPayoutsPage />} />
              <Route path="/creator/reports" element={<CreatorReportsPage />} />

              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/applications" element={<AdminApplicationsPage />} />
              <Route path="/admin/payouts" element={<AdminPayoutsPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/courses" element={<AdminCoursesPage />} />
              <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />

              <Route path="*" element={<HomePage />} />
            </Routes>
          </PageTransition>
        </main>
        <BottomNav />
      </div>

      <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
      <DevRoleSwitcher />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
