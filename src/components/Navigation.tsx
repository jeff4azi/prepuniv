import { useEffect, useRef, useState } from "react";
import {
  Home,
  Search,
  Wallet,
  Clock,
  Menu,
  Settings,
  LayoutDashboard,
  FileText,
  CreditCard,
  BarChart3,
  Users,
  BookOpen,
  ScrollText,
  ShieldCheck,
  ListChecks,
  Sparkles,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../mock";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";
import { AccountSheet, AccountPopover } from "./AccountMenu";

// ─── Types & shared data ──────────────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const USER_NAV: NavItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/browse", label: "Browse", icon: Search },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/history", label: "History", icon: Clock },
  { to: "/settings", label: "Settings", icon: Settings },
];

const CREATOR_NAV: NavItem[] = [
  {
    to: "/creator",
    label: "Creator Dashboard",
    icon: LayoutDashboard,
    roles: ["creator", "admin"],
  },
  {
    to: "/creator/quizzes",
    label: "My Quizzes",
    icon: FileText,
    roles: ["creator", "admin"],
  },
  {
    to: "/creator/payouts",
    label: "Payouts",
    icon: CreditCard,
    roles: ["creator", "admin"],
  },
  {
    to: "/creator/reports",
    label: "Reports",
    icon: BarChart3,
    roles: ["creator", "admin"],
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    to: "/admin",
    label: "Admin Dashboard",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    to: "/admin/applications",
    label: "Applications",
    icon: ListChecks,
    roles: ["admin"],
  },
  {
    to: "/admin/payouts",
    label: "Payouts",
    icon: CreditCard,
    roles: ["admin"],
  },
  { to: "/admin/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  { to: "/admin/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/admin/courses", label: "Courses", icon: BookOpen, roles: ["admin"] },
  {
    to: "/admin/quizzes",
    label: "Quizzes",
    icon: ScrollText,
    roles: ["admin"],
  },
];

// The 4 primary tabs always visible in the mobile bottom nav
const MOBILE_TABS: NavItem[] = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/browse", label: "Browse", icon: Search },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/history", label: "History", icon: Clock },
];

const ROLE_LABELS: Record<
  UserRole,
  { label: string; variant: "primary" | "secondary" | "warning" }
> = {
  user: { label: "Learner", variant: "primary" },
  creator: { label: "Creator", variant: "secondary" },
  admin: { label: "Admin", variant: "warning" },
};

function formatNaira(n: number) {
  const kobo = Math.abs(n);
  const base =
    "₦" + (kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 });
  return n < 0 ? "-" + base : base;
}

function filterByRole(
  items: NavItem[],
  role: UserRole,
  isApprovedCreator: boolean,
) {
  return items.filter((item) => {
    if (!item.roles) return true;
    if (item.roles.includes(role)) {
      if (item.roles.includes("creator") && role === "user")
        return isApprovedCreator;
      return true;
    }
    if (role === "user" && isApprovedCreator && item.roles.includes("creator"))
      return true;
    return false;
  });
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { currentUser, walletBalance } = useAuth();
  const role = currentUser.role;
  const isApproved = currentUser.is_approved_creator;

  const userNav = USER_NAV.filter((i) => !i.roles || i.roles.includes(role));
  const creatorNav = filterByRole(CREATOR_NAV, role, isApproved);
  const adminNav = filterByRole(ADMIN_NAV, role, isApproved);

  // Popover state
  const [popoverOpen, setPopoverOpen] = useState(false);
  const userCardRef = useRef<HTMLButtonElement>(null);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group flex items-center gap-3 h-11 px-3.5 rounded-2xl text-sm font-heading font-medium transition-all duration-150 ${
      isActive
        ? "bg-primary text-cream shadow-soft"
        : "text-text-soft hover:bg-surface/70 hover:text-text"
    }`;

  return (
    <aside className="hidden lg:flex lg:flex-col w-65 shrink-0 h-screen sticky top-0 bg-surface/80 backdrop-blur-xl border-r border-border/50">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 flex items-center gap-2.5">
        <img
          src={new URL("../assets/prepUniv.png", import.meta.url).href}
          alt="PrepUniv"
          className="h-8 w-8 rounded-xl object-contain"
        />
        <span className="font-heading font-bold text-xl tracking-tight text-primary">
          PrepUniv
        </span>
      </div>

      {/* Nav links */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-4 space-y-6">
        <nav className="space-y-1">
          {userNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={navLinkClass}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={2.1} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {creatorNav.length > 0 && (
          <div>
            <div className="px-3 mb-2 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Creator
              </p>
            </div>
            <nav className="space-y-1">
              {creatorNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={navLinkClass}>
                    <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={2.1} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}

        {adminNav.length > 0 && (
          <div>
            <div className="px-3 mb-2 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-warning" />
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Admin
              </p>
            </div>
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={navLinkClass}>
                    <Icon className="w-4.5 h-4.5 shrink-0" strokeWidth={2.1} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* ── Bottom user card + popover ── */}
      <div className="p-4 border-t border-border/50 relative">
        {/* Wallet link */}
        <NavLink
          to="/wallet"
          className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-cream/80 hover:bg-cream transition-colors"
        >
          <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Wallet className="w-4 h-4" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-muted">Wallet balance</p>
            <p className="font-heading font-semibold text-text text-sm truncate">
              {formatNaira(walletBalance)}
            </p>
          </div>
        </NavLink>

        {/* Popover anchored above this button */}
        <AccountPopover
          open={popoverOpen}
          onClose={() => setPopoverOpen(false)}
          anchorRef={userCardRef}
        />

        {/* Clickable user card — opens popover */}
        <button
          ref={userCardRef}
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={popoverOpen}
          className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-colors cursor-pointer ${
            popoverOpen
              ? "bg-surface text-text"
              : "hover:bg-surface/60 hover:text-text text-text-soft"
          }`}
        >
          <Avatar name={currentUser.full_name} size="md" ring />
          <div className="flex-1 min-w-0 text-left">
            <p className="font-heading font-semibold text-sm text-text truncate">
              {currentUser.full_name}
            </p>
            <Badge size="sm" variant={ROLE_LABELS[currentUser.role].variant}>
              {ROLE_LABELS[currentUser.role].label}
            </Badge>
          </div>
          {/* Subtle "more" indicator */}
          <div
            className={`w-1.5 h-1.5 rounded-full transition-colors ${popoverOpen ? "bg-primary" : "bg-muted/50"}`}
          />
        </button>
      </div>
    </aside>
  );
}

