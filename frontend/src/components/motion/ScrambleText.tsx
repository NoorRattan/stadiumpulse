import { useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  tag?: "h1" | "h2" | "h3" | "p" | "span";
  children?: ReactNode;
}

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

/**
 * Scrambles characters one-by-one before revealing each letter of `text`.
 * Falls back to plain text for reduced-motion users.
 */
export function ScrambleText({
  text,
  className = "",
  delay = 0,
  duration = 800,
  tag: Tag = "span",
}: ScrambleTextProps): JSX.Element {
  const [animatedText, setAnimatedText] = useState(() =>
    Array.from(text, () => " "),
  );
  const reduced = useReducedMotionSafe();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const displayed = reduced ? Array.from(text) : animatedText;

  useEffect(() => {
    if (reduced) {
      return;
    }

    timerRef.current = setTimeout(() => {
      const chars = Array.from(text);
      const total = chars.length;
      if (total === 0) return;
      const stepMs = duration / total;

      // Start all as scrambled
      setAnimatedText(chars.map(() => randomChar()));

      chars.forEach((finalChar, index) => {
        // Scramble rapidly for this position, then lock it
        const scrambleTicks = 4;
        for (let t = 0; t < scrambleTicks; t++) {
          setTimeout(
            () => {
              setAnimatedText((prev) => {
                const next = [...prev];
                next[index] = randomChar();
                return next;
              });
            },
            stepMs * index + (t * stepMs) / scrambleTicks,
          );
        }
        // Lock the final character
        setTimeout(
          () => {
            setAnimatedText((prev) => {
              const next = [...prev];
              next[index] = finalChar;
              return next;
            });
          },
          stepMs * (index + 1),
        );
      });
    }, delay);

    return () => {
      if (timerRef.current !== undefined) clearTimeout(timerRef.current);
    };
  }, [text, delay, duration, reduced]);

  return (
    <Tag aria-label={text} className={`font-mono tracking-widest ${className}`}>
      {displayed.map((ch, i) => (
        <span
          key={i}
          style={{
            color:
              ch !== text[i] && ch !== " " ? "var(--primary)" : "currentColor",
            transition: "color 0.05s",
          }}
        >
          {ch}
        </span>
      ))}
    </Tag>
  );
}
