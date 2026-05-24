"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Trophy, RotateCcw, ChevronRight, X, Check } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { FadeIn } from "@/components/motion/fade-in";
import { ScriptureDivider } from "@/components/shared/scripture-divider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  EASY_QUESTIONS,
  MEDIUM_QUESTIONS,
  HARD_QUESTIONS,
  type TriviaQuestion,
} from "@/lib/trivia-questions";

/* ------------------------------------------------------------------ */
/*  Lightweight confetti effect — gold & purple branded DOM confetti   */
/* ------------------------------------------------------------------ */

function launchConfetti() {
  const colors = [
    "#7e22ce", // purple-700
    "#9333ea", // purple-600
    "#c4a77d", // gold-400
    "#d4b896", // gold-300
    "#a855f7", // purple-500
    "#f5d0a9", // peach-300
  ];

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(container);

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    const size = Math.random() * 10 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const left = Math.random() * 100;
    const delay = Math.random() * 0.4;
    const duration = Math.random() * 1.5 + 1.5;
    const shape = Math.random() > 0.5 ? "50%" : "0";

    piece.style.cssText = `
      position:absolute;
      top:-20px;
      left:${left}%;
      width:${size}px;
      height:${size * (Math.random() * 0.6 + 0.6)}px;
      background:${color};
      border-radius:${shape};
      opacity:1;
      animation:confetti-fall ${duration}s ease-in ${delay}s forwards;
    `;
    container.appendChild(piece);
  }

  // Inject keyframes if not already present
  if (!document.getElementById("confetti-style")) {
    const style = document.createElement("style");
    style.id = "confetti-style";
    style.textContent = `
      @keyframes confetti-fall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(100vh) rotate(${360}deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  setTimeout(() => container.remove(), 3500);
}

/* ------------------------------------------------------------------ */
/*  Difficulty configuration                                           */
/* ------------------------------------------------------------------ */

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  {
    label: string;
    pool: TriviaQuestion[];
    bgSelected: string;
    bgHover: string;
    badgeBg: string;
    badgeText: string;
    badgeDark: string;
    badgeTextDark: string;
  }
> = {
  easy: {
    label: "Easy",
    pool: EASY_QUESTIONS,
    bgSelected:
      "bg-green-600 text-white border-green-600 hover:bg-green-700",
    bgHover:
      "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30",
    badgeBg: "bg-green-100",
    badgeText: "text-green-800",
    badgeDark: "dark:bg-green-900/40",
    badgeTextDark: "dark:text-green-300",
  },
  medium: {
    label: "Medium",
    pool: MEDIUM_QUESTIONS,
    bgSelected:
      "bg-amber-600 text-white border-amber-600 hover:bg-amber-700",
    bgHover:
      "border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-800",
    badgeDark: "dark:bg-amber-900/40",
    badgeTextDark: "dark:text-amber-300",
  },
  hard: {
    label: "Hard",
    pool: HARD_QUESTIONS,
    bgSelected: "bg-red-600 text-white border-red-600 hover:bg-red-700",
    bgHover:
      "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30",
    badgeBg: "bg-red-100",
    badgeText: "text-red-800",
    badgeDark: "dark:bg-red-900/40",
    badgeTextDark: "dark:text-red-300",
  },
};

const QUIZ_SIZE = 20;

/* ------------------------------------------------------------------ */
/*  Shuffle helper                                                     */
/* ------------------------------------------------------------------ */

function shuffle<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ------------------------------------------------------------------ */
/*  Adapted question interface for the component                       */
/* ------------------------------------------------------------------ */

interface InternalQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function adaptQuestions(pool: TriviaQuestion[]): InternalQuestion[] {
  return shuffle(pool)
    .slice(0, QUIZ_SIZE)
    .map((q) => ({
      question: q.question,
      options: q.options,
      correctIndex: q.correct,
      explanation: q.explanation,
    }));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BibleTriviaPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [questions, setQuestions] = useState<InternalQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const startGame = useCallback(
    (diff?: Difficulty) => {
      const d = diff ?? difficulty;
      const pool = DIFFICULTY_CONFIG[d].pool;
      setQuestions(adaptQuestions(pool));
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setAnswered(false);
      setGameOver(false);
    },
    [difficulty],
  );

  const handleDifficultyChange = useCallback(
    (diff: Difficulty) => {
      setDifficulty(diff);
      startGame(diff);
    },
    [startGame],
  );

  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard while questions are loading
  if (questions.length === 0) return null;

  const current = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent =
    ((currentIndex + (answered ? 1 : 0)) / totalQuestions) * 100;
  const isCorrect = selectedAnswer === current.correctIndex;
  const cfg = DIFFICULTY_CONFIG[difficulty];

  function handleAnswer(index: number) {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
    if (index === current.correctIndex) {
      setScore((s) => s + 1);
      launchConfetti();
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= totalQuestions) {
      setGameOver(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  }

  function getScoreMessage() {
    const pct = score / totalQuestions;
    if (pct === 1) return "Perfect score! You truly know your Bible!";
    if (pct >= 0.8) return "Excellent work! You know the Scriptures well!";
    if (pct >= 0.6) return "Great job! Keep studying the Word!";
    if (pct >= 0.4) return "Good effort! The Bible has so much to teach us.";
    return "Keep reading the Word — every page holds treasure!";
  }

  return (
    <>
      {/* Hero */}
      <PageHero
        title="Bible Trivia"
        subtitle="Test your knowledge of God's Word"
        overlay="warm"
        breadcrumbs={[{ label: "Bible Trivia" }]}
      />

      {/* Scripture divider */}
      <ScriptureDivider
        text="Your word is a lamp for my feet, a light on my path."
        reference="Psalm 119:105"
        variant="purple"
      />

      {/* Main trivia section */}
      <section className="section-padding">
        <div className="container-narrow">
          <FadeIn>
            {/* Difficulty selector */}
            <div className="mx-auto mb-8 max-w-2xl">
              <p className="mb-3 text-center text-sm font-medium text-warm-600 dark:text-warm-400">
                Choose Difficulty
              </p>
              <div className="flex justify-center gap-2">
                {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((d) => {
                  const c = DIFFICULTY_CONFIG[d];
                  const isActive = difficulty === d;
                  return (
                    <button
                      key={d}
                      onClick={() => handleDifficultyChange(d)}
                      className={`rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                        isActive ? c.bgSelected : c.bgHover
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {gameOver ? (
              /* -------- End screen -------- */
              <Card className="mx-auto max-w-2xl overflow-hidden border-warm-100 dark:border-warm-800">
                <div className="bg-purple-700 px-6 py-10 text-center text-white">
                  <Trophy className="mx-auto mb-3 h-14 w-14 text-gold-400" />
                  <h2 className="font-heading text-fluid-3xl font-bold">
                    Trivia Complete!
                  </h2>
                </div>

                <div className="space-y-6 p-6 text-center sm:p-8">
                  <div>
                    <p className="text-5xl font-heading font-bold text-purple-700 dark:text-purple-400">
                      {score} / {totalQuestions}
                    </p>
                    <p className="mt-2 text-warm-600 dark:text-warm-400">
                      {getScoreMessage()}
                    </p>
                  </div>

                  <Progress
                    value={(score / totalQuestions) * 100}
                    className="mx-auto h-3 max-w-xs bg-warm-100 dark:bg-warm-800"
                  />

                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      {score} Correct
                    </Badge>
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                      {totalQuestions - score} Missed
                    </Badge>
                    <Badge
                      className={`${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeDark} ${cfg.badgeTextDark}`}
                    >
                      {cfg.label} Mode
                    </Badge>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => startGame()}
                    className="gap-2 bg-purple-700 hover:bg-purple-800"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Play Again
                  </Button>
                </div>
              </Card>
            ) : (
              /* -------- Question screen -------- */
              <div className="mx-auto max-w-2xl space-y-6">
                {/* Progress header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-warm-600 dark:text-warm-400">
                    <span className="flex items-center gap-2">
                      Question {currentIndex + 1} of {totalQuestions}
                      <Badge
                        className={`${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeDark} ${cfg.badgeTextDark} text-xs`}
                      >
                        {cfg.label}
                      </Badge>
                    </span>
                    <span className="font-semibold text-purple-700 dark:text-purple-400">
                      {score} / {currentIndex + (answered ? 1 : 0)} correct
                    </span>
                  </div>
                  <Progress
                    value={progressPercent}
                    className="h-2 bg-warm-100 dark:bg-warm-800"
                  />
                </div>

                {/* Question card */}
                <Card className="overflow-hidden border-warm-100 dark:border-warm-800">
                  {/* Difficulty badge + question */}
                  <div className="p-6 sm:p-8">
                    <Badge
                      className={`mb-4 ${cfg.badgeBg} ${cfg.badgeText} ${cfg.badgeDark} ${cfg.badgeTextDark}`}
                    >
                      {cfg.label}
                    </Badge>
                    <h2 className="font-heading text-xl font-bold text-warm-900 dark:text-warm-50 sm:text-2xl">
                      {current.question}
                    </h2>
                  </div>

                  {/* Answer options */}
                  <div className="space-y-3 px-6 pb-6 sm:px-8 sm:pb-8">
                    {current.options.map((option, idx) => {
                      let optionStyles =
                        "border-warm-200 bg-white hover:border-purple-300 hover:bg-purple-50 dark:border-warm-700 dark:bg-warm-900 dark:hover:border-purple-600 dark:hover:bg-purple-950/30";

                      if (answered) {
                        if (idx === current.correctIndex) {
                          optionStyles =
                            "border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-950/30";
                        } else if (idx === selectedAnswer && !isCorrect) {
                          optionStyles =
                            "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950/30";
                        } else {
                          optionStyles =
                            "border-warm-100 bg-warm-50 opacity-60 dark:border-warm-800 dark:bg-warm-950";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          disabled={answered}
                          className={`flex w-full items-center gap-3 rounded-xl border-2 px-5 py-4 text-left transition-all duration-200 ${optionStyles} ${
                            !answered ? "cursor-pointer" : "cursor-default"
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 font-heading text-sm font-bold text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="font-medium text-warm-800 dark:text-warm-200">
                            {option}
                          </span>
                          {answered && idx === current.correctIndex && (
                            <Check className="ml-auto h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                          )}
                          {answered &&
                            idx === selectedAnswer &&
                            !isCorrect &&
                            idx !== current.correctIndex && (
                              <X className="ml-auto h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />
                            )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Feedback section */}
                  {answered && (
                    <div
                      className={`border-t px-6 py-5 sm:px-8 ${
                        isCorrect
                          ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20"
                          : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2">
                        {isCorrect ? (
                          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <BookOpen className="h-5 w-5 text-red-500 dark:text-red-400" />
                        )}
                        <p
                          className={`font-heading font-bold ${
                            isCorrect
                              ? "text-green-700 dark:text-green-400"
                              : "text-red-700 dark:text-red-400"
                          }`}
                        >
                          {isCorrect ? "Correct!" : "Not quite!"}
                        </p>
                      </div>

                      {!isCorrect && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm leading-relaxed text-warm-700 dark:text-warm-300">
                            {current.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>

                {/* Next button */}
                {answered && (
                  <div className="flex justify-end">
                    <Button
                      size="lg"
                      onClick={handleNext}
                      className="gap-2 bg-purple-700 hover:bg-purple-800"
                    >
                      {currentIndex + 1 >= totalQuestions
                        ? "See Results"
                        : "Next Question"}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </FadeIn>
        </div>
      </section>
    </>
  );
}
