"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { FadeIn } from "@/components/motion/fade-in";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOCK_MINISTRIES,
  MOCK_MINISTRY_MEMBERS,
  MOCK_MINISTRY_MESSAGES,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
  Users,
  Clock,
  Mail,
  UserCog,
  Trash2,
} from "lucide-react";
import type { MinistryMember, MinistryMessage, MinistryRole } from "@/types";

// ── Toast component ──────────────────────────────────────────────────
function Toast({
  type,
  message,
}: {
  type: "success" | "error";
  message: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        type === "success"
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-red-50 text-red-800 border border-red-200"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────
export default function MinistryDetailPage() {
  const params = useParams<{ id: string }>();
  const ministryId = params.id;

  // Find the ministry from mock data
  const ministry = MOCK_MINISTRIES.find((m) => m.id === ministryId);

  // Local state for members (so we can modify on approve/deny/role change/remove)
  const [members, setMembers] = useState<MinistryMember[]>(
    MOCK_MINISTRY_MEMBERS.filter((mm) => mm.ministry_id === ministryId)
  );

  // Messages state
  const [messages] = useState<MinistryMessage[]>(
    MOCK_MINISTRY_MESSAGES.filter((msg) => msg.ministry_id === ministryId)
  );

  // UI state
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Compose message state
  const [showCompose, setShowCompose] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Auto-dismiss toast
  useState(() => {
    // no-op on mount, handled in effect below
  });

  // Derived data
  const approvedMembers = useMemo(
    () => members.filter((m) => m.status === "approved"),
    [members]
  );

  const pendingMembers = useMemo(
    () => members.filter((m) => m.status === "pending"),
    [members]
  );

  const manager = useMemo(
    () =>
      approvedMembers.find((m) => m.role === "manager"),
    [approvedMembers]
  );

  // Filtered approved members for search
  const filteredApproved = useMemo(() => {
    if (!search) return approvedMembers;
    const term = search.toLowerCase();
    return approvedMembers.filter(
      (m) =>
        m.profile_name?.toLowerCase().includes(term) ||
        m.profile_email?.toLowerCase().includes(term)
    );
  }, [approvedMembers, search]);

  // ── Show toast with auto-dismiss ───────────────────────────────────
  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  // ── Handle approve/deny ────────────────────────────────────────────
  async function handleMemberAction(
    memberId: string,
    action: "approve" | "deny"
  ) {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/admin/ministries/${ministryId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data.error || `Failed to ${action} member`
        );
      }

      // Update local state
      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId
            ? {
                ...m,
                status: action === "approve" ? "approved" : "denied",
                approved_at:
                  action === "approve"
                    ? new Date().toISOString()
                    : m.approved_at,
              }
            : m
        )
      );

      const member = members.find((m) => m.id === memberId);
      showToast(
        "success",
        `${member?.profile_name ?? "Member"} has been ${action === "approve" ? "approved" : "denied"}.`
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : `Failed to ${action} member`
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ── Handle role change ─────────────────────────────────────────────
  async function handleRoleChange(memberId: string, newRole: MinistryRole) {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/admin/ministries/${ministryId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          action: "update_role",
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update role");
      }

      setMembers((prev) =>
        prev.map((m) =>
          m.id === memberId ? { ...m, role: newRole } : m
        )
      );

      const member = members.find((m) => m.id === memberId);
      showToast(
        "success",
        `${member?.profile_name ?? "Member"} is now ${newRole === "manager" ? "a Manager" : "a Member"}.`
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to update role"
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ── Handle remove member ───────────────────────────────────────────
  async function handleRemoveMember(memberId: string) {
    setActionLoading(memberId);
    try {
      const res = await fetch(`/api/admin/ministries/${ministryId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: memberId, action: "remove" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove member");
      }

      const member = members.find((m) => m.id === memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      showToast(
        "success",
        `${member?.profile_name ?? "Member"} has been removed from the ministry.`
      );
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to remove member"
      );
    } finally {
      setActionLoading(null);
    }
  }

  // ── Handle send message ────────────────────────────────────────────
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch(
        `/api/admin/ministries/${ministryId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: composeSubject.trim(),
            body: composeBody.trim(),
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      showToast("success", "Message sent to all ministry members.");
      setComposeSubject("");
      setComposeBody("");
      setShowCompose(false);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to send message"
      );
    } finally {
      setSendingMessage(false);
    }
  }

  // ── Not found state ────────────────────────────────────────────────
  if (!ministry) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Ministry Not Found" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-warm-700 font-medium mb-2">
            Ministry not found
          </p>
          <p className="text-warm-500 text-sm mb-4">
            The ministry you are looking for does not exist or has been removed.
          </p>
          <Link href="/admin/ministries">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Ministries
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Main render ────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Ministry Header */}
      <div className="space-y-4">
        <Link
          href="/admin/ministries"
          className="inline-flex items-center gap-1.5 text-sm text-warm-500 hover:text-purple-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Ministries
        </Link>

        <AdminPageHeader
          title={ministry.name}
          description={ministry.description}
        />

        <div className="flex flex-wrap gap-3">
          {ministry.schedule && (
            <Badge
              variant="outline"
              className="border-0 bg-purple-50 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              {ministry.schedule}
            </Badge>
          )}
          {manager && (
            <Badge
              variant="outline"
              className="border-0 bg-blue-50 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 gap-1.5"
            >
              <UserCog className="h-3.5 w-3.5" />
              Manager: {manager.profile_name}
            </Badge>
          )}
          <Badge
            variant="outline"
            className={`border-0 gap-1.5 ${
              ministry.is_active
                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
            }`}
          >
            {ministry.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} />}

      {/* Tabs */}
      <FadeIn>
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members" className="gap-1.5">
              <Users className="h-4 w-4" />
              Members ({approvedMembers.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Pending
              {pendingMembers.length > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-yellow-900">
                  {pendingMembers.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-1.5">
              <Mail className="h-4 w-4" />
              Messages ({messages.length})
            </TabsTrigger>
          </TabsList>

          {/* ── Members Tab ──────────────────────────────────────── */}
          <TabsContent value="members" className="space-y-4">
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Members table */}
            <div className="rounded-xl border border-warm-100 dark:border-warm-800 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-warm-50 dark:bg-warm-900">
                    <TableHead className="font-medium">Name</TableHead>
                    <TableHead className="font-medium">Email</TableHead>
                    <TableHead className="font-medium">Role</TableHead>
                    <TableHead className="font-medium">Joined</TableHead>
                    <TableHead className="font-medium text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApproved.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-warm-400"
                      >
                        {search
                          ? "No members match your search"
                          : "No approved members"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApproved.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <span className="font-medium text-warm-900 dark:text-warm-50">
                            {member.profile_name ?? "Unknown"}
                          </span>
                        </TableCell>
                        <TableCell className="text-warm-600 dark:text-warm-400">
                          {member.profile_email ?? "—"}
                        </TableCell>
                        <TableCell>
                          {actionLoading === member.id ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                              <span className="text-sm text-warm-500">
                                Updating...
                              </span>
                            </div>
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(value) =>
                                handleRoleChange(
                                  member.id,
                                  value as MinistryRole
                                )
                              }
                            >
                              <SelectTrigger className="w-[130px] h-8 border-0 bg-transparent hover:bg-warm-50 dark:hover:bg-warm-800 focus:ring-1 focus:ring-purple-500 p-0 pl-1">
                                <Badge
                                  variant="outline"
                                  className={`border-0 cursor-pointer ${
                                    member.role === "manager"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                                  }`}
                                >
                                  {member.role === "manager"
                                    ? "Manager"
                                    : "Member"}
                                </Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">
                                  <span className="flex items-center gap-2">
                                    <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                                    Member
                                  </span>
                                </SelectItem>
                                <SelectItem value="manager">
                                  <span className="flex items-center gap-2">
                                    <span className="inline-block h-2 w-2 rounded-full bg-purple-400" />
                                    Manager
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-warm-500">
                            {member.approved_at
                              ? formatDate(member.approved_at)
                              : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={actionLoading === member.id}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Pending Requests Tab ─────────────────────────────── */}
          <TabsContent value="pending" className="space-y-4">
            {pendingMembers.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-10 w-10 text-green-400 mb-3" />
                <p className="text-warm-700 dark:text-warm-200 font-medium mb-1">
                  No pending requests
                </p>
                <p className="text-warm-500 text-sm">
                  All membership requests have been processed.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="p-4 space-y-3 border-warm-100 dark:border-warm-800"
                  >
                    <div>
                      <h3 className="font-medium text-warm-900 dark:text-warm-50">
                        {member.profile_name ?? "Unknown"}
                      </h3>
                      <p className="text-sm text-warm-500">
                        {member.profile_email ?? "No email"}
                      </p>
                    </div>
                    <p className="text-xs text-warm-400">
                      Requested {formatDate(member.requested_at)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white gap-1.5"
                        onClick={() =>
                          handleMemberAction(member.id, "approve")
                        }
                        disabled={actionLoading === member.id}
                      >
                        {actionLoading === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1.5"
                        onClick={() =>
                          handleMemberAction(member.id, "deny")
                        }
                        disabled={actionLoading === member.id}
                      >
                        {actionLoading === member.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5" />
                        )}
                        Deny
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Messages Tab ─────────────────────────────────────── */}
          <TabsContent value="messages" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-warm-700 dark:text-warm-200">
                Ministry Messages
              </h3>
              <Button
                size="sm"
                className="bg-purple-700 hover:bg-purple-600 text-white gap-1.5"
                onClick={() => setShowCompose(!showCompose)}
              >
                <Send className="h-3.5 w-3.5" />
                {showCompose ? "Cancel" : "Compose Message"}
              </Button>
            </div>

            {/* Compose form */}
            {showCompose && (
              <Card className="p-4 border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-900/10">
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="msg_subject">Subject</Label>
                    <Input
                      id="msg_subject"
                      placeholder="Message subject..."
                      value={composeSubject}
                      onChange={(e) => setComposeSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="msg_body">Message</Label>
                    <Textarea
                      id="msg_body"
                      placeholder="Write your message to all ministry members..."
                      value={composeBody}
                      onChange={(e) => setComposeBody(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-warm-400">
                      This message will be sent to {approvedMembers.length}{" "}
                      approved member{approvedMembers.length !== 1 ? "s" : ""}.
                    </p>
                    <Button
                      type="submit"
                      className="bg-purple-700 hover:bg-purple-600 text-white gap-1.5"
                      disabled={sendingMessage}
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send to All Members
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Message list */}
            {messages.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-12 text-center">
                <Mail className="h-10 w-10 text-warm-300 mb-3" />
                <p className="text-warm-700 dark:text-warm-200 font-medium mb-1">
                  No messages yet
                </p>
                <p className="text-warm-500 text-sm">
                  Use the compose button to send the first message to this
                  ministry.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <Card
                    key={msg.id}
                    className="p-4 border-warm-100 dark:border-warm-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-medium text-warm-900 dark:text-warm-50 truncate">
                          {msg.subject}
                        </h4>
                        <p className="text-sm text-warm-500 mt-1 line-clamp-2">
                          {msg.body}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-3 text-xs text-warm-400">
                      <span>
                        Sent by{" "}
                        <span className="font-medium text-warm-600 dark:text-warm-300">
                          {msg.sender_name ?? "Unknown"}
                        </span>
                      </span>
                      <span>·</span>
                      <span>{formatDate(msg.sent_at)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </FadeIn>
    </div>
  );
}
