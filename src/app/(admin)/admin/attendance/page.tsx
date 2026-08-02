"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Loader2,
  Search,
  ClipboardCheck,
  ArrowLeft,
  Users,
} from "lucide-react";

interface AttendanceSession {
  id: string;
  title: string;
  session_date: string;
  type: string;
  headcount: number | null;
  notes: string | null;
  present_count: number;
  created_at: string;
}

interface MemberLite {
  id: string;
  first_name: string;
  last_name: string;
}

const SESSION_TYPES = [
  { value: "service", label: "Service" },
  { value: "event", label: "Event" },
  { value: "group", label: "Group" },
  { value: "class", label: "Class" },
] as const;

const TYPE_BADGE: Record<string, string> = {
  service: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  event: "bg-peach-100 text-peach-700 dark:bg-peach-900/30 dark:text-peach-300",
  group: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
};

// A DATE column ("YYYY-MM-DD") parses as UTC midnight, which formatDate would
// render a day early in Eastern time. Anchor at local noon to keep the day.
function formatSessionDate(date: string): string {
  return formatDate(`${date}T12:00:00`);
}

function todayInputValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Record-attendance flow
  const [flowOpen, setFlowOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  // Step 1 — session fields
  const [title, setTitle] = useState("");
  const [sessionDate, setSessionDate] = useState(todayInputValue());
  const [type, setType] = useState<string>("service");
  const [headcount, setHeadcount] = useState("");
  const [notes, setNotes] = useState("");

  // Step 2 — member checklist
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [present, setPresent] = useState<Record<string, boolean>>({});
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<AttendanceSession | null>(null);

  async function loadSessions() {
    try {
      setError(null);
      const res = await fetch("/api/admin/attendance");
      if (!res.ok) throw new Error("Failed to load attendance sessions");
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } catch (err) {
      console.error("Failed to load attendance:", err);
      setError("We couldn't load attendance sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  // ── Flow control ──────────────────────────────────────────────────
  function resetFlow() {
    setStep(1);
    setTitle("");
    setSessionDate(todayInputValue());
    setType("service");
    setHeadcount("");
    setNotes("");
    setMemberSearch("");
    setPresent({});
    setActiveSessionId(null);
    setFlowError(null);
    setSaving(false);
  }

  function openFlow() {
    resetFlow();
    setFlowOpen(true);
  }

  async function loadMembers() {
    setMembersLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      const data = await res.json();
      const list: MemberLite[] = (data.members ?? []).map(
        (m: { id: string; first_name: string; last_name: string }) => ({
          id: m.id,
          first_name: m.first_name ?? "",
          last_name: m.last_name ?? "",
        })
      );
      list.sort((a, b) =>
        `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
      );
      setMembers(list);
    } catch (err) {
      console.error("Failed to load members:", err);
      setFlowError("We couldn't load the member list.");
    } finally {
      setMembersLoading(false);
    }
  }

  // Step 1 -> create the session, then advance to the checklist.
  async function handleCreateSession() {
    if (!title.trim()) {
      setFlowError("A title is required.");
      return;
    }
    if (!sessionDate) {
      setFlowError("A date is required.");
      return;
    }
    setFlowError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          session_date: sessionDate,
          type,
          headcount: headcount ? Number(headcount) : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create session");
      const data = await res.json();
      setActiveSessionId(data.session.id);
      setStep(2);
      if (members.length === 0) loadMembers();
    } catch (err) {
      console.error(err);
      setFlowError("We couldn't create the session. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function toggleMember(id: string) {
    setPresent((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const presentCount = useMemo(
    () => Object.values(present).filter(Boolean).length,
    [present]
  );

  const filteredMembers = useMemo(() => {
    const term = memberSearch.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(term)
    );
  }, [members, memberSearch]);

  // Step 2 -> persist the marked records (and any updated headcount).
  async function handleSaveRecords() {
    if (!activeSessionId) return;
    setFlowError(null);
    setSaving(true);
    try {
      const records = members.map((m) => ({
        profile_id: m.id,
        present: !!present[m.id],
      }));

      if (records.length > 0) {
        const res = await fetch(
          `/api/admin/attendance/${activeSessionId}/records`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records }),
          }
        );
        if (!res.ok) throw new Error("Failed to save records");
      }

      // Persist a manually adjusted headcount if the user changed it on step 2.
      if (headcount) {
        await fetch(`/api/admin/attendance/${activeSessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ headcount: Number(headcount) }),
        });
      }

      setFlowOpen(false);
      resetFlow();
      loadSessions();
    } catch (err) {
      console.error(err);
      setFlowError("We couldn't save attendance. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function openDeleteDialog(session: AttendanceSession) {
    setDeleting(session);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/admin/attendance/${deleting.id}`, {
        method: "DELETE",
      });
      if (res.ok) loadSessions();
    } catch (err) {
      console.error(err);
    }
    setDeleteOpen(false);
    setDeleting(null);
  }

  // ── Columns ───────────────────────────────────────────────────────
  const columns = [
    {
      key: "session_date",
      label: "Date",
      sortable: true,
      render: (item: AttendanceSession) => formatSessionDate(item.session_date),
    },
    {
      key: "title",
      label: "Title",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      render: (item: AttendanceSession) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            TYPE_BADGE[item.type] ?? "bg-warm-100 text-warm-700"
          }`}
        >
          {item.type}
        </span>
      ),
    },
    {
      key: "present_count",
      label: "Attendance",
      render: (item: AttendanceSession) => {
        const headcount = item.headcount ?? null;
        return (
          <span className="inline-flex items-center gap-1.5 text-sm text-warm-700 dark:text-warm-300">
            <Users className="h-3.5 w-3.5 text-warm-400" />
            <span className="font-medium">{item.present_count}</span>
            {headcount != null && (
              <span className="text-warm-400">/ {headcount}</span>
            )}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: AttendanceSession) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-red-600 hover:bg-red-50"
            title="Delete session"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Loading state ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Attendance"
        description="Record and review attendance for services, events, groups, and classes"
        action={
          <Button
            onClick={openFlow}
            className="bg-purple-700 hover:bg-purple-600 text-white"
          >
            <ClipboardCheck className="mr-2 h-4 w-4" />
            Record Attendance
          </Button>
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center dark:border-red-900/40 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              setLoading(true);
              loadSessions();
            }}
          >
            Retry
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-warm-200 bg-warm-50/50 py-16 text-center dark:border-warm-800 dark:bg-warm-900/30">
          <ClipboardCheck className="mx-auto h-10 w-10 text-warm-300" />
          <h3 className="mt-4 font-heading text-lg font-semibold text-warm-900 dark:text-warm-50">
            No attendance recorded yet
          </h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-warm-500">
            Record your first session to start tracking who attends services,
            events, groups, and classes.
          </p>
          <Button
            onClick={openFlow}
            className="mt-4 bg-purple-700 hover:bg-purple-600 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Attendance
          </Button>
        </div>
      ) : (
        <DataTable
          data={sessions as unknown as Record<string, unknown>[]}
          columns={columns as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["title", "type"]}
        />
      )}

      {/* Record Attendance Flow */}
      <Dialog
        open={flowOpen}
        onOpenChange={(open) => {
          setFlowOpen(open);
          if (!open) resetFlow();
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {step === 1 ? "New Attendance Session" : "Mark Who Attended"}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Name the session and pick its date and type."
                : "Check each member who attended, or use the quick headcount."}
            </DialogDescription>
          </DialogHeader>

          {/* Step 1 — session details */}
          {step === 1 && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateSession();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="att-title">Title</Label>
                <Input
                  id="att-title"
                  placeholder="e.g. Sunday Morning Worship"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="att-date">Date</Label>
                  <Input
                    id="att-date"
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="att-type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="att-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="att-notes">Notes (optional)</Label>
                <Textarea
                  id="att-notes"
                  placeholder="Anything worth noting about this session"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {flowError && (
                <p role="alert" className="text-sm text-red-600">
                  {flowError}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFlowOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* Step 2 — member checklist */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-warm-50 px-3 py-2 dark:bg-warm-800">
                <span className="text-sm text-warm-600 dark:text-warm-300">
                  <span className="font-semibold text-warm-900 dark:text-warm-50">
                    {presentCount}
                  </span>{" "}
                  marked present
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="att-headcount" className="text-xs text-warm-500">
                    Quick headcount
                  </Label>
                  <Input
                    id="att-headcount"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="0"
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    className="h-8 w-20"
                  />
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
                <Input
                  placeholder="Search members…"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-warm-100 dark:border-warm-800">
                {membersLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <p className="py-10 text-center text-sm text-warm-400">
                    {members.length === 0
                      ? "No members found."
                      : "No members match your search."}
                  </p>
                ) : (
                  <ul className="divide-y divide-warm-100 dark:divide-warm-800">
                    {filteredMembers.map((m) => (
                      <li key={m.id}>
                        <label
                          htmlFor={`att-m-${m.id}`}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-warm-50 dark:hover:bg-warm-800/60"
                        >
                          <Checkbox
                            id={`att-m-${m.id}`}
                            checked={!!present[m.id]}
                            onCheckedChange={() => toggleMember(m.id)}
                          />
                          <span className="text-sm text-warm-700 dark:text-warm-200">
                            {m.first_name} {m.last_name}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {flowError && (
                <p role="alert" className="text-sm text-red-600">
                  {flowError}
                </p>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setFlowError(null);
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveRecords}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    "Save Attendance"
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Delete Session
            </DialogTitle>
            <DialogDescription>
              This permanently removes the session and its attendance records.
            </DialogDescription>
          </DialogHeader>
          {deleting && (
            <p className="text-sm text-warm-600">
              <span className="font-medium">{deleting.title}</span> (
              {formatSessionDate(deleting.session_date)}) will be removed.
            </p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
