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
    const rotation = Math.random() * 720 - 360;
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
/*  Trivia questions — 25 covering OT, NT, Psalms, Proverbs, Gospels  */
/* ------------------------------------------------------------------ */

interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  scripture: string;
  category: string;
}

const QUESTIONS: TriviaQuestion[] = [
  {
    question: "Who built the ark to survive the great flood?",
    options: ["Abraham", "Moses", "Noah", "David"],
    correctIndex: 2,
    explanation:
      "God instructed Noah to build an ark to save his family and pairs of every animal from the flood He sent to cleanse the earth.",
    scripture: "Genesis 6:13–22",
    category: "Old Testament",
  },
  {
    question: "How many days did God take to create the world?",
    options: ["5 days", "6 days", "7 days", "10 days"],
    correctIndex: 1,
    explanation:
      "God created the heavens and the earth in six days and rested on the seventh day, blessing it and making it holy.",
    scripture: "Genesis 1–2:3",
    category: "Old Testament",
  },
  {
    question: "Who was thrown into a den of lions?",
    options: ["Elijah", "Daniel", "Jonah", "Samson"],
    correctIndex: 1,
    explanation:
      "Daniel was thrown into the lions’ den for continuing to pray to God despite the king’s decree. God sent an angel to shut the lions’ mouths.",
    scripture: "Daniel 6:16–23",
    category: "Old Testament",
  },
  {
    question: "What sea did Moses part for the Israelites to cross?",
    options: ["Dead Sea", "Sea of Galilee", "Red Sea", "Mediterranean Sea"],
    correctIndex: 2,
    explanation:
      "God parted the Red Sea through Moses so the Israelites could escape Pharaoh’s army during the Exodus from Egypt.",
    scripture: "Exodus 14:21–22",
    category: "Old Testament",
  },
  {
    question: "Who was the first king of Israel?",
    options: ["David", "Solomon", "Saul", "Samuel"],
    correctIndex: 2,
    explanation:
      "Saul, from the tribe of Benjamin, was anointed by the prophet Samuel as the first king of Israel.",
    scripture: "1 Samuel 10:1",
    category: "Old Testament",
  },
  {
    question: "What did God use to speak to Moses in the desert?",
    options: ["A still small voice", "A burning bush", "A dove", "Thunder"],
    correctIndex: 1,
    explanation:
      "God spoke to Moses from a burning bush on Mount Horeb, calling him to lead the Israelites out of Egypt. The bush burned but was not consumed.",
    scripture: "Exodus 3:1–4",
    category: "Old Testament",
  },
  {
    question: "Who defeated Goliath with a sling and a stone?",
    options: ["Jonathan", "Joshua", "David", "Gideon"],
    correctIndex: 2,
    explanation:
      "As a young shepherd, David defeated the Philistine giant Goliath with faith in God, a sling, and a single stone.",
    scripture: "1 Samuel 17:49–50",
    category: "Old Testament",
  },
  {
    question: "In which town was Jesus born?",
    options: ["Nazareth", "Jerusalem", "Bethlehem", "Capernaum"],
    correctIndex: 2,
    explanation:
      "Jesus was born in Bethlehem of Judea, fulfilling the prophecy of Micah. Mary and Joseph had traveled there for a census.",
    scripture: "Matthew 2:1; Luke 2:4–7",
    category: "Gospels",
  },
  {
    question: "How many disciples did Jesus choose?",
    options: ["7", "10", "12", "14"],
    correctIndex: 2,
    explanation:
      "Jesus chose twelve disciples (also called apostles) to follow Him and carry out His ministry.",
    scripture: "Luke 6:13–16",
    category: "Gospels",
  },
  {
    question: "What was Jesus’ first recorded miracle?",
    options: [
      "Walking on water",
      "Turning water into wine",
      "Healing the blind man",
      "Feeding the 5,000",
    ],
    correctIndex: 1,
    explanation:
      "At a wedding in Cana of Galilee, Jesus turned water into wine, revealing His glory. This was the first of His miraculous signs.",
    scripture: "John 2:1–11",
    category: "Gospels",
  },
  {
    question: "Which disciple denied Jesus three times?",
    options: ["Judas", "Thomas", "Peter", "John"],
    correctIndex: 2,
    explanation:
      "After Jesus was arrested, Peter denied knowing Him three times before the rooster crowed, just as Jesus had foretold.",
    scripture: "Luke 22:54–62",
    category: "Gospels",
  },
  {
    question: "Who baptized Jesus in the Jordan River?",
    options: ["Peter", "John the Baptist", "Andrew", "James"],
    correctIndex: 1,
    explanation:
      "John the Baptist baptized Jesus in the Jordan River. When Jesus came up out of the water, the heavens opened and the Spirit descended like a dove.",
    scripture: "Matthew 3:13–17",
    category: "Gospels",
  },
  {
    question: "What mountain did Jesus deliver the Beatitudes from?",
    options: [
      "Mount Sinai",
      "Mount Carmel",
      "A mountainside (Mount of Beatitudes)",
      "Mount of Olives",
    ],
    correctIndex: 2,
    explanation:
      "Jesus taught the Sermon on the Mount, including the Beatitudes, from a mountainside near the Sea of Galilee.",
    scripture: "Matthew 5:1–12",
    category: "Gospels",
  },
  {
    question:
      "Which Psalm begins with “The Lord is my shepherd; I shall not want”?",
    options: ["Psalm 1", "Psalm 19", "Psalm 23", "Psalm 91"],
    correctIndex: 2,
    explanation:
      "Psalm 23, written by David, is one of the most beloved passages in Scripture, depicting God as a caring shepherd who provides for every need.",
    scripture: "Psalm 23:1",
    category: "Psalms",
  },
  {
    question: "Which Psalm declares “The heavens declare the glory of God”?",
    options: ["Psalm 8", "Psalm 19", "Psalm 24", "Psalm 100"],
    correctIndex: 1,
    explanation:
      "Psalm 19 celebrates how God’s creation reveals His majesty and how His Word is perfect, refreshing the soul.",
    scripture: "Psalm 19:1",
    category: "Psalms",
  },
  {
    question: "Which Psalm says “Be still, and know that I am God”?",
    options: ["Psalm 23", "Psalm 37", "Psalm 46", "Psalm 119"],
    correctIndex: 2,
    explanation:
      "Psalm 46 reminds us that God is our refuge and strength. In the midst of turmoil, He calls us to be still and trust Him.",
    scripture: "Psalm 46:10",
    category: "Psalms",
  },
  {
    question:
      "According to Proverbs, what is the beginning of knowledge?",
    options: ["Love", "Wisdom", "The fear of the Lord", "Obedience"],
    correctIndex: 2,
    explanation:
      "Proverbs teaches that true knowledge and wisdom begin with reverence for God, which shapes how we understand the world.",
    scripture: "Proverbs 1:7",
    category: "Proverbs",
  },
  {
    question:
      'Proverbs 3:5 tells us to "Trust in the Lord with all your heart and lean not on your own ___."',
    options: ["Strength", "Wisdom", "Understanding", "Knowledge"],
    correctIndex: 2,
    explanation:
      "This beloved proverb calls us to fully rely on God rather than our own limited perspective, trusting that He will direct our paths.",
    scripture: "Proverbs 3:5–6",
    category: "Proverbs",
  },
  {
    question:
      "According to Proverbs, what does a gentle answer turn away?",
    options: ["Sorrow", "Wrath", "Fear", "Doubt"],
    correctIndex: 1,
    explanation:
      "Proverbs teaches the power of our words: a gentle, soft answer can defuse anger, while harsh words stir up conflict.",
    scripture: "Proverbs 15:1",
    category: "Proverbs",
  },
  {
    question:
      "Who wrote most of the letters (epistles) in the New Testament?",
    options: ["Peter", "James", "John", "Paul"],
    correctIndex: 3,
    explanation:
      "The apostle Paul wrote thirteen epistles (letters) to early churches and individuals, forming a major portion of the New Testament.",
    scripture: "Romans–Philemon",
    category: "New Testament",
  },
  {
    question: "On what day did Jesus rise from the dead?",
    options: ["The first day", "The second day", "The third day", "The seventh day"],
    correctIndex: 2,
    explanation:
      "Jesus rose from the dead on the third day after His crucifixion, just as He had foretold, fulfilling Scripture.",
    scripture: "1 Corinthians 15:3–4; Luke 24:1–7",
    category: "New Testament",
  },
  {
    question:
      "What event is described in Acts 2 when the Holy Spirit descended on the believers?",
    options: ["The Last Supper", "Pentecost", "The Ascension", "The Transfiguration"],
    correctIndex: 1,
    explanation:
      "At Pentecost, the Holy Spirit came upon the believers gathered in Jerusalem with the sound of a mighty wind and tongues of fire. About 3,000 were baptized that day.",
    scripture: "Acts 2:1–41",
    category: "New Testament",
  },
  {
    question: "What is the last book of the Bible?",
    options: ["Jude", "Hebrews", "Revelation", "Acts"],
    correctIndex: 2,
    explanation:
      "Revelation, written by the apostle John, is the last book of the Bible. It contains prophetic visions about the end times and the return of Christ.",
    scripture: "Revelation 1:1–3",
    category: "New Testament",
  },
  {
    question:
      "Which Old Testament prophet was swallowed by a great fish?",
    options: ["Elijah", "Jonah", "Isaiah", "Jeremiah"],
    correctIndex: 1,
    explanation:
      "When Jonah fled from God’s call to go to Nineveh, God sent a great fish to swallow him. After three days and nights, the fish released him and Jonah obeyed.",
    scripture: "Jonah 1:17–2:10",
    category: "Old Testament",
  },
  {
    question:
      "In the parable of the Good Samaritan, who stopped to help the injured man?",
    options: [
      "A Levite",
      "A priest",
      "A Samaritan",
      "A Roman soldier",
    ],
    correctIndex: 2,
    explanation:
      "In Jesus’ parable, both a priest and a Levite passed by the injured man. Only the Samaritan stopped to show mercy and care for him, teaching us to love our neighbor.",
    scripture: "Luke 10:25–37",
    category: "Gospels",
  },
];

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function BibleTriviaPage() {
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const startGame = useCallback(() => {
    setQuestions(shuffle(QUESTIONS));
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(false);
    setGameOver(false);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  // Guard while questions are loading
  if (questions.length === 0) return null;

  const current = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = ((currentIndex + (answered ? 1 : 0)) / totalQuestions) * 100;
  const isCorrect = selectedAnswer === current.correctIndex;

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
                  </div>

                  <Button
                    size="lg"
                    onClick={startGame}
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
                    <span>
                      Question {currentIndex + 1} of {totalQuestions}
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
                  {/* Category badge + question */}
                  <div className="p-6 sm:p-8">
                    <Badge className="mb-4 bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                      {current.category}
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
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                            <BookOpen className="mr-1 inline h-4 w-4" />
                            Read more: {current.scripture}
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
