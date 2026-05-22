"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

function getRequirements(password: string): Requirement[] {
  return [
    { label: "At least 12 characters", met: password.length >= 12 },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
    { label: "Contains number", met: /[0-9]/.test(password) },
    {
      label: "Contains special character",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];
}

function getStrengthScore(requirements: Requirement[]): number {
  return requirements.filter((r) => r.met).length;
}

function getStrengthLabel(score: number): string {
  if (score <= 1) return "Weak";
  if (score <= 2) return "Fair";
  if (score <= 3) return "Strong";
  return "Excellent";
}

function getStrengthColor(score: number): string {
  if (score <= 1) return "bg-red-500";
  if (score === 2) return "bg-orange-500";
  if (score === 3) return "bg-yellow-500";
  return "bg-green-500";
}

function getStrengthTextColor(score: number): string {
  if (score <= 1) return "text-red-600";
  if (score === 2) return "text-orange-600";
  if (score === 3) return "text-yellow-600";
  return "text-green-600";
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const requirements = useMemo(() => getRequirements(password), [password]);
  const score = useMemo(() => getStrengthScore(requirements), [requirements]);
  const label = getStrengthLabel(score);
  const barColor = getStrengthColor(score);
  const textColor = getStrengthTextColor(score);
  const percentage = (score / 5) * 100;

  if (!password) return null;

  return (
    <div className="space-y-3">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-warm-500">Password strength</span>
          <span className={`text-xs font-medium ${textColor}`}>{label}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-warm-200">
          <motion.div
            className={`h-full rounded-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-green-500" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 text-warm-400" />
            )}
            <span className={req.met ? "text-green-700" : "text-warm-500"}>
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
