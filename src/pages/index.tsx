import {
  Rocket,
  Compass,
  Wallet as WalletIcon,
  Clock as ClockIcon,
  Settings as SettingsIcon,
  LayoutDashboard,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  BookOpen,
  ScrollText,
  ListChecks,
  ShieldCheck,
  Library,
  Plus,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { HomePage as RealHomePage } from "./HomePage";
import { BrowsePage as RealBrowsePage } from "./BrowsePage";
import { WalletPage as RealWalletPage } from "./WalletPage";
import { HistoryPage as RealHistoryPage } from "./HistoryPage";
import { SettingsPage as RealSettingsPage } from "./SettingsPage";
import { LibraryPage as RealLibraryPage } from "./LibraryPage";
import { CreatorDashboardPage as RealCreatorDashboardPage } from "./CreatorDashboardPage";
import { CreatorQuizzesPage as RealCreatorQuizzesPage } from "./CreatorQuizzesPage";
import { QuizBuilderPage as RealQuizBuilderPage } from "./QuizBuilderPage";
import { QuizAnalyticsPage as RealQuizAnalyticsPage } from "./QuizAnalyticsPage";
import { CreatorPayoutsPage as RealCreatorPayoutsPage } from "./CreatorPayoutsPage";
import { AdminDashboardPage as RealAdminDashboardPage } from "./AdminDashboardPage";
import { AdminApplicationsPage as RealAdminApplicationsPage } from "./AdminApplicationsPage";
import { AdminPayoutsPage as RealAdminPayoutsPage } from "./AdminPayoutsPage";
import { AdminReportsPage as RealAdminReportsPage } from "./AdminReportsPage";

// suppress "unused" linter warnings for icons still used by placeholder pages
void (ClockIcon, SettingsIcon, WalletIcon);

interface PlaceholderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  tag?: string;
  tagVariant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "muted";
}

export function PlaceholderPage({
  title,
  subtitle,
  icon: Icon,
  tag,
  tagVariant = "primary",
}: PlaceholderProps) {
  const { currentUser, purchasedQuizIds } = useAuth();
  return (
    <PageContainer
      title={title}
      subtitle={
        subtitle ??
        "Coming soon — this page is a placeholder shell while we build."
      }
      rightSlot={
        tag ? (
          <Badge variant={tagVariant} dot>
            {tag}
          </Badge>
        ) : undefined
      }
    >
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center text-center py-12 lg:py-16 px-4">
          <div className="h-20 w-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-6 shadow-card">
            {Icon ? (
              <Icon className="w-10 h-10" strokeWidth={1.9} />
            ) : (
              <Rocket className="w-10 h-10" strokeWidth={1.9} />
            )}
          </div>
          <h2 className="text-xl lg:text-2xl font-heading font-bold text-text tracking-tight">
            {title}
          </h2>
          <p className="mt-2 text-sm lg:text-base text-muted max-w-md">
            This is a routing stub. Full content will be built in a future
            prompt. The nav, shell, and responsive behaviour below are all wired
            up and ready to go.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl text-left">
            <div className="p-4 rounded-2xl bg-surface/40 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                  Current role
                </p>
              </div>
              <p className="font-heading font-semibold text-text capitalize">
                {currentUser.role}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface/40 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                  Purchased
                </p>
              </div>
              <p className="font-heading font-semibold text-text">
                {purchasedQuizIds.length} quizzes
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-surface/40 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                  Approved Creator
                </p>
              </div>
              <p className="font-heading font-semibold text-text">
                {currentUser.is_approved_creator ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline">View docs</Button>
            <Button rightIcon={<Rocket className="w-4 h-4" />}>Let's go</Button>
          </div>

          <p className="mt-10 text-[11px] font-medium text-muted uppercase tracking-widest">
            Tip: use the Dev Role Switcher in the corner to preview all nav
            states
          </p>
        </div>
      </Card>
    </PageContainer>
  );
}

export function HomePage() {
  return <RealHomePage />;
}

export function BrowsePage() {
  return <RealBrowsePage />;
}

export function WalletPage() {
  return <RealWalletPage />;
}

export function HistoryPage() {
  return <RealHistoryPage />;
}

export function SettingsPage() {
  return <RealSettingsPage />;
}

export function LibraryPage() {
  return <RealLibraryPage />;
}

// Creator pages
export function CreatorDashboardPage() {
  return <RealCreatorDashboardPage />;
}

export function CreatorQuizzesPage() {
  return <RealCreatorQuizzesPage />;
}

export function CreatorQuizzesNewPage() {
  return <RealQuizBuilderPage />;
}

export function CreatorQuizEditPage() {
  return <RealQuizBuilderPage />;
}

export function CreatorQuizAnalyticsPage() {
  return <RealQuizAnalyticsPage />;
}

export function CreatorPayoutsPage() {
  return <RealCreatorPayoutsPage />;
}

export function CreatorReportsPage() {
  return <RealCreatorReportsPage />;
}

// Admin pages
export function AdminDashboardPage() {
  return <RealAdminDashboardPage />;
}

export function AdminApplicationsPage() {
  return <RealAdminApplicationsPage />;
}

export function AdminPayoutsPage() {
  return <RealAdminPayoutsPage />;
}

export function AdminReportsPage() {
  return <RealAdminReportsPage />;
}

export function AdminUsersPage() {
  return (
    <PlaceholderPage
      title="User Management"
      subtitle="View, search, and manage all users"
      icon={Users}
      tag="Admin section"
      tagVariant="warning"
    />
  );
}

export function AdminCoursesPage() {
  return (
    <PlaceholderPage
      title="Courses"
      subtitle="Manage the course catalog"
      icon={BookOpen}
      tag="Admin section"
      tagVariant="warning"
    />
  );
}

export function AdminQuizzesPage() {
  return (
    <PlaceholderPage
      title="Quizzes (Admin)"
      subtitle="Moderate and manage all quizzes"
      icon={ScrollText}
      tag="Admin section"
      tagVariant="warning"
    />
  );
}
