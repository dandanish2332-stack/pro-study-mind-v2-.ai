import React, { useState, useEffect, useRef } from "react";
import {
  Gamepad2,
  Trophy,
  Flame,
  Sparkles,
  Timer,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Award,
  Zap,
  BookOpen,
  Atom,
  FlaskConical,
  Dna,
  Calculator,
  Binary,
  Compass,
  Shuffle,
  Star,
  Check,
  Play,
  Lock,
  BarChart3,
  Lightbulb,
  Layers,
  Delete,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Bug,
  Code2,
  Beaker,
  Flag,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import {
  getUserItem,
  setUserItem,
  persistUserKeyToServer,
  persistUserStateBatchToServer,
  logUserActivityToServer,
} from "../utils/userStorage";
import {
  EducationalGameMeta,
  GameQuestionItem,
  GameScoreRecord,
  StudentGameProfile,
  StudentBadge,
  GameDifficulty,
  GameplayType,
  SpellingWordItem,
  MemoryCardItem,
  ConnectorPairItem,
  MathTargetPuzzleItem,
  TrueFalseItem,
  ChemicalLabItem,
  SequenceOrderItem,
  CodeBugHuntItem,
  ElementSymbolRushItem,
  FormulaDerivationItem,
  PakistanTriviaItem,
} from "../types";
import {
  EDUCATIONAL_GAMES_METADATA,
  GAME_QUESTIONS_BANK,
  INITIAL_BADGES,
  SPELLING_WORDS_BANK,
  MEMORY_CARD_SETS,
  CONNECTOR_ROUNDS,
  MATH_TARGET_PUZZLES_BANK,
  TRUE_FALSE_BANK,
  CHEMICAL_LAB_ROUNDS,
  SEQUENCE_ORDER_ROUNDS,
  CODE_BUG_HUNT_ROUNDS,
  ELEMENT_SYMBOL_ROUNDS,
  FORMULA_DERIVATION_ROUNDS,
  PAKISTAN_TRIVIA_ROUNDS,
} from "../data/educationalGamesData";
import {
  playCorrectSound,
  playIncorrectSound,
  playStreakSound,
  playLevelUpSound,
  playClickSound,
} from "../utils/gameAudio";

const getFreshGamesProfile = (): StudentGameProfile => ({
  level: 0,
  xp: 0,
  xpToNextLevel: 250,
  title: "Novice Scholar",
  totalGamesPlayed: 0,
  totalCorrect: 0,
  highestStreak: 0,
  soundEnabled: true,
  badges: INITIAL_BADGES.map((b) => ({ ...b, unlocked: false })),
  history: [],
});

export const EducationalGamesView: React.FC = () => {
  const { language, speakBunny } = useApp();
  const { currentUser } = useAuth();

  // Student Profile State (Isolated per user account)
  const [profile, setProfile] = useState<StudentGameProfile>(() => {
    return getUserItem<StudentGameProfile>(currentUser?.id, "games_profile", getFreshGamesProfile());
  });

  const lastSyncedProfileRef = useRef<string>(
    JSON.stringify(getUserItem<StudentGameProfile>(currentUser?.id, "games_profile", getFreshGamesProfile()))
  );

  // Re-synchronize profile when user switches
  useEffect(() => {
    const loaded = getUserItem<StudentGameProfile>(currentUser?.id, "games_profile", getFreshGamesProfile());
    lastSyncedProfileRef.current = JSON.stringify(loaded);
    setProfile(loaded);
  }, [currentUser?.id]);

  // Sync profile to user storage & backend when mutated
  useEffect(() => {
    if (currentUser?.id) {
      setUserItem(currentUser.id, "games_profile", profile);
      setUserItem(currentUser.id, "game_profile", profile);
      const serialized = JSON.stringify(profile);
      if (serialized !== lastSyncedProfileRef.current) {
        lastSyncedProfileRef.current = serialized;
        persistUserKeyToServer(currentUser.id, "games_profile", profile);
        if (profile.totalGamesPlayed > 0) {
          logUserActivityToServer({
            userId: currentUser.id,
            userEmail: currentUser.email,
            userName: currentUser.name,
            feature: "games",
            action: "GAME_PROGRESS_UPDATED",
            details: `Level ${profile.level} · ${profile.xp} XP · ${profile.totalGamesPlayed} games played`,
          });
        }
      }
    }
  }, [profile, currentUser?.id, currentUser?.email, currentUser?.name]);

  // Main Navigation Modes: "hub" | "play" | "summary" | "badges"
  const [viewMode, setViewMode] = useState<"hub" | "play" | "summary" | "badges">("hub");

  // Filter in Hub
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>("medium");
  const [selectedGameplayFilter, setSelectedGameplayFilter] = useState<string>("all");

  // Active Game Meta
  const [activeGameMeta, setActiveGameMeta] = useState<EducationalGameMeta | null>(null);

  // Scoring & Progression State
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreakThisGame, setBestStreakThisGame] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [totalQuestionsInSession, setTotalQuestionsInSession] = useState<number>(10);

  // Global Timer for game rounds
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60);
  const [timerTotalSec, setTimerTotalSec] = useState<number>(60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Alerts
  const [showLevelUpAlert, setShowLevelUpAlert] = useState<boolean>(false);
  const [newlyUnlockedBadge, setNewlyUnlockedBadge] = useState<StudentBadge | null>(null);

  // ========================================================
  // SUB-GAME 1: SPELLING & ANAGRAM RUSH STATE
  // ========================================================
  const [spellingQuestions, setSpellingQuestions] = useState<SpellingWordItem[]>([]);
  const [spellingQIndex, setSpellingQIndex] = useState<number>(0);
  const [scrambledTiles, setScrambledTiles] = useState<Array<{ id: string; letter: string; used: boolean }>>([]);
  const [spelledSlots, setSpelledSlots] = useState<Array<{ tileId: string; letter: string }>>([]);
  const [spellingSubmitted, setSpellingSubmitted] = useState<boolean>(false);
  const [spellingIsCorrect, setSpellingIsCorrect] = useState<boolean>(false);
  const [revealedLettersCount, setRevealedLettersCount] = useState<number>(0);

  // ========================================================
  // SUB-GAME 2: MEMORY FLIP MATCH PUZZLE STATE
  // ========================================================
  const [memoryCards, setMemoryCards] = useState<MemoryCardItem[]>([]);
  const [flippedCardIndices, setFlippedCardIndices] = useState<number[]>([]);
  const [matchedPairsCount, setMatchedPairsCount] = useState<number>(0);
  const [memoryMovesCount, setMemoryMovesCount] = useState<number>(0);
  const [isMemoryChecking, setIsMemoryChecking] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 3: STEM CONCEPT CONNECTOR PUZZLE STATE
  // ========================================================
  const [connectorPairs, setConnectorPairs] = useState<ConnectorPairItem[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [selectedRightId, setSelectedRightId] = useState<string | null>(null);
  const [connectedPairIds, setConnectedPairIds] = useState<string[]>([]);
  const [connectorMismatchId, setConnectorMismatchId] = useState<string | null>(null);
  const [connectorInstruction, setConnectorInstruction] = useState<string>("");

  // ========================================================
  // SUB-GAME 4: NUMBER TARGET 24 PUZZLE STATE
  // ========================================================
  const [mathTargetPuzzles, setMathTargetPuzzles] = useState<MathTargetPuzzleItem[]>([]);
  const [mathTargetIndex, setMathTargetIndex] = useState<number>(0);
  const [mathFormulaInput, setMathFormulaInput] = useState<string>("");
  const [usedNumberIndices, setUsedNumberIndices] = useState<number[]>([]);
  const [mathCalculatedVal, setMathCalculatedVal] = useState<number | null>(null);
  const [mathFeedbackMsg, setMathFeedbackMsg] = useState<string | null>(null);
  const [mathTargetCleared, setMathTargetCleared] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 5: TRUE / FALSE SPEED BLITZ STATE
  // ========================================================
  const [tfQuestions, setTfQuestions] = useState<TrueFalseItem[]>([]);
  const [tfCurrentIndex, setTfCurrentIndex] = useState<number>(0);
  const [tfAnswerSubmitted, setTfAnswerSubmitted] = useState<boolean>(false);
  const [tfWasCorrect, setTfWasCorrect] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 6: SPEED QUIZ DUEL STATE
  // ========================================================
  const [quizQuestions, setQuizQuestions] = useState<GameQuestionItem[]>([]);
  const [quizQIndex, setQuizQIndex] = useState<number>(0);
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswerSubmitted, setQuizAnswerSubmitted] = useState<boolean>(false);
  const [quizIsCorrect, setQuizIsCorrect] = useState<boolean>(false);
  const [quizShowHint, setQuizShowHint] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 7: ALCHEMIST LAB IONIC FORMULA REACTOR STATE
  // ========================================================
  const [chemRounds, setChemRounds] = useState<ChemicalLabItem[]>([]);
  const [chemRoundIndex, setChemRoundIndex] = useState<number>(0);
  const [selectedCation, setSelectedCation] = useState<string | null>(null);
  const [selectedAnion, setSelectedAnion] = useState<string | null>(null);
  const [cationCount, setCationCount] = useState<number>(0);
  const [anionCount, setAnionCount] = useState<number>(0);
  const [chemSubmitted, setChemSubmitted] = useState<boolean>(false);
  const [chemIsCorrect, setChemIsCorrect] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 8: BIOQUEST PROCESS CYCLE SEQUENCER STATE
  // ========================================================
  const [seqRounds, setSeqRounds] = useState<SequenceOrderItem[]>([]);
  const [seqRoundIndex, setSeqRoundIndex] = useState<number>(0);
  const [userOrderedSteps, setUserOrderedSteps] = useState<string[]>([]);
  const [seqSubmitted, setSeqSubmitted] = useState<boolean>(false);
  const [seqIsCorrect, setSeqIsCorrect] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 9: BUG DETECTIVE (CODE SYNTAX & LOGIC HUNT) STATE
  // ========================================================
  const [bugRounds, setBugRounds] = useState<CodeBugHuntItem[]>([]);
  const [bugRoundIndex, setBugRoundIndex] = useState<number>(0);
  const [selectedBugLine, setSelectedBugLine] = useState<number | null>(null);
  const [selectedFixIndex, setSelectedFixIndex] = useState<number | null>(null);
  const [bugSubmitted, setBugSubmitted] = useState<boolean>(false);
  const [bugIsCorrect, setBugIsCorrect] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 10: ELEMENT SYMBOL RUSH STATE
  // ========================================================
  const [elementRounds, setElementRounds] = useState<ElementSymbolRushItem[]>([]);
  const [elementRoundIndex, setElementRoundIndex] = useState<number>(0);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [elementSubmitted, setElementSubmitted] = useState<boolean>(false);
  const [elementIsCorrect, setElementIsCorrect] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 11: FORMULA ARCHITECT STATE
  // ========================================================
  const [formulaRounds, setFormulaRounds] = useState<FormulaDerivationItem[]>([]);
  const [formulaRoundIndex, setFormulaRoundIndex] = useState<number>(0);
  const [placedFormulaTokens, setPlacedFormulaTokens] = useState<string[]>([]);
  const [availableFormulaTokens, setAvailableFormulaTokens] = useState<Array<{ id: string; token: string; used: boolean }>>([]);
  const [formulaSubmitted, setFormulaSubmitted] = useState<boolean>(false);
  const [formulaIsCorrect, setFormulaIsCorrect] = useState<boolean>(false);

  // ========================================================
  // SUB-GAME 12: PAKISTAN STUDIES & HERITAGE QUEST STATE
  // ========================================================
  const [pakistanRounds, setPakistanRounds] = useState<PakistanTriviaItem[]>([]);
  const [pakistanRoundIndex, setPakistanRoundIndex] = useState<number>(0);
  const [selectedPakOption, setSelectedPakOption] = useState<number | null>(null);
  const [pakistanSubmitted, setPakistanSubmitted] = useState<boolean>(false);
  const [pakistanIsCorrect, setPakistanIsCorrect] = useState<boolean>(false);

  // Global post-game educational review items
  const [sessionReviewItems, setSessionReviewItems] = useState<
    Array<{
      title: string;
      userResponse: string;
      expectedResponse: string;
      wasCorrect: boolean;
      explanation: string;
    }>
  >([]);

  // Sound toggle
  const toggleSound = () => {
    setProfile((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  // Helper title for level
  const getLevelTitle = (lvl: number): string => {
    if (lvl <= 2) return "Curious Scholar";
    if (lvl <= 4) return "Academic Explorer";
    if (lvl <= 7) return "Knowledge Seeker";
    if (lvl <= 10) return "Master Thinker";
    if (lvl <= 14) return "Subject Virtuoso";
    if (lvl <= 18) return "Grand Academic Polymath";
    return "Universal Brain Prodigy";
  };

  // ========================================================
  // LAUNCH GAME BY METADATA
  // ========================================================
  const startGame = (meta: EducationalGameMeta, customDiff?: GameDifficulty) => {
    playClickSound(profile.soundEnabled);
    const diff = customDiff || selectedDifficulty;

    setActiveGameMeta(meta);
    setCurrentScore(0);
    setCurrentStreak(0);
    setBestStreakThisGame(0);
    setCorrectAnswersCount(0);
    setSessionReviewItems([]);
    setShowLevelUpAlert(false);
    setNewlyUnlockedBadge(null);

    const timeLimit = meta.defaultTimeLimitSec || 60;
    setSecondsRemaining(timeLimit);
    setTimerTotalSec(timeLimit);
    setIsTimerPaused(false);

    // Initialize the specific game mode
    switch (meta.gameplayType) {
      case "spelling":
        initSpellingGame(diff);
        break;
      case "memory_puzzle":
        initMemoryPuzzleGame(diff);
        break;
      case "connector":
        initConnectorGame(diff);
        break;
      case "math_target":
        initMathTargetGame(diff);
        break;
      case "true_false":
        initTrueFalseGame(diff);
        break;
      case "chemical_lab":
        initChemLabGame(diff);
        break;
      case "sequence_order":
        initSequenceOrderGame(diff);
        break;
      case "code_bug_hunt":
        initCodeBugHuntGame(diff);
        break;
      case "element_symbol_rush":
        initElementSymbolGame(diff);
        break;
      case "formula_derivation":
        initFormulaDerivationGame(diff);
        break;
      case "pakistan_trivia":
        initPakistanTriviaGame(diff);
        break;
      case "quiz":
      default:
        initQuizGame(meta, diff);
        break;
    }

    setViewMode("play");
  };

  // Launch Random Game
  const launchRandomGame = () => {
    playClickSound(profile.soundEnabled);
    const randomMeta =
      EDUCATIONAL_GAMES_METADATA[
        Math.floor(Math.random() * EDUCATIONAL_GAMES_METADATA.length)
      ];
    startGame(randomMeta);
  };

  // ========================================================
  // 1. SPELLING GAME INITIALIZER & HANDLERS
  // ========================================================
  const initSpellingGame = (diff: GameDifficulty) => {
    let list = SPELLING_WORDS_BANK.filter((w) => w.difficulty === diff);
    if (list.length < 4) list = SPELLING_WORDS_BANK;

    const shuffled = [...list].sort(() => 0.5 - Math.random()).slice(0, 8);
    setSpellingQuestions(shuffled);
    setSpellingQIndex(0);
    setTotalQuestionsInSession(shuffled.length);
    setupSpellingWord(shuffled[0]);
  };

  const setupSpellingWord = (item: SpellingWordItem) => {
    if (!item) return;
    const cleanWord = item.word.toUpperCase().replace(/[^A-Z]/g, "");
    const letters = cleanWord.split("");
    // Scramble letters
    const scrambled = [...letters]
      .sort(() => 0.5 - Math.random())
      .map((l, i) => ({ id: `tile-${i}-${l}`, letter: l, used: false }));

    setScrambledTiles(scrambled);
    setSpelledSlots([]);
    setSpellingSubmitted(false);
    setSpellingIsCorrect(false);
    setRevealedLettersCount(0);
  };

  const handleTileClick = (tileId: string, letter: string) => {
    if (spellingSubmitted) return;
    playClickSound(profile.soundEnabled);

    setScrambledTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, used: true } : t))
    );
    setSpelledSlots((prev) => [...prev, { tileId, letter }]);
  };

  const handleSlotClick = (index: number) => {
    if (spellingSubmitted) return;
    playClickSound(profile.soundEnabled);

    const slotItem = spelledSlots[index];
    if (!slotItem) return;

    // Return letter tile to pool
    setScrambledTiles((prev) =>
      prev.map((t) => (t.id === slotItem.tileId ? { ...t, used: false } : t))
    );
    setSpelledSlots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSpellingBackspace = () => {
    if (spellingSubmitted || spelledSlots.length === 0) return;
    playClickSound(profile.soundEnabled);

    const last = spelledSlots[spelledSlots.length - 1];
    setScrambledTiles((prev) =>
      prev.map((t) => (t.id === last.tileId ? { ...t, used: false } : t))
    );
    setSpelledSlots((prev) => prev.slice(0, -1));
  };

  const handleSpellingClear = () => {
    if (spellingSubmitted) return;
    playClickSound(profile.soundEnabled);
    setScrambledTiles((prev) => prev.map((t) => ({ ...t, used: false })));
    setSpelledSlots([]);
  };

  const handleSpellingShuffle = () => {
    playClickSound(profile.soundEnabled);
    setScrambledTiles((prev) => [...prev].sort(() => 0.5 - Math.random()));
  };

  const handleSpellingRevealLetter = () => {
    if (spellingSubmitted) return;
    const currentQ = spellingQuestions[spellingQIndex];
    if (!currentQ) return;

    const targetWord = currentQ.word.toUpperCase();
    const nextIdx = spelledSlots.length;
    if (nextIdx >= targetWord.length) return;

    const neededLetter = targetWord[nextIdx];
    // Find an unused tile with this letter
    const availableTile = scrambledTiles.find(
      (t) => !t.used && t.letter === neededLetter
    );
    if (availableTile) {
      handleTileClick(availableTile.id, availableTile.letter);
      setRevealedLettersCount((prev) => prev + 1);
    }
  };

  // Check spelling when slots match word length
  useEffect(() => {
    if (
      activeGameMeta?.gameplayType === "spelling" &&
      spellingQuestions[spellingQIndex] &&
      !spellingSubmitted
    ) {
      const currentQ = spellingQuestions[spellingQIndex];
      const targetWord = currentQ.word.toUpperCase().replace(/[^A-Z]/g, "");
      if (targetWord.length > 0 && spelledSlots.length === targetWord.length) {
        verifySpelledWord();
      }
    }
  }, [spelledSlots, activeGameMeta?.gameplayType, spellingQuestions, spellingQIndex, spellingSubmitted]);

  const verifySpelledWord = () => {
    const currentQ = spellingQuestions[spellingQIndex];
    if (!currentQ) return;

    const spelled = spelledSlots.map((s) => s.letter).join("");
    const targetWord = currentQ.word.toUpperCase().replace(/[^A-Z]/g, "");
    const isRight = spelled === targetWord;

    setSpellingSubmitted(true);
    setSpellingIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const pts = Math.max(50, 150 - revealedLettersCount * 25);
      setCurrentScore((prev) => prev + pts * (nextStreak >= 3 ? 1.5 : 1));
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((prev) => Math.max(prev, nextStreak));
      setCorrectAnswersCount((prev) => prev + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Spell Word: ${currentQ.clue}`,
        userResponse: spelled || "(Blank)",
        expectedResponse: targetWord,
        wasCorrect: isRight,
        explanation: currentQ.explanation,
      },
    ]);
  };

  const handleNextSpellingWord = () => {
    playClickSound(profile.soundEnabled);
    if (spellingQIndex + 1 < spellingQuestions.length) {
      const nextIndex = spellingQIndex + 1;
      setSpellingQIndex(nextIndex);
      setupSpellingWord(spellingQuestions[nextIndex]);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 45);
    } else {
      finishGameSession();
    }
  };

  // Keyboard listener for Spelling Game (type letters, backspace, enter)
  useEffect(() => {
    if (
      viewMode !== "play" ||
      activeGameMeta?.gameplayType !== "spelling" ||
      spellingSubmitted
    )
      return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (/^[A-Z]$/.test(key)) {
        // Find first unused tile with this letter
        const match = scrambledTiles.find((t) => !t.used && t.letter === key);
        if (match) {
          handleTileClick(match.id, match.letter);
        }
      } else if (e.key === "Backspace") {
        handleSpellingBackspace();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, activeGameMeta, spellingSubmitted, scrambledTiles]);

  // ========================================================
  // 2. MEMORY FLIP MATCH PUZZLE INITIALIZER & HANDLERS
  // ========================================================
  const initMemoryPuzzleGame = (diff: GameDifficulty) => {
    const setKeys = Object.keys(MEMORY_CARD_SETS);
    const chosenKey = setKeys[Math.floor(Math.random() * setKeys.length)];
    const chosenSet = MEMORY_CARD_SETS[chosenKey];

    // Pick 6 pairs (12 cards)
    const pairs = chosenSet.pairs.slice(0, 6);
    const cards: MemoryCardItem[] = [];

    pairs.forEach((p, idx) => {
      cards.push({
        id: `card-${idx}-a`,
        pairId: p.pairId,
        content: p.a,
        subLabel: chosenSet.subject,
        isFlipped: false,
        isMatched: false,
        subject: chosenSet.subject,
      });
      cards.push({
        id: `card-${idx}-b`,
        pairId: p.pairId,
        content: p.b,
        subLabel: chosenSet.subject,
        isFlipped: false,
        isMatched: false,
        subject: chosenSet.subject,
      });
    });

    // Shuffle cards
    const shuffledCards = cards.sort(() => 0.5 - Math.random());
    setMemoryCards(shuffledCards);
    setFlippedCardIndices([]);
    setMatchedPairsCount(0);
    setMemoryMovesCount(0);
    setIsMemoryChecking(false);
    setTotalQuestionsInSession(6);
  };

  const handleCardClick = (cardIdx: number) => {
    if (isMemoryChecking) return;
    const card = memoryCards[cardIdx];
    if (!card || card.isFlipped || card.isMatched) return;

    playClickSound(profile.soundEnabled);

    // Flip card
    const updatedCards = [...memoryCards];
    updatedCards[cardIdx].isFlipped = true;
    setMemoryCards(updatedCards);

    const nextFlipped = [...flippedCardIndices, cardIdx];
    setFlippedCardIndices(nextFlipped);

    if (nextFlipped.length === 2) {
      setIsMemoryChecking(true);
      setMemoryMovesCount((m) => m + 1);

      const firstCard = updatedCards[nextFlipped[0]];
      const secondCard = updatedCards[nextFlipped[1]];

      if (firstCard.pairId === secondCard.pairId) {
        // MATCH!
        setTimeout(() => {
          playCorrectSound(profile.soundEnabled);
          const matchedCards = updatedCards.map((c, i) =>
            i === nextFlipped[0] || i === nextFlipped[1]
              ? { ...c, isMatched: true }
              : c
          );
          setMemoryCards(matchedCards);
          setFlippedCardIndices([]);
          setIsMemoryChecking(false);

          const newMatchedCount = matchedPairsCount + 1;
          setMatchedPairsCount(newMatchedCount);
          setCurrentScore((s) => s + 120);
          setCorrectAnswersCount(newMatchedCount);

          if (newMatchedCount >= 6) {
            playLevelUpSound(profile.soundEnabled);
            setTimeout(() => {
              finishGameSession();
            }, 600);
          }
        }, 400);
      } else {
        // Mismatch - flip back down
        setTimeout(() => {
          playIncorrectSound(profile.soundEnabled);
          const revertedCards = updatedCards.map((c, i) =>
            i === nextFlipped[0] || i === nextFlipped[1]
              ? { ...c, isFlipped: false }
              : c
          );
          setMemoryCards(revertedCards);
          setFlippedCardIndices([]);
          setIsMemoryChecking(false);
        }, 900);
      }
    }
  };

  // ========================================================
  // 3. STEM CONCEPT CONNECTOR PUZZLE INITIALIZER & HANDLERS
  // ========================================================
  const initConnectorGame = (_diff: GameDifficulty) => {
    const round = CONNECTOR_ROUNDS[Math.floor(Math.random() * CONNECTOR_ROUNDS.length)];
    setConnectorPairs(round.pairs);
    setConnectorInstruction(round.instruction);
    setSelectedLeftId(null);
    setSelectedRightId(null);
    setConnectedPairIds([]);
    setConnectorMismatchId(null);
    setTotalQuestionsInSession(round.pairs.length);
  };

  const handleConnectorLeftClick = (leftId: string) => {
    playClickSound(profile.soundEnabled);
    if (connectedPairIds.includes(leftId)) return;
    setSelectedLeftId(leftId);
    setConnectorMismatchId(null);

    // If right item was already selected, test match
    if (selectedRightId) {
      testConnectorMatch(leftId, selectedRightId);
    }
  };

  const handleConnectorRightClick = (rightId: string) => {
    playClickSound(profile.soundEnabled);
    const isAlreadyConnected = connectorPairs.some(
      (p) => p.rightId === rightId && connectedPairIds.includes(p.leftId)
    );
    if (isAlreadyConnected) return;

    setSelectedRightId(rightId);
    setConnectorMismatchId(null);

    if (selectedLeftId) {
      testConnectorMatch(selectedLeftId, rightId);
    }
  };

  const testConnectorMatch = (leftId: string, rightId: string) => {
    const foundPair = connectorPairs.find(
      (p) => p.leftId === leftId && p.rightId === rightId
    );

    if (foundPair) {
      playCorrectSound(profile.soundEnabled);
      const nextConnected = [...connectedPairIds, leftId];
      setConnectedPairIds(nextConnected);
      setSelectedLeftId(null);
      setSelectedRightId(null);
      setCurrentScore((s) => s + 100);
      setCorrectAnswersCount(nextConnected.length);

      setSessionReviewItems((prev) => [
        ...prev,
        {
          title: `Connect: ${foundPair.leftText}`,
          userResponse: foundPair.rightText,
          expectedResponse: foundPair.rightText,
          wasCorrect: true,
          explanation: foundPair.explanation,
        },
      ]);

      if (nextConnected.length >= connectorPairs.length) {
        playLevelUpSound(profile.soundEnabled);
        setTimeout(() => {
          finishGameSession();
        }, 800);
      }
    } else {
      playIncorrectSound(profile.soundEnabled);
      setConnectorMismatchId(leftId);
      setTimeout(() => {
        setSelectedLeftId(null);
        setSelectedRightId(null);
        setConnectorMismatchId(null);
      }, 700);
    }
  };

  // ========================================================
  // 4. NUMBER TARGET 24 PUZZLE INITIALIZER & HANDLERS
  // ========================================================
  const initMathTargetGame = (diff: GameDifficulty) => {
    let list = MATH_TARGET_PUZZLES_BANK.filter((p) => p.difficulty === diff);
    if (list.length < 3) list = MATH_TARGET_PUZZLES_BANK;
    setMathTargetPuzzles(list);
    setMathTargetIndex(0);
    setTotalQuestionsInSession(list.length);
    setupMathTargetPuzzle(list[0]);
  };

  const setupMathTargetPuzzle = (_puzzle: MathTargetPuzzleItem) => {
    setMathFormulaInput("");
    setUsedNumberIndices([]);
    setMathCalculatedVal(null);
    setMathFeedbackMsg(null);
    setMathTargetCleared(false);
  };

  const handleAppendMathNumber = (num: number, idx: number) => {
    if (mathTargetCleared || usedNumberIndices.includes(idx)) return;
    playClickSound(profile.soundEnabled);
    setUsedNumberIndices((prev) => [...prev, idx]);
    setMathFormulaInput((prev) => (prev ? `${prev} ${num}` : `${num}`));
  };

  const handleAppendMathOp = (op: string) => {
    if (mathTargetCleared || !mathFormulaInput) return;
    playClickSound(profile.soundEnabled);
    setMathFormulaInput((prev) => `${prev} ${op}`);
  };

  const handleMathClearFormula = () => {
    if (mathTargetCleared) return;
    playClickSound(profile.soundEnabled);
    setMathFormulaInput("");
    setUsedNumberIndices([]);
    setMathCalculatedVal(null);
    setMathFeedbackMsg(null);
  };

  const handleEvaluateMathFormula = () => {
    const currentPuzzle = mathTargetPuzzles[mathTargetIndex];
    if (!currentPuzzle || !mathFormulaInput) return;

    try {
      // Clean and safely calculate
      const safeFormula = mathFormulaInput
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/[^0-9+\-*/().\s]/g, "");

      // Evaluate safely
      const computed = Function(`"use strict"; return (${safeFormula});`)();
      setMathCalculatedVal(computed);

      if (Math.abs(computed - currentPuzzle.target) < 0.001) {
        // TARGET HIT!
        playCorrectSound(profile.soundEnabled);
        setMathTargetCleared(true);
        setMathFeedbackMsg(`🎯 Target Reached! ${mathFormulaInput} = ${currentPuzzle.target}`);
        setCurrentScore((s) => s + 150);
        setCorrectAnswersCount((c) => c + 1);

        setSessionReviewItems((prev) => [
          ...prev,
          {
            title: `Hit Target ${currentPuzzle.target}`,
            userResponse: mathFormulaInput,
            expectedResponse: `${currentPuzzle.target} (e.g. ${currentPuzzle.solutionExample})`,
            wasCorrect: true,
            explanation: `You successfully hit the target: ${safeFormula} = ${computed}!`,
          },
        ]);
      } else {
        playIncorrectSound(profile.soundEnabled);
        setMathFeedbackMsg(`Evaluated to ${computed}. We need ${currentPuzzle.target}!`);
      }
    } catch (err) {
      playIncorrectSound(profile.soundEnabled);
      setMathFeedbackMsg("Invalid mathematical formula. Check operator syntax.");
    }
  };

  const handleNextMathTarget = () => {
    playClickSound(profile.soundEnabled);
    if (mathTargetIndex + 1 < mathTargetPuzzles.length) {
      const nextIdx = mathTargetIndex + 1;
      setMathTargetIndex(nextIdx);
      setupMathTargetPuzzle(mathTargetPuzzles[nextIdx]);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 60);
    } else {
      finishGameSession();
    }
  };

  // ========================================================
  // 5. LIGHTNING TRUE / FALSE SPEED BLITZ INITIALIZER & HANDLERS
  // ========================================================
  const initTrueFalseGame = (_diff: GameDifficulty) => {
    const shuffled = [...TRUE_FALSE_BANK].sort(() => 0.5 - Math.random()).slice(0, 10);
    setTfQuestions(shuffled);
    setTfCurrentIndex(0);
    setTfAnswerSubmitted(false);
    setTfWasCorrect(false);
    setTotalQuestionsInSession(shuffled.length);
  };

  const handleTfChoice = (userBool: boolean) => {
    if (tfAnswerSubmitted) return;
    const currentQ = tfQuestions[tfCurrentIndex];
    if (!currentQ) return;

    const isRight = userBool === currentQ.isTrue;
    setTfAnswerSubmitted(true);
    setTfWasCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      setCurrentScore((s) => s + (nextStreak >= 4 ? 120 : 80));
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Fact: ${currentQ.statement}`,
        userResponse: userBool ? "True" : "False",
        expectedResponse: currentQ.isTrue ? "True" : "False",
        wasCorrect: isRight,
        explanation: currentQ.explanation,
      },
    ]);
  };

  const handleNextTfQuestion = () => {
    playClickSound(profile.soundEnabled);
    if (tfCurrentIndex + 1 < tfQuestions.length) {
      setTfCurrentIndex((prev) => prev + 1);
      setTfAnswerSubmitted(false);
      setTfWasCorrect(false);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 40);
    } else {
      finishGameSession();
    }
  };

  // ========================================================
  // 6. SPEED QUIZ DUEL INITIALIZER & HANDLERS
  // ========================================================
  const initQuizGame = (meta: EducationalGameMeta, diff: GameDifficulty) => {
    const allForCat = GAME_QUESTIONS_BANK[meta.id] || [];
    let filtered = allForCat.filter((q) => q.difficulty === diff);
    if (filtered.length < 5) filtered = allForCat;

    const shuffled = [...filtered].sort(() => 0.5 - Math.random()).slice(0, meta.questionCount || 10);
    setQuizQuestions(shuffled);
    setQuizQIndex(0);
    setQuizSelectedOption(null);
    setQuizAnswerSubmitted(false);
    setQuizIsCorrect(false);
    setQuizShowHint(false);
    setTotalQuestionsInSession(shuffled.length);
  };

  const handleQuizAnswer = (optionIdx: number) => {
    if (quizAnswerSubmitted) return;
    const currentQ = quizQuestions[quizQIndex];
    if (!currentQ) return;

    setQuizSelectedOption(optionIdx);
    setQuizAnswerSubmitted(true);

    const isRight = optionIdx === currentQ.correctIndex;
    setQuizIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const timeBonus = Math.round((secondsRemaining / timerTotalSec) * 50);
      const multiplier = nextStreak >= 5 ? 2.5 : nextStreak >= 3 ? 1.8 : 1.0;
      const pts = Math.round((100 + timeBonus) * multiplier);

      setCurrentScore((s) => s + pts);
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: currentQ.question,
        userResponse: currentQ.options[optionIdx] || "(None)",
        expectedResponse: currentQ.options[currentQ.correctIndex],
        wasCorrect: isRight,
        explanation: currentQ.explanation,
      },
    ]);
  };

  const handleNextQuizQuestion = () => {
    playClickSound(profile.soundEnabled);
    if (quizQIndex + 1 < quizQuestions.length) {
      setQuizQIndex((prev) => prev + 1);
      setQuizSelectedOption(null);
      setQuizAnswerSubmitted(false);
      setQuizIsCorrect(false);
      setQuizShowHint(false);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 60);
    } else {
      finishGameSession();
    }
  };

  // Keyboard listener for Quiz (1, 2, 3, 4)
  useEffect(() => {
    if (
      viewMode !== "play" ||
      activeGameMeta?.gameplayType !== "quiz" ||
      quizAnswerSubmitted
    )
      return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const currentQ = quizQuestions[quizQIndex];
        if (currentQ && currentQ.options[idx] !== undefined) {
          handleQuizAnswer(idx);
        }
      } else if (e.key === "h" || e.key === "H") {
        setQuizShowHint((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, activeGameMeta, quizAnswerSubmitted, quizQIndex, quizQuestions]);

  // Keyboard listener for True/False (T, F, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (
      viewMode !== "play" ||
      activeGameMeta?.gameplayType !== "true_false" ||
      tfAnswerSubmitted
    )
      return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "t" || e.key === "T" || e.key === "ArrowLeft") {
        handleTfChoice(true);
      } else if (e.key === "f" || e.key === "F" || e.key === "ArrowRight") {
        handleTfChoice(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, activeGameMeta, tfAnswerSubmitted, tfCurrentIndex]);

  const timerExpiredRef = useRef<boolean>(false);

  // Global Countdown Timer for active session
  useEffect(() => {
    if (secondsRemaining > 0) {
      timerExpiredRef.current = false;
    }
  }, [secondsRemaining]);

  useEffect(() => {
    if (viewMode === "play" && !isTimerPaused) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode, isTimerPaused, activeGameMeta]);

  useEffect(() => {
    if (viewMode === "play" && !isTimerPaused && secondsRemaining === 0 && !timerExpiredRef.current) {
      timerExpiredRef.current = true;
      handleTimeExpiration();
    }
  }, [viewMode, isTimerPaused, secondsRemaining]);

  // ========================================================
  // 7. ALCHEMIST LAB IONIC FORMULA REACTOR INITIALIZER & HANDLERS
  // ========================================================
  const initChemLabGame = (diff: GameDifficulty) => {
    let list = CHEMICAL_LAB_ROUNDS.filter((r) => r.difficulty === diff);
    if (list.length < 3) list = CHEMICAL_LAB_ROUNDS;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setChemRounds(shuffled);
    setChemRoundIndex(0);
    setTotalQuestionsInSession(shuffled.length);
    setupChemRound(shuffled[0]);
  };

  const setupChemRound = (_item: ChemicalLabItem) => {
    setSelectedCation(null);
    setSelectedAnion(null);
    setCationCount(0);
    setAnionCount(0);
    setChemSubmitted(false);
    setChemIsCorrect(false);
  };

  const handleSelectCation = (ion: string) => {
    if (chemSubmitted) return;
    playClickSound(profile.soundEnabled);
    setSelectedCation(ion);
    if (cationCount === 0) setCationCount(1);
  };

  const handleSelectAnion = (ion: string) => {
    if (chemSubmitted) return;
    playClickSound(profile.soundEnabled);
    setSelectedAnion(ion);
    if (anionCount === 0) setAnionCount(1);
  };

  const verifyChemReaction = () => {
    const currentRound = chemRounds[chemRoundIndex];
    if (!currentRound) return;

    setChemSubmitted(true);
    const isRight =
      selectedCation === currentRound.requiredCation &&
      selectedAnion === currentRound.requiredAnion &&
      cationCount === currentRound.cationCount &&
      anionCount === currentRound.anionCount;

    setChemIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const pts = 140 + Math.round((secondsRemaining / timerTotalSec) * 40);
      setCurrentScore((s) => s + pts);
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Compound Synthesis: ${currentRound.compoundName}`,
        userResponse: `${selectedCation || "?"}×${cationCount} + ${selectedAnion || "?"}×${anionCount}`,
        expectedResponse: `${currentRound.chemicalFormula} (${currentRound.requiredCation}×${currentRound.cationCount} + ${currentRound.requiredAnion}×${currentRound.anionCount})`,
        wasCorrect: isRight,
        explanation: currentRound.explanation,
      },
    ]);
  };

  const handleNextChemRound = () => {
    playClickSound(profile.soundEnabled);
    if (chemRoundIndex + 1 < chemRounds.length) {
      const nextIdx = chemRoundIndex + 1;
      setChemRoundIndex(nextIdx);
      setupChemRound(chemRounds[nextIdx]);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 60);
    } else {
      finishGameSession();
    }
  };

  // ========================================================
  // 8. BIOQUEST CYCLE SEQUENCER INITIALIZER & HANDLERS
  // ========================================================
  const initSequenceOrderGame = (diff: GameDifficulty) => {
    let list = SEQUENCE_ORDER_ROUNDS.filter((r) => r.difficulty === diff);
    if (list.length < 3) list = SEQUENCE_ORDER_ROUNDS;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setSeqRounds(shuffled);
    setSeqRoundIndex(0);
    setTotalQuestionsInSession(shuffled.length);
    setupSeqRound(shuffled[0]);
  };

  const setupSeqRound = (item: SequenceOrderItem) => {
    if (!item) return;
    const scrambled = [...item.correctSteps].sort(() => 0.5 - Math.random());
    setUserOrderedSteps(scrambled);
    setSeqSubmitted(false);
    setSeqIsCorrect(false);
  };

  const moveSeqStep = (index: number, direction: "up" | "down") => {
    if (seqSubmitted) return;
    playClickSound(profile.soundEnabled);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= userOrderedSteps.length) return;

    const copy = [...userOrderedSteps];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setUserOrderedSteps(copy);
  };

  const verifySequenceOrder = () => {
    const currentRound = seqRounds[seqRoundIndex];
    if (!currentRound) return;

    setSeqSubmitted(true);
    const isRight = userOrderedSteps.every((step, idx) => step === currentRound.correctSteps[idx]);
    setSeqIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const pts = 150 + Math.round((secondsRemaining / timerTotalSec) * 50);
      setCurrentScore((s) => s + pts);
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Process Sequence: ${currentRound.title}`,
        userResponse: userOrderedSteps.map((s, i) => `${i + 1}. ${s}`).join(" → "),
        expectedResponse: currentRound.correctSteps.map((s, i) => `${i + 1}. ${s}`).join(" → "),
        wasCorrect: isRight,
        explanation: currentRound.explanation,
      },
    ]);
  };

  const handleNextSeqRound = () => {
    playClickSound(profile.soundEnabled);
    if (seqRoundIndex + 1 < seqRounds.length) {
      const nextIdx = seqRoundIndex + 1;
      setSeqRoundIndex(nextIdx);
      setupSeqRound(seqRounds[nextIdx]);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 60);
    } else {
      finishGameSession();
    }
  };

  // ========================================================
  // 9. BUG DETECTIVE INITIALIZER & HANDLERS
  // ========================================================
  const initCodeBugHuntGame = (diff: GameDifficulty) => {
    let list = CODE_BUG_HUNT_ROUNDS.filter((r) => r.difficulty === diff);
    if (list.length < 3) list = CODE_BUG_HUNT_ROUNDS;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setBugRounds(shuffled);
    setBugRoundIndex(0);
    setTotalQuestionsInSession(shuffled.length);
    setupBugRound(shuffled[0]);
  };

  const setupBugRound = (_item: CodeBugHuntItem) => {
    setSelectedBugLine(null);
    setSelectedFixIndex(null);
    setBugSubmitted(false);
    setBugIsCorrect(false);
  };

  const handleSelectBugLine = (lineIdx: number) => {
    if (bugSubmitted) return;
    playClickSound(profile.soundEnabled);
    setSelectedBugLine(lineIdx);
  };

  const handleSelectFixOption = (fixIdx: number) => {
    if (bugSubmitted) return;
    playClickSound(profile.soundEnabled);
    setSelectedFixIndex(fixIdx);
  };

  const verifyBugPatch = (wasDirectSubmit = true) => {
    const currentRound = bugRounds[bugRoundIndex];
    if (!currentRound) return;

    setBugSubmitted(true);
    const isLineCorrect = selectedBugLine === currentRound.buggyLineIndex;
    const isFixCorrect = selectedFixIndex === currentRound.correctFixIndex;
    const isRight = wasDirectSubmit && isLineCorrect && isFixCorrect;

    setBugIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const pts = 160 + Math.round((secondsRemaining / timerTotalSec) * 40);
      setCurrentScore((s) => s + pts);
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Bug Hunt: ${currentRound.title} (${currentRound.language.toUpperCase()})`,
        userResponse: `Line ${selectedBugLine !== null ? selectedBugLine + 1 : "?"}: ${selectedFixIndex !== null ? currentRound.fixOptions[selectedFixIndex] : "None"}`,
        expectedResponse: `Line ${currentRound.buggyLineIndex + 1}: ${currentRound.fixOptions[currentRound.correctFixIndex]}`,
        wasCorrect: isRight,
        explanation: currentRound.explanation,
      },
    ]);
  };

  const handleNextBugRound = () => {
    playClickSound(profile.soundEnabled);
    if (bugRoundIndex + 1 < bugRounds.length) {
      const nextIdx = bugRoundIndex + 1;
      setBugRoundIndex(nextIdx);
      setupBugRound(bugRounds[nextIdx]);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 60);
    } else {
      finishGameSession();
    }
  };

  // ========================================================
  // 10. ELEMENT SYMBOL RUSH INITIALIZER & HANDLERS
  // ========================================================
  const initElementSymbolGame = (diff: GameDifficulty) => {
    let list = ELEMENT_SYMBOL_ROUNDS.filter((r) => r.difficulty === diff);
    if (list.length < 4) list = ELEMENT_SYMBOL_ROUNDS;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setElementRounds(shuffled);
    setElementRoundIndex(0);
    setTotalQuestionsInSession(shuffled.length);
    setupElementRound(shuffled[0]);
  };

  const setupElementRound = (_item: ElementSymbolRushItem) => {
    setSelectedSymbol(null);
    setElementSubmitted(false);
    setElementIsCorrect(false);
  };

  const handleSelectSymbol = (symbol: string) => {
    if (elementSubmitted) return;
    const currentRound = elementRounds[elementRoundIndex];
    if (!currentRound) return;

    setSelectedSymbol(symbol);
    setElementSubmitted(true);
    const isRight = symbol === currentRound.correctSymbol;
    setElementIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const pts = 120 + Math.round((secondsRemaining / timerTotalSec) * 50);
      setCurrentScore((s) => s + pts);
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Element Symbol: ${currentRound.elementName} (Atomic #${currentRound.atomicNumber})`,
        userResponse: symbol,
        expectedResponse: currentRound.correctSymbol,
        wasCorrect: isRight,
        explanation: currentRound.funFact,
      },
    ]);
  };

  const handleNextElementRound = () => {
    playClickSound(profile.soundEnabled);
    if (elementRoundIndex + 1 < elementRounds.length) {
      const nextIdx = elementRoundIndex + 1;
      setElementRoundIndex(nextIdx);
      setupElementRound(elementRounds[nextIdx]);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 45);
    } else {
      finishGameSession();
    }
  };

  // ========================================================
  // 11. FORMULA ARCHITECT INITIALIZER & HANDLERS
  // ========================================================
  const initFormulaDerivationGame = (diff: GameDifficulty) => {
    let list = FORMULA_DERIVATION_ROUNDS.filter((r) => r.difficulty === diff);
    if (list.length < 3) list = FORMULA_DERIVATION_ROUNDS;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setFormulaRounds(shuffled);
    setFormulaRoundIndex(0);
    setTotalQuestionsInSession(shuffled.length);
    setupFormulaRound(shuffled[0]);
  };

  const setupFormulaRound = (item: FormulaDerivationItem) => {
    if (!item) return;
    const tokens = item.scrambledTokens.map((t, i) => ({
      id: `tok-${i}-${t}`,
      token: t,
      used: false,
    }));
    setAvailableFormulaTokens(tokens);
    setPlacedFormulaTokens([]);
    setFormulaSubmitted(false);
    setFormulaIsCorrect(false);
  };

  const handlePlaceFormulaToken = (tokenId: string, token: string) => {
    if (formulaSubmitted) return;
    playClickSound(profile.soundEnabled);
    setAvailableFormulaTokens((prev) =>
      prev.map((t) => (t.id === tokenId ? { ...t, used: true } : t))
    );
    setPlacedFormulaTokens((prev) => [...prev, token]);
  };

  const handleRemoveFormulaToken = (slotIdx: number) => {
    if (formulaSubmitted) return;
    playClickSound(profile.soundEnabled);
    const removedToken = placedFormulaTokens[slotIdx];
    setAvailableFormulaTokens((prev) => {
      let freed = false;
      return prev.map((t) => {
        if (!freed && t.used && t.token === removedToken) {
          freed = true;
          return { ...t, used: false };
        }
        return t;
      });
    });
    setPlacedFormulaTokens((prev) => prev.filter((_, i) => i !== slotIdx));
  };

  const handleClearFormulaTokens = () => {
    if (formulaSubmitted) return;
    playClickSound(profile.soundEnabled);
    setAvailableFormulaTokens((prev) => prev.map((t) => ({ ...t, used: false })));
    setPlacedFormulaTokens([]);
  };

  const verifyFormulaDerivation = () => {
    const currentRound = formulaRounds[formulaRoundIndex];
    if (!currentRound) return;

    setFormulaSubmitted(true);
    const assembledStr = placedFormulaTokens.join(" ");
    const expectedStr = currentRound.correctTokens.join(" ");
    const isRight = assembledStr === expectedStr;

    setFormulaIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const pts = 150 + Math.round((secondsRemaining / timerTotalSec) * 45);
      setCurrentScore((s) => s + pts);
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Formula: ${currentRound.lawName}`,
        userResponse: assembledStr || "(Empty)",
        expectedResponse: currentRound.targetFormula,
        wasCorrect: isRight,
        explanation: currentRound.explanation,
      },
    ]);
  };

  const handleNextFormulaRound = () => {
    playClickSound(profile.soundEnabled);
    if (formulaRoundIndex + 1 < formulaRounds.length) {
      const nextIdx = formulaRoundIndex + 1;
      setFormulaRoundIndex(nextIdx);
      setupFormulaRound(formulaRounds[nextIdx]);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 65);
    } else {
      finishGameSession();
    }
  };

  // ========================================================
  // 12. PAKISTAN STUDIES QUEST INITIALIZER & HANDLERS
  // ========================================================
  const initPakistanTriviaGame = (diff: GameDifficulty) => {
    let list = PAKISTAN_TRIVIA_ROUNDS.filter((r) => r.difficulty === diff);
    if (list.length < 5) list = PAKISTAN_TRIVIA_ROUNDS;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    setPakistanRounds(shuffled);
    setPakistanRoundIndex(0);
    setSelectedPakOption(null);
    setPakistanSubmitted(false);
    setPakistanIsCorrect(false);
    setTotalQuestionsInSession(shuffled.length);
  };

  const handleSelectPakOption = (optionIdx: number) => {
    if (pakistanSubmitted) return;
    const currentRound = pakistanRounds[pakistanRoundIndex];
    if (!currentRound) return;

    setSelectedPakOption(optionIdx);
    setPakistanSubmitted(true);
    const isRight = optionIdx === currentRound.correctIndex;
    setPakistanIsCorrect(isRight);

    let nextStreak = currentStreak;
    if (isRight) {
      nextStreak += 1;
      const pts = 130 + Math.round((secondsRemaining / timerTotalSec) * 40);
      setCurrentScore((s) => s + pts);
      setCurrentStreak(nextStreak);
      setBestStreakThisGame((b) => Math.max(b, nextStreak));
      setCorrectAnswersCount((c) => c + 1);

      if (nextStreak >= 3) playStreakSound(profile.soundEnabled);
      else playCorrectSound(profile.soundEnabled);
    } else {
      setCurrentStreak(0);
      playIncorrectSound(profile.soundEnabled);
    }

    setSessionReviewItems((prev) => [
      ...prev,
      {
        title: `Social Studies: ${currentRound.question}`,
        userResponse: currentRound.options[optionIdx] || "None",
        expectedResponse: currentRound.options[currentRound.correctIndex],
        wasCorrect: isRight,
        explanation: currentRound.explanation,
      },
    ]);
  };

  const handleNextPakQuestion = () => {
    playClickSound(profile.soundEnabled);
    if (pakistanRoundIndex + 1 < pakistanRounds.length) {
      const nextIdx = pakistanRoundIndex + 1;
      setPakistanRoundIndex(nextIdx);
      setSelectedPakOption(null);
      setPakistanSubmitted(false);
      setPakistanIsCorrect(false);
      setSecondsRemaining(activeGameMeta?.defaultTimeLimitSec || 50);
    } else {
      finishGameSession();
    }
  };

  const handleTimeExpiration = () => {
    if (!activeGameMeta) return;

    if (activeGameMeta.gameplayType === "quiz" && !quizAnswerSubmitted) {
      handleQuizAnswer(-1);
    } else if (activeGameMeta.gameplayType === "spelling" && !spellingSubmitted) {
      verifySpelledWord();
    } else if (activeGameMeta.gameplayType === "true_false" && !tfAnswerSubmitted) {
      handleTfChoice(!tfQuestions[tfCurrentIndex]?.isTrue); // timed out counted as miss
    } else if (activeGameMeta.gameplayType === "chemical_lab" && !chemSubmitted) {
      verifyChemReaction();
    } else if (activeGameMeta.gameplayType === "sequence_order" && !seqSubmitted) {
      verifySequenceOrder();
    } else if (activeGameMeta.gameplayType === "code_bug_hunt" && !bugSubmitted) {
      verifyBugPatch(false);
    } else if (activeGameMeta.gameplayType === "element_symbol_rush" && !elementSubmitted) {
      handleSelectSymbol("");
    } else if (activeGameMeta.gameplayType === "formula_derivation" && !formulaSubmitted) {
      verifyFormulaDerivation();
    } else if (activeGameMeta.gameplayType === "pakistan_trivia" && !pakistanSubmitted) {
      handleSelectPakOption(-1);
    }
  };

  // ========================================================
  // FINISH GAME SESSION & AWARD XP / BADGES
  // ========================================================
  const finishGameSession = () => {
    const totalQ = Math.max(1, totalQuestionsInSession);
    const accuracy = Math.round((correctAnswersCount / totalQ) * 100);
    const xpEarned = 100 + correctAnswersCount * 35 + bestStreakThisGame * 20;

    const record: GameScoreRecord = {
      id: "gs-" + Date.now(),
      gameId: activeGameMeta?.id || "game",
      gameTitle: activeGameMeta?.title || "Game Session",
      category: activeGameMeta?.category || "math",
      gameplayType: activeGameMeta?.gameplayType || "quiz",
      score: currentScore,
      maxScore: totalQ * 150,
      percentage: accuracy,
      correctCount: correctAnswersCount,
      totalQuestions: totalQ,
      highestStreak: bestStreakThisGame,
      timeSpentSec: timerTotalSec,
      xpEarned,
      difficulty: selectedDifficulty,
      date: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setProfile((prev) => {
      let newXp = prev.xp + xpEarned;
      let newLevel = prev.level;
      let newXpToNext = prev.xpToNextLevel;
      let leveledUp = false;

      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel += 1;
        newXpToNext = Math.round(newXpToNext * 1.35);
        leveledUp = true;
      }

      if (leveledUp) {
        setShowLevelUpAlert(true);
        playLevelUpSound(prev.soundEnabled);
      }

      // Check Badges
      const updatedBadges = prev.badges.map((b) => {
        if (b.unlocked) return b;
        let shouldUnlock = false;

        if (b.id === "first_game") shouldUnlock = true;
        if (b.id === "math_wizard" && activeGameMeta?.category === "math" && accuracy >= 80) shouldUnlock = true;
        if (b.id === "alchemist" && activeGameMeta?.category === "chemistry" && accuracy >= 80) shouldUnlock = true;
        if (b.id === "biologist" && activeGameMeta?.category === "biology" && accuracy >= 80) shouldUnlock = true;
        if (b.id === "streak_5" && bestStreakThisGame >= 5) shouldUnlock = true;
        if (b.id === "streak_10" && bestStreakThisGame >= 10) shouldUnlock = true;

        if (shouldUnlock) {
          setNewlyUnlockedBadge({ ...b, unlocked: true });
          return { ...b, unlocked: true, unlockedAt: new Date().toLocaleDateString() };
        }
        return b;
      });

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        xpToNextLevel: newXpToNext,
        title: getLevelTitle(newLevel),
        totalGamesPlayed: prev.totalGamesPlayed + 1,
        totalCorrect: prev.totalCorrect + correctAnswersCount,
        highestStreak: Math.max(prev.highestStreak, bestStreakThisGame),
        badges: updatedBadges,
        history: [record, ...prev.history].slice(0, 30),
      };
    });

    setViewMode("summary");
  };

  const resetStatsToZero = () => {
    const clean: StudentGameProfile = {
      level: 0,
      xp: 0,
      xpToNextLevel: 250,
      title: "Novice Scholar",
      totalGamesPlayed: 0,
      totalCorrect: 0,
      highestStreak: 0,
      soundEnabled: true,
      badges: INITIAL_BADGES.map((b) => ({ ...b, unlocked: false })),
      history: [],
    };
    setProfile(clean);
    if (currentUser?.id) {
      setUserItem(currentUser.id, "games_profile", clean);
      setUserItem(currentUser.id, "game_profile", clean);
      setUserItem(currentUser.id, "study_streak", 0);
      setUserItem(currentUser.id, "saved_lectures", []);
      setUserItem(currentUser.id, "watched_lectures", []);
      persistUserStateBatchToServer(currentUser.id, {
        games_profile: clean,
        game_profile: clean,
        study_streak: 0,
        saved_lectures: [],
        watched_lectures: [],
      });
    }
  };

  // Helper Icon Renderer
  const renderGameIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case "Calculator":
        return <Calculator className={className} />;
      case "FlaskConical":
        return <FlaskConical className={className} />;
      case "Dna":
        return <Dna className={className} />;
      case "Atom":
        return <Atom className={className} />;
      case "BookOpen":
        return <BookOpen className={className} />;
      case "Binary":
        return <Binary className={className} />;
      case "Compass":
        return <Compass className={className} />;
      default:
        return <Gamepad2 className={className} />;
    }
  };

  // Filtered games in hub
  const filteredGames = EDUCATIONAL_GAMES_METADATA.filter((g) => {
    const matchCat = selectedCategory === "all" || g.category === selectedCategory;
    const matchType =
      selectedGameplayFilter === "all" || g.gameplayType === selectedGameplayFilter;
    return matchCat && matchType;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fadeIn">
      {/* Level Up Banner Alert */}
      {showLevelUpAlert && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 text-white">
              <Trophy className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                🎉 LEVEL UP! You Reached Level {profile.level}!
              </h3>
              <p className="text-xs text-amber-100 font-medium">
                New Title Unlocked: <strong>{profile.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowLevelUpAlert(false)}
            className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold shadow hover:bg-slate-100 transition-colors"
          >
            Awesome!
          </button>
        </div>
      )}

      {/* Newly Unlocked Badge Alert */}
      {newlyUnlockedBadge && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{newlyUnlockedBadge.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                New Achievement Unlocked
              </p>
              <h4 className="text-sm font-black">{newlyUnlockedBadge.title}</h4>
              <p className="text-xs text-emerald-100">{newlyUnlockedBadge.description}</p>
            </div>
          </div>
          <button
            onClick={() => setNewlyUnlockedBadge(null)}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
          >
            Claim Badge
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 1: GAMES HUB (Browse & Select Educational Games)   */}
      {/* ======================================================== */}
      {viewMode === "hub" && (
        <div className="space-y-6">
          {/* Top Header Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Welcome */}
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                  Educational Games Arena • Multiple Game Types
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                  Play & Learn Educational Games 🎮
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Choose from <strong>Word Tile Spelling</strong>, <strong>Memory Card Flip Puzzles</strong>, <strong>STEM Concept Connectors</strong>, <strong>Target 24 Math Puzzles</strong>, <strong>Lightning True/False</strong>, and <strong>Speed Quiz Duels</strong>!
                </p>
              </div>

              {/* Right Profile & XP Card */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-900/90 p-4 rounded-2xl border border-indigo-500/30 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white font-black text-xl shadow-lg shadow-indigo-600/30">
                    {profile.level}
                    <span className="absolute -bottom-1 text-[9px] font-bold uppercase tracking-wider bg-slate-950 px-1.5 rounded-full border border-amber-400 text-amber-300">
                      LVL
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{profile.title}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {profile.xp} / {profile.xpToNextLevel} XP
                    </p>
                    <div className="w-36 h-2 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((profile.xp / profile.xpToNextLevel) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="hidden sm:block w-px h-12 bg-slate-800" />

                {/* Quick Stats & Toggles */}
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div className="text-center px-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Streak</p>
                    <p className="text-base font-black text-amber-400 flex items-center justify-center gap-1">
                      <Flame className="w-4 h-4 fill-amber-400" />
                      {profile.highestStreak}
                    </p>
                  </div>

                  <div className="text-center px-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Badges</p>
                    <button
                      onClick={() => setViewMode("badges")}
                      className="text-base font-black text-cyan-400 flex items-center justify-center gap-1 hover:underline"
                    >
                      <Trophy className="w-4 h-4" />
                      {profile.badges.filter((b) => b.unlocked).length}/{profile.badges.length}
                    </button>
                  </div>

                  <button
                    onClick={toggleSound}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      profile.soundEnabled
                        ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                        : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}
                    title={profile.soundEnabled ? "Sound FX Enabled" : "Sound FX Muted"}
                  >
                    {profile.soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-cyan-300" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={resetStatsToZero}
                    className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-rose-950/40 hover:border-rose-500/50 text-slate-400 hover:text-rose-300 transition-colors flex items-center justify-center"
                    title="Reset stats, level, XP, and streak to 0"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={launchRandomGame}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all"
                >
                  <Shuffle className="w-4 h-4" /> Surprise Me (Daily Challenge)
                </button>

                <button
                  onClick={() => setViewMode("badges")}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
                >
                  <Award className="w-4 h-4 text-amber-400" /> Achievements & Badges
                </button>
              </div>

              {/* Difficulty selector */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase px-2">
                  Difficulty:
                </span>
                {(["easy", "medium", "hard", "expert"] as GameDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      playClickSound(profile.soundEnabled);
                      setSelectedDifficulty(d);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition-all ${
                      selectedDifficulty === d
                        ? "bg-indigo-600 text-white shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Gameplay Type Filter Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Filter by Game Type:
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: "all", label: "All Game Types", icon: Gamepad2 },
                { id: "spelling", label: "🔤 Tile Spelling", icon: BookOpen },
                { id: "memory_puzzle", label: "🧩 Memory Card Match", icon: Layers },
                { id: "connector", label: "🔗 Concept Connector", icon: Atom },
                { id: "math_target", label: "🎯 Target 24 Math", icon: Calculator },
                { id: "chemical_lab", label: "⚗️ Ionic Reaction Lab", icon: Beaker },
                { id: "sequence_order", label: "🧬 Cycle Sequencer", icon: Dna },
                { id: "code_bug_hunt", label: "🐛 Code Bug Detective", icon: Code2 },
                { id: "element_symbol_rush", label: "⚛️ Element Symbols", icon: Atom },
                { id: "formula_derivation", label: "📐 Formula Architect", icon: Calculator },
                { id: "pakistan_trivia", label: "🏛️ Social Studies", icon: Flag },
                { id: "true_false", label: "⚡ True / False Blitz", icon: Zap },
                { id: "quiz", label: "🏆 Speed Quiz Duel", icon: Trophy },
              ].map((typeItem) => {
                const Icon = typeItem.icon;
                const isActive = selectedGameplayFilter === typeItem.id;
                return (
                  <button
                    key={typeItem.id}
                    onClick={() => {
                      playClickSound(profile.soundEnabled);
                      setSelectedGameplayFilter(typeItem.id);
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                        : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{typeItem.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGames.map((game) => {
              const bestRecord = profile.history
                .filter((h) => h.gameId === game.id)
                .sort((a, b) => b.score - a.score)[0];

              return (
                <div
                  key={game.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <div
                        className={`p-3 rounded-2xl bg-gradient-to-br ${game.accentColor} shadow-md`}
                      >
                        {renderGameIcon(game.iconName, "w-6 h-6 text-white")}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {game.badge}
                        </span>
                        {bestRecord && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            Best: {bestRecord.score}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {game.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2 mt-1 leading-relaxed">
                        {game.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Timer className="w-3.5 h-3.5 text-cyan-500" />
                        {game.defaultTimeLimitSec}s Round
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono font-bold text-indigo-500 uppercase">
                        {game.gameplayType.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-2">
                    <button
                      onClick={() => startGame(game)}
                      className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-black text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Play {game.shortTitle}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 2: ACTIVE GAMEPLAY ARENA                           */}
      {/* ======================================================== */}
      {viewMode === "play" && activeGameMeta && (
        <div className="space-y-6">
          {/* Top In-Game Arena HUD */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-indigo-500/30 text-white shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  playClickSound(profile.soundEnabled);
                  setViewMode("hub");
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Exit Game to Hub"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                  {activeGameMeta.subject} • {activeGameMeta.badge}
                </span>
                <h2 className="text-sm sm:text-base font-black text-white">
                  {activeGameMeta.shortTitle}
                </h2>
              </div>
            </div>

            {/* Score & Streak */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-black transition-all ${
                  currentStreak >= 3
                    ? "bg-amber-950/80 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20 animate-pulse"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <Flame className={`w-4 h-4 ${currentStreak >= 3 ? "fill-amber-400 text-amber-400" : ""}`} />
                <span>{currentStreak}x Streak</span>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-black text-xs text-indigo-300">
                {currentScore} pts
              </div>

              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono font-black text-xs transition-colors ${
                  secondsRemaining <= 10
                    ? "bg-rose-950 border-rose-500 text-rose-300 animate-pulse"
                    : secondsRemaining <= 25
                    ? "bg-amber-950 border-amber-500 text-amber-300"
                    : "bg-slate-900 border-slate-800 text-cyan-300"
                }`}
              >
                <Timer className="w-3.5 h-3.5" />
                <span>{secondsRemaining}s</span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 1: SPELLING & ANAGRAM RUSH             */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "spelling" && spellingQuestions[spellingQIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Word {spellingQIndex + 1} of {spellingQuestions.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSpellingRevealLetter}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" /> Reveal Next Letter
                  </button>
                  <button
                    onClick={handleSpellingShuffle}
                    className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    title="Shuffle Tiles"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Word Clue Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-950/40 border border-purple-500/20 text-center space-y-1">
                <p className="text-xs uppercase font-bold text-purple-400">Definition Clue</p>
                <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  "{spellingQuestions[spellingQIndex].clue}"
                </h3>
                <p className="text-xs text-slate-400">
                  Hint: {spellingQuestions[spellingQIndex].hint}
                </p>
              </div>

              {/* Spelled Letter Slots */}
              <div className="space-y-2">
                <p className="text-center text-xs font-bold uppercase tracking-wider text-slate-400">
                  Spelled Word: (Tap slot to remove letter)
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 min-h-16">
                  {spellingQuestions[spellingQIndex].word
                    .toUpperCase()
                    .replace(/[^A-Z]/g, "")
                    .split("")
                    .map((_, slotIdx) => {
                      const filled = spelledSlots[slotIdx];
                      return (
                        <button
                          key={slotIdx}
                          disabled={spellingSubmitted}
                          onClick={() => handleSlotClick(slotIdx)}
                          className={`w-11 h-13 sm:w-13 sm:h-15 rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black transition-all shadow-sm ${
                            filled
                              ? "bg-indigo-600 text-white border-indigo-500 scale-105"
                              : "bg-slate-100 dark:bg-slate-950 border-slate-300 dark:border-slate-700 border-dashed text-slate-400"
                          }`}
                        >
                          {filled ? filled.letter : ""}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Scrambled Available Letter Tiles Bank */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Available Letters: (Click or type on keyboard)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSpellingBackspace}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      ⌫ Backspace
                    </button>
                    <button
                      onClick={handleSpellingClear}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {scrambledTiles.map((tile) => (
                    <button
                      key={tile.id}
                      disabled={tile.used || spellingSubmitted}
                      onClick={() => handleTileClick(tile.id, tile.letter)}
                      className={`w-11 h-12 sm:w-12 sm:h-13 rounded-2xl font-black text-lg sm:text-xl transition-all shadow ${
                        tile.used
                          ? "opacity-20 bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed scale-90"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 hover:border-indigo-500 active:scale-95"
                      }`}
                    >
                      {tile.letter}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spelling Result Feedback Card */}
              {spellingSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    spellingIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {spellingIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Masterfully Spelled! Word Correct!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          Correct spelling was:{" "}
                          <strong>{spellingQuestions[spellingQIndex].word}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs leading-relaxed">
                    <strong>Definition: </strong>
                    {spellingQuestions[spellingQIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextSpellingWord}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {spellingQIndex + 1 < spellingQuestions.length
                          ? "Next Word →"
                          : "Finish & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 2: MEMORY FLIP MATCH CARD PUZZLE       */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "memory_puzzle" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Card Match Puzzle
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                    Find and match corresponding scientific pairs!
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500">
                    Moves: <strong>{memoryMovesCount}</strong>
                  </span>
                  <span className="text-emerald-500 font-bold">
                    Matched: <strong>{matchedPairsCount} / 6 Pairs</strong>
                  </span>
                </div>
              </div>

              {/* 4x3 Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
                {memoryCards.map((card, idx) => {
                  const isOpen = card.isFlipped || card.isMatched;

                  return (
                    <button
                      key={card.id}
                      disabled={isOpen || isMemoryChecking}
                      onClick={() => handleCardClick(idx)}
                      className={`h-28 sm:h-32 p-3 rounded-2xl border-2 font-bold text-xs sm:text-sm transition-all duration-300 flex flex-col items-center justify-center text-center select-none shadow-sm ${
                        card.isMatched
                          ? "bg-emerald-500 text-white border-emerald-400 scale-95 shadow-md shadow-emerald-500/20"
                          : card.isFlipped
                          ? "bg-indigo-600 text-white border-indigo-400 scale-100 shadow-lg"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:border-indigo-500/60 hover:bg-slate-800 cursor-pointer"
                      }`}
                    >
                      {isOpen ? (
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-black leading-snug">
                            {card.content}
                          </p>
                          {card.isMatched && (
                            <Check className="w-4 h-4 mx-auto text-emerald-200" />
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-500">
                          <HelpCircle className="w-6 h-6 mx-auto opacity-40" />
                          <span className="text-[10px] font-mono uppercase tracking-wider block">
                            Tap to Flip
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 3: CONCEPT CONNECTOR PUZZLE            */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "connector" && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  Concept Connector Puzzle
                </span>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {connectorInstruction}
                </h3>
              </div>

              {/* Dual Column Connector Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Left Items Column */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Concepts / Physical Quantities
                  </h4>
                  <div className="space-y-2.5">
                    {connectorPairs.map((pair) => {
                      const isConnected = connectedPairIds.includes(pair.leftId);
                      const isSelected = selectedLeftId === pair.leftId;
                      const isMismatch = connectorMismatchId === pair.leftId;

                      return (
                        <button
                          key={pair.leftId}
                          disabled={isConnected}
                          onClick={() => handleConnectorLeftClick(pair.leftId)}
                          className={`w-full p-4 rounded-2xl border text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between gap-3 shadow-sm ${
                            isConnected
                              ? "bg-emerald-500 text-white border-emerald-500 opacity-90"
                              : isMismatch
                              ? "bg-rose-500 text-white border-rose-500 animate-shake"
                              : isSelected
                              ? "bg-indigo-600 text-white border-indigo-400 scale-[1.02] shadow-md shadow-indigo-600/30"
                              : "bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-500/50"
                          }`}
                        >
                          <span>{pair.leftText}</span>
                          {isConnected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Items Column (Shuffled) */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Matching Units / Definitions
                  </h4>
                  <div className="space-y-2.5">
                    {[...connectorPairs]
                      .sort((a, b) => a.rightText.localeCompare(b.rightText))
                      .map((pair) => {
                        const isConnected = connectedPairIds.includes(pair.leftId);
                        const isSelected = selectedRightId === pair.rightId;

                        return (
                          <button
                            key={pair.rightId}
                            disabled={isConnected}
                            onClick={() => handleConnectorRightClick(pair.rightId)}
                            className={`w-full p-4 rounded-2xl border text-left font-bold text-xs sm:text-sm transition-all flex items-center justify-between gap-3 shadow-sm ${
                              isConnected
                                ? "bg-emerald-500 text-white border-emerald-500 opacity-90"
                                : isSelected
                                ? "bg-cyan-600 text-white border-cyan-400 scale-[1.02] shadow-md shadow-cyan-600/30"
                                : "bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-cyan-500/50"
                            }`}
                          >
                            <span>{pair.rightText}</span>
                            {isConnected && <Check className="w-4 h-4 text-white" />}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 4: NUMBER TARGET 24 PUZZLE             */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "math_target" && mathTargetPuzzles[mathTargetIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Target Puzzle {mathTargetIndex + 1} of {mathTargetPuzzles.length}
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  {mathTargetPuzzles[mathTargetIndex].hint}
                </span>
              </div>

              {/* Big Target Badge */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/50 to-indigo-950/50 border border-blue-500/30 text-center space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Target Value</p>
                <h2 className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  TARGET: {mathTargetPuzzles[mathTargetIndex].target}
                </h2>
              </div>

              {/* Scratchpad Formula Input */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 font-mono text-lg text-white">
                <div className="flex-1 overflow-x-auto">
                  {mathFormulaInput ? (
                    <span className="text-cyan-300 font-bold">{mathFormulaInput}</span>
                  ) : (
                    <span className="text-slate-600 text-sm italic">
                      Click numbers and operators below to build your equation...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleMathClearFormula}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleEvaluateMathFormula}
                    className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs text-white font-bold shadow"
                  >
                    Calculate =
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {mathFeedbackMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 ${
                    mathTargetCleared
                      ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-300"
                      : "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300"
                  }`}
                >
                  <span>{mathFeedbackMsg}</span>
                  {mathTargetCleared && (
                    <button
                      onClick={handleNextMathTarget}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow hover:bg-emerald-500"
                    >
                      Next Target →
                    </button>
                  )}
                </div>
              )}

              {/* Available Numbers & Operators Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Numbers */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Available Numbers:</p>
                  <div className="flex flex-wrap gap-2.5">
                    {mathTargetPuzzles[mathTargetIndex].numbers.map((num, nIdx) => {
                      const isUsed = usedNumberIndices.includes(nIdx);
                      return (
                        <button
                          key={nIdx}
                          disabled={isUsed || mathTargetCleared}
                          onClick={() => handleAppendMathNumber(num, nIdx)}
                          className={`w-12 h-12 rounded-xl font-mono text-xl font-black transition-all ${
                            isUsed
                              ? "bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-30 cursor-not-allowed"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 active:scale-95 shadow"
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Operators */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold uppercase text-slate-400">Mathematical Operators:</p>
                  <div className="flex flex-wrap gap-2">
                    {["+", "-", "×", "÷", "(", ")"].map((op) => (
                      <button
                        key={op}
                        disabled={mathTargetCleared}
                        onClick={() => handleAppendMathOp(op)}
                        className="w-10 h-10 rounded-xl font-mono text-base font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 5: LIGHTNING TRUE OR FALSE BLITZ       */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "true_false" && tfQuestions[tfCurrentIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Question {tfCurrentIndex + 1} of {tfQuestions.length}
                </span>

                <span className="text-xs font-mono text-slate-400">
                  Press T for True / F for False
                </span>
              </div>

              {/* Bold Statement Box */}
              <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 min-h-36 flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  {tfQuestions[tfCurrentIndex].subject}
                </p>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                  "{tfQuestions[tfCurrentIndex].statement}"
                </h3>
              </div>

              {/* Big TRUE / FALSE Action Buttons */}
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                <button
                  disabled={tfAnswerSubmitted}
                  onClick={() => handleTfChoice(true)}
                  className="py-5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black text-lg sm:text-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-6 h-6" />
                  <span>TRUE (T)</span>
                </button>

                <button
                  disabled={tfAnswerSubmitted}
                  onClick={() => handleTfChoice(false)}
                  className="py-5 px-6 rounded-2xl bg-rose-500 hover:bg-rose-400 active:scale-95 text-white font-black text-lg sm:text-xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle className="w-6 h-6" />
                  <span>FALSE (F)</span>
                </button>
              </div>

              {/* Answer Explanation */}
              {tfAnswerSubmitted && (
                <div
                  className={`p-5 rounded-2xl border text-left space-y-2 animate-fadeIn max-w-xl mx-auto ${
                    tfWasCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {tfWasCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Spot on! Great scientific knowledge.</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          Statement was{" "}
                          <strong>{tfQuestions[tfCurrentIndex].isTrue ? "TRUE" : "FALSE"}</strong>!
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">
                    <strong>Explanation: </strong>
                    {tfQuestions[tfCurrentIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextTfQuestion}
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow"
                    >
                      {tfCurrentIndex + 1 < tfQuestions.length
                        ? "Next Question →"
                        : "Finish Blitz →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 6: SPEED QUIZ DUEL                     */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "quiz" && quizQuestions[quizQIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Question #{quizQIndex + 1}
                  </span>

                  {quizQuestions[quizQIndex].hint && (
                    <button
                      onClick={() => {
                        playClickSound(profile.soundEnabled);
                        setQuizShowHint(!quizShowHint);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>{quizShowHint ? "Hide Hint" : "Hint (Press H)"}</span>
                    </button>
                  )}
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                  {quizQuestions[quizQIndex].question}
                </h2>

                {quizQuestions[quizQIndex].subtext && (
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                    {quizQuestions[quizQIndex].subtext}
                  </p>
                )}

                {quizQuestions[quizQIndex].codeSnippet && (
                  <pre className="p-4 rounded-2xl bg-slate-950 text-cyan-300 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
                    <code>{quizQuestions[quizQIndex].codeSnippet}</code>
                  </pre>
                )}

                {quizShowHint && quizQuestions[quizQIndex].hint && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Study Clue: </span>
                      {quizQuestions[quizQIndex].hint}
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Answer Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {quizQuestions[quizQIndex].options.map((optionText, oIdx) => {
                  const isSelected = quizSelectedOption === oIdx;
                  const isTargetCorrect = oIdx === quizQuestions[quizQIndex].correctIndex;

                  let btnStyle =
                    "bg-slate-50 dark:bg-slate-950 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800";

                  if (quizAnswerSubmitted) {
                    if (isTargetCorrect) {
                      btnStyle =
                        "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20";
                    } else if (isSelected && !isTargetCorrect) {
                      btnStyle =
                        "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20";
                    } else {
                      btnStyle =
                        "bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-transparent opacity-60";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={quizAnswerSubmitted}
                      onClick={() => handleQuizAnswer(oIdx)}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            quizAnswerSubmitted && isTargetCorrect
                              ? "bg-white text-emerald-600"
                              : quizAnswerSubmitted && isSelected && !isTargetCorrect
                              ? "bg-white text-rose-600"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {oIdx + 1}
                        </span>
                        <span>{optionText}</span>
                      </div>
                      {quizAnswerSubmitted && isTargetCorrect && (
                        <Check className="w-5 h-5 text-white shrink-0" />
                      )}
                      {quizAnswerSubmitted && isSelected && !isTargetCorrect && (
                        <XCircle className="w-5 h-5 text-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Answer Feedback */}
              {quizAnswerSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    quizIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {quizIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Correct Answer! Points earned</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          {quizSelectedOption === -1
                            ? "Time expired!"
                            : "Not quite! Keep learning:"}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    <strong>Explanation: </strong>
                    {quizQuestions[quizQIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextQuizQuestion}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {quizQIndex + 1 < quizQuestions.length
                          ? "Next Question →"
                          : "Finish Game & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 7: CHEMICAL LAB IONIC REACTOR          */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "chemical_lab" && chemRounds[chemRoundIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              {/* Round Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      Ionic Reaction #{chemRoundIndex + 1} of {chemRounds.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Type: {chemRounds[chemRoundIndex].category}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    Synthesize: <span className="text-cyan-600 dark:text-cyan-400">{chemRounds[chemRoundIndex].compoundName}</span>
                  </h2>
                </div>

                <div className="p-3 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-900 text-xs text-cyan-800 dark:text-cyan-200 max-w-xs">
                  <p className="font-bold flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                    <span>Hint:</span>
                  </p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{chemRounds[chemRoundIndex].hint}</p>
                </div>
              </div>

              {/* Reaction Workbench */}
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-950 text-white border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Beaker className="w-4 h-4 text-cyan-400" /> Reaction Chamber
                  </span>
                  <div className="text-xs font-mono font-bold text-slate-300">
                    Target: <span className="text-amber-400 font-bold">{chemRounds[chemRoundIndex].compoundName}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cation Chamber */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                      1. Positive Ion (Cation)
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-black font-mono text-cyan-300">
                        {selectedCation || "(Select Cation)"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">Qty:</span>
                        <button
                          disabled={chemSubmitted || cationCount <= 1}
                          onClick={() => setCationCount((c) => Math.max(1, c - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{cationCount}</span>
                        <button
                          disabled={chemSubmitted || cationCount >= 4}
                          onClick={() => setCationCount((c) => Math.min(4, c + 1))}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Anion Chamber */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      2. Negative Ion (Anion)
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-black font-mono text-emerald-300">
                        {selectedAnion || "(Select Anion)"}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 font-bold">Qty:</span>
                        <button
                          disabled={chemSubmitted || anionCount <= 1}
                          onClick={() => setAnionCount((a) => Math.max(1, a - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-sm">{anionCount}</span>
                        <button
                          disabled={chemSubmitted || anionCount >= 4}
                          onClick={() => setAnionCount((a) => Math.min(4, a + 1))}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Available Ions Shelf */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Available Ions Shelf: (Click to select for chamber)
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {chemRounds[chemRoundIndex].availableIons.map((ionItem) => {
                      const isCation = ionItem.type === "cation";
                      const isChosen = isCation
                        ? selectedCation === ionItem.ion
                        : selectedAnion === ionItem.ion;

                      return (
                        <button
                          key={ionItem.ion}
                          disabled={chemSubmitted}
                          onClick={() =>
                            isCation
                              ? handleSelectCation(ionItem.ion)
                              : handleSelectAnion(ionItem.ion)
                          }
                          className={`p-3 rounded-2xl border text-left transition-all ${
                            isChosen
                              ? isCation
                                ? "bg-cyan-950 border-cyan-500 shadow-md shadow-cyan-500/20 text-white"
                                : "bg-emerald-950 border-emerald-500 shadow-md shadow-emerald-500/20 text-white"
                              : "bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-black font-mono">
                              {ionItem.ion}
                            </span>
                            <span className="text-[10px] font-bold uppercase opacity-60">
                              {ionItem.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 truncate">
                            {ionItem.name}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Synthesis Action */}
                {!chemSubmitted && (
                  <div className="pt-2 flex justify-end">
                    <button
                      disabled={!selectedCation || !selectedAnion}
                      onClick={verifyChemReaction}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg disabled:opacity-40 transition-all flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Synthesize Compound
                    </button>
                  </div>
                )}
              </div>

              {/* Reaction Feedback */}
              {chemSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    chemIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {chemIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>
                          Synthesis Succeeded! {chemRounds[chemRoundIndex].chemicalFormula} formed!
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          Reaction Failed! Target was:{" "}
                          <strong>{chemRounds[chemRoundIndex].chemicalFormula}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    <strong>Explanation: </strong>
                    {chemRounds[chemRoundIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextChemRound}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {chemRoundIndex + 1 < chemRounds.length
                          ? "Next Reaction →"
                          : "Finish Lab & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 8: CYCLE SEQUENCER                     */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "sequence_order" && seqRounds[seqRoundIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                    Process Sequence #{seqRoundIndex + 1} of {seqRounds.length}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    {seqRounds[seqRoundIndex].title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {seqRounds[seqRoundIndex].prompt}
                  </p>
                </div>
              </div>

              {/* Interactive Step Reordering List */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Arrange in correct chronological order: (Use ↑ / ↓ arrows to reorder)
                </p>

                <div className="space-y-2.5">
                  {userOrderedSteps.map((stepText, stepIdx) => (
                    <div
                      key={stepIdx}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 transition-all hover:border-violet-500/50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-violet-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {stepIdx + 1}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                          {stepText}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          disabled={seqSubmitted || stepIdx === 0}
                          onClick={() => moveSeqStep(stepIdx, "up")}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-violet-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-20"
                          title="Move step up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={seqSubmitted || stepIdx === userOrderedSteps.length - 1}
                          onClick={() => moveSeqStep(stepIdx, "down")}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-violet-600 hover:text-white text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-20"
                          title="Move step down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!seqSubmitted && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={verifySequenceOrder}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Verify Step Sequence
                    </button>
                  </div>
                )}
              </div>

              {/* Sequence Feedback */}
              {seqSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    seqIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {seqIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Flawless Sequence! Process verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>Incorrect sequence! Review the proper cycle stages:</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    <strong>Explanation: </strong>
                    {seqRounds[seqRoundIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextSeqRound}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {seqRoundIndex + 1 < seqRounds.length
                          ? "Next Process →"
                          : "Finish Sequencer & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 9: CODE BUG DETECTIVE                  */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "code_bug_hunt" && bugRounds[bugRoundIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      Bug Hunt #{bugRoundIndex + 1} of {bugRounds.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {bugRounds[bugRoundIndex].language}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Bug className="w-5 h-5 text-rose-500" />
                    <span>{bugRounds[bugRoundIndex].title}</span>
                  </h2>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Click the line containing the bug, then choose the patch!
                </div>
              </div>

              {/* Code Editor Window */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs sm:text-sm">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs text-slate-400">solution.{bugRounds[bugRoundIndex].language === "python" ? "py" : bugRounds[bugRoundIndex].language === "javascript" ? "js" : "cpp"}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">Tap line to isolate bug</span>
                </div>

                <div className="p-3 sm:p-4 space-y-1">
                  {bugRounds[bugRoundIndex].snippetLines.map((lineStr, lineIdx) => {
                    const isSelected = selectedBugLine === lineIdx;
                    return (
                      <div
                        key={lineIdx}
                        onClick={() => handleSelectBugLine(lineIdx)}
                        className={`flex items-start gap-4 px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-rose-950/80 border border-rose-500 text-rose-200"
                            : "hover:bg-slate-900 text-slate-300 border border-transparent"
                        }`}
                      >
                        <span className="w-6 text-right text-slate-600 select-none font-bold">
                          {lineIdx + 1}
                        </span>
                        <code className="flex-1 whitespace-pre">{lineStr}</code>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white shrink-0">
                            BUG SUSPECT
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fix Selector Options */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select the Correct Fix for Line {selectedBugLine !== null ? selectedBugLine + 1 : "(Select line above)"}:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bugRounds[bugRoundIndex].fixOptions.map((fixText, fIdx) => {
                    const isChosen = selectedFixIndex === fIdx;
                    return (
                      <button
                        key={fIdx}
                        disabled={bugSubmitted}
                        onClick={() => handleSelectFixOption(fIdx)}
                        className={`p-3.5 rounded-2xl border text-left font-mono text-xs sm:text-sm transition-all ${
                          isChosen
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                            : "bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-black/20 text-center font-bold flex items-center justify-center shrink-0">
                            {fIdx + 1}
                          </span>
                          <span className="whitespace-pre truncate">{fixText}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {!bugSubmitted && (
                  <div className="pt-2 flex justify-end">
                    <button
                      disabled={selectedBugLine === null || selectedFixIndex === null}
                      onClick={() => verifyBugPatch(true)}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg disabled:opacity-40 transition-all flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" /> Apply Patch & Verify
                    </button>
                  </div>
                )}
              </div>

              {/* Bug Result Feedback */}
              {bugSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    bugIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {bugIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Bug Successfully Squashed! Code passed unit tests!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          Bug still active! Correct line was Line {bugRounds[bugRoundIndex].buggyLineIndex + 1}.
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    <strong>Root Cause & Fix: </strong>
                    {bugRounds[bugRoundIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextBugRound}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {bugRoundIndex + 1 < bugRounds.length
                          ? "Next Code Bug →"
                          : "Finish Bug Hunt & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 10: ELEMENT SYMBOL RUSH                */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "element_symbol_rush" && elementRounds[elementRoundIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                      Element #{elementRoundIndex + 1} of {elementRounds.length}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Family: {elementRounds[elementRoundIndex].category}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    What is the chemical symbol for <span className="text-cyan-600 dark:text-cyan-400">{elementRounds[elementRoundIndex].elementName}</span>?
                  </h2>
                </div>
                <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  Atomic Number: Z = {elementRounds[elementRoundIndex].atomicNumber}
                </div>
              </div>

              {/* Central Element Display Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-950 border border-cyan-500/30 text-white shadow-xl text-center space-y-2 relative overflow-hidden">
                <div className="text-xs uppercase tracking-widest text-cyan-400 font-bold">
                  Identify IUPAC Periodic Symbol
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white">
                  {elementRounds[elementRoundIndex].elementName}
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Atomic Number {elementRounds[elementRoundIndex].atomicNumber} • Family: {elementRounds[elementRoundIndex].category.toUpperCase()}
                </div>
              </div>

              {/* 4 Large Symbol Choices */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {elementRounds[elementRoundIndex].symbolOptions.map((symChoice) => {
                  const isSelected = selectedSymbol === symChoice;
                  const isTargetCorrect = symChoice === elementRounds[elementRoundIndex].correctSymbol;

                  let btnStyle =
                    "bg-slate-50 dark:bg-slate-950 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800";

                  if (elementSubmitted) {
                    if (isTargetCorrect) {
                      btnStyle =
                        "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20";
                    } else if (isSelected && !isTargetCorrect) {
                      btnStyle =
                        "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20";
                    } else {
                      btnStyle =
                        "bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-transparent opacity-60";
                    }
                  }

                  return (
                    <button
                      key={symChoice}
                      disabled={elementSubmitted}
                      onClick={() => handleSelectSymbol(symChoice)}
                      className={`p-6 rounded-2xl border text-center font-black font-mono text-2xl sm:text-3xl transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${btnStyle}`}
                    >
                      <span>{symChoice}</span>
                      <span className="text-[10px] font-sans font-medium uppercase opacity-70">
                        Symbol
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Element Feedback */}
              {elementSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    elementIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {elementIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>
                          Correct Symbol! {elementRounds[elementRoundIndex].elementName} = {elementRounds[elementRoundIndex].correctSymbol}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          Incorrect! The symbol for {elementRounds[elementRoundIndex].elementName} is{" "}
                          <strong>{elementRounds[elementRoundIndex].correctSymbol}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    <strong>Etymology & Fun Fact: </strong>
                    {elementRounds[elementRoundIndex].funFact}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextElementRound}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {elementRoundIndex + 1 < elementRounds.length
                          ? "Next Element →"
                          : "Finish Rush & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 11: FORMULA ARCHITECT                  */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "formula_derivation" && formulaRounds[formulaRoundIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    Equation Assembly #{formulaRoundIndex + 1} of {formulaRounds.length}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                    Assemble: <span className="text-blue-600 dark:text-blue-400">{formulaRounds[formulaRoundIndex].lawName}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Subject: {formulaRounds[formulaRoundIndex].subject} • Tap tokens below to place them in correct mathematical order.
                  </p>
                </div>
              </div>

              {/* Placed Tokens Assembly Drop-Zone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Equation Workspace (Click a placed token to remove):
                  </span>
                  <button
                    disabled={formulaSubmitted || placedFormulaTokens.length === 0}
                    onClick={handleClearFormulaTokens}
                    className="text-xs font-bold text-rose-500 hover:text-rose-600 disabled:opacity-40"
                  >
                    Clear Workspace
                  </button>
                </div>

                <div className="min-h-20 p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 flex flex-wrap items-center justify-center gap-2.5">
                  {placedFormulaTokens.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      Tap formula tokens below to construct equation here...
                    </span>
                  ) : (
                    placedFormulaTokens.map((tok, sIdx) => (
                      <button
                        key={sIdx}
                        disabled={formulaSubmitted}
                        onClick={() => handleRemoveFormulaToken(sIdx)}
                        className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-rose-600 text-white font-mono font-black text-lg sm:text-xl shadow transition-all active:scale-95"
                        title="Click to remove token"
                      >
                        {tok}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Available Formula Tokens Bank */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Available Tokens Bank (Tap to add):
                </span>
                <div className="flex flex-wrap items-center justify-center gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {availableFormulaTokens.map((item) => (
                    <button
                      key={item.id}
                      disabled={item.used || formulaSubmitted}
                      onClick={() => handlePlaceFormulaToken(item.id, item.token)}
                      className={`px-4 py-2.5 rounded-xl font-mono font-black text-lg sm:text-xl transition-all shadow ${
                        item.used
                          ? "opacity-20 bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed scale-90"
                          : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:border-blue-500 active:scale-95"
                      }`}
                    >
                      {item.token}
                    </button>
                  ))}
                </div>

                {!formulaSubmitted && (
                  <div className="pt-2 flex justify-end">
                    <button
                      disabled={placedFormulaTokens.length === 0}
                      onClick={verifyFormulaDerivation}
                      className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg disabled:opacity-40 transition-all flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Verify Equation Assembly
                    </button>
                  </div>
                )}
              </div>

              {/* Formula Feedback */}
              {formulaSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    formulaIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {formulaIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>
                          Equation Perfectly Verified! {formulaRounds[formulaRoundIndex].targetFormula}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          Incorrect Assembly! Target formula was:{" "}
                          <strong>{formulaRounds[formulaRoundIndex].targetFormula}</strong>
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    <strong>Scientific Law: </strong>
                    {formulaRounds[formulaRoundIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextFormulaRound}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {formulaRoundIndex + 1 < formulaRounds.length
                          ? "Next Equation →"
                          : "Finish Formula Builder & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------- */}
          {/* GAMEPLAY TYPE 12: PAKISTAN STUDIES & HERITAGE QUEST  */}
          {/* ---------------------------------------------------- */}
          {activeGameMeta.gameplayType === "pakistan_trivia" && pakistanRounds[pakistanRoundIndex] && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                      <Flag className="w-3 h-3 text-emerald-600" /> Social Studies #{pakistanRoundIndex + 1} of {pakistanRounds.length}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Topic: {pakistanRounds[pakistanRoundIndex].category}
                    </span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                    {pakistanRounds[pakistanRoundIndex].question}
                  </h2>
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  FBISE & Provincial Board Exam Prep
                </div>
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {pakistanRounds[pakistanRoundIndex].options.map((optText, oIdx) => {
                  const isSelected = selectedPakOption === oIdx;
                  const isTargetCorrect = oIdx === pakistanRounds[pakistanRoundIndex].correctIndex;

                  let btnStyle =
                    "bg-slate-50 dark:bg-slate-950 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-800";

                  if (pakistanSubmitted) {
                    if (isTargetCorrect) {
                      btnStyle =
                        "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20";
                    } else if (isSelected && !isTargetCorrect) {
                      btnStyle =
                        "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/20";
                    } else {
                      btnStyle =
                        "bg-slate-100 dark:bg-slate-900/40 text-slate-400 border-transparent opacity-60";
                    }
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={pakistanSubmitted}
                      onClick={() => handleSelectPakOption(oIdx)}
                      className={`p-4 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all flex items-center justify-between gap-3 active:scale-[0.98] ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            pakistanSubmitted && isTargetCorrect
                              ? "bg-white text-emerald-600"
                              : pakistanSubmitted && isSelected && !isTargetCorrect
                              ? "bg-white text-rose-600"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {oIdx + 1}
                        </span>
                        <span>{optText}</span>
                      </div>
                      {pakistanSubmitted && isTargetCorrect && (
                        <Check className="w-5 h-5 text-white shrink-0" />
                      )}
                      {pakistanSubmitted && isSelected && !isTargetCorrect && (
                        <XCircle className="w-5 h-5 text-white shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Feedback */}
              {pakistanSubmitted && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 animate-fadeIn ${
                    pakistanIsCorrect
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                      : "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                  }`}
                >
                  <div className="flex items-center gap-2 font-black text-sm">
                    {pakistanIsCorrect ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Correct Answer! Points awarded</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-rose-500" />
                        <span>
                          {selectedPakOption === -1
                            ? "Time expired!"
                            : `Correct: ${pakistanRounds[pakistanRoundIndex].options[pakistanRounds[pakistanRoundIndex].correctIndex]}`}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed font-medium">
                    <strong>Historical Fact: </strong>
                    {pakistanRounds[pakistanRoundIndex].explanation}
                  </p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleNextPakQuestion}
                      className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow flex items-center gap-2 transition-all active:scale-95"
                    >
                      <span>
                        {pakistanRoundIndex + 1 < pakistanRounds.length
                          ? "Next Question →"
                          : "Finish Quest & View Results →"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 3: GAME SUMMARY & FULL CONCEPT REVIEW              */}
      {/* ======================================================== */}
      {viewMode === "summary" && activeGameMeta && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border border-indigo-500/30 text-white shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="space-y-2">
              <span className="text-4xl">🏆</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Game Session Completed!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                You conquered <strong>{activeGameMeta.title}</strong> on{" "}
                <span className="uppercase font-mono text-cyan-300">
                  {selectedDifficulty}
                </span>{" "}
                difficulty.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Final Score</p>
                <p className="text-2xl font-black text-indigo-400">{currentScore}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Accuracy</p>
                <p className="text-2xl font-black text-emerald-400">
                  {totalQuestionsInSession > 0
                    ? Math.round((correctAnswersCount / totalQuestionsInSession) * 100)
                    : 100}
                  %
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Best Streak</p>
                <p className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-amber-400" />
                  {bestStreakThisGame}x
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] font-bold text-slate-400 uppercase">XP Awarded</p>
                <p className="text-2xl font-black text-cyan-400">
                  +{100 + correctAnswersCount * 35 + bestStreakThisGame * 20} XP
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startGame(activeGameMeta)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" /> Play Again
              </button>

              <button
                onClick={launchRandomGame}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                <Shuffle className="w-4 h-4" /> Next Random Game
              </button>

              <button
                onClick={() => setViewMode("hub")}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-colors"
              >
                Back to Games Hub
              </button>
            </div>
          </div>

          {/* Full Educational Review Breakdown */}
          {sessionReviewItems.length > 0 && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Round Review & Concept Breakdown
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review your answers from this round with academic notes to master every concept.
              </p>

              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                {sessionReviewItems.map((item, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            item.wasCorrect
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600"
                              : "bg-rose-100 dark:bg-rose-950 text-rose-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {item.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                            <span
                              className={
                                item.wasCorrect
                                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                  : "text-rose-600 dark:text-rose-400 font-bold"
                              }
                            >
                              Your Answer: {item.userResponse}
                            </span>
                            {!item.wasCorrect && (
                              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                                Correct: <strong>{item.expectedResponse}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.wasCorrect
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300"
                        }`}
                      >
                        {item.wasCorrect ? "Correct" : "Review"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                      💡 <strong>Key Insight:</strong> {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODE 4: TROPHY ROOM & BADGES GALLERY                    */}
      {/* ======================================================== */}
      {viewMode === "badges" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode("hub")}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  Student Trophy Room & Badges
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Unlock prestigious academic badges across spelling, memory, puzzles, math, and STEM speed duels!
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              {profile.badges.filter((b) => b.unlocked).length} of{" "}
              {profile.badges.length} Badges Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {profile.badges.map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all ${
                  badge.unlocked
                    ? "bg-white dark:bg-slate-900 border-amber-400/60 dark:border-amber-500/40 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`text-3xl p-3 rounded-2xl flex items-center justify-center shrink-0 ${
                      badge.unlocked
                        ? "bg-amber-50 dark:bg-amber-950/50 shadow"
                        : "bg-slate-200 dark:bg-slate-800 grayscale"
                    }`}
                  >
                    {badge.unlocked ? badge.icon : "🔒"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {badge.title}
                      </h4>
                      {badge.unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                      {badge.description}
                    </p>
                    {badge.unlockedAt && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono pt-1">
                        Unlocked on {badge.unlockedAt}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
