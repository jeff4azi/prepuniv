import { forwardRef, useState, type InputHTMLAttributes, type LabelHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type ErrorMsg = string | undefined | null;

interface FieldWrapperProps {
  id: string;
  label?: string;
  error?: ErrorMsg;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FieldWrapper({ id, label, error, hint, children, className = '' }: FieldWrapperProps) {
  return (
    <div className={'w-full ' + className}>
      {label && (
        <label
          htmlFor={id}
          className="block mb-1.5 text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-danger flex items-start gap-1.5 leading-snug">
          <span aria-hidden className="mt-[2px] inline-block w-1 h-1 rounded-full bg-danger shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

const BASE_INPUT = [
  'w-full h-12 sm:h-[50px] px-4 rounded-xl text-sm',
  'bg-cream text-text placeholder:text-muted/70',
  'border border-border focus:outline-none',
  'ring-0 focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
  'transition-all duration-150',
  'disabled:opacity-60 disabled:cursor-not-allowed',
].join(' ');

const ERROR_INPUT = [
  'border-danger/60 bg-danger-bg/30',
  'focus:ring-danger/30 focus:border-danger',
].join(' ');

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  id: string;
  label?: string;
  error?: ErrorMsg;
  hint?: string;
  inputClassName?: string;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { id, label, error, hint, inputClassName = '', ...props },
  ref,
) {
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <input
        id={id}
        ref={ref}
        className={BASE_INPUT + ' ' + (error ? ERROR_INPUT + ' ' : '') + inputClassName}
        {...props}
      />
    </FieldWrapper>
  );
});

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  id: string;
  label?: string;
  error?: ErrorMsg;
  hint?: string;
  inputClassName?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { id, label, error, hint, inputClassName = '', ...props },
  ref,
) {
  const [show, setShow] = useState(false);
  return (
    <FieldWrapper id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={BASE_INPUT + ' pr-12 ' + (error ? ERROR_INPUT + ' ' : '') + inputClassName}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-muted hover:text-text transition-colors rounded-r-xl active:scale-95"
          tabIndex={-1}
        >
          {show ? (
            <EyeOff className="w-[18px] h-[18px]" strokeWidth={2} />
          ) : (
            <Eye className="w-[18px] h-[18px]" strokeWidth={2} />
          )}
        </button>
      </div>
    </FieldWrapper>
  );
});

// ---------- Validation helpers ----------
export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function requiredField(v: string) {
  if (!v || !v.trim()) return 'This field is required';
  return null;
}

export function validateEmail(v: string) {
  const req = requiredField(v);
  if (req) return req;
  if (!isEmail(v)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(v: string) {
  const req = requiredField(v);
  if (req) return req;
  if (v.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function validatePasswordMatch(pw: string, confirm: string) {
  const req = requiredField(confirm);
  if (req) return req;
  if (pw !== confirm) return 'Passwords do not match';
  return null;
}

export function validateFullName(v: string) {
  const req = requiredField(v);
  if (req) return req;
  const parts = v.trim().split(/\s+/);
  if (parts.length < 2) return 'Enter your first and last name';
  return null;
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={
        'block mb-1.5 text-xs sm:text-[13px] font-heading font-semibold text-text-soft tracking-tight ' +
        (props.className ?? '')
      }
    />
  );
}
