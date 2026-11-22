import { cn } from "@/lib/utils";

/** A circular progress indicator. `value` runs from 0 to 1. */
export function ProgressRing({
  value,
  size = 48,
  stroke = 5,
  color = "var(--primary)",
  track = "var(--border)",
  className,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(Math.max(value, 0), 1);
  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          opacity={v === 0 ? 0 : 1}
          className="transition-[stroke-dashoffset,opacity] duration-500 ease-out"
        />
      </svg>
      <div className="relative grid place-items-center">{children}</div>
    </div>
  );
}
