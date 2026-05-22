"use client";

import { useState } from "react";
import {
  TrendingUp,
  Target,
  Trophy,
  Plus,
  BookOpen,
  HandHeart,
  Clock,
  DollarSign,
  Flame,
  GraduationCap,
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
import { MOCK_SPIRITUAL_GOALS } from "@/lib/mock-data";

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

export default function SpiritualGrowthPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalPeriod, setGoalPeriod] = useState("");

  const goals = MOCK_SPIRITUAL_GOALS;
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

  const handleCreateGoal = () => {
    // In a real app, this would save to the backend
    setDialogOpen(false);
    setGoalTitle("");
    setGoalType("");
    setGoalTarget("");
    setGoalPeriod("");
  };

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

      {/* Goal Cards */}
      <SlideUpContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal, index) => {
          const config = typeConfig[goal.type] || typeConfig.bible_reading;
          const percentage = Math.round((goal.current / goal.target) * 100);
          const IconComponent = config.icon;

          return (
            <SlideUpItem key={goal.id}>
              <FadeIn direction="up" delay={0.25 + index * 0.05}>
                <div className="bg-white rounded-xl p-6 border border-warm-100 hover:shadow-card-hover transition-shadow">
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
                    <Badge variant="outline" className="text-xs text-warm-500">
                      {periodLabels[goal.period]}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-warm-800 mb-3">{goal.title}</h3>

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
                </div>
              </FadeIn>
            </SlideUpItem>
          );
        })}
      </SlideUpContainer>

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
