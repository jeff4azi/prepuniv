import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Sparkles, User, ChevronDown, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../mock';
import { Badge } from './Badge';

const ROLES: Array<{ id: UserRole; label: string; desc: string; icon: React.ElementType; color: string }> = [
  { id: 'user', label: 'Learner', desc: 'Browse & take quizzes', icon: User, color: 'text-primary' },
  { id: 'creator', label: 'Creator', desc: 'Build & sell quizzes', icon: Sparkles, color: 'text-secondary' },
  { id: 'admin', label: 'Admin', desc: 'Full platform access', icon: ShieldCheck, color: 'text-warning' },
];

export function DevRoleSwitcher() {
  const { currentRole, setCurrentRole } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, []);

  const activeRole = ROLES.find((r) => r.id === currentRole)!;
  const ActiveIcon = activeRole.icon;

  return (
    <div ref={ref} className="fixed right-4 bottom-4 lg:bottom-auto lg:top-4 z-[60]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="group flex items-center gap-2 pl-3 pr-3.5 h-11 rounded-2xl bg-cream border border-border shadow-elevated hover:shadow-elevated transition-all active:scale-[0.98]"
        aria-label="Dev role switcher"
      >
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          <Terminal className="w-[14px] h-[14px]" strokeWidth={2.4} />
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-muted">
            Dev
          </span>
          <Badge size="sm" variant="primary" dot>
            <span className="flex items-center gap-1">
              <ActiveIcon className="w-3 h-3" />
              {activeRole.label}
            </span>
          </Badge>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        className={`absolute bottom-14 lg:bottom-auto lg:top-14 right-0 w-72 rounded-2xl bg-cream border border-border shadow-elevated p-2 transition-all duration-200 origin-bottom-right lg:origin-top-right ${
          open
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-1 lg:-translate-y-1 scale-95 pointer-events-none'
        }`}
      >
        <div className="px-3 pt-2 pb-3">
          <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted">
            Switch preview role
          </p>
          <p className="text-xs text-muted mt-0.5">
            Dev-only. Does not persist across reloads.
          </p>
        </div>
        <div className="space-y-1">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isActive = currentRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  setCurrentRole(role.id);
                  setOpen(false);
                }}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'hover:bg-surface/60'
                }`}
              >
                <div
                  className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-primary text-cream' : `bg-surface ${role.color}`
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2.2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm text-text">
                    {role.label}
                    {isActive && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-bold">
                        Active
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{role.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
