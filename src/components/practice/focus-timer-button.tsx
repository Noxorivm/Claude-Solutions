"use client";

import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

// CTA del estado vacío (docs/06 §microcopy): enfoca el botón de inicio
// del cronómetro.
export function FocusTimerButton() {
  return (
    <Button
      variant="outline"
      className="h-11"
      onClick={() => {
        document.getElementById("practice-timer-start")?.focus();
        document
          .getElementById("practice-timer-start")
          ?.scrollIntoView({ block: "center", behavior: "smooth" });
      }}
    >
      {strings.practice.emptyCta}
    </Button>
  );
}
