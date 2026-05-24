"use client";

import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  Target,
  Trophy,
  Plus,
  Minus,
  Pencil,
  Trash2,
  CheckCircle2,
  BookOpen,
  HandHeart,
  Clock,
  DollarSign,
  Flame,
  GraduationCap,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { FadeIn } from "@/components/motion/fade-in";
import { SlideUpContainer, SlideUpItem } from "@/components/motion/slide-up";
import type { SpiritualGoal } from "@/types";

const typeConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: typeof BookOpen }
> = {
  bible_reading: {
    label: "Bible Reading",
    color: "text-purple-700",
    bgColor: "bg-purple-100",
    icon: BookOpen,
  },
  prayer: {
    label: "Prayer",
    color: "text-peach-700",
    bgColor: "bg-peach-100",
    icon: HandHeart,
  },
  service_hours: {
    label: "Service Hours",
    color: "text-gold-700",
    bgColor: "bg-gold-100",
    icon: Clock,
  },
  giving: {
    label: "Giving",
    color: "text-green-700",
    bgColor: "bg-green-100",
    icon: DollarSign,
  },
  fasting: {
    label: "Fasting",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
    icon: Flame,
  },
  study: {
    label: "Study",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
    icon: GraduationCap,
  },
};

const periodLabels: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

const STORAGE_KEY = "fbc_spiritual_goals";

function loadGoalsFromLocalStorage(): SpiritualGoal[] | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return null;
}

