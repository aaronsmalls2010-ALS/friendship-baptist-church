"use client";

import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { FadeIn } from "@/components/motion/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { MOCK_MEMORIALS, MOCK_PROFILES } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import type { Memorial, MemorialComment } from "@/types";
import {
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  MessageCircle,
  Heart,
  Plus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helper: look up profile name by id                                 */
/* ------------------------------------------------------------------ */
function profileName(id: string) {
  const p = MOCK_PROFILES.find((pr) => pr.id === id);
  return p ? `${p.first_name} ${p.last_name}` : id;
}

/* ================================================================== */
/*  Page Component                                                     */
/* ================================================================== */
export default function MemorialManagementPage() {
  const [memorials, setMemorials] = useState<Memorial[]>(
    () => [...MOCK_MEMORIALS]
  );

  /* ── form dialog state ────────────────────────────────────────── */
  const [formOpen, setFormOpen] = useState(false);
  const [editingMemorial, setEditingMemorial] = useState<Memorial | null>(null);

  /* ── delete confirmation dialog ────────────────────────────────── */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingMemorial, setDeletingMemorial] = useState<Memorial | null>(
    null
  );

  /* ── comments panel ────────────────────────────────────────────── */
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsMemorial, setCommentsMemorial] = useState<Memorial | null>(
    null
  );

  /* ── delete-comment confirmation ───────────────────────────────── */
  const [deleteCommentOpen, setDeleteCommentOpen] = useState(false);
  const [deletingComment, setDeletingComment] =
    useState<MemorialComment | null>(null);

  /* ── form field state ──────────────────────────────────────────── */
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formDateOfBirth, setFormDateOfBirth] = useState("");
  const [formDateOfPassing, setFormDateOfPassing] = useState("");
  const [formObituary, setFormObituary] = useState("");
  const [formScripture, setFormScripture] = useState("");
  const [formScriptureText, setFormScriptureText] = useState("");
  const [formHymn, setFormHymn] = useState("");
  const [formRoles, setFormRoles] = useState("");
  const [formFamilyMessage, setFormFamilyMessage] = useState("");
  const [formIsPublished, setFormIsPublished] = useState(false);

  /* ── helpers ───────────────────────────────────────────────────── */

  function resetForm() {
    setFormFirstName("");
    setFormLastName("");
    setFormDateOfBirth("");
    setFormDateOfPassing("");
    setFormObituary("");
    setFormScripture("");
    setFormScriptureText("");
    setFormHymn("");
    setFormRoles("");
    setFormFamilyMessage("");
    setFormIsPublished(false);
    setEditingMemorial(null);
  }

  function openCreateDialog() {
    resetForm();
    setFormOpen(true);
  }

  function openEditDialog(memorial: Memorial) {
    setEditingMemorial(memorial);
    setFormFirstName(memorial.first_name);
    setFormLastName(memorial.last_name);
    setFormDateOfBirth(memorial.date_of_birth ?? "");
    setFormDateOfPassing(memorial.date_of_passing);
    setFormObituary(memorial.obituary);
    setFormScripture(memorial.scripture ?? "");
    setFormScriptureText(memorial.scripture_text ?? "");
    setFormHymn(memorial.favorite_hymn ?? "");
    setFormRoles(memorial.church_roles?.join(", ") ?? "");
    setFormFamilyMessage(memorial.family_message ?? "");
    setFormIsPublished(memorial.is_published);
    setFormOpen(true);
  }

  function handleSave() {
    const roles = formRoles
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    if (editingMemorial) {
      setMemorials((prev) =>
        prev.map((m) =>
          m.id === editingMemorial.id
            ? {
                ...m,
                first_name: formFirstName,
                last_name: formLastName,
                date_of_birth: formDateOfBirth || undefined,
                date_of_passing: formDateOfPassing,
                obituary: formObituary,
                scripture: formScripture || undefined,
                scripture_text: formScriptureText || undefined,
                favorite_hymn: formHymn || undefined,
                church_roles: roles.length > 0 ? roles : undefined,
                family_message: formFamilyMessage || undefined,
                is_published: formIsPublished,
                updated_at: new Date().toISOString(),
              }
            : m
        )
      );
    } else {
      const newMemorial: Memorial = {
        id: `mem${Date.now()}`,
        created_by: "p14", // admin user
        first_name: formFirstName,
        last_name: formLastName,
        date_of_birth: formDateOfBirth || undefined,
        date_of_passing: formDateOfPassing,
        obituary: formObituary,
        scripture: formScripture || undefined,
        scripture_text: formScriptureText || undefined,
        favorite_hymn: formHymn || undefined,
        church_roles: roles.length > 0 ? roles : undefined,
        family_message: formFamilyMessage || undefined,
        is_published: formIsPublished,
        photos: [],
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setMemorials((prev) => [...prev, newMemorial]);
    }
    setFormOpen(false);
    resetForm();
  }

  /* ── delete ────────────────────────────────────────────────────── */

  function openDeleteDialog(memorial: Memorial) {
    setDeletingMemorial(memorial);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (deletingMemorial) {
      setMemorials((prev) =>
        prev.filter((m) => m.id !== deletingMemorial.id)
      );
    }
    setDeleteOpen(false);
    setDeletingMemorial(null);
  }

  /* ── toggle publish ────────────────────────────────────────────── */

  function togglePublish(memorial: Memorial) {
    setMemorials((prev) =>
      prev.map((m) =>
        m.id === memorial.id
          ? { ...m, is_published: !m.is_published, updated_at: new Date().toISOString() }
          : m
      )
    );
  }

  /* ── comments ──────────────────────────────────────────────────── */

  function openCommentsDialog(memorial: Memorial) {
    setCommentsMemorial(memorial);
    setCommentsOpen(true);
  }

  function openDeleteCommentDialog(comment: MemorialComment) {
    setDeletingComment(comment);
    setDeleteCommentOpen(true);
  }

  function handleDeleteComment() {
    if (deletingComment && commentsMemorial) {
      setMemorials((prev) =>
        prev.map((m) =>
          m.id === commentsMemorial.id
            ? {
                ...m,
                comments: m.comments.filter(
                  (c) => c.id !== deletingComment.id
                ),
              }
            : m
        )
      );
      // Update local reference for the comments panel
      setCommentsMemorial((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter(
                (c) => c.id !== deletingComment.id
              ),
            }
          : null
      );
    }
    setDeleteCommentOpen(false);
    setDeletingComment(null);
  }

  /* ── table columns ─────────────────────────────────────────────── */

  const columns = [
    {
      key: "first_name",
      label: "Name",
      sortable: true,
      render: (item: Memorial) => (
        <div className="flex items-center gap-2">
          <Heart className="h-4 w-4 text-purple-400 shrink-0" />
          <span className="font-medium text-warm-900">
            {item.first_name} {item.last_name}
          </span>
        </div>
      ),
    },
    {
      key: "date_of_passing",
      label: "Date of Passing",
      sortable: true,
      render: (item: Memorial) => formatDate(item.date_of_passing),
    },
    {
      key: "created_by",
      label: "Created By",
      render: (item: Memorial) => (
        <span className="text-warm-600">{profileName(item.created_by)}</span>
      ),
    },
    {
      key: "is_published",
      label: "Status",
      render: (item: Memorial) => (
        <Badge
          variant={item.is_published ? "default" : "secondary"}
          className={
            item.is_published
              ? "bg-green-100 text-green-800 hover:bg-green-200"
              : "bg-warm-100 text-warm-600 hover:bg-warm-200"
          }
        >
          {item.is_published ? "Published" : "Draft"}
        </Badge>
      ),
    },
    {
      key: "comments",
      label: "Comments",
      render: (item: Memorial) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openCommentsDialog(item);
          }}
          className="h-8 gap-1.5 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
          title="View comments"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs font-medium">{item.comments.length}</span>
        </Button>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (item: Memorial) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              togglePublish(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
            title={item.is_published ? "Unpublish" : "Publish"}
          >
            {item.is_published ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openEditDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-purple-700 hover:bg-purple-50"
            title="Edit memorial"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteDialog(item);
            }}
            className="h-8 w-8 p-0 text-warm-500 hover:text-red-600 hover:bg-red-50"
            title="Delete memorial"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <FadeIn direction="up">
      <div className="space-y-6">
        <AdminPageHeader
          title="Loved Ones Gone Home"
          description="Manage memorial entries for departed church family members"
          action={
            <Button
              onClick={openCreateDialog}
              className="bg-purple-700 hover:bg-purple-600 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Memorial
            </Button>
          }
        />

        <DataTable
          data={memorials as unknown as Record<string, unknown>[]}
          columns={columns as unknown as Parameters<typeof DataTable>[0]["columns"]}
          searchable
          searchKeys={["first_name", "last_name"]}
        />

        {/* ── Create / Edit Memorial Dialog ──────────────────────────── */}
        <Dialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                {editingMemorial ? "Edit Memorial" : "Add Memorial"}
              </DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    placeholder="First name"
                    value={formFirstName}
                    onChange={(e) => setFormFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    placeholder="Last name"
                    value={formLastName}
                    onChange={(e) => setFormLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formDateOfBirth}
                    onChange={(e) => setFormDateOfBirth(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_passing">Date of Passing</Label>
                  <Input
                    id="date_of_passing"
                    type="date"
                    value={formDateOfPassing}
                    onChange={(e) => setFormDateOfPassing(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Obituary */}
              <div className="space-y-2">
                <Label htmlFor="obituary">Obituary</Label>
                <Textarea
                  id="obituary"
                  placeholder="Obituary / life story"
                  rows={5}
                  value={formObituary}
                  onChange={(e) => setFormObituary(e.target.value)}
                  required
                />
              </div>

              {/* Scripture */}
              <div className="space-y-2">
                <Label htmlFor="scripture">Scripture Reference</Label>
                <Input
                  id="scripture"
                  placeholder="e.g. Psalm 23:1"
                  value={formScripture}
                  onChange={(e) => setFormScripture(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scripture_text">Scripture Text</Label>
                <Textarea
                  id="scripture_text"
                  placeholder="Full scripture text"
                  rows={2}
                  value={formScriptureText}
                  onChange={(e) => setFormScriptureText(e.target.value)}
                />
              </div>

              {/* Hymn */}
              <div className="space-y-2">
                <Label htmlFor="hymn">Favorite Hymn</Label>
                <Input
                  id="hymn"
                  placeholder="e.g. Amazing Grace"
                  value={formHymn}
                  onChange={(e) => setFormHymn(e.target.value)}
                />
              </div>

              {/* Roles */}
              <div className="space-y-2">
                <Label htmlFor="roles">Church Roles</Label>
                <Input
                  id="roles"
                  placeholder="Comma-separated, e.g. Deacon, Choir Member"
                  value={formRoles}
                  onChange={(e) => setFormRoles(e.target.value)}
                />
              </div>

              {/* Family message */}
              <div className="space-y-2">
                <Label htmlFor="family_message">Family Message</Label>
                <Textarea
                  id="family_message"
                  placeholder="Short message from the family"
                  rows={2}
                  value={formFamilyMessage}
                  onChange={(e) => setFormFamilyMessage(e.target.value)}
                />
              </div>

              {/* Published toggle */}
              <div className="flex items-center justify-between rounded-lg border border-warm-200 p-3">
                <Label htmlFor="is_published" className="cursor-pointer">
                  Published
                </Label>
                <Switch
                  id="is_published"
                  checked={formIsPublished}
                  onCheckedChange={(checked) => setFormIsPublished(checked)}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-purple-700 hover:bg-purple-600 text-white"
              >
                {editingMemorial ? "Update Memorial" : "Save Memorial"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Delete Memorial
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this memorial? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            {deletingMemorial && (
              <p className="text-sm text-warm-600">
                <span className="font-medium">
                  {deletingMemorial.first_name} {deletingMemorial.last_name}
                </span>{" "}
                will be permanently removed, including all photos and comments.
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteOpen(false)}
              >
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

        {/* ── Comments Dialog ────────────────────────────────────────── */}
        <Dialog
          open={commentsOpen}
          onOpenChange={(open) => {
            setCommentsOpen(open);
            if (!open) setCommentsMemorial(null);
          }}
        >
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Comments{" "}
                {commentsMemorial && (
                  <span className="text-warm-500 font-normal text-base">
                    &mdash; {commentsMemorial.first_name}{" "}
                    {commentsMemorial.last_name}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                {commentsMemorial?.comments.length === 0
                  ? "No comments yet on this memorial."
                  : `${commentsMemorial?.comments.length} comment${
                      (commentsMemorial?.comments.length ?? 0) !== 1
                        ? "s"
                        : ""
                    }`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              {commentsMemorial?.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-xl border border-warm-100 bg-warm-50/50 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-warm-900">
                        {comment.author_name}
                      </p>
                      <p className="text-xs text-warm-500 mt-0.5">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteCommentDialog(comment)}
                      className="h-7 w-7 p-0 shrink-0 text-warm-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete comment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-warm-700 leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Delete Comment Confirmation Dialog ─────────────────────── */}
        <Dialog open={deleteCommentOpen} onOpenChange={setDeleteCommentOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl">
                Delete Comment
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this comment?
              </DialogDescription>
            </DialogHeader>
            {deletingComment && (
              <p className="text-sm text-warm-600">
                Comment by{" "}
                <span className="font-medium">
                  {deletingComment.author_name}
                </span>{" "}
                will be permanently removed.
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setDeleteCommentOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteComment}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Comment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </FadeIn>
  );
}
