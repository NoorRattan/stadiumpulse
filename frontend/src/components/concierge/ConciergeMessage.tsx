import { memo } from "react";
import { Bot, Info, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";

/** Supported chat message roles in the concierge thread. */
export type ConciergeMessageRole = "user" | "assistant" | "system";

/** Props for a single concierge message row. */
interface ConciergeMessageProps {
  role: ConciergeMessageRole;
  text: string;
}

const messagePresentation = {
  user: {
    Icon: UserRound,
    articleClassName: "justify-end",
    bubbleClassName: "bg-primary text-primary-foreground",
    label: "You",
    leadingIcon: false,
  },
  assistant: {
    Icon: Bot,
    articleClassName: undefined,
    bubbleClassName: undefined,
    label: "StadiumPulse",
    leadingIcon: true,
  },
  system: {
    Icon: Info,
    articleClassName: "justify-center",
    bubbleClassName: "bg-muted text-foreground",
    label: "System note",
    leadingIcon: true,
  },
} as const;

/** Message bubble with sender name, icon, and alignment distinction. */
export const ConciergeMessage = memo(function ConciergeMessage({
  role,
  text,
}: ConciergeMessageProps) {
  const presentation = messagePresentation[role];
  const { Icon } = presentation;

  return (
    <article className={cn("flex gap-3", presentation.articleClassName)}>
      {presentation.leadingIcon && (
        <Icon
          aria-hidden="true"
          className={cn(
            "mt-1 size-5 shrink-0",
            role === "system" && "text-accent",
          )}
        />
      )}
      <div
        className={cn(
          "max-w-[min(42rem,85%)] rounded-lg border border-border bg-card px-4 py-3",
          presentation.bubbleClassName,
        )}
      >
        <p className="text-xs font-semibold">{presentation.label}</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{text}</p>
      </div>
      {!presentation.leadingIcon && (
        <Icon aria-hidden="true" className="mt-1 size-5 shrink-0" />
      )}
    </article>
  );
});
