"use client";

import { Pause, Play, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, useTransition } from "react";
import { toast } from "sonner";

import { recordPracticeSession } from "@/actions/practice";
import { showAchievementToasts } from "@/components/achievement-toasts";
import {
  SessionFields,
  type SessionFieldsValue,
} from "@/components/practice/session-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PracticeFormOptions } from "@/db/queries/practice";
import { formatRelativeDays } from "@/lib/format";
import { strings } from "@/lib/strings";

const t = strings.practice;

// localStorage SOLO para el timer en curso (docs/03 §E1: el cronómetro
// sobrevive a recargas); ningún dato de negocio vive en el cliente.
const LS_KEY = "claude-solutions-practice-timer";

interface TimerSnapshot {
  state: "running" | "paused";
  /** epoch ms del último (re)inicio; solo significativo en running. */
  startedAt: number;
  accumulatedSec: number;
}

function readSnapshot(): TimerSnapshot | null {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimerSnapshot;
    if (
      (parsed.state === "running" || parsed.state === "paused") &&
      typeof parsed.startedAt === "number" &&
      typeof parsed.accumulatedSec === "number"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: TimerSnapshot | null): void {
  try {
    if (snapshot) {
      window.localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
    } else {
      window.localStorage.removeItem(LS_KEY);
    }
  } catch {
    // localStorage indisponible: el timer funciona, sin persistencia.
  }
}

function formatElapsed(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

const emptySubscribe = () => () => {};

// Reloj como external store: snapshot cuantizado al segundo (estable
// dentro del mismo segundo, requisito de useSyncExternalStore).
const tickSubscribe = (callback: () => void) => {
  const id = setInterval(callback, 250);
  return () => clearInterval(id);
};
const nowSecSnapshot = () => Math.floor(Date.now() / 1000);

const EMPTY_FIELDS: SessionFieldsValue = {
  techniqueId: "",
  lessonId: "",
  rating: null,
  notes: "",
};

export function PracticeTimer({ options }: { options: PracticeFormOptions }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [snapshot, setSnapshot] = useState<TimerSnapshot | null>(() => {
    if (typeof window === "undefined") return null;
    return readSnapshot();
  });
  const nowSec = useSyncExternalStore(tickSubscribe, nowSecSnapshot, () => 0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fields, setFields] = useState<SessionFieldsValue>(EMPTY_FIELDS);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const elapsedSec = snapshot
    ? snapshot.accumulatedSec +
      (snapshot.state === "running"
        ? Math.max(0, nowSec - Math.floor(snapshot.startedAt / 1000))
        : 0)
    : 0;

  function update(next: TimerSnapshot | null): void {
    writeSnapshot(next);
    setSnapshot(next);
  }

  function handleStart(): void {
    update({ state: "running", startedAt: Date.now(), accumulatedSec: 0 });
  }

  function handlePause(): void {
    if (!snapshot) return;
    update({ state: "paused", startedAt: 0, accumulatedSec: elapsedSec });
  }

  function handleResume(): void {
    if (!snapshot) return;
    update({
      state: "running",
      startedAt: Date.now(),
      accumulatedSec: snapshot.accumulatedSec,
    });
  }

  function handleFinish(): void {
    if (elapsedSec < 60) {
      toast.error(t.minDuration);
      return;
    }
    // Congela el tiempo mientras se rellena el cierre (cancelar = pausa).
    update({ state: "paused", startedAt: 0, accumulatedSec: elapsedSec });
    setFieldsError(null);
    setDialogOpen(true);
  }

  function handleSave(): void {
    if (!fields.techniqueId && !fields.lessonId) {
      setFieldsError(t.needTarget);
      return;
    }
    setFieldsError(null);
    startTransition(async () => {
      const result = await recordPracticeSession({
        durationSec: snapshot?.accumulatedSec ?? elapsedSec,
        techniqueId: fields.techniqueId || null,
        lessonId: fields.lessonId || null,
        selfRating: fields.rating,
        notes: fields.notes.trim() || null,
        performedAt: new Date().toISOString(),
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.capped
          ? t.savedCapped(result.xpAwarded)
          : t.savedXp(result.xpAwarded),
      );
      if (result.nextReviewAt) {
        toast(
          t.nextReviewToast(
            formatRelativeDays(new Date(result.nextReviewAt), new Date()),
          ),
        );
      }
      showAchievementToasts(result.newAchievements);
      update(null);
      setFields(EMPTY_FIELDS);
      setDialogOpen(false);
      router.refresh();
    });
  }

  const state = snapshot?.state ?? "idle";

  return (
    <section
      aria-label={t.timerLabel}
      // Regla de oro del cronómetro (R2b-2): marco con la dirección pero
      // superficie CASI SÓLIDA (reading-surface gana a la veladura del
      // marco) — los dígitos no compiten con la atmósfera.
      className="ornate-frame-sutil reading-surface p-6 text-center"
    >
      <p className="heading-eyebrow">{t.timerLabel}</p>
      <p className="mt-2 font-mono text-[60px] leading-none" aria-live="off">
        {mounted ? formatElapsed(elapsedSec) : "00:00"}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {state === "idle" ? (
          <Button
            id="practice-timer-start"
            size="lg"
            className="h-12 min-w-40"
            onClick={handleStart}
            disabled={!mounted}
          >
            <Play aria-hidden />
            {t.start}
          </Button>
        ) : null}
        {state === "running" ? (
          <Button
            size="lg"
            variant="outline"
            className="h-12 min-w-32"
            onClick={handlePause}
          >
            <Pause aria-hidden />
            {t.pause}
          </Button>
        ) : null}
        {state === "paused" ? (
          <Button size="lg" className="h-12 min-w-32" onClick={handleResume}>
            <Play aria-hidden />
            {t.resume}
          </Button>
        ) : null}
        {state !== "idle" ? (
          <Button
            size="lg"
            variant="secondary"
            className="h-12 min-w-32"
            onClick={handleFinish}
          >
            <Square aria-hidden />
            {t.finish}
          </Button>
        ) : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.dialogTitle}</DialogTitle>
          </DialogHeader>
          <p className="font-mono text-2xl">{formatElapsed(elapsedSec)}</p>
          <SessionFields
            options={options}
            value={fields}
            onChange={setFields}
            idPrefix="timer"
          />
          <div aria-live="polite">
            {fieldsError ? (
              <p className="text-sm text-danger-ink">{fieldsError}</p>
            ) : null}
          </div>
          <Button onClick={handleSave} disabled={pending} className="h-11">
            {pending ? t.saving : t.save}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
