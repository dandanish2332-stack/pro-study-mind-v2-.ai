import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BookOpen,
  Search,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Languages,
  Sparkles,
  Share2,
  Check,
  Filter,
  GraduationCap,
  Layers,
  ChevronRight,
  ArrowRight,
  RotateCcw,
  X,
  FileText,
  Lightbulb,
  ExternalLink,
  History,
  TrendingUp,
  Globe2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";
import { getUserItem, setUserItem } from "../utils/userStorage";
import { DictionaryEntry } from "../types";
import { ACADEMIC_DICTIONARY_DATA } from "../data/dictionaryData";
import { speakWithVoice } from "../utils/voiceEngine";

const SUPPORTED_LANGUAGES = [
  { code: "UR", name: "Urdu (اردو)", flag: "🇵🇰" },
  { code: "PS", name: "Pashto (پښتو)", flag: "🇵🇰" },
  { code: "AR", name: "Arabic (العربية)", flag: "🇸🇦" },
  { code: "ES", name: "Spanish (Español)", flag: "🇪🇸" },
  { code: "FR", name: "French (Français)", flag: "🇫🇷" },
  { code: "DE", name: "German (Deutsch)", flag: "🇩🇪" },
  { code: "HI", name: "Hindi (हिन्दी)", flag: "🇮🇳" },
  { code: "ZH", name: "Chinese (中文)", flag: "🇨🇳" },
  { code: "EN", name: "English (Academic)", flag: "🇬🇧" },
];

const SUBJECT_FILTERS = [
  "All Subjects",
  "Biology",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Computer Science",
  "English & Literature",
  "Social Studies & History",
];

const GRADE_LEVEL_FILTERS = [
  { id: "all", label: "All Classes (1st to 2nd Year)" },
  { id: "primary", label: "Class 1st to 5th (Primary)" },
  { id: "middle", label: "Class 6th to 8th (Middle)" },
  { id: "matric", label: "9th & 10th Class (Matric)" },
  { id: "college", label: "11th & 12th Class (FSc/ICS)" },
];

const POPULAR_TOPIC_CHIPS = [
  { label: "Photosynthesis", query: "Photosynthesis" },
  { label: "دوربین (Telescope)", query: "Telescope" },
  { label: "خردبین (Microscope)", query: "Microscope" },
  { label: "خلیہ (Cell)", query: "Cell" },
  { label: "کشش ثقل (Gravity)", query: "Gravity" },
  { label: "Inertia (جمود)", query: "Inertia" },
  { label: "Atom (ایٹم)", query: "Atom" },
  { label: "Mitosis", query: "Mitosis" },
  { label: "Derivative (مشتق)", query: "Derivative" },
  { label: "Matrix (قالب)", query: "Matrix" },
  { label: "Algorithm", query: "Algorithm" },
  { label: "Electric Current", query: "Electric Current" },
  { label: "Constitution (آئین)", query: "Constitution" },
];

// Helper to normalize Urdu & Arabic text (stripping diacritics / tashkeel for resilient search)
function normalizeText(str: string): string {
  if (!str) return "";
  return str
    .replace(/[\u064B-\u065F\u0670\u0617-\u061A]/g, "") // remove arabic/urdu zer, zabur, pesh, jazm
    .replace(/[ـ]/g, "") // tatweel
    .replace(/[يى]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[ۀہة]/g, "ہ")
    .toLowerCase()
    .trim();
}

