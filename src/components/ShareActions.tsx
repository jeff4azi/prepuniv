import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Share2,
  Copy,
  MoreHorizontal,
  ExternalLink,
  Check,
  X,
} from "lucide-react";
import { trackShare } from "../lib/analytics";

type ToastFn = (t: {
  message: string;
  variant?: "success" | "info" | "error" | "warning";
}) => void;

export async function handleShareOrCopy(
  shareUrl: string,
  opts: {
    title?: string;
    text?: string;
    showToast: ToastFn;
    preferred?: "share" | "copy";
    /** Quiz/item ID for analytics — pass this to get share events in GA4 */
    itemId?: string;
  },
): Promise<"shared" | "copied" | "error"> {
  const showToast = opts.showToast;
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (opts.preferred !== "copy" && canShare) {
    try {
      await navigator.share({
        title: opts.title ?? "Check this out",
        text: opts.text ?? "",
        url: shareUrl,
      });
      showToast({ message: "Shared!", variant: "success" });
      if (opts.itemId)
        trackShare({ method: "native_share", item_id: opts.itemId });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "error";
    }
  }

  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.clipboard?.writeText === "function"
    ) {
      await navigator.clipboard.writeText(shareUrl);
    } else {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showToast({ message: "Link copied to clipboard!", variant: "success" });
    if (opts.itemId)
      trackShare({ method: "clipboard_copy", item_id: opts.itemId });
    return "copied";
  } catch (e) {
    showToast({
      message: "Couldn't copy — copy it manually.",
      variant: "error",
    });
    return "error";
  }
}

type ShareActionsMenuProps = {
  url: string;
  title?: string;
  text?: string;
  showToast: ToastFn;
  size?: "sm" | "md";
  className?: string;
  align?: "right" | "left";
  label?: string;
  /** Quiz/item ID forwarded to analytics */
  itemId?: string;
};

export function ShareActionsMenu({
  url,
  title,
  text,
  showToast,
  size = "sm",
  className = "",
  align = "right",
  label = "Quiz actions",
  itemId,
}: ShareActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left?: number;
    right?: number;
  } | null>(null);
  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  // Compute fixed position from the button's bounding rect
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    if (align === "right") {
      setMenuPos({ top: rect.bottom + 8, right: vw - rect.right });
    } else {
      setMenuPos({ top: rect.bottom + 8, left: rect.left });
    }
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (
        btnRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onScroll() {
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const btnSize = size === "md" ? "h-9 w-9 rounded-2xl" : "h-8 w-8 rounded-xl";
  const iconSize = size === "md" ? "w-[18px] h-[18px]" : "w-4 h-4";

  const menu =
    open && menuPos
      ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{
              position: "fixed",
              top: menuPos.top,
              ...(menuPos.right !== undefined
                ? { right: menuPos.right }
                : { left: menuPos.left }),
              zIndex: 9999,
            }}
            className="min-w-49 rounded-2xl bg-cream shadow-elevated ring-1 ring-border/40 p-1.5 animate-in fade-in zoom-in-95 duration-120"
          >
            {canShare && (
              <button
                type="button"
                role="menuitem"
                onClick={async (e) => {
                  e.stopPropagation();
                  setOpen(false);
                  await handleShareOrCopy(url, {
                    title,
                    text,
                    showToast,
                    preferred: "share",
                    itemId,
                  });
                }}
                className="w-full h-9.5 px-3 rounded-xl text-[13px] font-heading font-semibold flex items-center gap-2.5 text-text hover:bg-surface/70 active:scale-[0.99] transition-all"
              >
                <Share2
                  className="w-4 h-4 text-secondary shrink-0"
                  strokeWidth={2}
                />
                Share via…
                <span className="ml-auto text-[10px] font-heading font-bold uppercase tracking-wider text-muted">
                  Mobile
                </span>
              </button>
            )}

            <button
              type="button"
              role="menuitem"
              onClick={async (e) => {
                e.stopPropagation();
                const res = await handleShareOrCopy(url, {
                  title,
                  text,
                  showToast,
                  preferred: "copy",
                  itemId,
                });
                if (res === "copied") {
                  setJustCopied(true);
                  window.setTimeout(() => setJustCopied(false), 1500);
                }
                window.setTimeout(() => setOpen(false), 250);
              }}
              className="w-full h-9.5 px-3 rounded-xl text-[13px] font-heading font-semibold flex items-center gap-2.5 text-text hover:bg-surface/70 active:scale-[0.99] transition-all"
            >
              {justCopied ? (
                <Check
                  className="w-4 h-4 text-success shrink-0"
                  strokeWidth={2.4}
                />
              ) : (
                <Copy
                  className="w-4 h-4 text-primary shrink-0"
                  strokeWidth={2}
                />
              )}
              {justCopied ? "Copied!" : "Copy link"}
              {!canShare && (
                <span className="ml-auto text-[10px] font-heading font-bold uppercase tracking-wider text-muted">
                  Fallback
                </span>
              )}
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="w-full h-9.5 px-3 rounded-xl text-[13px] font-heading font-semibold flex items-center gap-2.5 text-text hover:bg-surface/70 active:scale-[0.99] transition-all"
            >
              <ExternalLink
                className="w-4 h-4 text-muted shrink-0"
                strokeWidth={2}
              />
              Open in new tab
            </button>

            <div className="h-px my-1 bg-border/40 -mx-1" />

            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="w-full h-9 px-3 rounded-xl text-[12px] font-heading font-medium flex items-center gap-2 text-muted hover:bg-surface/50 active:scale-[0.99] transition-all"
            >
              <X className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              Dismiss
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((v) => !v);
        }}
        className={`${btnSize} flex items-center justify-center text-text-soft hover:text-text hover:bg-surface/70 active:scale-95 transition-all duration-150`}
      >
        <MoreHorizontal className={iconSize} strokeWidth={2.2} />
      </button>
      {menu}
    </div>
  );
}

type ShareIconButtonProps = {
  url: string;
  title?: string;
  text?: string;
  showToast: ToastFn;
  size?: "sm" | "md";
  className?: string;
  label?: string;
  /** Quiz/item ID forwarded to analytics */
  itemId?: string;
};

export function ShareIconButton({
  url,
  title,
  text,
  showToast,
  size = "md",
  className = "",
  label = "Share",
  itemId,
}: ShareIconButtonProps) {
  const btnCls =
    size === "md"
      ? "h-10 px-3.5 gap-2 rounded-2xl text-[13px]"
      : "h-9 px-3 gap-1.5 rounded-xl text-[12px]";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        void handleShareOrCopy(url, { title, text, showToast, itemId });
      }}
      className={`${btnCls} inline-flex items-center font-heading font-semibold border border-border/50 bg-surface/40 text-text hover:border-primary/30 hover:text-primary hover:bg-surface active:scale-[0.98] transition-all duration-150 ${className}`}
    >
      <Share2
        className={size === "md" ? "w-[17px] h-[17px]" : "w-4 h-4"}
        strokeWidth={2.1}
      />
      <span>{label}</span>
    </button>
  );
}
