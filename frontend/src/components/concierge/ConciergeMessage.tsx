import { memo } from "react";
import { Bot, Info, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

/** Supported chat message roles in the concierge thread. */
export type ConciergeMessageRole = "user" | "assistant" | "system";

/** Props for a single concierge message row. */
export interface ConciergeMessageProps {
  role: ConciergeMessageRole;
  text: string;
}

/** Message bubble with sender name, icon, and alignment distinction. */
export const ConciergeMessage = memo(function ConciergeMessage({
  role,
  text,
}: ConciergeMessageProps) {
  const isUser = role === "user";
  const isSystem = role === "system";
  const Icon = isSystem ? Info : isUser ? UserRound : Bot;
  const label = isSystem ? "System note" : isUser ? "You" : "StadiumPulse";

  return (
    <article
      className={cn(
        "flex gap-3",
        isUser && "justify-end",
        isSystem && "justify-center",
      )}
    >
      {!isUser && (
        <Icon
          aria-hidden="true"
          className={cn("mt-1 size-5 shrink-0", isSystem && "text-accent")}
        />
      )}
      <div
        className={cn(
          "max-w-[min(42rem,85%)] rounded-lg border border-border bg-card px-4 py-3",
          isUser && "bg-primary text-primary-foreground",
          isSystem && "bg-muted text-foreground",
        )}
      >
        <p className="text-xs font-semibold">{label}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{text}</p>
      </div>
      {isUser && <Icon aria-hidden="true" className="mt-1 size-5 shrink-0" />}
    </article>
  );
});
