import { useState, useRef, useEffect, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles, User as UserIcon } from 'lucide-react';
import { AuthShell, AuthCard } from '../components/AuthShell';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { TextInput, PasswordInput, validateEmail, validatePassword } from '../components/Form';
import { useAuth } from '../context/AuthContext';
import { profiles, type Profile } from '../mock';

const ROLE_TINT: Record<string, { label: string; tone: 'primary' | 'secondary' | 'warning'; icon: React.ElementType }> = {
  user: { label: 'Learner', tone: 'primary', icon: UserIcon },
  creator: { label: 'Creator', tone: 'secondary', icon: Sparkles },
  admin: { label: 'Admin', tone: 'warning', icon: ShieldCheck },
};

export function LoginPage() {
  const navigate = useNavigate();
  const { logInAsUser, logInAsRole } = useAuth();

  const [email, setEmail] = useState('adebayo.j@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [touched, setTouched] = useState<{ email: boolean; password: boolean }>({
    email: false,
    password: false,
  });

  const [selectedUserId, setSelectedUserId] = useState<string>(profiles[0].id);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    window.addEventListener('mousedown', h);
    return () => window.removeEventListener('mousedown', h);
  }, []);

  function runValidation() {
    return {
      email: validateEmail(email),
      password: validatePassword(password),
    };
  }

  function validateAll(): boolean {
    const e = runValidation();
    setErrors(e);
    setTouched({ email: true, password: true });
    return !e.email && !e.password;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    logInAsUser(selectedUserId);
    setLoading(false);
    navigate('/home', { replace: true });
  }

  const liveErrors = touched.email || touched.password ? runValidation() : {};
  const finalErrors = {
    email: errors.email ?? liveErrors.email,
    password: errors.password ?? liveErrors.password,
  };

  const selectedUser: Profile | undefined = profiles.find((p) => p.id === selectedUserId) ?? profiles[0];
  const SelRoleMeta = ROLE_TINT[selectedUser.role];
  const SelIcon = SelRoleMeta.icon;

  return (
    <AuthShell
      crossLink={{ label: "Don't have an account?", to: '/signup', cta: 'Sign up' }}
    >
      <AuthCard
        tag="Welcome back"
        tagTone="success"
        title="Log in to PrepUniv"
        subtitle="Pick up right where you left off — every quiz you've unlocked is still yours."
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4 sm:space-y-[18px]">
          <TextInput
            id="email"
            name="email"
            label="Email address"
            placeholder="you@school.edu.ng"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            error={finalErrors.email ?? undefined}
          />

          <div>
            <div className="flex items-end justify-between mb-1.5">
              <label
                htmlFor="password"
                className="text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              error={finalErrors.password ?? undefined}
            />
          </div>

          {/* Dev mock user picker */}
          <div ref={pickerRef} className="relative">
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-heading uppercase tracking-wider font-semibold text-muted">
                Dev tools · sign in as
              </p>
              <button
                type="button"
                onClick={() => logInAsRole(selectedUser.role as 'user' | 'creator' | 'admin')}
                className="text-[11px] font-semibold text-primary hover:underline"
              >
                Use this role →
              </button>
            </div>
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="w-full flex items-center gap-3 h-12 sm:h-[50px] px-3.5 rounded-xl bg-surface/50 border border-border/70 hover:border-border hover:bg-surface transition-colors text-left"
            >
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <SelIcon className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-heading font-semibold text-text truncate">
                  {selectedUser.full_name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge size="sm" variant={SelRoleMeta.tone}>
                    {SelRoleMeta.label}
                  </Badge>
                  <span className="text-[11px] text-muted truncate">{selectedUser.email}</span>
                </div>
              </div>
              <ChevronDown
                className={'w-4 h-4 text-muted transition-transform duration-200 ' + (pickerOpen ? 'rotate-180' : '')}
              />
            </button>

            <div
              className={
                'absolute left-0 right-0 z-20 mt-2 rounded-2xl bg-cream border border-border shadow-elevated p-2 overflow-hidden transition-all duration-200 origin-top ' +
                (pickerOpen
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                  : 'opacity-0 -translate-y-1 scale-[0.98] pointer-events-none')
              }
            >
              <div className="text-[10px] font-heading uppercase tracking-widest font-bold text-muted px-3 pt-2 pb-1">
                Mock profiles (dev-only)
              </div>
              <ul className="space-y-1">
                {profiles.map((p) => {
                  const meta = ROLE_TINT[p.role];
                  const Icon = meta.icon;
                  const active = p.id === selectedUserId;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserId(p.id);
                          setPickerOpen(false);
                        }}
                        className={
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ' +
                          (active ? 'bg-primary/10 ring-1 ring-primary/25' : 'hover:bg-surface/70')
                        }
                      >
                        <div className={'h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ' + (active ? 'bg-primary text-cream' : 'bg-surface text-secondary')}>
                          <Icon className="w-4 h-4" strokeWidth={2.2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-heading font-semibold text-text truncate">{p.full_name}</p>
                            {active && (
                              <span className="text-[10px] font-heading uppercase tracking-widest font-bold text-primary">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge size="sm" variant={meta.tone}>
                              {meta.label}
                            </Badge>
                            <span className="text-[11px] text-muted truncate">{p.email}</span>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <Button fullWidth size="lg" isLoading={loading} type="submit" className="h-12 mt-1">
            Log in
            {!loading && <ArrowRight className="w-[18px] h-[18px]" />}
          </Button>

          <p className="text-center text-xs text-muted pt-1">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </AuthCard>
    </AuthShell>
  );
}
