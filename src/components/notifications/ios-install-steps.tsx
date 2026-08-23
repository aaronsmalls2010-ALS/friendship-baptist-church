"use client";

import { Bell, Share, PlusSquare } from "lucide-react";

/**
 * iPhone / iPad instructions.
 *
 * iOS only delivers web push to a site that has been added to the Home Screen
 * (16.4+), so on an un-installed iPhone every notification surface shows these
 * three steps instead of a switch that could never work.
 */
export function IosInstallSteps({ dark = false }: { dark?: boolean }) {
  const body = dark ? "text-white/80" : "text-warm-600 dark:text-warm-300";
  const accent = dark ? "text-gold-300" : "text-purple-700";
  const strong = dark ? "text-white" : "text-warm-900 dark:text-warm-50";

  return (
    <ol className={`space-y-2.5 text-sm ${body}`}>
      <li className="flex items-start gap-2.5">
        <Share className={`mt-0.5 h-4 w-4 shrink-0 ${accent}`} />
        <span>
          Tap the <span className={`font-semibold ${strong}`}>Share</span> button
          at the bottom of Safari.
        </span>
      </li>
      <li className="flex items-start gap-2.5">
        <PlusSquare className={`mt-0.5 h-4 w-4 shrink-0 ${accent}`} />
        <span>
          Scroll down and choose{" "}
          <span className={`font-semibold ${strong}`}>Add to Home Screen</span>,
          then tap <span className={`font-semibold ${strong}`}>Add</span>.
        </span>
      </li>
      <li className="flex items-start gap-2.5">
        <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${accent}`} />
        <span>
          Open the new Friendship Baptist icon on your Home Screen, then turn
          notifications on from there.
        </span>
      </li>
    </ol>
  );
}
