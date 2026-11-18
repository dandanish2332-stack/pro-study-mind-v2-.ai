import { VoicePersonaOption, VoicePersonaId } from "../types";

export const VOICE_PERSONAS: VoicePersonaOption[] = [
  {
    id: "natural_man",
    name: "Natural Man (Default)",
    gender: "male",
    description: "Warm, natural grounded masculine voice with friendly tone for all age groups",
    defaultPitch: 0.92,
    defaultRate: 1.15,
  },
  {
    id: "friendly_buddy",
    name: "Cheerful AI Study Buddy",
    gender: "male",
    description: "Upbeat, energetic, cheerful buddy voice designed for students & fun learning",
    defaultPitch: 1.25,
    defaultRate: 1.2,
  },
  {
    id: "natural_female",
    name: "Natural Female Helper",
    gender: "female",
    description: "Clear, bright, encouraging female voice suitable for family & students",
    defaultPitch: 1.08,
    defaultRate: 1.15,
  },
  {
    id: "soft_female",
    name: "Gentle Storyteller & Guide",
    gender: "female",
    description: "Gentle, soothing, patient tone perfect for bedtime, reading, and relaxing",
    defaultPitch: 1.15,
    defaultRate: 1.05,
  },
  {
    id: "deep_male",
    name: "Deep Resonant Male",
    gender: "male",
    description: "Calm, steady masculine baritone voice with clear articulation",
    defaultPitch: 0.75,
    defaultRate: 1.1,
  },
  {
    id: "cyber_agent",
    name: "Friendly AI Companion Robot",
    gender: "robot",
    description: "Futuristic, playful synthetic voice for science & tech tasks",
    defaultPitch: 1.3,
    defaultRate: 1.25,
  },
  {
    id: "system_custom",
    name: "System Device Voice",
    gender: "male",
    description: "Select directly from installed device speech synthesis engines",
    defaultPitch: 1.0,
    defaultRate: 1.15,
  },
];

let systemVoicesCache: SpeechSynthesisVoice[] = [];

function populateVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const list = window.speechSynthesis.getVoices();
    if (list && list.length > 0) {
      systemVoicesCache = list;
    }
  } catch (e) {}
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  try {
    populateVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      populateVoices();
    };
  } catch (e) {}
}

export function getSystemVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return [];
  }
  populateVoices();
  return systemVoicesCache;
}

export const LANG_TO_LOCALE: Record<string, string> = {
  EN: "en-US",
  PS: "ps-AF",
  UR: "ur-PK",
  ES: "es-ES",
  FR: "fr-FR",
  DE: "de-DE",
  JA: "ja-JP",
  ZH: "zh-CN",
  HI: "hi-IN",
  AR: "ar-SA",
  TR: "tr-TR",
  RU: "ru-RU",
  FA: "fa-IR",
  BN: "bn-BD",
  PT: "pt-BR",
  IT: "it-IT",
};

export const FIRST_TIME_VOICE_GREETINGS: Record<string, string> = {
  EN: "Hi, I am your AI Voice Assistant and Study Helper created by danish. What would you like to study or work on today?",
  PS: "سلام، زه ستاسو د AI غږیز مرستیال او د زده کړې لارښود یم چې د دانش لخوا جوړ شوی یم. نن څه زده کول یا کار کول غواړئ؟",
  UR: "سلام، میں آپ کا AI وائس اسسٹنٹ اور اسٹڈی ہیلپر ہوں جسے دانش نے بنایا ہے۔ آج آپ کیا پڑھنا یا کام کرنا چاہتے ہیں؟",
  ES: "Hola, soy tu asistente de voz y tutor de estudio con IA creado por danish. ¿Qué te gustaría estudiar o trabajar hoy?",
  FR: "Bonjour, je suis votre assistant vocal IA et compagnon d'étude créé par danish. Que souhaitez-vous étudier ou travailler aujourd'hui ?",
  DE: "Hallo, ich bin dein KI-Sprachassistent und Lernhelfer, erstellt von danish. Was möchtest du heute lernen oder bearbeiten?",
  JA: "こんにちは、danishによって作成されたAI音声アシスタント兼学習サポーターです。今日は何を勉強または作業しますか？",
  ZH: "你好，我是由 danish 创建的 AI 语音助手与学习伙伴。今天你想学习或完成什么任务？",
  HI: "नमस्ते, मैं दानिश द्वारा बनाया गया आपका AI वॉयس असिस्टेंट और स्टडी हेल्पर हूँ। आज आप क्या पढ़ना या काम करना चाहते हैं?",
  AR: "مرحباً، أنا مساعدك الصوتی ومساعد الدراسة بالذكاء الاصطناعي الذي أنشأه دانش. ماذا تريد أن تدرس أو تعمل عليه اليوم؟",
  TR: "Merhaba, ben danish tarafından oluşturulan yapay zeka sesli asistanınız ve ders yardımcınızım. Bugün ne çalışmak veya yapmak istersiniz?",
  RU: "Привет, я ваш голосовой ИИ-ассистент и помощник в учебе, созданный danish. Что бы вы хотели изучить или сделать сегодня?",
  FA: "سلام، من دستیار صوتی و راهنمای مطالعه هوش مصنوعی شما هستم که توسط دانش ساخته شده‌ام. امروز چه چیزی می‌خواهید مطالعه کنید؟",
  BN: "হ্যালো, আমি দানিশের তৈরি আপনার এআই ভয়েস অ্যাসিস্ট্যান্ট এবং স্টাডি হেল্পার। আজ আপনি কী পড়তে বা কাজ করতে চান?",
  PT: "Olá, sou seu assistente de voz e tutor de estudos com IA criado por danish. O que você gostaria de estudar ou trabalhar hoje?",
  IT: "Ciao, sono il tuo assistente vocale e tutor di studio IA creato da danish. Cosa vorresti studiare o fare oggi?",
};

export const CREATOR_DETAILS_RESPONSE: Record<string, string> = {
  EN: "I am created by Danish, who is studying in 2nd year and is a student of SPS College Batkhela Campus and lives in Mekhband.",
  PS: "زه د دانش لخوا جوړ شوی یم چې په دوهم کال (2nd year) کې زده کړه کوي، د SPS کالج باټخیله کیمپس زده کوونکی دی او په میخ بند کې اوسیږي.",
  UR: "مجھے دانش نے بنایا ہے جو سیکنڈ ایئر (2nd year) میں زیرِ تعلیم ہیں، SPS کالج بٹ خیلہ کیمپس کے طالب علم ہیں اور میخ بند (Mekhband) میں رہتے ہیں۔",
  ES: "Fui creado por Danish, quien está estudiando en segundo año, es estudiante de SPS College Batkhela Campus y vive en Mekhband.",
};

