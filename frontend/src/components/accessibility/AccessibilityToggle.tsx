import { memo, useContext } from "react";

import { AccessibilityContext } from "@/contexts/AccessibilityContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/** Toggle cluster for high contrast, reduced motion, and screen-reader mode. */
export const AccessibilityToggle = memo(function AccessibilityToggle() {
  const preferences = useContext(AccessibilityContext);

  if (!preferences) {
    return null;
  }

  return (
    <fieldset className="flex flex-wrap items-center gap-3 text-sm text-foreground">
      <legend className="sr-only">Accessibility preferences</legend>
      <div className="flex min-h-11 items-center gap-2">
        <Checkbox
          id="high-contrast-toggle"
          checked={preferences.highContrast}
          onCheckedChange={(checked) =>
            preferences.setHighContrast(checked === true)
          }
        />
        <Label htmlFor="high-contrast-toggle">High contrast</Label>
      </div>
      <div className="flex min-h-11 items-center gap-2">
        <Checkbox
          id="reduced-motion-toggle"
          checked={preferences.reducedMotion}
          onCheckedChange={(checked) =>
            preferences.setReducedMotionOverride(checked === true)
          }
        />
        <Label htmlFor="reduced-motion-toggle">Reduce motion</Label>
      </div>
      <div className="flex min-h-11 items-center gap-2">
        <Checkbox
          id="screen-reader-toggle"
          checked={preferences.screenReaderMode}
          onCheckedChange={(checked) =>
            preferences.setScreenReaderMode(checked === true)
          }
        />
        <Label htmlFor="screen-reader-toggle">Screen reader</Label>
      </div>
    </fieldset>
  );
});
