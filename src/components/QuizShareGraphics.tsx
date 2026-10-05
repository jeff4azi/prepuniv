import { useRef, useState } from "react";
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
                      <div className="absolute inset-0 [transform:scale(0.6667)] [transform-origin:top_left] [width:150%] [height:150%]">
                        {i === 0 && <TemplateMinimal data={data} />}
                        {i === 1 && <TemplateStats data={data} />}
                        {i === 2 && <TemplateCreator data={data} />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                  <Badge variant="primary" size="sm" dot>
                    <ImageIcon className="w-3 h-3" />
                    Preview
                  </Badge>
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
              <div className="grid grid-cols-3 gap-2.5">
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
                    <div className="absolute inset-0 [transform:scale(0.3)] [transform-origin:top_left] [width:333.333%] [height:333.333%]">
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
    return (
      <div
        ref={ref}
        className="absolute inset-0 flex flex-col"
        style={{
          background:
            "linear-gradient(160deg, #fbf8ee 0%, #f4efdb 45%, #ece4c6 100%)",
          fontFamily:
            "'Lexend', 'Inter', system-ui, -apple-system, sans-serif",
          color: "#1f2a17",
          padding: "44px 40px 40px",
        }}
      >
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-2.5">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-soft"
              style={{
                background:
                  "linear-gradient(135deg, #44612e 0%, #667351 100%)",
              }}
            >
              <span style={{ color: "#fbf8ee", fontSize: 18, fontWeight: 800 }}>
                P
              </span>
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16, lineHeight: 1, letterSpacing: "-0.01em" }}>
                PrepUniv
              </p>
              <p style={{ fontSize: 10.5, color: "#667351", fontWeight: 500, marginTop: 2 }}>
                Study smarter, together
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(102, 115, 81, 0.12)",
              color: "#44612e",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
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
            padding: "9px 18px",
            borderRadius: 14,
            background: "#44612e",
            color: "#fbf8ee",
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {data.courseCode}
          {data.courseTitle && ` · ${data.courseTitle}`.slice(0, 26)}
        </div>

        <h1
          style={{
            fontSize: 40,
            lineHeight: 1.08,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "14px 0 16px",
            color: "#1f2a17",
          }}
        >
          {truncate(data.quizTitle, 7)}
        </h1>

        <p
          style={{
            fontSize: 14.5,
            lineHeight: 1.55,
            color: "#3a4a2c",
            fontWeight: 400,
            marginBottom: 28,
            minHeight: 44,
          }}
        >
          {data.quizDescription
            ? truncate(data.quizDescription, 2)
            : `${data.questionCount} carefully crafted questions to test your understanding and help you ace your next exam.`}
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: "auto",
            flexWrap: "wrap",
          }}
        >
          <Pill label="Questions" value={`${data.questionCount}`} tone="primary" />
          <Pill label="Price" value={formatNaira(data.priceKobo)} tone="cream" />
          <Pill
            label="Attempts"
            value={data.attemptCount.toLocaleString("en-NG")}
            tone="sage"
          />
        </div>

        <div
          style={{
            marginTop: 36,
            padding: "22px 24px",
            borderRadius: 24,
            background:
              "linear-gradient(135deg, rgba(68, 97, 46, 0.08) 0%, rgba(102, 115, 81, 0.06) 100%)",
            border: "1.5px solid rgba(68, 97, 46, 0.18)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 11, color: "#667351", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                Ready to test yourself?
              </p>
              <p style={{ fontSize: 17, fontWeight: 700, color: "#1f2a17", letterSpacing: "-0.01em" }}>
                Start now on PrepUniv →
              </p>
            </div>
            <div
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                background: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 2px 8px rgba(68, 97, 46, 0.08), 0 1px 3px rgba(68, 97, 46, 0.04)",
                border: "1px solid rgba(177, 184, 156, 0.5)",
              }}
            >
              <FakeQR />
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AvatarGraphic url={data.creatorAvatarUrl} name={data.creatorName} size={30} />
            <p style={{ fontSize: 12, color: "#667351", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              by <span style={{ color: "#44612e", fontWeight: 700 }}>{data.creatorName}</span>
            </p>
          </div>
          <p style={{ fontSize: 10, color: "#859173", fontWeight: 500, letterSpacing: "0.04em" }}>
            prepuniv.app
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
        className="absolute inset-0 flex flex-col"
        style={{
          background:
            "linear-gradient(155deg, #44612e 0%, #3a5327 40%, #2f4421 100%)",
          fontFamily:
            "'Lexend', 'Inter', system-ui, -apple-system, sans-serif",
          padding: "40px 36px 36px",
          position: "relative",
          overflow: "hidden",
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
          className="flex items-center justify-between mb-8"
          style={{ position: "relative" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="h-10 w-10 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(251, 248, 238, 0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(251, 248, 238, 0.2)",
              }}
            >
              <span style={{ color: "#fbf8ee", fontSize: 18, fontWeight: 800 }}>
                P
              </span>
            </div>
            <div>
              <p style={{ color: "#fbf8ee", fontWeight: 700, fontSize: 16, lineHeight: 1, letterSpacing: "-0.01em" }}>
                PrepUniv
              </p>
              <p style={{ fontSize: 10.5, color: "rgba(235, 230, 210, 0.7)", fontWeight: 500, marginTop: 2 }}>
                Creator performance
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              padding: "6px 12px",
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

        <div style={{ marginBottom: 8, position: "relative" }}>
          <span
            style={{
              display: "inline-block",
              padding: "6px 14px",
              borderRadius: 12,
              background: "rgba(251, 248, 238, 0.12)",
              border: "1px solid rgba(251, 248, 238, 0.2)",
              color: "#ece4c6",
              fontSize: 12.5,
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
            fontSize: 30,
            lineHeight: 1.15,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#fbf8ee",
            margin: "12px 0 24px",
          }}
        >
          {truncate(data.quizTitle, 5)}
        </h1>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 22,
          }}
        >
          <StatCardGraphic
            label="Attempts"
            value={data.attemptCount.toLocaleString("en-NG")}
            accent={data.attemptCount >= 100 ? "gold" : "cream"}
          />
          <StatCardGraphic
            label="Earnings"
            value={formatNaira(data.creatorEarningsKobo)}
            accent="green"
          />
          <StatCardGraphic
            label="Questions"
            value={`${data.questionCount}`}
            accent="cream"
          />
          <StatCardGraphic
            label="Price"
            value={formatNaira(data.priceKobo)}
            accent="cream"
          />
        </div>

        <div
          style={{
            position: "relative",
            padding: "18px 20px",
            borderRadius: 22,
            background:
              "linear-gradient(135deg, rgba(251, 248, 238, 0.14) 0%, rgba(251, 248, 238, 0.08) 100%)",
            border: "1.5px solid rgba(251, 248, 238, 0.22)",
            marginBottom: "auto",
          }}
        >
          <div className="flex items-start gap-2.5">
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 999,
                background: "#d6e6d0",
                color: "#3e6b33",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 14,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              !
            </div>
            <div>
              <p style={{ color: "#fbf8ee", fontSize: 14, fontWeight: 700, lineHeight: 1.35, letterSpacing: "-0.01em" }}>
                {data.attemptCount >= 20
                  ? `${data.attemptCount.toLocaleString("en-NG")} students already attempted this. Don't be left behind!`
                  : "Fresh quiz on the block. Be among the first to test your knowledge."}
              </p>
              <p style={{ color: "rgba(235, 230, 210, 0.7)", fontSize: 11.5, marginTop: 4, fontWeight: 500, lineHeight: 1.4 }}>
                {data.courseCode} · {data.questionCount} questions · Instant scoring with explanations
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 24,
            padding: "18px 22px",
            borderRadius: 22,
            background: "#fbf8ee",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow:
              "0 8px 24px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div>
            <p style={{ fontSize: 10, color: "#667351", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
              Take the challenge
            </p>
            <p style={{ color: "#1f2a17", fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>
              Attempt now →
            </p>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              background: "linear-gradient(135deg, #44612e 0%, #667351 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 10px rgba(68, 97, 46, 0.35)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbf8ee" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </div>
        </div>

        <p
          style={{
            position: "relative",
            textAlign: "center",
            marginTop: 18,
            fontSize: 10.5,
            color: "rgba(235, 230, 210, 0.6)",
            letterSpacing: "0.05em",
            fontWeight: 500,
          }}
        >
          Created by {data.creatorName} · prepuniv.app
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
        className="absolute inset-0 flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, #fbf8ee 0%, #f6f0d9 100%)",
          fontFamily:
            "'Lexend', 'Inter', system-ui, -apple-system, sans-serif",
          padding: "36px 36px 34px",
          color: "#1f2a17",
          position: "relative",
          overflow: "hidden",
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

        <div className="flex items-center justify-between mb-8" style={{ position: "relative" }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 10,
                background: "linear-gradient(135deg, #44612e 0%, #667351 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ color: "#fbf8ee", fontSize: 13, fontWeight: 800 }}>P</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: "-0.01em", color: "#44612e" }}>
              PrepUniv
            </span>
          </div>
          <span
            style={{
              fontSize: 9.5,
              padding: "5px 11px",
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
          className="flex items-center gap-4 mb-6"
          style={{ position: "relative" }}
        >
          <div
            style={{
              width: 68,
              height: 68,
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
                fontSize: 22,
                border: "2px solid #fbf8ee",
              }}
            >
              {!data.creatorAvatarUrl && initials}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "#667351", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 3 }}>
              Hey, I'm
            </p>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#1f2a17", lineHeight: 1, marginBottom: 5 }}>
              {data.creatorName}
            </h2>
            <p style={{ fontSize: 12, color: "#3a4a2c", lineHeight: 1.4, fontWeight: 400, maxWidth: 200 }}>
              {data.creatorBio
                ? truncate(data.creatorBio, 1)
                : `${data.courseCode} quiz creator · helping you pass exams ✨`}
            </p>
          </div>
        </div>

        <div
          style={{
            position: "relative",
            padding: "20px 20px 22px",
            borderRadius: 26,
            background:
              "linear-gradient(155deg, #fff 0%, #fbf8ee 55%, #f4efdb 100%)",
            border: "1.5px solid rgba(177, 184, 156, 0.6)",
            boxShadow:
              "0 10px 28px rgba(68, 97, 46, 0.10), 0 3px 10px rgba(68, 97, 46, 0.06)",
            marginBottom: "auto",
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div
              style={{
                display: "inline-flex",
                padding: "7px 14px",
                borderRadius: 12,
                background: "rgba(68, 97, 46, 0.10)",
                color: "#44612e",
                fontSize: 12,
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
                gap: 5,
                padding: "7px 14px",
                borderRadius: 12,
                background: "#44612e",
                color: "#fbf8ee",
                fontSize: 12.5,
                fontWeight: 800,
              }}
            >
              <span>{formatNaira(data.priceKobo)}</span>
            </div>
          </div>

          <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: "#1f2a17", lineHeight: 1.15, marginBottom: 10 }}>
            {truncate(data.quizTitle, 6)}
          </h3>

          <p style={{ fontSize: 13, color: "#3a4a2c", lineHeight: 1.55, fontWeight: 400, marginBottom: 18 }}>
            I put this together for <span style={{ color: "#44612e", fontWeight: 700 }}>YOU</span> —{" "}
            {data.questionCount} hand-picked questions to make sure you walk into that exam hall with confidence. 💪
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              padding: "12px",
              borderRadius: 18,
              background: "rgba(102, 115, 81, 0.08)",
            }}
          >
            <MicroStat label="Q's" value={`${data.questionCount}`} />
            <MicroStat
              label="Attempts"
              value={data.attemptCount.toLocaleString("en-NG")}
            />
            <MicroStat
              label="Avg. score"
              value={
                data.attemptCount > 20
                  ? "58%"
                  : "TBD"
              }
            />
          </div>
        </div>

        <div
          style={{
            position: "relative",
            marginTop: 22,
            padding: "16px 20px",
            borderRadius: 20,
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
            <p style={{ fontSize: 10, color: "rgba(235, 230, 210, 0.8)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
              Get it on
            </p>
            <p style={{ color: "#fbf8ee", fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em" }}>
              PrepUniv →
            </p>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              background: "#fbf8ee",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <UserCircleGraphic size={28} />
          </div>
        </div>

        <p
          style={{
            position: "relative",
            textAlign: "center",
            marginTop: 14,
            fontSize: 10.5,
            color: "#859173",
            fontWeight: 500,
            letterSpacing: "0.03em",
          }}
        >
          prepuniv.app · share the prep, share the pass 🎓
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
}: {
  label: string;
  value: string;
  tone: "primary" | "cream" | "sage";
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
        padding: "10px 15px",
        borderRadius: 16,
        background: t.bg,
        color: t.text,
        border: (t as any).border ?? "none",
        boxShadow:
          tone === "cream"
            ? "0 1px 3px rgba(68, 97, 46, 0.06)"
            : "0 2px 8px rgba(68, 97, 46, 0.18)",
        minWidth: 92,
      }}
    >
      <p style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: t.label, marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}>
        {value}
      </p>
    </div>
  );
}

function StatCardGraphic({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "cream" | "green" | "gold";
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
        padding: "14px 14px 15px",
        borderRadius: 20,
        background: a.badgeBg,
        boxShadow:
          "0 6px 16px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255,255,255,0.6)",
        border: `1.5px solid ${a.ring}`,
      }}
    >
      <p style={{ fontSize: 9.5, color: accent === "cream" ? "#667351" : a.badgeText, opacity: 0.85, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </p>
      <p
        style={{
          color: a.badgeText,
          fontSize: value.length > 7 ? 20 : 25,
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

function MicroStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center", padding: "6px 4px" }}>
      <p style={{ fontSize: 9, color: "#667351", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 16, fontWeight: 800, color: "#44612e", letterSpacing: "-0.01em", lineHeight: 1 }}>
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

function FakeQR() {
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
  const cell = 5;
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
