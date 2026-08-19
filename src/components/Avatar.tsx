import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Size = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "size"> {
  name: string;
  src?: string;
  size?: Size;
  ring?: boolean;
  /**
   * When true (the default) and a real image is showing, clicking the
   * avatar opens a full-screen enlarge overlay. Set to false wherever the
   * avatar already has its own click purpose — wrapped in a `<Link>` to a
   * creator profile, or inside a button that opens a menu/drawer — so the
   * enlarge click doesn't fight the existing one for the same tap.
   */
  enlargeable?: boolean;
}

const SIZE_MAP: Record<Size, string> = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const BG_COLORS = ["bg-primary/80", "bg-secondary", "bg-muted"];

function hashString(s: string) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function AvatarLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-80 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <button
        type="button"
        className="absolute inset-0 bg-text/70 backdrop-blur-sm cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-5 right-5 z-10 h-10 w-10 rounded-full bg-cream/10 hover:bg-cream/20 text-cream flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="relative z-10 max-h-[80vh] max-w-[85vw] rounded-3xl object-contain shadow-elevated"
      />
    </div>,
    document.body,
  );
}

export function Avatar({
  name,
  src,
  size = "md",
  ring = false,
  enlargeable = true,
  className = "",
  alt,
  ...props
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const [enlarged, setEnlarged] = useState(false);

  // If the src changes (e.g. a fresh upload), give the new image a chance.
  useEffect(() => {
    setImgError(false);
  }, [src]);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const bgIndex = hashString(name) % BG_COLORS.length;
  const showImage = !!src && !imgError;
  const canEnlarge = enlargeable && showImage;
  const displayAlt = alt ?? name;

  return (
    <>
      <div
        className={`relative inline-flex shrink-0 items-center justify-center rounded-2xl overflow-hidden font-heading font-semibold text-cream ${SIZE_MAP[size]} ${ring ? "ring-2 ring-cream shadow-soft" : ""} ${BG_COLORS[bgIndex]} ${className}`}
      >
        {showImage ? (
          <img
            src={src}
            alt={displayAlt}
            className={`h-full w-full object-cover ${canEnlarge ? "cursor-zoom-in" : ""}`}
            onError={() => setImgError(true)}
            onClick={
              canEnlarge
                ? (e) => {
                    e.stopPropagation();
                    setEnlarged(true);
                  }
                : undefined
            }
            {...props}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {enlarged && showImage && (
        <AvatarLightbox
          src={src}
          alt={displayAlt}
          onClose={() => setEnlarged(false)}
        />
      )}
    </>
  );
}