export const RETURNING_VOICE_GREETINGS: Record<string, string> = {
  EN: "Hi, I am your AI Voice Assistant and Study Helper created by danish. What would you like to study or work on today?",
  PS: "سلام، زه ستاسو د AI غږیز مرستیال او د زده کړې لارښود یم چې د دانش لخوا جوړ شوی یم. نن څه زده کول یا کار کول غواړئ؟",
  UR: "سلام، میں آپ کا AI وائس اسسٹنٹ اور اسٹڈی ہیلپر ہوں جسے دانش نے بنایا ہے۔ آج آپ کیا پڑھنا یا کام کرنا چاہتے ہیں؟",
  ES: "Hola, soy tu asistente de voz y tutor de estudio con IA creado por danish. ¿Qué te gustaría estudiar o trabajar hoy?",
  FR: "Bonjour, je suis votre assistant vocal IA et compagnon d'étude créé par danish. Que souhaitez-vous étudier ou travailler aujourd'hui ?",
  DE: "Hallo, ich bin dein KI-Sprachassistent und Lernhelfer, erstellt von danish. Was möchtest du heute lernen oder bearbeiten?",
  JA: "こんにちは、danishによって作成されたAI音声アシスタント兼学習サポーターです。今日は何を勉強または作業しますか？",
  ZH: "你好，我是由 danish 创建的 AI 语音助手与学习伙伴。今天你想学习或完成什么任务？",
  HI: "नमस्ते, मैं दानिश द्वारा बनाया गया आपका AI वॉयस असिस्टेंट और स्टडी हेल्پر हूँ। आज आप क्या पढ़ना या काम करना चाहते हैं?",
  AR: "مرحباً، أنا مساعدك الصوتي ومساعد الدراسة بالذكاء الاصطناعي الذي أنشأه دانش. ماذا تريد أن تدرس أو تعمل عليه اليوم؟",
  TR: "Merhaba, ben danish tarafından oluşturulan yapay zeka sesli asistanınız ve ders yardımcınızım. Bugün ne çalışmak veya yapmak istersiniz?",
  RU: "Привет, я ваш голосовой ИИ-ассистент и помощник в учебе, созданный danish. Что бы вы хотели изучить или сделать сегодня?",
  FA: "سلام، من دستیار صوتی و راهنمای مطالعه هوش مصنوعی شما هستم که توسط دانش ساخته شده‌ام. امروز چه چیزی می‌خواهید مطالعه کنید؟",
  BN: "হ্যালো, আমি দানিশের তৈরি আপনার এআই ভয়েস অ্যাসিস্ট্যান্ট এবং স্টাডি হেল্পার। আজ আপনি কী পড়তে বা কাজ করতে চান?",
  PT: "Olá, sou seu assistente de voz e tutor de estudos com IA criado por danish. O que você gostaria de estudar ou trabalhar hoje?",
  IT: "Ciao, sono il tuo assistente vocale e tutor di studio IA creato da danish. Cosa vorresti studiare o fare oggi?",
};

export function hasSpokenVoiceIntroduction(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("danish_voice_agent_intro_spoken") === "true";
  } catch (e) {
    return false;
  }
}

export function markVoiceIntroductionAsSpoken(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("danish_voice_agent_intro_spoken", "true");
  } catch (e) {}
}

export function getVoiceModeInitialGreeting(lang: string = "EN"): { text: string; isFirstTime: boolean } {
  markVoiceIntroductionAsSpoken();
  return {
    text: FIRST_TIME_VOICE_GREETINGS[lang] || FIRST_TIME_VOICE_GREETINGS["EN"],
    isFirstTime: true,
  };
}

// Web Audio API Audio Cues (Synthesizer Chimes)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

/**
 * Play pleasant 2-tone melodic chime when wake word or voice assistant activates
 */
export function playActivationChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "sine";

    // Note 1: E5 (659.25 Hz)
    osc1.frequency.setValueAtTime(659.25, now);
    // Note 2: A5 (880 Hz)
    osc2.frequency.setValueAtTime(880, now + 0.12);

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
    gainNode.gain.setValueAtTime(0.2, now + 0.12);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.12);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.35);
  } catch (e) {
    // Ignore audio error if not permitted
  }
}

/**
 * Play gentle short blip when recording starts
 */
export function playListeningStartTone() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.08); // G5

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {}
}

export function findMatchingVoice(
  personaId: VoicePersonaId,
  customVoiceURI?: string,
  langCode?: string
): SpeechSynthesisVoice | null {
  const voices = getSystemVoices();
  if (!voices || voices.length === 0) return null;

  if (personaId === "system_custom" && customVoiceURI) {
    const matched = voices.find((v) => v.voiceURI === customVoiceURI);
    if (matched) return matched;
  }

  const langPrefix = langCode ? langCode.split("-")[0].toLowerCase() : "";

  // Filter voices that match language prefix if specified
  let candidates = voices;
  if (langPrefix) {
    let langMatches = voices.filter((v) => v.lang.toLowerCase().startsWith(langPrefix));
    // Multilingual fallback: Urdu and Pashto share phonetics with Hindi and Arabic
    if (langMatches.length === 0 && (langPrefix === "ur" || langPrefix === "ps")) {
      langMatches = voices.filter(
        (v) => v.lang.toLowerCase().startsWith("hi") || v.lang.toLowerCase().startsWith("ar")
      );
    }
    if (langMatches.length > 0) {
      candidates = langMatches;
    }
  }

  const persona = VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];

  if (persona.gender === "male") {
    const maleVoice = candidates.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes("male") ||
        name.includes("david") ||
        name.includes("mark") ||
        name.includes("george") ||
        name.includes("daniel") ||
        name.includes("alex") ||
        name.includes("james") ||
        name.includes("guy") ||
        name.includes("stefan") ||
        name.includes("paul") ||
        name.includes("jorge") ||
        name.includes("pablo") ||
        name.includes("google us english")
      );
    });
    if (maleVoice) return maleVoice;
  } else if (persona.gender === "female") {
    const femaleVoice = candidates.find((v) => {
      const name = v.name.toLowerCase();
      return (
        name.includes("female") ||
        name.includes("zira") ||
        name.includes("samantha") ||
        name.includes("victoria") ||
        name.includes("karen") ||
        name.includes("aria") ||
        name.includes("jenny") ||
        name.includes("helena") ||
        name.includes("monica") ||
        name.includes("google uk english female")
      );
    });
    if (femaleVoice) return femaleVoice;
  }

  return candidates[0] || voices.find((v) => v.lang.startsWith("en")) || voices[0] || null;
}

// Retain active utterance in memory to avoid Chrome Garbage Collection abort bug
let activeUtteranceHolder: SpeechSynthesisUtterance | null = null;
let speechKeepAliveInterval: any = null;

/**
 * Pre-warms the browser's speech synthesis engine so audio playback starts instantaneously
 * and unlocks mobile Safari/Chrome audio context safely
 */
export function warmUpSpeechEngine() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    // Warm up voices cache
    populateVoices();
    // Speak an empty 0-volume utterance to unlock mobile device audio pipelines on user touch
    const dummy = new SpeechSynthesisUtterance(" ");
    dummy.volume = 0.01;
    dummy.rate = 5;
    window.speechSynthesis.speak(dummy);
  } catch (e) {}
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    if (speechKeepAliveInterval) {
      clearInterval(speechKeepAliveInterval);
      speechKeepAliveInterval = null;
    }
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    activeUtteranceHolder = null;
    (window as any).__activeUtterance = null;
  } catch (e) {}
}

