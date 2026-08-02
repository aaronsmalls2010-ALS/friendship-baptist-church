"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils";
import {
  Sparkles,
  Heart,
  Droplet,
  HandHelping,
  UserPlus,
  Mail,
  Phone,
  Loader2,
  Trash2,
  CircleDot,
  Clock,
  CheckCircle2,
  Inbox,
  type LucideIcon,
} from "lucide-react";

type CardType = "connect" | "salvation" | "baptism" | "prayer" | "interest";
type Status = "new" | "in_progress" | "done";

interface ConnectionCard {
  id: string;
  profile_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  card_type: CardType;
  message: string | null;
  status: Status;
  created_at: string;
}

const TYPE_META: Record<
  CardType,
  { label: string; icon: LucideIcon; badge: string }
> = {
  connect: { label: "New Here", icon: UserPlus, badge: "bg-blue-100 text-blue-700" },
  salvation: { label: "Decision for Christ", icon: Sparkles, badge: "bg-gold-100 text-gold-700" },
  baptism: { label: "Baptism", icon: Droplet, badge: "bg-teal-100 text-teal-700" },
  prayer: { label: "Prayer", icon: Heart, badge: "bg-purple-100 text-purple-700" },
  interest: { label: "Serving", icon: HandHelping, badge: "bg-emerald-100 text-emerald-700" },
};

const STATUS_META: Record<Status, { label: string; badge: string }> = {
  new: { label: "New", badge: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "In Progress", badge: "bg-blue-100 text-blue-700" },
  done: { label: "Done", badge: "bg-green-100 text-green-700" },
};

const STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const TYPE_FILTERS = [
  { value: "all", label: "All Types" },
  { value: "connect", label: "New Here" },
  { value: "salvation", label: "Decision for Christ" },
  { value: "baptism", label: "Baptism" },
  { value: "prayer", label: "Prayer" },
  { value: "interest", label: "Serving" },
];

export default function AdminConnectionsPage() {
  const [cards, setCards] = useState<ConnectionCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<ConnectionCard | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    try {
      const res = await fetch(`/api/admin/connections?${params.toString()}`);
      const data = await res.json();
      setCards(data.cards ?? []);
    } catch (err) {
      console.error("Failed to load connection cards:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(card: ConnectionCard, status: Status) {
    setBusyId(card.id);
    const res = await fetch(`/api/admin/connections/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (res.ok) {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, status } : c))
      );
    }
  }

  function openDelete(card: ConnectionCard) {
    setDeleting(card);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    const res = await fetch(`/api/admin/connections/${deleting.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setCards((prev) => prev.filter((c) => c.id !== deleting.id));
    }
    setDeleteOpen(false);
    setDeleting(null);
  }

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
        title="Connection Cards"
        description="Follow up on next-steps cards submitted by members"
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-warm-500">
        {cards.length} {cards.length === 1 ? "card" : "cards"}
      </p>

      {cards.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-12 w-12 text-warm-200 mx-auto mb-3" />
          <p className="text-warm-500">No connection cards match these filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => {
            const type = TYPE_META[card.card_type] ?? TYPE_META.connect;
            const TypeIcon = type.icon;
            const status = STATUS_META[card.status] ?? STATUS_META.new;
            const isBusy = busyId === card.id;
            return (
              <Card key={card.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={`${type.badge} flex items-center gap-1`}>
                        <TypeIcon className="h-3 w-3" />
                        {type.label}
                      </Badge>
                      <Badge className={status.badge}>{status.label}</Badge>
                      <span className="text-xs text-warm-400">
                        {formatDate(card.created_at)}
                      </span>
                    </div>

                    <div>
                      <p className="font-semibold text-warm-800 dark:text-warm-100">
                        {card.name}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-warm-500">
                        {card.email && (
                          <a
                            href={`mailto:${card.email}`}
                            className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{card.email}</span>
                          </a>
                        )}
                        {card.phone && (
                          <a
                            href={`tel:${card.phone}`}
                            className="flex items-center gap-1.5 hover:text-purple-600 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {card.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    {card.message && (
                      <p className="text-sm text-warm-600 dark:text-warm-300 leading-relaxed whitespace-pre-wrap">
                        {card.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row flex-wrap gap-2 sm:flex-col sm:w-44 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy || card.status === "in_progress"}
                      onClick={() => updateStatus(card, "in_progress")}
                      className="justify-start"
                    >
                      <Clock className="mr-2 h-4 w-4" /> In Progress
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isBusy || card.status === "done"}
                      onClick={() => updateStatus(card, "done")}
                      className="justify-start"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Done
                    </Button>
                    {card.status !== "new" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => updateStatus(card, "new")}
                        className="justify-start text-warm-500"
                      >
                        <CircleDot className="mr-2 h-4 w-4" /> Reopen
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDelete(card)}
                      className="justify-start text-warm-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">
              Delete Connection Card
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this connection card?
            </DialogDescription>
          </DialogHeader>
          {deleting && (
            <p className="text-sm text-warm-600">
              The card from{" "}
              <span className="font-medium">{deleting.name}</span> will be
              permanently removed.
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