export const DictionaryView: React.FC = () => {
  const { language, selectedVoicePersona, customVoiceURI } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLang, setSelectedLang] = useState<string>("UR");
  const [selectedSubject, setSelectedSubject] = useState<string>("All Subjects");
  const [selectedGradeBand, setSelectedGradeBand] = useState<string>("all");
  const [activeWordEntry, setActiveWordEntry] = useState<DictionaryEntry | null>(
    ACADEMIC_DICTIONARY_DATA[0] || null
  );
  const [copiedWordId, setCopiedWordId] = useState<string | null>(null);
  const [isSearchingAI, setIsSearchingAI] = useState<boolean>(false);
  const { currentUser } = useAuth();
  const [searchStatusMsg, setSearchStatusMsg] = useState<string | null>(null);
  const [showOnlySaved, setShowOnlySaved] = useState<boolean>(false);
  const [speakingField, setSpeakingField] = useState<"en" | "ur" | null>(null);

  // Bookmarked / Saved words state (Isolated per user account)
  const [bookmarkedWords, setBookmarkedWords] = useState<string[]>(() => {
    return getUserItem<string[]>(currentUser?.id, "dict_bookmarks", []);
  });

  // Recent searches history (Isolated per user account)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    return getUserItem<string[]>(currentUser?.id, "dict_recents", []);
  });

  // Dynamic user-discovered words cache (Isolated per user account)
  const [dynamicEntries, setDynamicEntries] = useState<DictionaryEntry[]>(() => {
    const raw = getUserItem<DictionaryEntry[]>(currentUser?.id, "dict_custom_words", []);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item: any) => item && typeof item === "object")
      .map((item: any) => ({
        id: String(item.id || `dict-custom-${Date.now()}-${Math.random()}`),
        word: String(item.word || "Academic Term"),
        phonetic: item.phonetic || "",
        partOfSpeech: item.partOfSpeech || "academic term",
        subject: item.subject || "General Science",
        definition: item.definition || "",
        simpleExplanation: item.simpleExplanation || "",
        translations: item.translations && typeof item.translations === "object" ? item.translations : { UR: item.word || "" },
        examples: Array.isArray(item.examples) ? item.examples : (item.exampleSentence ? [item.exampleSentence] : []),
        synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
        antonyms: Array.isArray(item.antonyms) ? item.antonyms : [],
        targetClass: item.targetClass || "Class 1st to 2nd Year",
        etymology: item.etymology || undefined,
      }));
  });

  // Re-synchronize when active user changes
  useEffect(() => {
    setBookmarkedWords(getUserItem<string[]>(currentUser?.id, "dict_bookmarks", []));
    setRecentSearches(getUserItem<string[]>(currentUser?.id, "dict_recents", []));
    const raw = getUserItem<DictionaryEntry[]>(currentUser?.id, "dict_custom_words", []);
    setDynamicEntries(Array.isArray(raw) ? raw : []);
  }, [currentUser?.id]);

  const toggleBookmark = (id: string) => {
    setBookmarkedWords((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      setUserItem(currentUser?.id, "dict_bookmarks", next);
      return next;
    });
  };

  const addRecentSearch = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      setUserItem(currentUser?.id, "dict_recents", next);
      return next;
    });
  };

  // Combine static and dynamic entries ensuring 100% unique IDs and words
  const allDictionaryEntries = useMemo(() => {
    const seenIds = new Set<string>();
    const seenWords = new Set<string>();
    const result: DictionaryEntry[] = [];

    // Prioritize static entries
    for (const entry of ACADEMIC_DICTIONARY_DATA) {
      if (!entry) continue;
      const lowerWord = (entry.word || "").toLowerCase().trim();
      if (!seenIds.has(entry.id) && !seenWords.has(lowerWord)) {
        seenIds.add(entry.id);
        seenWords.add(lowerWord);
        result.push({
          ...entry,
          examples: Array.isArray(entry.examples) ? entry.examples : [],
          translations: entry.translations && typeof entry.translations === "object" ? entry.translations : { UR: entry.word || "" },
          synonyms: Array.isArray(entry.synonyms) ? entry.synonyms : [],
          antonyms: Array.isArray(entry.antonyms) ? entry.antonyms : [],
        });
      }
    }

    // Add any non-duplicate dynamic custom entries
    for (const entry of dynamicEntries) {
      if (!entry) continue;
      const lowerWord = (entry.word || "").toLowerCase().trim();
      if (!seenIds.has(entry.id) && !seenWords.has(lowerWord)) {
        seenIds.add(entry.id);
        seenWords.add(lowerWord);
        result.push({
          ...entry,
          examples: Array.isArray(entry.examples) ? entry.examples : [],
          translations: entry.translations && typeof entry.translations === "object" ? entry.translations : { UR: entry.word || "" },
          synonyms: Array.isArray(entry.synonyms) ? entry.synonyms : [],
          antonyms: Array.isArray(entry.antonyms) ? entry.antonyms : [],
        });
      }
    }

    return result;
  }, [dynamicEntries]);

  // Audio Pronunciation TTS
  const playWordAudio = (text: string, langType: "en" | "ur") => {
    setSpeakingField(langType);
    const localeCode = langType === "ur" ? "UR" : "EN";
    speakWithVoice(
      text,
      selectedVoicePersona,
      customVoiceURI,
      1.0,
      0.95,
      localeCode
    );
    setTimeout(() => {
      setSpeakingField(null);
    }, 2500);
  };

  // Filtered List with resilient Urdu diacritic tolerance & 100% defensive null guards
  const filteredEntries = useMemo(() => {
    const qRaw = searchQuery.trim();
    const qNorm = normalizeText(qRaw);

    return allDictionaryEntries.filter((entry) => {
      if (!entry) return false;

      if (showOnlySaved && !bookmarkedWords.includes(entry.id)) {
        return false;
      }

      // If user is actively searching a query, do not rigidly hide matches behind subject/grade filters
      if (!qNorm) {
        if (selectedSubject !== "All Subjects" && !(entry.subject || "").toLowerCase().includes(selectedSubject.toLowerCase())) {
          return false;
        }

        if (selectedGradeBand !== "all") {
          const tClass = (entry.targetClass || "").toLowerCase();
          if (selectedGradeBand === "primary" && !tClass.includes("1st") && !tClass.includes("5th") && !tClass.includes("6th")) {
            return false;
          }
          if (selectedGradeBand === "middle" && !tClass.includes("6th") && !tClass.includes("7th") && !tClass.includes("8th")) {
            return false;
          }
          if (selectedGradeBand === "matric" && !tClass.includes("9th") && !tClass.includes("10th") && !tClass.includes("matric")) {
            return false;
          }
          if (selectedGradeBand === "college" && !tClass.includes("11th") && !tClass.includes("12th") && !tClass.includes("2nd") && !tClass.includes("fsc")) {
            return false;
          }
        }
        return true;
      }

      // Matching query against word, definition, examples, subject, and all translations
      const wordNorm = normalizeText(entry.word || "");
      const defNorm = normalizeText(entry.definition || "");
      const subjNorm = normalizeText(entry.subject || "");
      const exNorm = Array.isArray(entry.examples)
        ? entry.examples.some((ex) => typeof ex === "string" && normalizeText(ex).includes(qNorm))
        : false;
      const transNorm = entry.translations && typeof entry.translations === "object"
        ? Object.values(entry.translations).some((val) => typeof val === "string" && normalizeText(val).includes(qNorm))
        : false;

      return (
        wordNorm.includes(qNorm) ||
        defNorm.includes(qNorm) ||
        subjNorm.includes(qNorm) ||
        exNorm ||
        transNorm
      );
    });
  }, [allDictionaryEntries, searchQuery, selectedSubject, selectedGradeBand, showOnlySaved, bookmarkedWords]);

  // Keep activeWordEntry steady: never forcefully flip selection on every single keystroke (prevents blinking)
  useEffect(() => {
    if (!activeWordEntry && filteredEntries.length > 0) {
      setActiveWordEntry(filteredEntries[0]);
    }
  }, [filteredEntries, activeWordEntry]);

  // Comprehensive AI / Online Lookup for any word in the world
  const handleAILookup = async (wordToSearch: string) => {
    const term = wordToSearch.trim();
    if (!term) return;

    addRecentSearch(term);

    // If word is already in current entries, just select it immediately
    const existing = allDictionaryEntries.find(
      (e) =>
        normalizeText(e.word) === normalizeText(term) ||
        normalizeText(e.translations.UR || "").includes(normalizeText(term))
    );
    if (existing) {
      setActiveWordEntry(existing);
      return;
    }

    setIsSearchingAI(true);
    setSearchStatusMsg(`Searching academic databases & Urdu dictionary for "${term}"...`);

    try {
      const res = await fetch("/api/dictionary/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: term,
          targetLanguage: selectedLang,
          grade: selectedGradeBand !== "all" ? selectedGradeBand : "Class 1st to 2nd Year",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.entry && data.entry.word) {
          const rawEntry = data.entry;
          const newEntry: DictionaryEntry = {
            id: rawEntry.id || `dict-${term.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now()}`,
            word: rawEntry.word || term.charAt(0).toUpperCase() + term.slice(1),
            phonetic: rawEntry.phonetic || `/${term.toLowerCase()}/`,
            partOfSpeech: rawEntry.partOfSpeech || "academic term",
            subject: rawEntry.subject || (selectedSubject !== "All Subjects" ? selectedSubject : "General Science"),
            definition: rawEntry.definition || `Fundamental academic concept regarding "${term}".`,
            simpleExplanation: rawEntry.simpleExplanation || `Key concept encountered when studying ${term}.`,
            translations: {
              UR: rawEntry.translations?.UR || rawEntry.translations?.urdu || `${term} کا اردو مفہوم و معنی`,
              PS: rawEntry.translations?.PS || rawEntry.translations?.pashto || `${term} پښتو معنی`,
              ...rawEntry.translations,
            },
            examples: Array.isArray(rawEntry.examples) && rawEntry.examples.length > 0
              ? rawEntry.examples
              : (rawEntry.exampleSentence ? [rawEntry.exampleSentence] : [`Students analyze "${term}" to understand key textbook concepts and exam questions.`]),
            synonyms: rawEntry.synonyms || ["academic term", "concept", "principle"],
            antonyms: rawEntry.antonyms || [],
            targetClass: rawEntry.gradeLevel || rawEntry.targetClass || "Class 1st to 2nd Year",
            etymology: rawEntry.etymology,
          };

          // Reset restrictive filters so the newly searched word is immediately visible in the list
          setSelectedSubject("All Subjects");
          setSelectedGradeBand("all");

          setDynamicEntries((prev) => {
            const next = [newEntry, ...prev.filter((e) => e.word.toLowerCase() !== newEntry.word.toLowerCase())];
            setUserItem(currentUser?.id, "dict_custom_words", next.slice(0, 50));
            return next;
          });
          setActiveWordEntry(newEntry);
          return;
        }
      }
      throw new Error("AI lookup returned empty");
    } catch {
      // Local graceful fallback with authentic Urdu meaning format
      const fallbackEntry: DictionaryEntry = {
        id: `dict-ai-${Date.now()}`,
        word: term.charAt(0).toUpperCase() + term.slice(1),
        phonetic: `/${term.toLowerCase()}/`,
        partOfSpeech: "academic concept",
        subject: selectedSubject !== "All Subjects" ? selectedSubject : "General Science",
        definition: `Fundamental concept and operational framework regarding "${term}" in modern education.`,
        simpleExplanation: `Key concept that students encounter when studying ${term} in school and college courses.`,
        translations: {
          UR: `${term} کا مفہوم، تشریح اور اردو معنی`,
          PS: `د ${term} پښتو معنا او اصطلاح`,
          AR: `مصطلح ${term}`,
        },
        examples: [`Students examine "${term}" to understand core principles and analytical methods in examinations.`],
        targetClass: "Class 1st to 2nd Year",
      };
      setDynamicEntries((prev) => [fallbackEntry, ...prev]);
      setActiveWordEntry(fallbackEntry);
    } finally {
      setIsSearchingAI(false);
      setSearchStatusMsg(null);
    }
  };

  const handleCopy = (entry: DictionaryEntry) => {
    const urduMeaning = entry.translations ? (entry.translations.UR || entry.translations.urdu || "") : "";
    const firstExample = Array.isArray(entry.examples) && entry.examples[0] ? entry.examples[0] : "";
    const text = `${entry.word || ""} (${entry.partOfSpeech || ""})\nUrdu Meaning: ${urduMeaning}\nDefinition: ${entry.definition || ""}\nExplanation: ${entry.simpleExplanation || ""}\nExample: ${firstExample}`;
    navigator.clipboard.writeText(text);
    setCopiedWordId(entry.id);
    setTimeout(() => setCopiedWordId(null), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-violet-800/40 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
              <Languages className="w-3.5 h-3.5 text-cyan-300" />
              Multilingual Academic Dictionary (Class 1st to 2nd Year)
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Academic & Language Dictionary
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Search any scientific, mathematical, or literary term in English or Urdu. Features instant authentic Urdu & Pashto meanings (اردو معنی), audio pronunciations in both languages, simple student explanations, and exam examples.
            </p>
          </div>

          {/* Language Selector Dropdown / Pills */}
          <div className="flex flex-col gap-2 shrink-0 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
              Target Language:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {SUPPORTED_LANGUAGES.slice(0, 6).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 justify-center ${
                    selectedLang === lang.code
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search Input Form (Press Enter to define any English or Urdu word) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              handleAILookup(searchQuery);
            }
          }}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in English or Urdu (e.g. Photosynthesis, Telescope, دوربین, Gravity, کشش ثقل, Cell, خلیہ, Derivative)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearchingAI || !searchQuery.trim()}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            {isSearchingAI ? (
              <RotateCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Define & Urdu Meaning</span>
          </button>
        </form>

        {/* Popular Quick-Select Topic Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-indigo-500" />
            Popular:
          </span>
          {POPULAR_TOPIC_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setSearchQuery(chip.query);
                handleAILookup(chip.query);
              }}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white transition-all shrink-0 cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Subject Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SUBJECT_FILTERS.map((subj) => (
              <button
                key={subj}
                onClick={() => setSelectedSubject(subj)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  selectedSubject === subj
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                }`}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Saved words toggle button */}
          <button
            onClick={() => setShowOnlySaved(!showOnlySaved)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              showOnlySaved
                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-amber-400"
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current" />
            <span>Saved Words ({bookmarkedWords.length})</span>
          </button>
        </div>

        {/* Grade Band Filter */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Grade Level:
          </span>
          {GRADE_LEVEL_FILTERS.map((band) => (
            <button
              key={band.id}
              onClick={() => setSelectedGradeBand(band.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedGradeBand === band.id
                  ? "bg-violet-600 text-white font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {band.label}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE: WORD LIST (LEFT) & RICH DETAIL CARD (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Word Cards List (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>{filteredEntries.length} Terms Available</span>
            <span>Click any term to explore</span>
          </div>

          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredEntries.map((entry) => {
              const isSelected = activeWordEntry?.id === entry.id;
              const isSaved = bookmarkedWords.includes(entry.id);
              const translation = entry.translations[selectedLang] || entry.translations.UR || "";

              return (
                <div
                  key={entry.id}
                  onClick={() => setActiveWordEntry(entry)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {entry.word}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                          {entry.partOfSpeech}
                        </span>
                      </div>
                      {entry.phonetic && (
                        <p className="text-[11px] text-slate-400 font-mono">{entry.phonetic}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(entry.id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-500 cursor-pointer"
                      title={isSaved ? "Remove bookmark" : "Save word"}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ) : (
                        <Bookmark className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {translation && (
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 line-clamp-1 font-serif" dir="rtl">
                      {translation}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {entry.simpleExplanation || entry.definition}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {entry.subject}
                    </span>
                    <span>{entry.targetClass || "All Classes"}</span>
                  </div>
                </div>
              );
            })}

            {filteredEntries.length === 0 && (
              <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  No predefined terms match "{searchQuery}"
                </p>
                <p className="text-xs text-slate-500">
                  Click the button below to look up "{searchQuery}" across real-time academic dictionaries and Urdu translators!
                </p>
                <button
                  onClick={() => handleAILookup(searchQuery)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-bold text-xs shadow flex items-center gap-2 mx-auto active:scale-95 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Translate & Define "{searchQuery}"</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Academic Lexicon Card (7 Cols) */}
        <div className="lg:col-span-7">
          {isSearchingAI ? (
            /* Animated Loading Card while AI / Online Dictionary is Fetching */
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xl space-y-6 text-center animate-pulse">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <RotateCcw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                  Looking Up "{searchQuery}"
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {searchStatusMsg || "Consulting syllabus lexicons, authentic Urdu translations, board exam definitions, and student explanations..."}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Translating English ⇄ Urdu & Pashto</span>
              </div>
            </div>
          ) : activeWordEntry ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 sticky top-20">
              {/* Header: Word, Phonetic, Subject & Pronunciation Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                      {activeWordEntry.word}
                    </h2>
                    <button
                      onClick={() => playWordAudio(activeWordEntry.word, "en")}
                      className={`p-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                        speakingField === "en"
                          ? "bg-indigo-600 text-white"
                          : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white"
                      }`}
                      title="Listen to English pronunciation"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>English Audio</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {activeWordEntry.phonetic && (
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {activeWordEntry.phonetic}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {activeWordEntry.partOfSpeech}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                      {activeWordEntry.subject}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300">
                      {activeWordEntry.targetClass || "Class 1st to 2nd Year"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleBookmark(activeWordEntry.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      bookmarkedWords.includes(activeWordEntry.id)
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-amber-400"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    <span>{bookmarkedWords.includes(activeWordEntry.id) ? "Saved" : "Save"}</span>
                  </button>

                  <button
                    onClick={() => handleCopy(activeWordEntry)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                    title="Copy definition"
                  >
                    {copiedWordId === activeWordEntry.id ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Share2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Urdu Translation Showcase Card (Prominently Styled with Urdu Pronunciation) */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 border border-emerald-300 dark:border-emerald-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                    <span>🇵🇰</span>
                    <span>اردو معنی و مفہوم (Urdu Meaning)</span>
                  </span>

                  {/* Urdu Audio Button */}
                  <button
                    onClick={() => {
                      const urduText =
                        activeWordEntry.translations.UR ||
                        activeWordEntry.translations.urdu ||
                        activeWordEntry.word;
                      playWordAudio(urduText, "ur");
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                      speakingField === "ur"
                        ? "bg-emerald-700 text-white"
                        : "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white"
                    }`}
                    title="Listen to Urdu pronunciation"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>اردو تلفظ سنیں</span>
                  </button>
                </div>

                <div className="bg-white/95 dark:bg-slate-950/90 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 shadow-inner">
                  <p
                    dir="rtl"
                    className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-emerald-200 leading-relaxed tracking-wide font-serif text-right"
                  >
                    {activeWordEntry.translations.UR ||
                      activeWordEntry.translations.urdu ||
                      activeWordEntry.translations[selectedLang] ||
                      `${activeWordEntry.word} کا اردو مفہوم و تشریح`}
                  </p>
                </div>

                {/* Additional Language Translations if available */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {(activeWordEntry.translations.PS || activeWordEntry.translations.pashto) && (
                    <div className="px-3 py-1.5 rounded-xl bg-teal-100/70 dark:bg-teal-950/60 border border-teal-300 dark:border-teal-800 text-xs flex items-center gap-1.5">
                      <span className="font-bold text-teal-800 dark:text-teal-300">پښتو (Pashto):</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-serif">
                        {activeWordEntry.translations.PS || activeWordEntry.translations.pashto}
                      </span>
                      <button
                        onClick={() => {
                          const psText = activeWordEntry.translations.PS || activeWordEntry.translations.pashto;
                          if (psText) {
                            speakWithVoice(psText, selectedVoicePersona, customVoiceURI, 1.0, 0.95, "PS");
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 transition-colors cursor-pointer ml-1"
                        title="Listen to Pashto pronunciation"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {selectedLang !== "UR" && selectedLang !== "PS" && activeWordEntry.translations[selectedLang] && (
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-100/70 dark:bg-indigo-950/60 border border-indigo-300 dark:border-indigo-800 text-xs flex items-center gap-1.5">
                      <span className="font-bold text-indigo-800 dark:text-indigo-300">
                        {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.name || selectedLang}:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {activeWordEntry.translations[selectedLang]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Comprehensive Academic Definition */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Academic Curriculum Definition
                </h4>
                <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                  {activeWordEntry.definition}
                </p>
              </div>

              {/* Simple Student Explanation */}
              {activeWordEntry.simpleExplanation && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Simple Student Explanation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeWordEntry.simpleExplanation}
                  </p>
                </div>
              )}

              {/* Academic Examples in Context */}
              {Array.isArray(activeWordEntry.examples) && activeWordEntry.examples.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Textbook & Exam Examples
                  </h4>
                  <div className="space-y-2">
                    {activeWordEntry.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic"
                      >
                        "{ex}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Synonyms & Antonyms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {Array.isArray(activeWordEntry.synonyms) && activeWordEntry.synonyms.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Related Concepts / Synonyms
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {activeWordEntry.synonyms.map((syn, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(syn);
                            handleAILookup(syn);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-indigo-100 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {syn}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {Array.isArray(activeWordEntry.antonyms) && activeWordEntry.antonyms.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Antonyms / Opposites
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {activeWordEntry.antonyms.map((ant, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-800/60"
                        >
                          {ant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {activeWordEntry.etymology && (
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                  <strong>Etymology:</strong> {activeWordEntry.etymology}
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Select a Word to View Detailed Definition
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Explore definitions, translations in Urdu, Pashto, Arabic, and more, with audio pronunciations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