/**
 * Fast client-side instant knowledge resolver for zero-latency speech (<1ms response)
 * Solves questions instantaneously without server delay, quota limits, or network lag.
 */
export function getInstantVoiceAnswer(command: string, langCode: string = "EN"): string | null {
  const raw = (command || "").trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const normalized = lower
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // 1. Creator & Danish Identity Queries (< 1ms)
  const isCreatorQuery =
    normalized.includes("creater") ||
    normalized.includes("creator") ||
    lower.includes("who created you") ||
    lower.includes("who made you") ||
    lower.includes("who built you") ||
    lower.includes("who designed you") ||
    lower.includes("who is danish") ||
    lower.includes("about danish") ||
    lower.includes("who is your creator") ||
    lower.includes("who is your creater") ||
    lower.includes("what you know about your creater") ||
    lower.includes("what you know about your creator") ||
    lower.includes("what do you know about your creator") ||
    lower.includes("what do you know about your creater") ||
    lower.includes("tell me about your creator") ||
    lower.includes("tell me about your creater") ||
    lower.includes("tell me about danish") ||
    lower.includes("about your creator") ||
    lower.includes("about your creater") ||
    lower.includes("who made this") ||
    lower.includes("who built this") ||
    lower.includes("کس نے بنایا") ||
    lower.includes("دانش کون") ||
    lower.includes("کون ہے دانش") ||
    lower.includes("آپ کا بنانے والا") ||
    lower.includes("آپ کو کس نے") ||
    lower.includes("خالق") ||
    lower.includes("تاسو چا جوړ کړي") ||
    lower.includes("چا جوړ کړي یاست") ||
    lower.includes("چا جوړ کړی") ||
    lower.includes("دانش څوک") ||
    lower.includes("ستاسو جوړونکی") ||
    normalized === "danish" ||
    normalized === "creator" ||
    normalized === "creater";

  if (isCreatorQuery) {
    if (langCode === "UR") {
      return "مجھے دانش نے بنایا ہے جو سیکنڈ ایئر (2nd year) میں زیرِ تعلیم ہیں، SPS کالج بٹ خیلہ کیمپس کے طالب علم ہیں اور میخ بند (Mekhband) میں رہتے ہیں۔";
    }
    if (langCode === "PS") {
      return "زه د دانش لخوا جوړ شوی یم چې په دوهم کال (2nd year) کې زده کړه کوي، د SPS کالج باټخیله کیمپس زده کوونکی دی او په میخ بند کې اوسیږي.";
    }
    if (langCode === "ES") {
      return "Fui creado por Danish, quien está estudiando en segundo año, es estudiante de SPS College Batkhela Campus y vive en Mekhband.";
    }
    return "I am created by Danish, who is studying in 2nd year and is a student of SPS College Batkhela Campus and lives in Mekhband.";
  }

  // 2. Identity Queries (< 1ms)
  if (
    lower.includes("who are you") ||
    lower.includes("what is your name") ||
    lower.includes("what are you") ||
    lower.includes("آپ کون ہو") ||
    lower.includes("آپ کون ہیں") ||
    lower.includes("تم کون ہو") ||
    lower.includes("آپ کا نام") ||
    lower.includes("تمہارا نام") ||
    lower.includes("تاسو څوک یاست") ||
    lower.includes("ته څوک یې") ||
    lower.includes("ستاسو نوم")
  ) {
    if (langCode === "UR") {
      return "میں آپ کا AI وائس اسسٹنٹ اور اسٹڈی ہیلپر ہوں۔ مجھے دانش نے بنایا ہے جو سیکنڈ ایئر کے طالب علم ہیں، SPS کالج بٹ خیلہ کیمپس میں پڑھتے ہیں اور میخ بند میں رہتے ہیں۔ آج آپ کیا پڑھنا چاہتے ہیں؟";
    }
    if (langCode === "PS") {
      return "زه ستاسو د AI غږیز مرستیال او د زده کړې لارښود یم چې د دانش لخوا جوړ شوی یم. نن څه زده کول غواړئ؟";
    }
    if (langCode === "ES") {
      return "Soy tu asistente de voz y compañero de estudio con IA creado por Danish. ¿Qué te gustaría aprender hoy?";
    }
    return "I am your AI Voice Assistant and Study Helper created by Danish from SPS College Batkhela Campus. What would you like to study or work on today?";
  }

  // 3. Capabilities & Help (< 1ms)
  if (
    normalized === "help" ||
    normalized === "commands" ||
    normalized.includes("what can you do") ||
    normalized.includes("how does this work") ||
    normalized.includes("what are your features") ||
    lower.includes("مدد") ||
    lower.includes("آپ کیا کر سکتے") ||
    lower.includes("مرسته") ||
    lower.includes("تاسو څه کولی")
  ) {
    if (langCode === "UR") {
      return "میں سائنس، ریاضی اور مطالعہ کے موضوعات کی وضاحت کر سکتا ہوں، کوئز لے سکتا ہوں، کیلنڈر شیڈول کر سکتا ہوں اور نوٹس تیار کر سکتا ہوں۔ بس بول کر بتائیے!";
    }
    if (langCode === "PS") {
      return "زه کولی شم د ساینس، ریاضی او درسي موضوعاتو وضاحت وکړم، ازموینې واخلم او ستاسو مرسته وکړم. په آزاده توګه خبرې وکړئ!";
    }
    return "I can explain study topics, solve math problems, test you in Quiz Mode, schedule calendar sessions, track study tasks, and summarize notes. Just speak naturally!";
  }

  // 4. Greetings (< 1ms)
  const isGreeting =
    normalized === "hello" ||
    normalized === "hi" ||
    normalized === "hey" ||
    normalized === "hey ai" ||
    normalized === "hi ai" ||
    normalized === "hello ai" ||
    normalized === "how are you" ||
    normalized === "how are you doing" ||
    normalized === "good morning" ||
    normalized === "good afternoon" ||
    normalized === "good evening" ||
    normalized === "whats up" ||
    normalized.includes("salam") ||
    lower.includes("سلام") ||
    lower.includes("اسلام علیکم") ||
    lower.includes("السلام علیکم") ||
    lower.includes("کیا حال") ||
    lower.includes("کیسے ہو") ||
    lower.includes("څنګه یئ") ||
    lower.includes("څنګه یاست");

  if (isGreeting) {
    if (normalized.includes("good morning") || lower.includes("صبح بخیر") || lower.includes("سهار")) {
      return langCode === "UR"
        ? "صبح بخیر! کیا آپ آج کے نتیجہ خیز مطالعے کے لیے تیار ہیں؟ ہم کس مضمون سے آغاز کریں؟"
        : langCode === "PS"
        ? "سهار په خیر! د نن ورځې زده کړې لپاره چمتو یاست؟ په کوم مضمون پیل وکړو؟"
        : "Good morning! Ready for a productive study session? What subject shall we begin with?";
    }
    if (normalized.includes("good evening") || lower.includes("شام بخیر") || lower.includes("ماښام")) {
      return langCode === "UR"
        ? "شام بخیر! آئیے آج رات توجہ کے ساتھ مطالعہ کرتے ہیں۔ آپ کو کس چیز میں مدد چاہیے؟"
        : "Good evening! Let's get some focused studying done tonight. What do you need help with?";
    }
    if (langCode === "UR") {
      return "ہیلو! میں بالکل ٹھیک ہوں اور آپ کی مدد کے لیے تیار ہوں۔ آج آپ کیا پڑھنا چاہتے ہیں؟";
    }
    if (langCode === "PS") {
      return "سلام! زه ډېر ښه یم او ستاسو مرستې ته چمتو یم. نن څه لوستل غواړئ؟";
    }
    return "Hello! I am doing great and ready to help you learn. What would you like to study or work on?";
  }

  // 5. Current Time & Date (< 1ms)
  if (
    normalized.includes("what time is it") ||
    normalized.includes("tell me the time") ||
    normalized.includes("what is the time") ||
    normalized === "time" ||
    lower.includes("وقت") ||
    lower.includes("ٹائم") ||
    lower.includes("وخت") ||
    lower.includes("ټایم")
  ) {
    const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return langCode === "UR"
      ? `اس وقت کا وقت ${timeStr} ہے۔`
      : langCode === "PS"
      ? `اوسنی وخت ${timeStr} دی.`
      : `The current time is ${timeStr}.`;
  }

  if (
    normalized.includes("what is today's date") ||
    normalized.includes("what is the date") ||
    normalized.includes("what day is today") ||
    normalized.includes("what day is it") ||
    normalized === "date" ||
    lower.includes("تاریخ") ||
    lower.includes("نېټه")
  ) {
    const dateStr = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return langCode === "UR"
      ? `آج کی تاریخ ${dateStr} ہے۔`
      : langCode === "PS"
      ? `نن نېټه ${dateStr} ده.`
      : `Today is ${dateStr}.`;
  }

  // 6. Instant Rotating Study Tips (< 1ms)
  if (
    normalized.includes("study tip") ||
    normalized.includes("study advice") ||
    normalized.includes("how to study") ||
    normalized.includes("motivate me")
  ) {
    const studyTips = [
      "Try the Pomodoro technique: study with intense focus for 25 minutes, then take a 5-minute break to maximize memory retention.",
      "Use active recall: quiz yourself or explain the concept out loud in your own words rather than passively re-reading.",
      "Space your repetitions: reviewing material across multiple days creates much stronger neural pathways than cramming overnight.",
      "Teach it out loud to yourself: if you can explain a topic simply, you have truly mastered it.",
      "Stay well hydrated and take short walks: physical movement stimulates blood flow to the brain and sharpens concentration.",
    ];
    return studyTips[Math.floor(Math.random() * studyTips.length)];
  }

  // 7. Instant Fun Facts & Student Jokes (< 1ms)
  if (
    normalized.includes("tell me a fact") ||
    normalized.includes("give me a fact") ||
    normalized.includes("fun fact") ||
    normalized.includes("science fact")
  ) {
    const facts = [
      "Honey never spoils: archaeologists have discovered pots of honey in ancient Egyptian tombs thousands of years old that are still preserved.",
      "A day on Venus is longer than a year on Venus: it takes Venus 243 Earth days to rotate once, but only 225 Earth days to orbit the Sun.",
      "Octopuses have three hearts and blue copper-based blood.",
      "Sound travels approximately 4.3 times faster in water than in air.",
      "Bananas are naturally slightly radioactive because they contain potassium-40.",
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }

  if (
    normalized.includes("tell me a joke") ||
    normalized.includes("make me laugh") ||
    normalized.includes("funny joke")
  ) {
    const jokes = [
      "Why don't scientists trust atoms? Because they make up everything!",
      "Why did the math book look so sad? Because it had too many problems.",
      "How do you organize a space party? You planet!",
      "Why was the equal sign so humble? Because she knew she wasn't less than or greater than anyone else.",
    ];
    return jokes[Math.floor(Math.random() * jokes.length)];
  }

  // 8. Instant Math & Calculation Solver (< 1ms)
  const percentMatch = normalized.match(/(?:what is|calculate)?\s*(\d+(?:\.\d+)?)\s*(?:percent|%)\s*(?:of)\s*(\d+(?:\.\d+)?)/i);
  if (percentMatch) {
    const p = parseFloat(percentMatch[1]);
    const total = parseFloat(percentMatch[2]);
    const resVal = (p / 100) * total;
    const formatted = Number.isInteger(resVal) ? resVal : resVal.toFixed(2);
    return `${p} percent of ${total} is ${formatted}.`;
  }

  const sqrtMatch = normalized.match(/(?:what is|calculate)?\s*(?:the\s*)?square\s*root\s*of\s*(\d+(?:\.\d+)?)/i);
  if (sqrtMatch) {
    const n = parseFloat(sqrtMatch[1]);
    const resVal = Math.sqrt(n);
    const formatted = Number.isInteger(resVal) ? resVal : resVal.toFixed(3);
    return `The square root of ${n} is ${formatted}.`;
  }

  const powerMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:to\s*the\s*power\s*of|\^)\s*(\d+(?:\.\d+)?)/i);
  if (powerMatch) {
    const base = parseFloat(powerMatch[1]);
    const exp = parseFloat(powerMatch[2]);
    const resVal = Math.pow(base, exp);
    const formatted = Number.isInteger(resVal) ? resVal : resVal.toFixed(2);
    return `${base} to the power of ${exp} is ${formatted}.`;
  }

  const mathMatch = normalized.match(/(?:what is|calculate|solve)?\s*(\d+(?:\.\d+)?)\s*(plus|\+|\-|minus|times|\*|x|multiplied by|divided by|\/)\s*(\d+(?:\.\d+)?)/i);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    const op = mathMatch[2].toLowerCase();
    const num2 = parseFloat(mathMatch[3]);
    let result: number | null = null;
    if (op === "+" || op === "plus") result = num1 + num2;
    else if (op === "-" || op === "minus") result = num1 - num2;
    else if (op === "*" || op === "x" || op === "times" || op === "multiplied by") result = num1 * num2;
    else if (op === "/" || op === "divided by") result = num2 !== 0 ? num1 / num2 : null;

    if (result !== null) {
      const formattedResult = Number.isInteger(result) ? result : result.toFixed(2);
      return `${num1} ${op.replace("*", "times").replace("/", "divided by")} ${num2} equals ${formattedResult}.`;
    }
  }

  // 9. Comprehensive Instant Knowledge Dictionary (< 1ms response)
  const quickFactMap: Record<string, string> = {
    // Creator Context
    "batkhela": "Batkhela is the educational and commercial hub of Malakand District, Khyber Pakhtunkhwa, where my creator Danish studies at SPS College.",
    "mekhband": "Mekhband is a scenic locality situated in Batkhela, Malakand, Pakistan, where my creator Danish lives.",
    "sps college": "SPS College Batkhela Campus is the academic institution in Malakand where my creator Danish studies in 2nd year.",

    // World Geography - Continents & Oceans
    "how many continents": "There are 7 continents in the world: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.",
    "continents of the world": "The 7 continents are Asia (largest), Africa, North America, South America, Antarctica, Europe, and Australia.",
    "continents": "There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia.",
    "largest continent": "Asia is the largest continent on Earth by both land area and population.",
    "smallest continent": "Australia is the smallest continent by land area.",
    "how many oceans": "There are 5 oceans on Earth: the Pacific, Atlantic, Indian, Southern, and Arctic Ocean.",
    "oceans": "There are 5 oceans: the Pacific, Atlantic, Indian, Southern, and Arctic Ocean.",
    "largest ocean": "The Pacific Ocean is the largest and deepest ocean on Earth, covering more than 30% of the Earth's surface.",
    "smallest ocean": "The Arctic Ocean is the smallest and shallowest ocean.",
    "deepest point on earth": "The Mariana Trench (Challenger Deep) in the Pacific Ocean is the deepest location on Earth at approximately 11,034 meters deep.",
    "mariana trench": "The Mariana Trench is the deepest oceanic trench on Earth, reaching nearly 11,000 meters in depth.",
    "highest mountain": "Mount Everest is the highest mountain on Earth at 8,848.86 meters, situated in the Himalayas on the border of Nepal and China.",
    "mount everest": "Mount Everest is the highest mountain on Earth at 8,848.86 meters, situated in the Himalayas.",
    "second highest mountain": "K2 is the second highest mountain in the world at 8,611 meters, located in Gilgit-Baltistan, Pakistan.",
    "k2": "K2 is the second highest mountain in the world at 8,611 meters, located in Gilgit-Baltistan, Pakistan.",
    "longest river": "The Nile River in Africa is the longest river in the world at approximately 6,650 kilometers.",
    "nile river": "The Nile River in Africa is the longest river in the world at approximately 6,650 kilometers.",
    "amazon river": "The Amazon River in South America is the largest river by water discharge volume and the second longest in the world.",
    "largest desert": "The Antarctic Desert is the largest desert overall, while the Sahara Desert in Africa is the largest hot desert.",
    "sahara desert": "The Sahara Desert in North Africa is the world's largest hot desert, spanning over 9 million square kilometers.",

    // World Capitals
    "capital of pakistan": "The capital of Pakistan is Islamabad.",
    "capital of united states": "The capital of the United States is Washington, D.C.",
    "capital of america": "The capital of the United States of America is Washington, D.C.",
    "capital of usa": "The capital of the USA is Washington, D.C.",
    "capital of united kingdom": "The capital of the United Kingdom is London.",
    "capital of uk": "The capital of the United Kingdom is London.",
    "capital of england": "The capital of England is London.",
    "capital of france": "The capital of France is Paris.",
    "capital of germany": "The capital of Germany is Berlin.",
    "capital of china": "The capital of the People's Republic of China is Beijing.",
    "capital of japan": "The capital of Japan is Tokyo.",
    "capital of russia": "The capital of Russia is Moscow.",
    "capital of saudi arabia": "The capital of Saudi Arabia is Riyadh.",
    "capital of turkey": "The capital of Turkey is Ankara.",
    "capital of canada": "The capital of Canada is Ottawa.",
    "capital of australia": "The capital of Australia is Canberra.",
    "capital of egypt": "The capital of Egypt is Cairo.",
    "capital of iran": "The capital of Iran is Tehran.",
    "capital of india": "The capital of India is New Delhi.",
    "capital of afghanistan": "The capital of Afghanistan is Kabul.",
    "capital of uae": "The capital of the United Arab Emirates is Abu Dhabi.",
    "capital of bangladesh": "The capital of Bangladesh is Dhaka.",
    "capital of italy": "The capital of Italy is Rome.",
    "capital of spain": "The capital of Spain is Madrid.",
    "capital of brazil": "The capital of Brazil is Brasilia.",

    // Currencies
    "currency of pakistan": "The currency of Pakistan is the Pakistani Rupee (PKR).",
    "currency of united states": "The currency of the United States is the US Dollar (USD).",
    "currency of usa": "The currency of the United States is the US Dollar (USD).",
    "currency of united kingdom": "The currency of the United Kingdom is the British Pound (GBP).",
    "currency of uk": "The currency of the United Kingdom is the British Pound (GBP).",
    "currency of japan": "The currency of Japan is the Japanese Yen (JPY).",
    "currency of china": "The currency of China is the Renminbi, commonly known as the Yuan (CNY).",
    "currency of saudi arabia": "The currency of Saudi Arabia is the Saudi Riyal (SAR).",
    "currency of europe": "The official currency of the Eurozone is the Euro (EUR).",

    // Solar System & Space
    "how many planets": "There are 8 recognized planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.",
    "planets in solar system": "The 8 planets in order from the Sun are Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.",
    "largest planet": "Jupiter is the largest planet in our solar system, with more mass than all other planets combined.",
    "smallest planet": "Mercury is the smallest planet in our solar system and the closest to the Sun.",
    "closest planet to the sun": "Mercury is the closest planet to the Sun.",
    "hottest planet": "Venus is the hottest planet with surface temperatures over 460 degrees Celsius due to its thick atmosphere.",
    "red planet": "Mars is called the Red Planet because iron oxide on its surface gives it a reddish hue.",
    "rings of saturn": "Saturn is famous for its bright planetary ring system made primarily of water ice and rocky debris.",
    "nearest star to earth": "The Sun is the closest star to Earth, located about 150 million kilometers away.",
    "speed of light": "The speed of light in a vacuum is approximately 300,000 kilometers per second.",
    "speed of sound": "The speed of sound in dry air at room temperature is approximately 343 meters per second.",
    "gravity": "Gravity on Earth accelerates falling objects at approximately 9.8 meters per second squared.",
    "age of the universe": "The universe is estimated to be approximately 13.8 billion years old.",
    "age of earth": "The Earth is approximately 4.54 billion years old.",

    // Science Pioneers & History
    "albert einstein": "Albert Einstein developed the theory of relativity and won the 1921 Nobel Prize for explaining the photoelectric effect.",
    "isaac newton": "Sir Isaac Newton formulated the three laws of motion and universal gravitation, and co-invented calculus.",
    "marie curie": "Marie Curie discovered radioactivity, polonium, and radium, and is the only person to win Nobel Prizes in two different scientific fields.",
    "ibn al haytham": "Ibn al-Haytham was the father of modern optics and pioneer of the empirical scientific method.",
    "al khwarizmi": "Muhammad ibn Musa al-Khwarizmi was the 9th-century polymath considered the father of algebra and the namesake of algorithms.",
    "jabir ibn hayyan": "Jabir ibn Hayyan is known as the foundational father of chemistry who developed distillation and crystallization techniques.",
    "allama iqbal": "Allama Muhammad Iqbal was the great philosopher-poet who presented the vision of an independent homeland at the 1930 Allahabad address.",
    "quaid e azam": "Quaid-e-Azam Muhammad Ali Jinnah is the founding father and first Governor-General of Pakistan.",
    "muhammad ali jinnah": "Quaid-e-Azam Muhammad Ali Jinnah founded Pakistan on August 14, 1947.",

    // Pakistani National Symbols & History
    "national animal of pakistan": "The national animal of Pakistan is the Markhor, a magnificent wild mountain goat known for its screw-shaped horns.",
    "markhor": "The Markhor is the national animal of Pakistan, famous for its majestic screw-shaped spiral horns and agility in high rugged mountains.",
    "national bird of pakistan": "The national bird of Pakistan is the Chukar partridge.",
    "chukar": "The Chukar partridge is the national bird of Pakistan, found in mountainous valleys across northern Pakistan.",
    "national flower of pakistan": "The national flower of Pakistan is the white Jasmine, also known locally as Chambeli.",
    "jasmine": "The white Jasmine (Chambeli) is the national flower of Pakistan, symbolizing purity and friendship.",
    "national poet of pakistan": "The national poet of Pakistan is Allama Muhammad Iqbal, who presented the historic Allahabad address outlining the concept of Pakistan.",
    "national language of pakistan": "The national language of Pakistan is Urdu.",
    "national game of pakistan": "The national sport of Pakistan is Field Hockey, in which Pakistan has won three Olympic gold medals and four World Cups.",
    "national sport of pakistan": "The national sport of Pakistan is Field Hockey.",
    "independence day of pakistan": "Pakistan celebrates its Independence Day on August 14th, marking the birth of the nation in 1947.",
    "founder of pakistan": "The founder of Pakistan is Quaid-e-Azam Muhammad Ali Jinnah.",
    "national anthem of pakistan": "The national anthem of Pakistan is 'Qaumi Taranah', written by Hafeez Jullundhri and composed by Ahmed G. Chagla.",
    "pakistan day": "Pakistan Day is celebrated on March 23rd, commemorating the 1940 Lahore Resolution.",

    // Core Biology Syllabus
    "photosynthesis": "Photosynthesis is the process where green plants convert sunlight, water, and carbon dioxide into glucose and oxygen inside chloroplasts.",
    "cellular respiration": "Cellular respiration converts biochemical energy from glucose into ATP cellular energy within mitochondria, releasing carbon dioxide and water.",
    "cell": "A cell is the basic structural, functional, and biological unit of all living organisms, discovered by Robert Hooke in 1665.",
    "mitosis": "Mitosis is eukaryotic cell division that produces two genetically identical diploid daughter cells.",
    "meiosis": "Meiosis is reductional cell division in reproductive cells that produces four genetically unique haploid gametes.",
    "dna": "DNA, or deoxyribonucleic acid, is the double-helix molecule storing the genetic instructions for all living organisms.",
    "rna": "RNA is a single-stranded nucleic acid that carries instructions from DNA for synthesizing proteins.",
    "chloroplast": "Chloroplasts are plant cell organelles containing chlorophyll that carry out photosynthesis.",
    "mitochondria": "Mitochondria are the powerhouse organelles of eukaryotic cells where aerobic cellular respiration produces ATP.",
    "enzyme": "Enzymes are biological protein catalysts that lower activation energy and accelerate biochemical reactions.",
    "osmosis": "Osmosis is the net movement of water molecules from high water potential to low water potential across a semipermeable membrane.",
    "microscope": "A microscope is an optical instrument that uses lenses to produce magnified images of microscopic structures like cells and microorganisms.",

    // Core Physics Syllabus
    "newtons second law": "Newton's second law states that force equals mass multiplied by acceleration, F equals m times a.",
    "newtons first law": "Newton's first law states that an object remains at rest or in uniform motion unless acted upon by an external net force.",
    "newtons third law": "Newton's third law states that for every action force, there is an equal and opposite reaction force.",
    "velocity": "Velocity is the rate of change of displacement with respect to time, possessing both magnitude and directional vector.",
    "momentum": "Momentum is the product of an object's mass and its velocity, p equals m times v, and is conserved in isolated systems.",
    "acceleration": "Acceleration is the rate of change of velocity over time, measured in meters per second squared.",
    "work": "In physics, work is done when a force causes displacement along the direction of the force, calculated as W equals F times d.",
    "energy": "Energy is the capacity to do work, measured in joules. The Law of Conservation of Energy states energy cannot be created or destroyed, only transformed.",
    "power": "Power is the rate of doing work or transferring energy per unit time, calculated as work divided by time and measured in watts.",
    "telescope": "A telescope is an optical instrument that uses curved lenses or mirrors to observe and magnify distant celestial objects like stars and planets.",
    "friction": "Friction is the resistive contact force that opposes relative motion between two sliding or rolling surfaces.",
    "pressure": "Pressure is force applied perpendicular to the surface of an object per unit area, P equals F over A, measured in Pascals.",
    "inertia": "Inertia is the natural tendency of an object to resist any change in its velocity or state of rest.",
    "ohms law": "Ohm's law states that electrical voltage equals electric current multiplied by resistance, V equals I times R.",
    "coulombs law": "Coulomb's law states that the electrostatic force between two charges is proportional to their product and inversely proportional to the square of their distance.",
    "kinetic energy": "Kinetic energy is energy of motion, calculated as half mass times velocity squared, one-half m v squared.",
    "potential energy": "Gravitational potential energy is stored energy due to height, calculated as mass times gravity times height, m g h.",

    // Native Urdu & Pashto Terms
    "مارخور": "پاکستان کا قومی جانور مارخور ہے جو اپنے بل دار سینگوں کی وجہ سے جانا جاتا ہے۔",
    "خلیہ": "سیل یا خلیہ تمام جانداروں کی ساخت اور فعل کی بنیادی حیاتیاتی اکائی ہے۔",
    "سیل": "سیل یا خلیہ تمام جانداروں کی ساخت اور فعل کی بنیادی حیاتیاتی اکائی ہے۔",
    "ایٹم": "ایٹم مادے کا بنیادی ذرہ ہے جو پروٹان، نیوٹران اور الیکٹران پر مشتمل ہوتا ہے۔",
    "توانائی": "توانائی کام کرنے کی صلاحیت کو کہتے ہیں۔ قانون بقائے توانائی کے مطابق توانائی نہ بنتی ہے اور نہ فنا ہوتی ہے۔",
    "قائد اعظم": "قائد اعظم محمد علی جناح پاکستان کے بانی اور پہلے گورنر جنرل ہیں۔",
    "علامہ اقبال": "علامہ محمد اقبال پاکستان کے قومی شاعر اور مفکرِ پاکستان ہیں۔",
    "اسلام آباد": "اسلام آباد پاکستان کا خوبصورت دارالحکومت ہے۔",
    "حجره": "حجره د ټولو ژوندیو موجوداتو د جوړښت او کار بنسټیزه برخه ده.",
    "اټوم": "اټوم د مادې بنسټیزه ذره ده.",

    // Core Chemistry Syllabus
    "atom": "An atom is the fundamental building block of chemical elements, composed of a central nucleus of protons and neutrons surrounded by electrons.",
    "ph": "pH is a logarithmic scale measuring hydrogen ion concentration: below 7 is acidic, 7 is neutral, and above 7 is basic or alkaline.",
    "acid": "An acid is a chemical compound with a pH below 7 that donates hydrogen ions, turns blue litmus paper red, and tastes sour.",
    "base": "A base is a chemical compound with a pH above 7 that accepts hydrogen ions, turns red litmus paper blue, and feels slippery.",
    "alkali": "An alkali is a water-soluble base that releases hydroxide ions (OH-) in aqueous solution.",

    // Space & Astronomy Specifics
    "mars": "Mars is the fourth planet from the Sun, called the Red Planet because iron oxide on its surface gives it a reddish appearance. It has two small moons: Phobos and Deimos.",
    "jupiter": "Jupiter is the fifth planet and the largest in our solar system, a gas giant with the iconic Great Red Spot storm and over 90 moons.",

    // Mathematics & Computing
    "pythagorean theorem": "The Pythagorean theorem states that in a right-angled triangle, a squared plus b squared equals c squared.",
    "quadratic formula": "The quadratic formula solves a x squared plus b x plus c equals zero as x equals negative b plus or minus the square root of b squared minus 4 a c, all over 2 a.",
    "area of circle": "The area of a circle is calculated as pi times the radius squared, A equals pi r squared.",
    "circumference of circle": "The circumference of a circle is calculated as 2 times pi times the radius, C equals 2 pi r.",
    "derivative": "A derivative represents the instantaneous rate of change of a function with respect to an independent variable.",
    "binary search": "Binary search finds a target in a sorted list by repeatedly halving the search interval with logarithmic O(log n) efficiency.",
    "algorithm": "An algorithm is a finite, unambiguous sequence of step-by-step instructions designed to solve a specific problem.",
  };

  // Check matching: multi-word phrases match with .includes(), single-word terms match with word-boundary regex
  for (const [key, answer] of Object.entries(quickFactMap)) {
    const isMatched = key.includes(" ")
      ? normalized.includes(key)
      : new RegExp(`\\b${key}\\b`, "i").test(normalized);

    if (isMatched) {
      if (langCode === "UR") {
        if (key === "photosynthesis") return "فوٹوسنتھیسس وہ عمل ہے جس میں پودے سورج کی روشنی، پانی اور کاربن ڈائی آکسائیڈ سے خوراک اور آکسیجن تیار کرتے ہیں۔";
        if (key === "cell") return "سیل (خلیہ) تمام جانداروں کی ساخت اور فعل کی بنیادی حیاتیاتی اکائی ہے جسے رابرٹ ہک نے 1665 میں دریافت کیا۔";
        if (key === "atom") return "ایٹم مادے کا بنیادی ذرہ ہے جو نیوکلیئس (پروٹان اور نیوٹران) اور اس کے گرد گھومتے الیکٹران پر مشتمل ہوتا ہے۔";
        if (key === "work") return "طبیعیات میں کام اس وقت ہوتا ہے جب کوئی قوت کسی چیز کو اپنی سمت میں حرکت دے، ڈبلیو برابر فورس ضرب فاصلہ۔";
        if (key === "energy") return "توانائی کام کرنے کی صلاحیت کو کہتے ہیں۔ قانون بقائے توانائی کے مطابق توانائی نہ بنتی ہے اور نہ ختم ہوتی ہے۔";
        if (key === "velocity") return "ولاسٹی وقت کے لحاظ سے ڈسپلیسمنٹ کی شرح کو کہتے ہیں جس میں مقدار اور سمت دونوں شامل ہیں۔";
        if (key === "acceleration") return "ایکسلریشن وقت کے لحاظ سے ولاسٹی میں تبدیلی کی شرح کو کہتے ہیں۔";
        if (key === "mars") return "مریخ (Mars) نظام شمسی کا چوتھا سیارہ ہے جسے آئرن آکسائیڈ کی وجہ سے سرخ سیارہ بھی کہا جاتا ہے۔";
        if (key === "jupiter") return "مشتری (Jupiter) نظام شمسی کا پانچواں اور سب سے بڑا سیارہ ہے۔";
        if (key === "capital of pakistan") return "پاکستان کا دارالحکومت اسلام آباد ہے۔";
        if (key === "national animal of pakistan" || key === "markhor") return "پاکستان کا قومی جانور مارخور ہے جو اپنے بل دار سینگوں کی وجہ سے جانا جاتا ہے۔";
        if (key === "national flower of pakistan" || key === "jasmine") return "پاکستان کا قومی پھول سفید چمبیلی (Jasmine) ہے۔";
        if (key === "national bird of pakistan" || key === "chukar") return "پاکستان کا قومی پرندہ چکور ہے۔";
        if (key === "national poet of pakistan") return "پاکستان کے قومی شاعر علامہ محمد اقبال ہیں۔";
        if (key === "national game of pakistan" || key === "national sport of pakistan") return "پاکستان کا قومی کھیل فیلڈ ہاکی ہے۔";
        if (key === "founder of pakistan") return "پاکستان کے بانی قائد اعظم محمد علی جناح ہیں۔";
        if (key === "capital of united states") return "امریکہ کا دارالحکومت واشنگٹن ڈی سی ہے۔";
        if (key === "how many planets") return "ہمارے نظام شمسی میں 8 سیارے ہیں۔";
        if (key === "speed of light") return "خلا میں روشنی کی رفتار تقریباً 300,000 کلومیٹر فی سیکنڈ ہے۔";
        if (key === "dna") return "ڈی این اے (DNA) وہ موروثی مالیکیول ہے جو تمام جانداروں کی جینیاتی ہدایات کو محفوظ رکھتا ہے۔";
      } else if (langCode === "PS") {
        if (key === "photosynthesis") return "فوٹوسنتھیسس هغه پروسه ده چې په هغې کې بوټي د لمر له رڼا، اوبو او کاربن ډای اکسایډ څخه خواړه او اکسیجن جوړوي.";
        if (key === "cell") return "حجره (Cell) د ټولو ژوندیو موجوداتو د جوړښت او کار بنسټیزه برخه ده.";
        if (key === "atom") return "اټوم د مادې بنسټیزه ذره ده چې له پروتونونو، نیوترونونو او الکترونونو څخه جوړه شوې ده.";
        if (key === "capital of pakistan") return "د پاکستان پلازمېنه اسلام آباد دی.";
        if (key === "how many planets") return "زموږ په لمریز نظام کې اته سیارې شتون لري.";
        if (key === "national animal of pakistan" || key === "markhor") return "د پاکستان ملي ځناور مارخور دی.";
        if (key === "national flower of pakistan" || key === "jasmine") return "د پاکستان ملي ګل سپینه چمبیلي (یاسمین) ده.";
      }
      return answer;
    }
  }

  return null;
}

