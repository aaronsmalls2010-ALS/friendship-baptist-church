"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeIn } from "@/components/motion/fade-in";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  X,
  Home,
} from "lucide-react";

interface FamilyMember {
  profile_id: string;
  relationship: string | null;
  profiles?: { first_name?: string; last_name?: string; email?: string; photo_url?: string } | null;
}
interface Family {
  id: string;
  name: string;
  created_at: string;
  members: FamilyMember[];
}
interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function AdminFamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [allMembers, setAllMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  // Create / rename dialog
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Family | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation dialog
  const [confirmDeleteFamily, setConfirmDeleteFamily] = useState<Family | null>(null);

  // Manage members dialog
  const [membersOpen, setMembersOpen] = useState(false);
  const [activeFamily, setActiveFamily] = useState<Family | null>(null);
  const [addProfileId, setAddProfileId] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");
      const [famRes, memRes] = await Promise.all([
        fetch("/api/admin/families"),
        fetch("/api/admin/members"),
      ]);
      if (!famRes.ok) {
        const d = await famRes.json();
        throw new Error(d.error || "Failed to load families");
      }
      const famData = await famRes.json();
      setFamilies(famData.families ?? []);
      if (memRes.ok) {
        const memData = await memRes.json();
        setAllMembers(
          (memData.members ?? []).map((m: MemberOption) => ({
            id: m.id,
            first_name: m.first_name,
            last_name: m.last_name,
            email: m.email,
          }))
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load families");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  function openCreate() {
    setEditing(null);
    setNameInput("");
    setFormOpen(true);
  }
  function openRename(family: Family) {
    setEditing(family);
    setNameInput(family.name);
    setFormOpen(true);
  }

  async function handleSave() {
    if (!nameInput.trim()) return;
    setSaving(true);
    try {
      const res = editing
        ? await fetch(`/api/admin/families/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nameInput.trim() }),
          })
        : await fetch("/api/admin/families", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: nameInput.trim() }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save family");
      setToast({ type: "success", message: editing ? "Family renamed." : "Family created." });
      setFormOpen(false);
      await fetchData();
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(family: Family) {
    setConfirmDeleteFamily(family);
  }

  async function doDeleteFamily(family: Family) {
    setConfirmDeleteFamily(null);
    try {
      const res = await fetch(`/api/admin/families/${family.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to delete");
      }
      setToast({ type: "success", message: "Family deleted." });
      await fetchData();
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    }
  }

  function openMembers(family: Family) {
    setActiveFamily(family);
    setAddProfileId("");
    setMembersOpen(true);
  }

  async function handleAddMember() {
    if (!activeFamily || !addProfileId) return;
    try {
      const res = await fetch(`/api/admin/families/${activeFamily.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: addProfileId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to add member");
      }
      setAddProfileId("");
      const famRes = await fetch("/api/admin/families");
      const famData = await famRes.json();
      setFamilies(famData.families ?? []);
      setActiveFamily(
        (famData.families ?? []).find((f: Family) => f.id === activeFamily.id) ?? activeFamily
      );
      setToast({ type: "success", message: "Member added to family." });
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    }
  }

  async function handleRemoveMember(profileId: string) {
    if (!activeFamily) return;
    try {
      const res = await fetch(`/api/admin/families/${activeFamily.id}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: profileId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to remove member");
      }
      const famRes = await fetch("/api/admin/families");
      const famData = await famRes.json();
      setFamilies(famData.families ?? []);
      setActiveFamily(
        (famData.families ?? []).find((f: Family) => f.id === activeFamily.id) ?? activeFamily
      );
      setToast({ type: "success", message: "Member removed." });
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed" });
    }
  }

  function memberName(m: FamilyMember) {
    const p = m.profiles;
    return p ? `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email : m.profile_id;
  }

  function memberInitials(m: FamilyMember) {
    const p = m.profiles;
    const first = (p?.first_name ?? "")[0] ?? "";
    const last = (p?.last_name ?? "")[0] ?? "";
    return (first + last).toUpperCase() || "?";
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Families" description="Manage church families" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Families" description="Manage church families" />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
          <p className="text-warm-500 text-sm mb-4">{error}</p>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              fetchData();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Members not yet in the active family (for the add dropdown)
  const assignable = activeFamily
    ? allMembers.filter(
        (m) => !activeFamily.members.some((fm) => fm.profile_id === m.id)
      )
    : [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Families"
        description={`${families.length} famil${families.length === 1 ? "y" : "ies"}`}
        action={
          <Button onClick={openCreate} className="bg-purple-700 hover:bg-purple-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Family
          </Button>
        }
      />

      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {families.length === 0 ? (
        <FadeIn>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-warm-200 dark:border-warm-800 py-16 text-center">
            <Home className="h-10 w-10 text-warm-300 mb-3" />
            <p className="text-warm-600 font-medium">No families yet</p>
            <p className="text-warm-400 text-sm mb-4">
              Create a family, then add members or let members join it themselves.
            </p>
            <Button onClick={openCreate} className="bg-purple-700 hover:bg-purple-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Family
            </Button>
          </div>
        </FadeIn>
      ) : (
        <FadeIn>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((family) => (
              <div
                key={family.id}
                className="rounded-xl border border-warm-100 dark:border-warm-800 p-4 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-lg text-warm-900 dark:text-warm-50">
                      {family.name}
                    </h3>
                    <p className="text-xs text-warm-400 flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3" />
                      {family.members.length} member
                      {family.members.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
                      onClick={() => openRename(family)}
                      title="Rename"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-warm-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(family)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center flex-1">
                  {family.members.length === 0 ? (
                    <span className="text-sm text-warm-400">No members yet</span>
                  ) : (
                    <div className="flex -space-x-2">
                      {family.members.slice(0, 6).map((m) => (
                        <Avatar
                          key={m.profile_id}
                          className="h-8 w-8 border-2 border-white dark:border-warm-900 ring-0"
                          title={memberName(m)}
                        >
                          {m.profiles?.photo_url && (
                            <AvatarImage src={m.profiles.photo_url} alt={memberName(m)} />
                          )}
                          <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-xs font-medium">
                            {memberInitials(m)}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {family.members.length > 6 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-warm-900 bg-warm-100 dark:bg-warm-800 text-xs font-medium text-warm-600 dark:text-warm-300">
                          +{family.members.length - 6}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => openMembers(family)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Create / rename dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {editing ? "Rename Family" : "New Family"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="family-name">Family name</Label>
              <Input
                id="family-name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. The Smalls Family"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !nameInput.trim()}
                className="bg-purple-700 hover:bg-purple-600 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage members dialog */}
      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              {activeFamily?.name} — Members
            </DialogTitle>
          </DialogHeader>
          {activeFamily && (
            <div className="space-y-4">
              {/* Add member */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label>Add a member</Label>
                  <Select value={addProfileId} onValueChange={setAddProfileId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {assignable.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-warm-400">
                          Everyone is already in this family
                        </div>
                      ) : (
                        assignable.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.first_name} {m.last_name} — {m.email}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddMember}
                  disabled={!addProfileId}
                  className="bg-purple-700 hover:bg-purple-600 text-white"
                >
                  Add
                </Button>
              </div>

              {/* Current members */}
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {activeFamily.members.length === 0 ? (
                  <p className="text-sm text-warm-400 py-2">No members yet.</p>
                ) : (
                  activeFamily.members.map((m) => (
                    <div
                      key={m.profile_id}
                      className="flex items-center justify-between rounded-lg border border-warm-100 dark:border-warm-800 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7">
                          {m.profiles?.photo_url && (
                            <AvatarImage src={m.profiles.photo_url} alt={memberName(m)} />
                          )}
                          <AvatarFallback className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-[11px] font-medium">
                            {memberInitials(m)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-warm-700 dark:text-warm-200">
                          {memberName(m)}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-warm-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleRemoveMember(m.profile_id)}
                        title="Remove from family"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete family confirmation */}
      <Dialog open={!!confirmDeleteFamily} onOpenChange={(o) => { if (!o) setConfirmDeleteFamily(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Family</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-warm-600 dark:text-warm-400">
            Delete the{" "}
            <span className="font-semibold text-warm-900 dark:text-warm-100">
              &ldquo;{confirmDeleteFamily?.name}&rdquo;
            </span>{" "}
            family? Members will be unlinked but not deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteFamily(null)}>Cancel</Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => confirmDeleteFamily && doDeleteFamily(confirmDeleteFamily)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
