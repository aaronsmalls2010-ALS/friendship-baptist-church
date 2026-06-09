"use client";

import { useState, useEffect } from "react";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Memorial {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  date_of_birth?: string;
  date_of_passing: string;
  obituary: string;
  scripture?: string;
  scripture_text?: string;
  favorite_hymn?: string;
  church_roles?: string[];
  family_message?: string;
}

export default function PortalMemorialsPage() {
  const [memorials, setMemorials] = useState<Memorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Memorial | null>(null);

  useEffect(() => {
    fetch("/api/portal/memorials")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setMemorials(d.memorials ?? []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-24">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  );

  if (selected) return (
    <FadeIn>
      <div className="max-w-2xl mx-auto space-y-6 px-4 py-6">
        <button onClick={() => setSelected(null)} className="text-sm text-purple-600 hover:underline">← Back to Hall of Angels</button>
        <div className="text-center space-y-2">
          {selected.photo_url ? (
            <img src={selected.photo_url} alt={`${selected.first_name} ${selected.last_name}`}
              className="h-32 w-32 rounded-full object-cover mx-auto border-4 border-purple-100" />
          ) : (
            <div className="h-32 w-32 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
              <Heart className="h-12 w-12 text-purple-400" />
            </div>
          )}
          <h1 className="font-heading text-2xl font-bold text-warm-900 dark:text-warm-50">
            {selected.first_name} {selected.last_name}
          </h1>
          <p className="text-warm-500">
            {selected.date_of_birth ? `${formatDate(selected.date_of_birth)} — ` : ""}{formatDate(selected.date_of_passing)}
          </p>
          {selected.church_roles && selected.church_roles.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {selected.church_roles.map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
          )}
        </div>

        {selected.obituary && (
          <div>
            <h2 className="font-semibold text-warm-800 dark:text-warm-200 mb-2">In Memory</h2>
            <p className="text-warm-700 dark:text-warm-300 leading-relaxed whitespace-pre-wrap">{selected.obituary}</p>
          </div>
        )}

        {selected.scripture && (
          <blockquote className="border-l-4 border-purple-300 pl-4 italic text-warm-600 dark:text-warm-400">
            {selected.scripture_text && <p className="mb-1">&ldquo;{selected.scripture_text}&rdquo;</p>}
            <cite className="text-sm not-italic font-medium">— {selected.scripture}</cite>
          </blockquote>
        )}

        {selected.favorite_hymn && (
          <p className="text-sm text-warm-500">Favorite Hymn: <span className="font-medium">{selected.favorite_hymn}</span></p>
        )}

        {selected.family_message && (
          <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4">
            <h2 className="font-semibold text-warm-800 dark:text-warm-200 mb-2">From the Family</h2>
            <p className="text-warm-700 dark:text-warm-300 leading-relaxed">{selected.family_message}</p>
          </div>
        )}
      </div>
    </FadeIn>
  );

  return (
    <FadeIn>
      <div className="space-y-6 px-4 py-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Heart className="h-8 w-8 text-purple-400" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-warm-900 dark:text-warm-50">Hall of Angels</h1>
          <p className="text-warm-500">Honoring our beloved church family members who have gone home</p>
        </div>

        {memorials.length === 0 ? (
          <p className="text-center text-warm-400 py-12">No memorials published yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {memorials.map((m) => (
              <button key={m.id} onClick={() => setSelected(m)}
                className="text-left rounded-xl border border-warm-100 dark:border-warm-800 bg-white dark:bg-warm-950 p-5 hover:border-purple-300 hover:shadow-md transition-all space-y-3">
                <div className="flex items-center gap-3">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={`${m.first_name} ${m.last_name}`}
                      className="h-12 w-12 rounded-full object-cover border-2 border-purple-100 shrink-0" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Heart className="h-5 w-5 text-purple-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-warm-900 dark:text-warm-50">{m.first_name} {m.last_name}</p>
                    <p className="text-xs text-warm-500">{formatDate(m.date_of_passing)}</p>
                  </div>
                </div>
                {m.obituary && (
                  <p className="text-sm text-warm-600 dark:text-warm-400 line-clamp-2">{m.obituary}</p>
                )}
                <p className="text-xs text-purple-600 font-medium">Read more →</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
