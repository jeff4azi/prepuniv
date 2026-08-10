/**
 * AccountMenu — unified account/logout panel.
 *
 * mode="sheet"   → mobile bottom-sheet (full nav for the role)
 * mode="popover" → desktop popover above sidebar card (just Log Out — everything
 *                  else is already visible in the sidebar)
 */
import { useEffect, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Settings,
  LogOut,
  LayoutDashboard,
  FileText,
  CreditCard,
  BarChart3,
  ShieldCheck,
  ListChecks,
  BookOpen,
  ScrollText,
  Users,
  Sparkles,
  UserPlus,
  X,
  ChevronRight,
  Wallet,
  Clock,
  GraduationCap,
} from "lucide-react";
import { useAuth, type UserRole } from "../context/AuthContext";
import { Avatar } from "./Avatar";
import { Badge } from "./Badge";

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── Shared nav-link style helpers ───────────────────────────────────────────

const linkCls =
  "flex items-center gap-3 h-11 px-3 rounded-2xl text-sm font-heading font-medium text-text-soft hover:bg-surface/70 hover:text-text transition-colors w-full";
const activeCls =
  "flex items-center gap-3 h-11 px-3 rounded-2xl text-sm font-heading font-medium bg-primary text-cream shadow-soft w-full";
const sectionLabelCls = "px-3 mb-1 mt-3 flex items-center gap-2";

function NavItem({
  to,
  icon: Icon,
  label,
  iconClass = "",
  onClose,
  end,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  iconClass?: string;
  onClose: () => void;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClose}
      end={end}
      className={({ isActive }) => (isActive ? activeCls : linkCls)}
    >
      <Icon className={`w-4.5 h-4.5 shrink-0 ${iconClass}`} strokeWidth={2.1} />
      <span className="flex-1">{label}</span>
      <ChevronRight className="w-4 h-4 opacity-40" />
    </NavLink>
  );
}

// ─── User header (shared by both modes) ──────────────────────────────────────

function UserHeader() {
  const { currentUser, walletBalance } = useAuth();
  const roleInfo = ROLE_LABELS[currentUser.role];
  return (
    <div className="px-4 pt-4 pb-3 flex items-center gap-3">
      <Avatar name={currentUser.full_name} size="md" ring />
      <div className="flex-1 min-w-0">
        <p className="font-heading font-semibold text-sm text-text truncate leading-tight">
          {currentUser.full_name}
        </p>
        <div className="mt-1">
          <Badge size="sm" variant={roleInfo.variant}>
            {roleInfo.label}
          </Badge>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] text-muted font-heading">Balance</p>
        <p className="font-heading font-bold text-sm text-primary leading-tight">
          {formatNaira(walletBalance)}
        </p>
      </div>
    </div>
  );
}

// ─── Log-out row (shared) ─────────────────────────────────────────────────────

function LogOutRow({ onLogOut }: { onLogOut: () => void }) {
  return (
    <div className="mx-4 border-t border-border/50 mt-2 pt-2 pb-3">
      <button
        type="button"
        onClick={onLogOut}
        className="flex items-center gap-3 h-11 px-3 rounded-2xl text-sm font-heading font-medium text-warning/80 hover:bg-warning-bg hover:text-warning transition-colors w-full"
      >
        <LogOut className="w-4.5 h-4.5 shrink-0" strokeWidth={2.1} />
        <span>Log out</span>
      </button>
    </div>
  );
}

// ─── Desktop-only body: just the user header + log out ───────────────────────
// The sidebar already shows everything else, so we don't repeat it.

function DesktopMenuBody({ onClose }: { onClose: () => void }) {
  const { logOut } = useAuth();
  const navigate = useNavigate();

  function handleLogOut() {
    logOut();
    onClose();
    navigate("/");
  }

  return (
    <div className="py-2 px-4">
      <button
        type="button"
        onClick={handleLogOut}
        className="flex items-center gap-3 h-11 px-3 rounded-2xl text-sm font-heading font-medium text-warning/80 hover:bg-warning-bg hover:text-warning transition-colors w-full"
      >
        <LogOut className="w-4.5 h-4.5 shrink-0" strokeWidth={2.1} />
        <span>Log out</span>
      </button>
    </div>
  );
}

// ─── Mobile-only body: full role-aware navigation ────────────────────────────
// Shows everything the desktop sidebar shows, organised by role.