function saveGoalsToLocalStorage(goals: SpiritualGoal[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch {}
}

export default function SpiritualGrowthPage() {
  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<SpiritualGoal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalPeriod, setGoalPeriod] = useState("");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SpiritualGoal | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editPeriod, setEditPeriod] = useState("");

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Celebration state — tracks recently completed goal ids
  const [celebratingIds, setCelebratingIds] = useState<Set<string>>(new Set());

  // Fetch goals on mount: try API first, fall back to localStorage
  useEffect(() => {
    async function fetchGoals() {
      try {
        const res = await fetch("/api/portal/growth");
        if (res.ok) {
          const data = await res.json();
          const apiGoals = data.goals || [];
          if (apiGoals.length > 0) {
            setGoals(apiGoals);
            saveGoalsToLocalStorage(apiGoals);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch goals from API:", error);
      }

      // Fall back to localStorage
      const localGoals = loadGoalsFromLocalStorage();
      if (localGoals) {
        setGoals(localGoals);
      }
    }

    fetchGoals().finally(() => setLoading(false));
  }, []);

  // Persist goals to localStorage whenever they change (cache layer)
  useEffect(() => {
    if (!loading) {
      saveGoalsToLocalStorage(goals);
    }
  }, [goals, loading]);

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);
  const averageProgress =
    activeGoals.length > 0
      ? Math.round(
          activeGoals.reduce(
            (sum, g) => sum + (g.current / g.target) * 100,
            0
          ) / activeGoals.length
        )
      : 0;

  const handleCreateGoal = async () => {
    const newGoal: SpiritualGoal = {
      id: `sg-${Date.now()}`,
      profile_id: "",
      type: goalType as SpiritualGoal["type"],
      title: goalTitle,
      target: parseInt(goalTarget, 10),
      current: 0,
      period: goalPeriod as SpiritualGoal["period"],
      is_completed: false,
      created_at: new Date().toISOString().split("T")[0],
    };
    setGoals((prev) => [...prev, newGoal]);
    setDialogOpen(false);
    setGoalTitle("");
    setGoalType("");
    setGoalTarget("");
    setGoalPeriod("");

    // Persist to API
    try {
      await fetch("/api/portal/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGoal),
      });
    } catch (error) {
      console.error("Failed to save new goal to API:", error);
    }
  };

  const handleIncrement = (goalId: string) => {
    let updatedGoal: SpiritualGoal | null = null;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId || g.is_completed) return g;
        const newCurrent = Math.min(g.current + 1, g.target);
        const justCompleted = newCurrent >= g.target;
        if (justCompleted) {
          // Trigger celebration animation
          setCelebratingIds((s) => new Set(s).add(goalId));
          setTimeout(() => {
            setCelebratingIds((s) => {
              const next = new Set(s);
              next.delete(goalId);
              return next;
            });
          }, 2000);
        }
        updatedGoal = {
          ...g,
          current: newCurrent,
          is_completed: justCompleted,
        };
        return updatedGoal;
      })
    );

    // Persist to API
    if (updatedGoal) {
      const goalToSave = updatedGoal;
      fetch("/api/portal/growth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalToSave),
      }).catch((error) => console.error("Failed to update goal:", error));
    }
  };

  const handleDecrement = (goalId: string) => {
    let updatedGoal: SpiritualGoal | null = null;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId || g.is_completed) return g;
        updatedGoal = { ...g, current: Math.max(g.current - 1, 0) };
        return updatedGoal;
      })
    );

    // Persist to API
    if (updatedGoal) {
      const goalToSave = updatedGoal;
      fetch("/api/portal/growth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalToSave),
      }).catch((error) => console.error("Failed to update goal:", error));
    }
  };

  const handleOpenEdit = (goal: SpiritualGoal) => {
    setEditingGoal(goal);
    setEditTitle(goal.title);
    setEditType(goal.type);
    setEditTarget(String(goal.target));
    setEditPeriod(goal.period);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingGoal) return;
    let updatedGoal: SpiritualGoal | null = null;
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== editingGoal.id) return g;
        const newTarget = parseInt(editTarget, 10);
        updatedGoal = {
          ...g,
          title: editTitle,
          type: editType as SpiritualGoal["type"],
          target: newTarget,
          period: editPeriod as SpiritualGoal["period"],
          // If new target is now <= current, mark complete
          is_completed: g.current >= newTarget,
        };
        return updatedGoal;
      })
    );
    setEditDialogOpen(false);
    setEditingGoal(null);

    // Persist to API
    if (updatedGoal) {
      try {
        await fetch("/api/portal/growth", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedGoal),
        });
      } catch (error) {
        console.error("Failed to update goal:", error);
      }
    }
  };

  const handleDelete = async (goalId: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    setDeleteConfirmId(null);

    // Persist to API
    try {
      await fetch(`/api/portal/growth?id=${goalId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <FadeIn direction="up">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100">
            <TrendingUp className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h1 className="text-fluid-2xl font-heading font-bold text-warm-800">
              Spiritual Growth
            </h1>
            <p className="text-warm-500 text-sm">
              Track your spiritual journey
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Growth Stats */}
      <FadeIn direction="up" delay={0.1}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Goals Active",
              value: activeGoals.length,
              icon: Target,
              color: "text-purple-700",
              bg: "bg-purple-100",
            },
            {
              label: "Goals Completed",
              value: completedGoals.length,
              icon: Trophy,
              color: "text-gold-700",
              bg: "bg-gold-100",
            },
            {
              label: "Average Progress",
              value: `${averageProgress}%`,
              icon: TrendingUp,
              color: "text-green-700",
              bg: "bg-green-100",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-5 border border-warm-100"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${stat.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-warm-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-warm-800">
                    {stat.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      {/* Current Goals Section */}
      <FadeIn direction="up" delay={0.2}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-fluid-lg text-warm-800">
            Current Goals
          </h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-700 hover:bg-purple-800">
                <Plus className="h-4 w-4 mr-1" />
                Add New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  Create New Goal
                </DialogTitle>
                <DialogDescription>
                  Set a spiritual growth goal to track your progress.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="goal-title">Goal Title</Label>
                  <Input
                    id="goal-title"
                    placeholder="e.g., Read the Book of Psalms"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-type">Type</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bible_reading">
                        Bible Reading
                      </SelectItem>
                      <SelectItem value="prayer">Prayer</SelectItem>
                      <SelectItem value="service_hours">
                        Service Hours
                      </SelectItem>
                      <SelectItem value="giving">Giving</SelectItem>
                      <SelectItem value="fasting">Fasting</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-target">Target</Label>
                  <Input
                    id="goal-target"
                    type="number"
                    placeholder="e.g., 30"
                    min={1}
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="goal-period">Period</Label>
                  <Select value={goalPeriod} onValueChange={setGoalPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreateGoal}
                  className="bg-purple-700 hover:bg-purple-800"
                  disabled={
                    !goalTitle || !goalType || !goalTarget || !goalPeriod
                  }
                >
                  Create Goal
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </FadeIn>

      {/* Active Goal Cards */}
      {activeGoals.length > 0 ? (
        <SlideUpContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeGoals.map((goal, index) => {
            const config = typeConfig[goal.type] || typeConfig.bible_reading;
            const percentage = Math.round((goal.current / goal.target) * 100);
            const IconComponent = config.icon;
            const isCelebrating = celebratingIds.has(goal.id);

            return (
              <SlideUpItem key={goal.id}>
                <FadeIn direction="up" delay={0.25 + index * 0.05}>
                  <div
                    className={`bg-white rounded-xl p-6 border transition-all ${
                      isCelebrating
                        ? "border-green-300 shadow-lg ring-2 ring-green-200"
                        : "border-warm-100 hover:shadow-card-hover"
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}
                        >
                          <IconComponent
                            className={`h-4 w-4 ${config.color}`}
                          />
                        </div>
                        <Badge
                          className={`${config.bgColor} ${config.color} border-0 text-xs`}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-warm-400 hover:text-purple-600"
                          onClick={() => handleOpenEdit(goal)}
                          title="Edit goal"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {deleteConfirmId === goal.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDelete(goal.id)}
                            >
                              Delete
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-warm-500 hover:text-warm-700"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-warm-400 hover:text-red-500"
                            onClick={() => setDeleteConfirmId(goal.id)}
                            title="Delete goal"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-warm-800 mb-1">{goal.title}</h3>
                    <Badge variant="outline" className="text-xs text-warm-500 mb-3">
                      {periodLabels[goal.period]}
                    </Badge>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={percentage}
                        className="h-2.5 bg-warm-100"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-warm-500">
                          {goal.current} of {goal.target}
                        </span>
                        <span className="text-sm font-bold text-warm-800">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress +/- Buttons */}
                    <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-warm-100">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => handleDecrement(goal.id)}
                        disabled={goal.current <= 0}
                        title="Decrease progress"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-bold text-warm-800 min-w-[3rem] text-center">
                        {goal.current}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full border-purple-300 text-purple-700 hover:bg-purple-50"
                        onClick={() => handleIncrement(goal.id)}
                        disabled={goal.current >= goal.target}
                        title="Increase progress"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </FadeIn>
              </SlideUpItem>
            );
          })}
        </SlideUpContainer>
      ) : (
        <FadeIn direction="up" delay={0.25}>
          <div className="text-center py-10 bg-white rounded-xl border border-warm-100">
            <Target className="h-12 w-12 text-warm-300 mx-auto mb-3" />
            <p className="text-warm-500">No active goals. Create one to start tracking your growth!</p>
          </div>
        </FadeIn>
      )}

      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <FadeIn direction="up" delay={0.3}>
          <div className="space-y-4">
            <h2 className="font-heading font-bold text-fluid-lg text-warm-800 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gold-600" />
              Completed Goals
            </h2>
            <SlideUpContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal, index) => {
                const config = typeConfig[goal.type] || typeConfig.bible_reading;
                const IconComponent = config.icon;

                return (
                  <SlideUpItem key={goal.id}>
                    <FadeIn direction="up" delay={0.35 + index * 0.05}>
                      <div className="bg-green-50 rounded-xl p-6 border border-green-200 relative overflow-hidden">
                        {/* Completed badge */}
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor}`}
                          >
                            <IconComponent
                              className={`h-4 w-4 ${config.color}`}
                            />
                          </div>
                          <Badge
                            className={`${config.bgColor} ${config.color} border-0 text-xs`}
                          >
                            {config.label}
                          </Badge>
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-warm-800 mb-1">{goal.title}</h3>
                        <Badge variant="outline" className="text-xs text-warm-500 mb-3">
                          {periodLabels[goal.period]}
                        </Badge>

                        {/* Completed progress */}
                        <div className="space-y-2">
                          <Progress value={100} className="h-2.5 bg-green-100" />
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-green-700 font-medium">
                              {goal.target} of {goal.target}
                            </span>
                            <span className="text-sm font-bold text-green-700">
                              100%
                            </span>
                          </div>
                        </div>

                        {/* Delete button for completed goals */}
                        <div className="mt-3 pt-3 border-t border-green-200 flex justify-end">
                          {deleteConfirmId === goal.id ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleDelete(goal.id)}
                              >
                                Delete
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-warm-500 hover:text-warm-700"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-warm-400 hover:text-red-500"
                              onClick={() => setDeleteConfirmId(goal.id)}
                              title="Delete goal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </FadeIn>
                  </SlideUpItem>
                );
              })}
            </SlideUpContainer>
          </div>
        </FadeIn>
      )}

      {/* Edit Goal Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-heading">Edit Goal</DialogTitle>
            <DialogDescription>
              Update your spiritual growth goal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal-title">Goal Title</Label>
              <Input
                id="edit-goal-title"
                placeholder="e.g., Read the Book of Psalms"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-type">Type</Label>
              <Select value={editType} onValueChange={setEditType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bible_reading">Bible Reading</SelectItem>
                  <SelectItem value="prayer">Prayer</SelectItem>
                  <SelectItem value="service_hours">Service Hours</SelectItem>
                  <SelectItem value="giving">Giving</SelectItem>
                  <SelectItem value="fasting">Fasting</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-target">Target</Label>
              <Input
                id="edit-goal-target"
                type="number"
                placeholder="e.g., 30"
                min={1}
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-goal-period">Period</Label>
              <Select value={editPeriod} onValueChange={setEditPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-purple-700 hover:bg-purple-800"
              disabled={!editTitle || !editType || !editTarget || !editPeriod}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encouragement */}
      <FadeIn direction="up" delay={0.4}>
        <div className="bg-purple-50 rounded-xl p-6 lg:p-8 border border-purple-100">
          <div className="text-center max-w-2xl mx-auto">
            <p className="font-scripture italic text-purple-800 text-lg leading-relaxed">
              &ldquo;Being confident of this very thing, that he which hath
              begun a good work in you will perform it until the day of Jesus
              Christ.&rdquo;
            </p>
            <p className="mt-3 text-sm font-medium text-purple-600">
              &mdash; Philippians 1:6
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