// ─── TopBar (mobile) ──────────────────────────────────────────────────────────

interface TopBarProps {
  onOpenAccountMenu: () => void;
}

export function TopBar({ onOpenAccountMenu }: TopBarProps) {
  const { currentUser, walletBalance } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 4);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header
      className={`lg:hidden sticky top-0 z-40 w-full backdrop-blur-xl transition-all duration-200 safe-top ${
        scrolled
          ? "bg-background/85 border-b border-border/50 shadow-soft"
          : "bg-background/60"
      }`}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 h-11 -ml-2 pl-2 pr-3 rounded-2xl active:scale-95 transition-transform"
        >
          <img
            src={new URL("../assets/prepUniv.png", import.meta.url).href}
            alt="PrepUniv"
            className="h-7 w-7 rounded-lg object-contain"
          />
          <span className="font-heading font-bold text-lg tracking-tight text-primary">
            PrepUniv
          </span>
        </button>

        <div className="flex items-center gap-2">
          {/* Wallet shortcut */}
          <button
            onClick={() => navigate("/wallet")}
            className="flex items-center gap-1.5 h-11 px-3 rounded-2xl bg-primary/10 text-primary active:scale-95 transition-transform"
            aria-label="Wallet"
          >
            <Wallet className="w-4.5 h-4.5" strokeWidth={2.2} />
            <span className="font-heading font-semibold text-sm">
              {formatNaira(walletBalance)}
            </span>
          </button>

          {/* Avatar → opens Account Menu sheet */}
          <button
            onClick={onOpenAccountMenu}
            className="h-11 w-11 flex items-center justify-center rounded-2xl active:scale-95 transition-transform"
            aria-label="Open account menu"
          >
            <Avatar name={currentUser.full_name} size="sm" ring />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── BottomNav (mobile) ───────────────────────────────────────────────────────

interface BottomNavProps {
  onOpenAccountMenu: () => void;
}

export function BottomNav({ onOpenAccountMenu }: BottomNavProps) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-2xl bg-background/85 border-t border-border/60 safe-bottom">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {MOBILE_TABS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/home" || item.to === "/"}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-14 transition-all duration-150 active:scale-95 ${
                  isActive ? "text-primary" : "text-muted hover:text-text-soft"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-primary" />
                  )}
                  <Icon
                    className={`w-5.5 h-5.5 ${isActive ? "scale-105" : ""} transition-transform`}
                    strokeWidth={isActive ? 2.4 : 2}
                  />
                  <span className="text-[11px] font-heading font-medium tracking-tight">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* 5th tab: "Menu" → opens Account Menu sheet (not a route) */}
        <button
          type="button"
          onClick={onOpenAccountMenu}
          className="relative flex flex-col items-center justify-center gap-1 py-2.5 min-h-14 transition-all duration-150 active:scale-95 text-muted hover:text-text-soft"
          aria-label="Open account menu"
        >
          <Menu className="w-5.5 h-5.5 transition-transform" strokeWidth={2} />
          <span className="text-[11px] font-heading font-medium tracking-tight">
            Menu
          </span>
        </button>
      </div>
    </nav>
  );
}