/**
 * Phonetically converts mathematical equations, powers of ten, and fractions
 * into natural spoken words so students never hear raw code ("backslash frac", "caret", etc.).
 */
export function cleanTextForNaturalSpeech(text: string, langCode = "EN"): string {
  if (!text) return "";

  let s = text
    .replace(/[\u{1F600}-\u{1F6FF}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/gu, "")
    .replace(/https?:\/\/\S+/g, "link")
    .replace(/[*_#`~[\]]/g, "");

  // 1. Fractions: \frac{a}{b} -> a over b
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "$1 over $2");
  s = s.replace(/\\left\(|\\right\)/g, "");

  // 2. Powers of ten and variables
  s = s.replace(/10\^\{([+-]?\d+)\}/g, "10 to the power of $1");
  s = s.replace(/10\^([+-]?\d+)/g, "10 to the power of $1");
  s = s.replace(/([a-zA-Z0-9])\^\{?2\}?/g, "$1 squared");
  s = s.replace(/([a-zA-Z0-9])\^\{?3\}?/g, "$1 cubed");
  s = s.replace(/([a-zA-Z0-9])\^\{?([+-]?\d+)\}?/g, "$1 to the power of $2");

  // 3. Radicals: \sqrt{x} -> square root of x
  s = s.replace(/\\sqrt\{([^}]+)\}/g, "square root of $1");

  // 4. Mathematical operators
  s = s.replace(/\\times/g, " times ");
  s = s.replace(/\\cdot/g, " times ");
  s = s.replace(/\\pm/g, " plus or minus ");
  s = s.replace(/\\approx/g, " approximately ");
  s = s.replace(/\\neq/g, " is not equal to ");
  s = s.replace(/\\leq|\\le/g, " is less than or equal to ");
  s = s.replace(/\\geq|\\ge/g, " is greater than or equal to ");
  s = s.replace(/\\infty/g, " infinity ");
  s = s.replace(/\\to/g, " approaches ");

  // 5. Greek symbols
  s = s.replace(/\\pi/g, " pi ");
  s = s.replace(/\\theta/g, " theta ");
  s = s.replace(/\\lambda/g, " lambda ");
  s = s.replace(/\\alpha/g, " alpha ");
  s = s.replace(/\\beta/g, " beta ");
  s = s.replace(/\\gamma/g, " gamma ");
  s = s.replace(/\\Delta|\\delta/g, " delta ");
  s = s.replace(/\\omega/g, " omega ");
  s = s.replace(/\\mu/g, " micro ");
  s = s.replace(/\\varepsilon_0|\\varepsilon_o|\\varepsilon/g, " epsilon zero ");

  // 6. Common physics units
  s = s.replace(/\bm\/s\^2\b|\bm\/s²\b/g, " meters per second squared ");
  s = s.replace(/\bm\/s\b/g, " meters per second ");
  s = s.replace(/\bkg\/m\^3\b|\bkg\/m³\b/g, " kilograms per cubic meter ");
  s = s.replace(/\bN\s*m\^2\/kg\^2\b/g, " Newton meters squared per kilogram squared ");

  // 7. Strip \text{...} wrappers and raw formatting
  s = s.replace(/\\text\{([^}]+)\}/g, "$1");
  s = s.replace(/[\$\\]/g, " ");
  s = s.replace(/[{}]/g, "");

  // 8. Clean excess whitespace
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Ultra-fast, zero-delay speech synthesis execution with Chrome queue collision protection.
 * Fixes the async cancel() deadlock where speech lags behind text display.
 */
export function speakWithVoice(
  text: string,
  personaId: VoicePersonaId = "natural_man",
  customVoiceURI?: string,
  pitchOverride?: number,
  rateOverride?: number,
  langCode?: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): SpeechSynthesisUtterance | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return null;
  }

  // Clean text from emojis, raw LaTeX syntax, and formatting for crystal-clear natural speech
  const cleanText = cleanTextForNaturalSpeech(text, langCode);

  if (!cleanText) {
    if (onEnd) onEnd();
    return null;
  }

  try {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    activeUtteranceHolder = utterance;
    (window as any).__activeUtterance = utterance;

    const persona = VOICE_PERSONAS.find((p) => p.id === personaId) || VOICE_PERSONAS[0];

    utterance.pitch = pitchOverride ?? persona.defaultPitch;
    utterance.rate = rateOverride ?? persona.defaultRate;

    const locale = langCode ? (LANG_TO_LOCALE[langCode] || langCode) : "en-US";

    // Synchronize language and voice cleanly
    const matchedVoice = findMatchingVoice(personaId, customVoiceURI, locale);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
      const reqPrefix = locale.split("-")[0].toLowerCase();
      const voicePrefix = matchedVoice.lang.split("-")[0].toLowerCase();
      if (reqPrefix === voicePrefix) {
        utterance.lang = matchedVoice.lang;
      } else {
        utterance.lang = locale;
      }
    } else {
      utterance.lang = locale;
    }

    let hasStarted = false;
    let hasEnded = false;
    let startWatchdogTimer: any = null;
    let fallbackTimeoutTimer: any = null;

    const safeEnd = (triggerEndCallback = true) => {
      if (hasEnded) return;
      hasEnded = true;
      if (startWatchdogTimer) clearTimeout(startWatchdogTimer);
      if (fallbackTimeoutTimer) clearTimeout(fallbackTimeoutTimer);
      if (speechKeepAliveInterval) {
        clearInterval(speechKeepAliveInterval);
        speechKeepAliveInterval = null;
      }
      activeUtteranceHolder = null;
      (window as any).__activeUtterance = null;
      if (triggerEndCallback && onEnd) onEnd();
    };

    utterance.onstart = () => {
      hasStarted = true;
      if (startWatchdogTimer) clearTimeout(startWatchdogTimer);
      if (fallbackTimeoutTimer) clearTimeout(fallbackTimeoutTimer);
      if (onStart) onStart();

      // Chrome keep-alive: pause and resume every 7s during long utterances
      if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);
      speechKeepAliveInterval = setInterval(() => {
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 7000);
    };

    utterance.onend = () => {
      safeEnd(true);
    };

    utterance.onerror = (err) => {
      const isCancellation = err?.error === "canceled" || err?.error === "interrupted";
      if (!isCancellation) {
        console.warn("Speech synthesis notice:", err);
      }
      if (onError) onError(err);
      // If canceled, do not re-trigger onEnd listening loop
      safeEnd(!isCancellation);
    };

    // Calculate maximum duration based on word count
    const wordCount = cleanText.split(/\s+/).length;
    const maxSec = Math.max(5, Math.ceil(wordCount / 2.0) + 3);
    setTimeout(() => {
      if (!hasEnded && activeUtteranceHolder === utterance) {
        safeEnd(true);
      }
    }, maxSec * 1000);

    // Fast watchdog: wake Chrome speech queue within 40ms if stalled
    startWatchdogTimer = setTimeout(() => {
      if (!hasStarted && activeUtteranceHolder === utterance) {
        try {
          if (window.speechSynthesis.paused || window.speechSynthesis.pending) {
            window.speechSynthesis.resume();
          }
        } catch (e) {}
      }
    }, 40);

    // Hard fallback timeout for mobile & slow TTS engines
    fallbackTimeoutTimer = setTimeout(() => {
      if (!hasStarted && activeUtteranceHolder === utterance) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
        safeEnd(true);
      }
    }, 6000);

    // IMMEDIATE ZERO-LATENCY SPEECH DISPATCH:
    // If speaking or pending, cancel cleanly with 60ms delay so Blink IPC doesn't drop the new utterance
    const isActivelySpeaking = window.speechSynthesis.speaking || window.speechSynthesis.pending;

    const triggerSpeak = () => {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {
        console.warn("Speech synthesis trigger error:", e);
        safeEnd(true);
      }
    };

    if (isActivelySpeaking) {
      try {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}
      setTimeout(triggerSpeak, 60);
    } else {
      triggerSpeak();
    }

    return utterance;
  } catch (e) {
    console.warn("speakWithVoice initialization error:", e);
    if (onEnd) onEnd();
    return null;
  }
}

