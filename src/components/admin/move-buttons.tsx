"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import type { AdminMutationResult } from "@/actions/admin/shared";
import { Button } from "@/components/ui/button";
import { strings } from "@/lib/strings";

const t = strings.admin.reorder;

// Botones ↑/↓ accesibles (docs/03 §H3). La server action concreta llega
// por props: el mismo componente reordena cursos, módulos, lecciones o
// preguntas.
export function MoveButtons({
  id,
  title,
  isFirst,
  isLast,
  action,
}: {
  id: string;
  title: string;
  isFirst: boolean;
  isLast: boolean;
  action: (input: {
    id: string;
    direction: "up" | "down";
  }) => Promise<AdminMutationResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: "up" | "down"): void {
    startTransition(async () => {
      const result = await action({ id, direction });
      if (!result.ok) {
        toast.error(result.error ?? strings.common.genericError);
        return;
      }
      router.refresh();
    });
  }

  return (
    <span className="inline-flex gap-1">
      <Button
        variant="outline"
        size="icon"
        disabled={pending || isFirst}
        onClick={() => move("up")}
        aria-label={`${t.moveUp} ${title}`}
        className="size-8"
      >
        ↑
      </Button>
      <Button
        variant="outline"
        size="icon"
        disabled={pending || isLast}
        onClick={() => move("down")}
        aria-label={`${t.moveDown} ${title}`}
        className="size-8"
      >
        ↓
      </Button>
    </span>
  );
}
