import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Download,
  Share2,
  Palette,
  Check,
  Image as ImageIcon,
  TrendingUp,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PREPUNIV_LOGO_SRC = new URL("../assets/prepUniv.png", import.meta.url)
  .href;

import { Card } from "./Card";
import { Badge } from "./Badge";
import { formatNaira } from "./QuizCard";
import { trackShare } from "../lib/analytics";

type ToastFn = (t: {
  message: string;
  variant?: "success" | "info" | "error" | "warning";
}) => void;

interface QuizGraphicData {
  quizId: string;
  quizTitle: string;
  quizDescription?: string;
  courseCode: string;
  courseTitle?: string;
  questionCount: number;
  priceKobo: number;
  attemptCount: number;
  creatorEarningsKobo: number;
  creatorName: string;
  creatorAvatarUrl?: string;
  creatorBio?: string;
  publicUrl: string;
}

const TEMPLATE_COUNT = 3;
const PREVIEW_W = 320;
const PREVIEW_H = 400;
const CAPTURE_W = 480;
const CAPTURE_H = 600;

export function QuizShareGraphics({
  data,
  showToast,
}: {
  data: QuizGraphicData;
  showToast: ToastFn;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const capRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];
  const [downloading, setDownloading] = useState<number | null>(null);
  const [justDownloaded, setJustDownloaded] = useState<number | null>(null);
  const thumbGridRef = useRef<HTMLDivElement>(null);
  const [thumbScale, setThumbScale] = useState(0.3);

  useEffect(() => {
    const updateThumbScale = () => {
      const grid = thumbGridRef.current;
      if (!grid) return;
      const firstBtn = grid.firstElementChild as HTMLElement | null;
      if (!firstBtn) return;
      const w = firstBtn.clientWidth;
      if (w > 0) setThumbScale(w / CAPTURE_W);
    };
    updateThumbScale();
    window.addEventListener("resize", updateThumbScale);
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateThumbScale)
        : null;
    if (ro && thumbGridRef.current) ro.observe(thumbGridRef.current);
    return () => {
      window.removeEventListener("resize", updateThumbScale);
      if (ro) ro.disconnect();
    };
  }, []);

  async function handleDownload(idx: number) {
    const ref = capRefs[idx].current;
    if (!ref) return;
    setDownloading(idx);
    try {
      const dataUrl = await toPng(ref, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        width: CAPTURE_W,
        height: CAPTURE_H,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      const link = document.createElement("a");
      link.download = `prepuniv-${data.courseCode}-quiz-${idx + 1}.png`;
      link.href = dataUrl;
      link.click();
      setJustDownloaded(idx);
      window.setTimeout(() => setJustDownloaded(null), 1600);
      showToast({
        message: `Design ${idx + 1} saved to downloads`,
        variant: "success",
      });
    } catch (e) {
      console.error(e);
      showToast({
        message: "Couldn't generate image. Please try again.",
        variant: "error",
      });
    } finally {
      setDownloading(null);
    }
  }

  async function handleShare(idx: number) {
    const ref = capRefs[idx].current;
    if (!ref) return;
    try {
      const dataUrl = await toPng(ref, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        width: CAPTURE_W,
        height: CAPTURE_H,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `prepuniv-quiz-${idx + 1}.png`, {
        type: "image/png",
      });

      const canShareFiles =
        typeof navigator !== "undefined" &&
        typeof (navigator as any).canShare === "function" &&
        (navigator as any).canShare({ files: [file] });

      const shareText = buildShareText(idx);

      if (canShareFiles && typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `${data.courseCode} · ${data.quizTitle}`,
            text: shareText,
            files: [file],
            url: data.publicUrl,
          });
          trackShare({ method: "native_share_image", item_id: data.quizId });
          showToast({ message: "Shared with image!", variant: "success" });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }

      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title: `${data.courseCode} · ${data.quizTitle}`,
            text: shareText,
            url: data.publicUrl,
          });
          trackShare({ method: "native_share_text", item_id: data.quizId });
          showToast({ message: "Shared!", variant: "success" });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }

      try {
        if (typeof navigator.clipboard?.writeText === "function") {
          await navigator.clipboard.writeText(`${shareText}\n${data.publicUrl}`);
        } else {
          const ta = document.createElement("textarea");
          ta.value = `${shareText}\n${data.publicUrl}`;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          document.body.appendChild(ta);
          ta.focus();
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        showToast({
          message: "Caption + link copied. Paste with your image!",
          variant: "info",
        });
      } catch {
        showToast({
          message: "Couldn't copy caption. Try downloading the image instead.",
          variant: "error",
        });
      }
    } catch (e) {
      console.error(e);
      showToast({
        message: "Something went wrong. Try downloading instead.",
        variant: "error",
      });
    }
  }

  function buildShareText(idx: number): string {
    const short =
      data.quizTitle.length > 55 ? data.quizTitle.slice(0, 52) + "…" : data.quizTitle;
    if (idx === 0) {
      return `Just dropped a new quiz on PrepUniv 📚\n\n🎯 ${data.courseCode} — ${short}\n❓ ${data.questionCount} questions\n💸 ${formatNaira(data.priceKobo)} per attempt\n\nAce your exams — practice with this right now 👇`;
    }
    if (idx === 1) {
      return `${data.quizTitle} is doing numbers! 📈🔥\n\nAlready ${data.attemptCount.toLocaleString("en-NG")} attempts from students.\n\n${data.courseCode} · ${data.questionCount} questions · ${formatNaira(data.priceKobo)}\nTest yourself on PrepUniv and see where you stand 👇`;
    }
    return `Hey guys! 👋 I created this quiz to help us all pass ${data.courseCode}.\n\n📝 Topic: ${short}\n🧠 ${data.questionCount} curated questions\n✅ Great for exam prep\n\nLet's study smart together. Tap the link to get started 🚀`;
  }

  function goPrev() {
    setActiveIdx((i) => (i - 1 + TEMPLATE_COUNT) % TEMPLATE_COUNT);
  }
  function goNext() {
    setActiveIdx((i) => (i + 1) % TEMPLATE_COUNT);
  }

  return (
    <>
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: -99999,
          width: CAPTURE_W,
          height: CAPTURE_H,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <div style={{ width: CAPTURE_W, height: CAPTURE_H, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0 }}>
            <TemplateMinimal ref={capRefs[0]} data={data} />
          </div>
        </div>
        <div
          style={{
            width: CAPTURE_W,
            height: CAPTURE_H,
            position: "relative",
            marginTop: 20,
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <TemplateStats ref={capRefs[1]} data={data} />
          </div>
        </div>
        <div
          style={{
            width: CAPTURE_W,
            height: CAPTURE_H,
            position: "relative",
            marginTop: 20,
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <TemplateCreator ref={capRefs[2]} data={data} />
          </div>
        </div>
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-heading font-semibold uppercase tracking-wider text-muted mb-1">
                Promo graphics
              </p>
              <p className="font-heading font-semibold text-base text-text leading-tight">
                Share your quiz with 3 ready-made designs
              </p>
              <p className="text-xs text-text-soft mt-0.5">
                Download as PNG or share directly to WhatsApp, Telegram & more.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={goPrev}
              aria-label="Previous design"
              className="h-9 w-9 rounded-xl border border-border/50 bg-surface/40 text-text-soft hover:text-text hover:bg-surface transition-colors flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  aria-label={`Design ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    activeIdx === i ? "w-6 bg-primary" : "w-2 bg-border/60 hover:bg-muted"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              aria-label="Next design"
              className="h-9 w-9 rounded-xl border border-border/50 bg-surface/40 text-text-soft hover:text-text hover:bg-surface transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5 bg-surface/20">
          <div className="flex flex-col lg:flex-row gap-5">
            <div className="mx-auto lg:mx-0 lg:shrink-0">
              <div
                className="relative rounded-3xl bg-cream shadow-elevated ring-1 ring-border/50 overflow-hidden"
                style={{ width: PREVIEW_W, height: PREVIEW_H }}
              >
                <div className="absolute inset-0">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="absolute inset-0 transition-opacity duration-200"
                      style={{
                        opacity: activeIdx === i ? 1 : 0,
                        zIndex: activeIdx === i ? 2 : 0,
                        pointerEvents: activeIdx === i ? "auto" : "none",
                      }}
                    >
                      <div
                        className="absolute top-0 left-0"
                        style={{
                          width: CAPTURE_W,
                          height: CAPTURE_H,
                          transform: "scale(0.6667)",
                          transformOrigin: "top left",
                        }}
                      >
                        {i === 0 && <TemplateMinimal data={data} />}
                        {i === 1 && <TemplateStats data={data} />}
                        {i === 2 && <TemplateCreator data={data} />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-[12px] text-muted font-heading font-medium">
                Design {activeIdx + 1} of {TEMPLATE_COUNT} ·{" "}
                {activeIdx === 0 && "Minimal Spotlight"}
                {activeIdx === 1 && "Stats Highlight"}
                {activeIdx === 2 && "Creator Showcase"}
              </p>
            </div>

            <div className="flex-1 min-w-0 space-y-4">
              <div ref={thumbGridRef} className="grid grid-cols-3 gap-2.5">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIdx(i)}
                    className={`relative aspect-[4/5] rounded-2xl overflow-hidden ring-1 transition-all ${
                      activeIdx === i
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]"
                        : "ring-border/50 hover:ring-muted opacity-90 hover:opacity-100"
                    }`}
                  >
                    <div
                      className="absolute top-0 left-0 shrink-0"
                      style={{
                        width: CAPTURE_W,
                        height: CAPTURE_H,
                        transform: `scale(${thumbScale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      {i === 0 && <TemplateMinimal data={data} />}
                      {i === 1 && <TemplateStats data={data} />}
                      {i === 2 && <TemplateCreator data={data} />}
                    </div>
                    <div className="absolute top-1.5 left-1.5 z-10">
                      <span className="inline-flex h-5 min-w-5 px-1.5 items-center justify-center rounded-lg bg-cream/90 text-[10px] font-heading font-bold text-text ring-1 ring-border/50">
                        {i + 1}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-cream border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0" />
                  <p className="text-[12px] font-heading font-semibold uppercase tracking-wider text-muted">
                    Suggested caption
                  </p>
                </div>
                <p className="text-[13px] font-sans text-text leading-relaxed whitespace-pre-wrap">
                  {buildShareText(activeIdx)}
                </p>
                <p className="mt-2 text-[11px] text-muted font-heading">
                  🔗 {data.publicUrl}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleDownload(activeIdx)}
                  disabled={downloading === activeIdx}
                  className="h-11 rounded-2xl bg-primary text-cream text-[13px] font-heading font-semibold shadow-soft hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {downloading === activeIdx ? (
                    <span className="w-4 h-4 rounded-full border-2 border-cream border-t-transparent animate-spin" />
                  ) : justDownloaded === activeIdx ? (
                    <Check className="w-4 h-4" strokeWidth={2.4} />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {justDownloaded === activeIdx ? "Saved!" : "Download PNG"}
                </button>
                <button
                  onClick={() => handleShare(activeIdx)}
                  className="h-11 rounded-2xl bg-secondary text-cream text-[13px] font-heading font-semibold shadow-soft hover:bg-secondary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>

              <div className="rounded-2xl bg-primary/5 border border-primary/15 p-3.5">
                <p className="text-[12px] font-heading font-semibold text-primary mb-1 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Pro tip
                </p>
                <p className="text-[12px] text-text-soft leading-relaxed">
                  Post Design 2 (Stats Highlight) once your quiz hits 50+ attempts
                  — social proof drives way more purchases. Share to your
                  department & course WhatsApp groups.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Template 1 — Minimal Spotlight
// ─────────────────────────────────────────────────────────────────────────────
const TemplateMinimal = Object.assign(
  // eslint-disable-next-line react/display-name
  (
    props: {
      data: QuizGraphicData;
      ref?: React.Ref<HTMLDivElement>;
    },
  ) => {
    const { data, ref } = props;
    const coursePill = `${data.courseCode}${
      data.courseTitle ? ` · ${data.courseTitle}` : ""
    }`;
    return (
      <div
        ref={ref}
        className="flex flex-col shrink-0"
        style={{
          width: CAPTURE_W,
          height: CAPTURE_H,
          background:
            "linear-gradient(160deg, #fbf8ee 0%, #f6f0da 50%, #ece3bd 100%)",
          fontFamily:
            "'Lexend', 'Inter', system-ui, -apple-system, sans-serif",
          color: "#1f2a17",
          padding: "28px 28px 24px",
          boxSizing: "border-box",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -90,
            left: -100,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "rgba(177, 184, 156, 0.26)",
            filter: "blur(6px)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -80,
            right: -70,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(68, 97, 46, 0.09)",
            filter: "blur(6px)",
          }}
        />

        <div
          className="flex items-center justify-between mb-5"
          style={{ position: "relative" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex items-center justify-center overflow-hidden shrink-0"
              style={{
                width: 32,
                height: 32,
                borderRadius: 12,
                background: "transparent",
                border: "none",
              }}
            >
              <img
                src={PREPUNIV_LOGO_SRC}
                alt="PrepUniv"
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
            <div className="min-w-0">
              <p
                style={{
                  fontWeight: 800,
                  fontSize: 16,
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                PrepUniv
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: "#667351",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                Study smarter, together
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 9,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(68, 97, 46, 0.10)",
              color: "#44612e",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              border: "1.5px solid rgba(68, 97, 46, 0.14)",
              flexShrink: 0,
            }}
          >
            New Quiz
          </span>
        </div>

        <div
          className="mb-4"
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            padding: "7px 14px",
            borderRadius: 12,
            background:
              "linear-gradient(135deg, #44612e 0%, #58753b 100%)",
            color: "#fbf8ee",
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "0.01em",
            position: "relative",
            boxShadow: "0 3px 10px rgba(68, 97, 46, 0.20)",
            maxWidth: "100%",
          }}
        >
          <span
            style={{
              display: "inline-block",
              maxWidth: 360,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {coursePill.length > 46
              ? `${data.courseCode} · ${
                  data.courseTitle
                    ? data.courseTitle.slice(0, 34).trimEnd() + "…"
                    : ""
                }`
              : coursePill}
          </span>
        </div>

        <h1
          style={{
            fontSize: 30,
            lineHeight: 1.05,
            fontWeight: 900,
            letterSpacing: "-0.025em",
            margin: "4px 0 8px",
            color: "#1f2a17",
            position: "relative",
          }}
        >
          {truncate(data.quizTitle, 5)}
        </h1>

        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.45,
            color: "#3a4a2c",
            fontWeight: 400,
            marginBottom: 16,
            minHeight: 36,
            position: "relative",
          }}
        >
          {data.quizDescription
            ? truncate(data.quizDescription, 2)
            : `${data.questionCount} carefully crafted questions to test your understanding and help you ace your next exam.`}
        </p>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
            marginBottom: 18,
          }}
        >
          <Pill
            label="Questions"
            value={`${data.questionCount}`}
            tone="primary"
            compact
          />
          <Pill
            label="Price"
            value={formatNaira(data.priceKobo)}
            tone="cream"
            compact
          />
          <Pill
            label="Attempts"
            value={data.attemptCount.toLocaleString("en-NG")}
            tone="sage"
            compact
          />
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 0,
            padding: "16px 16px 14px",
            borderRadius: 20,
            background:
              "linear-gradient(155deg, #ffffff 0%, #fbf7e9 50%, #f4efd5 100%)",
            border: "1.5px solid rgba(177, 184, 156, 0.55)",
            boxShadow:
              "0 10px 28px rgba(68, 97, 46, 0.11), 0 2px 6px rgba(68, 97, 46, 0.05)",
          }}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: 9,
                  color: "#667351",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Ready to test yourself?
              </p>
              <p
                style={{
                  fontSize: 15,
                  fontWeight: 900,
                  color: "#1f2a17",
                  letterSpacing: "-0.02em",
                }}
              >
                Start now on PrepUniv →
              </p>
            </div>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, #44612e 0%, #5a773d 100%)",
                color: "#fbf8ee",
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                boxShadow: "0 4px 12px rgba(68, 97, 46, 0.26)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fbf8ee"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              Open Quiz
            </div>
          </div>
          <div
            style={{
              padding: "7px 10px",
              borderRadius: 12,
              background: "rgba(102, 115, 81, 0.10)",
              border: "1px solid rgba(102, 115, 81, 0.16)",
              display: "flex",
              alignItems: "center",
              gap: 7,
            }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#44612e"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#44612e",
                letterSpacing: "-0.005em",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                flex: 1,
              }}
            >
              {data.publicShareUrl
                ? data.publicShareUrl.replace(/^https?:\/\//, "")
                : "prepuniv.com/quiz/…"}
            </span>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <AvatarGraphic
              url={data.creatorAvatarUrl}
              name={data.creatorName}
              size={26}
            />
            <p
              style={{
                fontSize: 11,
                color: "#667351",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              by{" "}
              <span style={{ color: "#44612e", fontWeight: 700 }}>
                {data.creatorName}
              </span>
            </p>
          </div>
          <p
            style={{
              fontSize: 9.5,
              color: "#859173",
              fontWeight: 600,
              letterSpacing: "0.04em",
            }}
          >
            prepuniv.com
          </p>
        </div>
      </div>
    );
  },
  { displayName: "TemplateMinimal" },
);

// ─────────────────────────────────────────────────────────────────────────────
// Template 2 — Stats Highlight
// ─────────────────────────────────────────────────────────────────────────────
const TemplateStats = Object.assign(
  // eslint-disable-next-line react/display-name
  (
    props: {
      data: QuizGraphicData;
      ref?: React.Ref<HTMLDivElement>;
    },
  ) => {
    const { data, ref } = props;
    return (
      <div
        ref={ref}
        className="flex flex-col shrink-0"
        style={{
          width: CAPTURE_W,
          height: CAPTURE_H,
          background:
            "linear-gradient(155deg, #44612e 0%, #3a5327 40%, #2f4421 100%)",
          fontFamily:
            "'Lexend', 'Inter', system-ui, -apple-system, sans-serif",
          padding: "28px 28px 24px",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -120,
            right: -100,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(251, 248, 238, 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -140,
            left: -110,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(214, 230, 208, 0.07) 0%, transparent 70%)",
          }}
        />

        <div
          className="flex items-center justify-between mb-6"
          style={{ position: "relative" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center overflow-hidden shrink-0"
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: "rgba(251, 248, 238, 0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(251, 248, 238, 0.2)",
              }}
            >
              <img
                src={PREPUNIV_LOGO_SRC}
                alt="PrepUniv"
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
            <div>
              <p style={{ color: "#fbf8ee", fontWeight: 700, fontSize: 15, lineHeight: 1, letterSpacing: "-0.01em" }}>
                PrepUniv
              </p>
              <p style={{ fontSize: 10, color: "rgba(235, 230, 210, 0.7)", fontWeight: 500, marginTop: 2 }}>
                Creator performance
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 9.5,
              padding: "5px 11px",
              borderRadius: 999,
              background: "rgba(214, 230, 208, 0.18)",
              color: "#d6e6d0",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              border: "1px solid rgba(214, 230, 208, 0.28)",
            }}
          >
            Live
          </span>
        </div>

        <div style={{ marginBottom: 6, position: "relative" }}>
          <span
            style={{
              display: "inline-block",
              padding: "5px 12px",
              borderRadius: 10,
              background: "rgba(251, 248, 238, 0.12)",
              border: "1px solid rgba(251, 248, 238, 0.2)",
              color: "#ece4c6",
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.02em",
            }}
          >
            {data.courseCode}
          </span>
        </div>

        <h1
          style={{
            position: "relative",
            fontSize: 24,
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#fbf8ee",
            margin: "8px 0 16px",
          }}
        >
          {truncate(data.quizTitle, 5)}
        </h1>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            marginBottom: 16,
          }}
        >
          <StatCardGraphic
            label="Attempts"
            value={data.attemptCount.toLocaleString("en-NG")}
            accent={data.attemptCount >= 100 ? "gold" : "cream"}
            compact
          />
          <StatCardGraphic
            label="Avg. Score"
            value={data.attemptCount > 20 ? "58%" : "TBD"}
            accent="green"
            compact
          />
          <StatCardGraphic
            label="Questions"
            value={`${data.questionCount}`}
            accent="cream"
            compact
          />
          <StatCardGraphic
            label="Price"
            value={formatNaira(data.priceKobo)}
            accent="cream"
            compact
          />
        </div>

        <div
          style={{
            position: "relative",
            padding: "14px 16px",
            borderRadius: 18,
            background:
              "linear-gradient(135deg, rgba(251, 248, 238, 0.14) 0%, rgba(251, 248, 238, 0.08) 100%)",
            border: "1.5px solid rgba(251, 248, 238, 0.22)",
            marginBottom: 18,
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              style={{
                width: 20,
                height: 20,
                borderRadius: 999,
                background: "#d6e6d0",
                color: "#3e6b33",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 12,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              !
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ color: "#fbf8ee", fontSize: 12.5, fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                {data.attemptCount >= 20
                  ? `${data.attemptCount.toLocaleString("en-NG")} students already attempted. Don't be left behind!`
                  : "Fresh quiz on the block. Be among the first to test your knowledge."}
              </p>
              <p style={{ color: "rgba(235, 230, 210, 0.7)", fontSize: 10.5, marginTop: 3, fontWeight: 500, lineHeight: 1.35 }}>
                {data.courseCode} · {data.questionCount} questions · Instant scoring
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "auto",
            padding: "14px 18px",
            borderRadius: 18,
            background: "#fbf8ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            boxShadow:
              "0 8px 24px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 9.5, color: "#667351", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
              Take the challenge
            </p>
            <p style={{ color: "#1f2a17", fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Attempt now →
            </p>
          </div>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 14,
              background: "linear-gradient(135deg, #44612e 0%, #667351 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(68, 97, 46, 0.35)",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbf8ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </div>

        <p
          style={{
            position: "relative",
            textAlign: "center",
            marginTop: 14,
            fontSize: 10,
            color: "rgba(235, 230, 210, 0.6)",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          Created by {data.creatorName} · prepuniv.com
        </p>
      </div>
    );
  },
  { displayName: "TemplateStats" },
);

// ─────────────────────────────────────────────────────────────────────────────
// Template 3 — Creator Showcase
// ─────────────────────────────────────────────────────────────────────────────
const TemplateCreator = Object.assign(
  // eslint-disable-next-line react/display-name
  (
    props: {
      data: QuizGraphicData;
      ref?: React.Ref<HTMLDivElement>;
    },
  ) => {
    const { data, ref } = props;
    const initials = data.creatorName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div
        ref={ref}
        className="flex flex-col shrink-0"
        style={{
          width: CAPTURE_W,
          height: CAPTURE_H,
          background:
            "linear-gradient(180deg, #fbf8ee 0%, #f6f0d9 100%)",
          fontFamily:
            "'Lexend', 'Inter', system-ui, -apple-system, sans-serif",
          padding: "26px 26px 22px",
          color: "#1f2a17",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(102, 115, 81, 0.10)",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: 80,
            left: -80,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(68, 97, 46, 0.07)",
          }}
        />

        <div className="flex items-center justify-between mb-6" style={{ position: "relative" }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              <img
                src={PREPUNIV_LOGO_SRC}
                alt="PrepUniv"
                crossOrigin="anonymous"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em", color: "#44612e" }}>
              PrepUniv
            </span>
          </div>
          <span
            style={{
              fontSize: 9,
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(68, 97, 46, 0.1)",
              color: "#44612e",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Creator
          </span>
        </div>

        <div
          className="flex items-center gap-3 mb-5"
          style={{ position: "relative" }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              padding: 3,
              background:
                "linear-gradient(135deg, #44612e 0%, #859173 50%, #d8dbc3 100%)",
              boxShadow:
                "0 6px 18px rgba(68, 97, 46, 0.18)",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: data.creatorAvatarUrl
                  ? `url(${data.creatorAvatarUrl}) center/cover no-repeat, #ece4c6`
                  : "#ece4c6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#44612e",
                fontWeight: 800,
                fontSize: 20,
                border: "2px solid #fbf8ee",
              }}
            >
              {!data.creatorAvatarUrl && initials}
            </div>
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 10.5, color: "#667351", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 2 }}>
              Hey, I'm
            </p>
            <h2 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.02em", color: "#1f2a17", lineHeight: 1.1, marginBottom: 4 }}>
              {truncate(data.creatorName, 3)}
            </h2>
            <p style={{ fontSize: 11.5, color: "#3a4a2c", lineHeight: 1.35, fontWeight: 400 }}>
              {data.creatorBio
                ? truncate(data.creatorBio, 1)
                : `${data.courseCode} quiz creator · helping you pass exams ✨`}
            </p>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            padding: "16px 16px 18px",
            borderRadius: 22,
            background:
              "linear-gradient(155deg, #fff 0%, #fbf8ee 55%, #f4efdb 100%)",
            border: "1.5px solid rgba(177, 184, 156, 0.6)",
            boxShadow:
              "0 10px 28px rgba(68, 97, 46, 0.10), 0 3px 10px rgba(68, 97, 46, 0.06)",
            marginBottom: 18,
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div
              style={{
                display: "inline-flex",
                padding: "6px 12px",
                borderRadius: 10,
                background: "rgba(68, 97, 46, 0.10)",
                color: "#44612e",
                fontSize: 11.5,
                fontWeight: 800,
                letterSpacing: "0.02em",
              }}
            >
              {data.courseCode}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "6px 12px",
                borderRadius: 10,
                background: "#44612e",
                color: "#fbf8ee",
                fontSize: 11.5,
                fontWeight: 800,
              }}
            >
              <span>{formatNaira(data.priceKobo)}</span>
            </div>
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#1f2a17", lineHeight: 1.15, marginBottom: 8 }}>
            {truncate(data.quizTitle, 5)}
          </h3>

          <p style={{ fontSize: 12, color: "#3a4a2c", lineHeight: 1.5, fontWeight: 400, marginBottom: 14 }}>
            I put this together for <span style={{ color: "#44612e", fontWeight: 700 }}>YOU</span> —{" "}
            {data.questionCount} hand-picked questions to walk into that exam hall with confidence. 💪
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 6,
              padding: "10px",
              borderRadius: 16,
              background: "rgba(102, 115, 81, 0.08)",
            }}
          >
            <MicroStat label="Q's" value={`${data.questionCount}`} compact />
            <MicroStat
              label="Attempts"
              value={data.attemptCount.toLocaleString("en-NG")}
              compact
            />
            <MicroStat
              label="Avg. score"
              value={data.attemptCount > 20 ? "58%" : "TBD"}
              compact
            />
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: "auto",
            padding: "13px 16px",
            borderRadius: 18,
            background:
              "linear-gradient(120deg, #44612e 0%, #536d39 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            boxShadow: "0 4px 14px rgba(68, 97, 46, 0.25)",
          }}
        >
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 9.5, color: "rgba(235, 230, 210, 0.8)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
              Get it on
            </p>
            <p style={{ color: "#fbf8ee", fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em" }}>
              PrepUniv →
            </p>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 14,
              background: "#fbf8ee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserCircleGraphic size={22} />
          </div>
        </div>

        <p
          style={{
            position: "relative",
            textAlign: "center",
            marginTop: 12,
            fontSize: 10,
            color: "#859173",
            fontWeight: 500,
            letterSpacing: "0.03em",
          }}
        >
          prepuniv.com · share the prep, share the pass 🎓
        </p>
      </div>
    );
  },
  { displayName: "TemplateCreator" },
);

// ─── Small helper components ────────────────────────────────────────────────

function Pill({
  label,
  value,
  tone,
  compact = false,
}: {
  label: string;
  value: string;
  tone: "primary" | "cream" | "sage";
  compact?: boolean;
}) {
  const tones = {
    primary: {
      bg: "linear-gradient(135deg, #44612e 0%, #536d39 100%)",
      text: "#fbf8ee",
      label: "rgba(235, 230, 210, 0.8)",
    },
    cream: {
      bg: "#fff",
      text: "#1f2a17",
      label: "#667351",
      border: "1px solid rgba(177, 184, 156, 0.6)",
    },
    sage: {
      bg: "rgba(102, 115, 81, 0.12)",
      text: "#44612e",
      label: "#667351",
    },
  };
  const t = tones[tone];
  return (
    <div
      style={{
        padding: compact ? "7px 11px" : "10px 15px",
        borderRadius: compact ? 12 : 16,
        background: t.bg,
        color: t.text,
        border: (t as any).border ?? "none",
        boxShadow:
          tone === "cream"
            ? "0 1px 3px rgba(68, 97, 46, 0.06)"
            : "0 2px 8px rgba(68, 97, 46, 0.18)",
        minWidth: compact ? 72 : 92,
      }}
    >
      <p
        style={{
          fontSize: compact ? 8.5 : 9.5,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: t.label,
          marginBottom: compact ? 2 : 3,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: compact ? 14 : 16.5,
          fontWeight: 800,
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function StatCardGraphic({
  label,
  value,
  accent,
  compact = false,
}: {
  label: string;
  value: string;
  accent: "cream" | "green" | "gold";
  compact?: boolean;
}) {
  const accents: Record<string, { badgeBg: string; badgeText: string; ring: string }> = {
    cream: {
      badgeBg: "#fbf8ee",
      badgeText: "#1f2a17",
      ring: "rgba(251, 248, 238, 0.16)",
    },
    green: {
      badgeBg: "#d6e6d0",
      badgeText: "#3e6b33",
      ring: "rgba(214, 230, 208, 0.28)",
    },
    gold: {
      badgeBg:
        "linear-gradient(135deg, #f0e3c4 0%, #e9d59e 100%)",
      badgeText: "#8a671e",
      ring: "rgba(240, 227, 196, 0.25)",
    },
  };
  const a = accents[accent];
  return (
    <div
      style={{
        padding: compact ? "10px 11px 11px" : "14px 14px 15px",
        borderRadius: compact ? 16 : 20,
        background: a.badgeBg,
        boxShadow:
          "0 6px 16px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
        border: `1.5px solid ${a.ring}`,
      }}
    >
      <p
        style={{
          fontSize: compact ? 8.5 : 9.5,
          color: accent === "cream" ? "#667351" : a.badgeText,
          opacity: 0.85,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginBottom: compact ? 4 : 6,
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: a.badgeText,
          fontSize: compact
            ? value.length > 7
              ? 17
              : 20
            : value.length > 7
            ? 20
            : 25,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function MicroStat({
  label,
  value,
  compact = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div style={{ textAlign: "center", padding: compact ? "4px 3px" : "6px 4px" }}>
      <p
        style={{
          fontSize: compact ? 8 : 9,
          color: "#667351",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: compact ? 2 : 3,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: compact ? 13 : 16,
          fontWeight: 800,
          color: "#44612e",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function AvatarGraphic({
  url,
  name,
  size = 32,
}: {
  url?: string;
  name: string;
  size?: number;
}) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: url
          ? `url(${url}) center/cover no-repeat, #d8dbc3`
          : "linear-gradient(135deg, #667351 0%, #44612e 100%)",
        border: "1.5px solid #fff",
        boxShadow: "0 1px 3px rgba(68, 97, 46, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fbf8ee",
        fontSize: Math.round(size * 0.4),
        fontWeight: 800,
        flexShrink: 0,
      }}
    >
      {!url && initials}
    </div>
  );
}

function FakeQR({ size = 5 }: { size?: number }) {
  const modules = [
    [1, 1, 1, 1, 1, 0, 1, 0],
    [1, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 1, 0, 1, 1, 0, 0],
    [1, 0, 0, 0, 1, 0, 1, 1],
    [1, 1, 1, 1, 1, 0, 0, 1],
    [0, 0, 1, 0, 0, 1, 1, 0],
    [1, 0, 1, 1, 0, 1, 0, 1],
    [0, 1, 0, 1, 1, 0, 1, 1],
  ];
  const cell = size;
  return (
    <svg width={cell * 8} height={cell * 8} viewBox={`0 0 ${cell * 8} ${cell * 8}`}>
      {modules.map((row, y) =>
        row.map((v, x) =>
          v ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell - 0.5}
              height={cell - 0.5}
              rx={0.8}
              fill="#44612e"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}

function UserCircleGraphic({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#44612e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function truncate(text: string, maxLines: number): string {
  const words = text.trim().split(/\s+/);
  const maxCharsPerLine = 26;
  const limit = maxCharsPerLine * maxLines;
  if (text.length <= limit) return text;
  let out = "";
  let count = 0;
  for (const w of words) {
    const next = (out ? out + " " : "") + w;
    if (next.length > limit - 1) break;
    out = next;
    count++;
  }
  if (!out) return words[0]?.slice(0, limit - 1) + "…" ?? "";
  return out + "…";
}