function MobileMenuBody({ onClose }: { onClose: () => void }) {
  const { currentUser, logOut } = useAuth();
  const navigate = useNavigate();
  const role = currentUser.role;
  const isApproved = currentUser.is_approved_creator;

  function handleLogOut() {
    logOut();
    onClose();
    navigate("/");
  }

  return (
    <>
      <UserHeader />

      <div className="px-3 pb-1 space-y-0.5">
        {/* ── Home/Browse/Library/Wallet are on the bottom nav — not repeated here ── */}
        <NavItem to="/history" icon={Clock} label="History" onClose={onClose} />
        <NavItem
          to="/settings"
          icon={Settings}
          label="Settings"
          onClose={onClose}
        />

        {/* ── Creator section ── */}
        {isApproved && (
          <>
            <div className={sectionLabelCls}>
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Creator
              </p>
            </div>
            <NavItem
              to="/creator"
              icon={LayoutDashboard}
              label="Creator Dashboard"
              iconClass="text-secondary"
              onClose={onClose}
              end
            />
            <NavItem
              to="/creator/quizzes"
              icon={FileText}
              label="My Quizzes"
              onClose={onClose}
              end
            />
            <NavItem
              to="/creator/payouts"
              icon={CreditCard}
              label="Payouts"
              onClose={onClose}
              end
            />
            <NavItem
              to="/creator/reports"
              icon={FileText}
              label="Reports"
              onClose={onClose}
              end
            />
          </>
        )}

        {/* "Become a Creator" for non-approved users */}
        {!isApproved && role === "user" && (
          <NavItem
            to="/creator/apply"
            icon={UserPlus}
            label="Become a Creator"
            iconClass="text-secondary"
            onClose={onClose}
          />
        )}

        {/* ── Admin section ── */}
        {role === "admin" && (
          <>
            <div className={sectionLabelCls}>
              <ShieldCheck className="w-3.5 h-3.5 text-warning" />
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
                Admin
              </p>
            </div>
            <NavItem
              to="/admin"
              icon={ShieldCheck}
              label="Admin Dashboard"
              iconClass="text-warning"
              onClose={onClose}
              end
            />
            <NavItem
              to="/admin/applications"
              icon={ListChecks}
              label="Applications"
              onClose={onClose}
              end
            />
            <NavItem
              to="/admin/payouts"
              icon={CreditCard}
              label="Payouts"
              onClose={onClose}
              end
            />
            <NavItem
              to="/admin/reports"
              icon={FileText}
              label="Reports"
              onClose={onClose}
              end
            />
            <NavItem
              to="/admin/users"
              icon={Users}
              label="Users"
              onClose={onClose}
              end
            />
            <NavItem
              to="/admin/courses"
              icon={BookOpen}
              label="Courses"
              onClose={onClose}
              end
            />
            <NavItem
              to="/admin/quizzes"
              icon={ScrollText}
              label="Quizzes"
              onClose={onClose}
              end
            />
            <NavItem
              to="/admin/universities"
              icon={GraduationCap}
              label="Universities"
              onClose={onClose}
              end
            />
          </>
        )}
      </div>

      <LogOutRow onLogOut={handleLogOut} />
    </>
  );
}

// ─── Sheet (mobile) ───────────────────────────────────────────────────────────

interface AccountSheetProps {
  open: boolean;
  onClose: () => void;
}

export function AccountSheet({ open, onClose }: AccountSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <div
      className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-200 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      aria-modal={open}
      role="dialog"
      aria-label="Account menu"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-text/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div
        className={`absolute bottom-0 left-0 right-0 rounded-t-3xl bg-cream shadow-elevated flex flex-col max-h-[90vh] transition-transform duration-300 ease-out safe-bottom ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Drag handle */}
        <div className="pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-4 h-8 w-8 rounded-xl flex items-center justify-center text-muted hover:bg-surface/60 hover:text-text transition-colors"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Scrollable body */}
        <div className="overflow-y-auto no-scrollbar">
          <MobileMenuBody onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

// ─── Popover (desktop) ────────────────────────────────────────────────────────

interface AccountPopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function AccountPopover({
  open,
  onClose,
  anchorRef,
}: AccountPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    const t = setTimeout(
      () => document.addEventListener("mousedown", handler),
      0,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handler);
    };
  }, [open, onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="hidden lg:block absolute bottom-full left-0 right-0 mb-2 z-50 rounded-2xl bg-cream border border-border/50 shadow-elevated overflow-hidden"
      role="dialog"
      aria-label="Account menu"
    >
      <DesktopMenuBody onClose={onClose} />
    </div>
  );
}
