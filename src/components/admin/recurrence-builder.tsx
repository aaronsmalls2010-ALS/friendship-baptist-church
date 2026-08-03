"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  parseRule,
  serializeRule,
  describeRule,
  WEEKDAYS,
  ORDINALS,
  type RecurrenceRule,
} from "@/lib/events/recurrence";

function IntervalRow({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <Input
        type="number"
        min={1}
        max={99}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="h-9 w-16"
      />
      <span>{unit}</span>
    </div>
  );
}

const pill = (on: boolean) =>
  cn(
    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
    on ? "bg-purple-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
  );

/**
 * Outlook/Teams-style recurrence builder. Emits a serialized rule string
 * (JSON, or "none") via onChange. Supports weekly-on-days and monthly
 * ordinal-weekday patterns like "2nd Sunday of the month".
 */
export function RecurrenceBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rule = parseRule(value);
  const set = (r: RecurrenceRule) => onChange(serializeRule(r));

  function changeFreq(f: string) {
    switch (f) {
      case "daily":
        set({ freq: "daily", interval: 1 });
        break;
      case "weekly":
        set({ freq: "weekly", interval: 1, weekdays: rule.freq === "weekly" ? rule.weekdays : [] });
        break;
      case "monthly":
        set({ freq: "monthly", interval: 1, mode: "ordinal", ordinals: [1], weekday: 0 });
        break;
      case "yearly":
        set({ freq: "yearly", interval: 1, month: 0, day: 0 });
        break;
      default:
        set({ freq: "none" });
    }
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Repeats</Label>
        <Select value={rule.freq} onValueChange={changeFreq}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {rule.freq === "daily" && (
        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <IntervalRow label="Repeat every" unit="day(s)" value={rule.interval} onChange={(n) => set({ ...rule, interval: n })} />
        </div>
      )}

      {rule.freq === "weekly" && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <IntervalRow label="Repeat every" unit="week(s)" value={rule.interval} onChange={(n) => set({ ...rule, interval: n })} />
          <div>
            <Label className="text-xs text-slate-500">On these days</Label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {WEEKDAYS.map((w) => {
                const on = rule.weekdays.includes(w.value);
                return (
                  <button
                    type="button"
                    key={w.value}
                    onClick={() =>
                      set({
                        ...rule,
                        weekdays: on
                          ? rule.weekdays.filter((d) => d !== w.value)
                          : [...rule.weekdays, w.value].sort((a, b) => a - b),
                      })
                    }
                    className={cn(pill(on), "h-8 w-11")}
                  >
                    {w.short}
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-slate-400">Leave empty to use the start date&apos;s day.</p>
          </div>
        </div>
      )}

      {rule.freq === "monthly" && (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="monthly-mode"
                checked={rule.mode === "ordinal"}
                onChange={() => set({ freq: "monthly", interval: rule.interval, mode: "ordinal", ordinals: [1], weekday: 0 })}
              />
              On the…
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="monthly-mode"
                checked={rule.mode === "day"}
                onChange={() => set({ freq: "monthly", interval: rule.interval, mode: "day", day: 1 })}
              />
              On day…
            </label>
          </div>

          {rule.mode === "ordinal" ? (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {ORDINALS.map((o) => {
                  const on = rule.ordinals.includes(o.value);
                  return (
                    <button
                      type="button"
                      key={o.value}
                      onClick={() =>
                        set({
                          ...rule,
                          ordinals: on ? rule.ordinals.filter((x) => x !== o.value) : [...rule.ordinals, o.value],
                        })
                      }
                      className={pill(on)}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
              <Select value={String(rule.weekday)} onValueChange={(v) => set({ ...rule, weekday: Number(v) })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((w) => (
                    <SelectItem key={w.value} value={String(w.value)}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-400">
                e.g. &ldquo;Second Sunday&rdquo;. Pick more than one (like 1st &amp; 3rd) if needed.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span>Day of month</span>
              <Input
                type="number"
                min={1}
                max={31}
                value={rule.day || 1}
                onChange={(e) => set({ ...rule, day: Math.min(31, Math.max(1, Number(e.target.value) || 1)) })}
                className="h-9 w-20"
              />
            </div>
          )}

          <IntervalRow label="Repeat every" unit="month(s)" value={rule.interval} onChange={(n) => set({ ...rule, interval: n })} />
        </div>
      )}

      {rule.freq !== "none" && (
        <p className="text-xs font-medium text-purple-700 dark:text-purple-300">{describeRule(value)}</p>
      )}
    </div>
  );
}
