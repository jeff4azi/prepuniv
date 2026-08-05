/**
 * MathText — renders a string that may contain inline LaTeX delimited by $…$
 *
 * Segments without $ are rendered as plain text.
 * Segments inside $…$ are rendered via KaTeX.
 *
 * Usage:
 *   <MathText text="The speed of light is $3 \times 10^8\text{ m/s}$" />
 */
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  /** Extra class applied to the wrapping span */
  className?: string;
  /** KaTeX display mode — false (inline) by default */
  displayMode?: boolean;
}

/** Split a string into alternating [plain, math, plain, math, …] segments. */
function splitMath(
  text: string,
): Array<{ type: "text" | "math"; value: string }> {
  const segments: Array<{ type: "text" | "math"; value: string }> = [];
  // Match $...$ but not $$...$$  (we only support inline for now)
  const re = /\$([^$]+)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push({ type: "text", value: text.slice(last, m.index) });
    }
    segments.push({ type: "math", value: m[1] });
    last = m.index + m[0].length;
  }

  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }

  return segments;
}

function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
  } catch {
    // Fallback: show the raw latex wrapped in $ so it's still readable
    return `$${latex}$`;
  }
}

export function MathText({
  text,
  className,
  displayMode = false,
}: MathTextProps) {
  const segments = splitMath(text);

  // Fast path: no math in string
  if (segments.length === 1 && segments[0].type === "text") {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.value}</span>
        ) : (
          <span
            key={i}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: renderMath(seg.value, displayMode),
            }}
          />
        ),
      )}
    </span>
  );
}
