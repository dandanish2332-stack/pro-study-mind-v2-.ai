import React, { useMemo } from "react";
import katex from "katex";

interface MathFormulaProps {
  latex: string;
  display?: boolean;
  className?: string;
}

/**
 * Humanizes any LaTeX string into clean, readable Unicode math if KaTeX fails,
 * ensuring students NEVER see raw programming/AI syntax ("ais language").
 */
export function humanizeLatex(latex: string): string {
  if (!latex) return "";
  let s = latex.trim().replace(/^[\$]+|[\$]+$/g, "");
  // Replace fractions: \frac{a}{b} -> (a / b)
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");
  // Replace radicals: \sqrt{x} -> √(x)
  s = s.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");
  // Replace multiplication and dots
  s = s.replace(/\\times/g, "×");
  s = s.replace(/\\cdot/g, "·");
  // Replace powers of ten: 10^{8} -> 10⁸, 10^{-11} -> 10⁻¹¹
  s = s.replace(/10\^\{([+-]?\d+)\}/g, "10^($1)");
  s = s.replace(/10\^([+-]?\d+)/g, "10^($1)");
  // Replace plus minus, approximately, arrows
  s = s.replace(/\\pm/g, "±");
  s = s.replace(/\\approx/g, "≈");
  s = s.replace(/\\to/g, "→");
  s = s.replace(/\\leq|\\le/g, "≤");
  s = s.replace(/\\geq|\\ge/g, "≥");
  s = s.replace(/\\neq/g, "≠");
  s = s.replace(/\\infty/g, "∞");
  // Replace Greek letters
  s = s
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\lambda/g, "λ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\gamma/g, "γ")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\delta/g, "δ")
    .replace(/\\omega/g, "ω")
    .replace(/\\mu/g, "μ")
    .replace(/\\varepsilon_0|\\varepsilon_o|\\varepsilon/g, "ε₀");
  // Remove \text{...}
  s = s.replace(/\\text\{([^}]+)\}/g, "$1");
  // Remove formatting backslashes
  s = s.replace(/\\,|\\quad|\\;|\\!/g, " ").replace(/\\/g, "");
  return s.trim();
}

/**
 * Pre-cleans raw LaTeX strings to prevent KaTeX syntax errors (e.g. unbracketed negative powers,
 * unescaped percents, \varepsilon_o, or raw asterisks).
 */
export function cleanLatexForKaTeX(latex: string): string {
  let s = latex.trim().replace(/^[\$]+|[\$]+$/g, "");
  // 1. Fix letter 'o' instead of digit '0' in epsilon_0
  s = s.replace(/\\varepsilon_o/g, "\\varepsilon_0");
  // 2. Wrap unbracketed powers: 10^-11 -> 10^{-11}, 10^8 -> 10^{8}
  s = s.replace(/\b10\^([+-]?\d+)\b/g, "10^{$1}");
  // 3. Wrap powers in variable symbols: x^2 -> x^{2}, v_i^2 -> v_i^{2}
  s = s.replace(/([a-zA-Z0-9_])\^([+-]?\d+)\b/g, "$1^{$2}");
  // 4. Convert scientific multiplication: 3 * 10 -> 3 \times 10, 3 × 10 -> 3 \times 10
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:\*|×)\s*10\^/g, "$1 \\times 10^");
  // 5. Clean standalone asterisks to center dots
  s = s.replace(/\s*\*\s*/g, " \\cdot ");
  s = s.replace(/\s*×\s*/g, " \\times ");
  // 6. Convert parenthesis fractions: (a)/(b) -> \frac{a}{b}
  s = s.replace(/\(([^)]+)\)\/\(([^)]+)\)/g, "\\frac{$1}{$2}");
  // 7. Auto-escape percent signs
  s = s.replace(/([^\\])%/g, "$1\\%");
  return s;
}

/**
 * KaTeX formula renderer with verified fallback.
 */
export const MathFormula: React.FC<MathFormulaProps> = ({
  latex,
  display = false,
  className = "",
}) => {
  const html = useMemo(() => {
    try {
      const clean = cleanLatexForKaTeX(latex);
      return katex.renderToString(clean, {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return null;
    }
  }, [latex, display]);

  if (!html) {
    const readable = humanizeLatex(latex);
    return (
      <span className={`font-semibold text-indigo-700 dark:text-indigo-300 ${className}`}>
        {readable}
      </span>
    );
  }

  return (
    <span
      className={`inline-block select-text align-middle ${
        display ? "my-2 w-full text-center overflow-x-auto py-1" : ""
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Universal math and power-of-ten formatter.
 * Automatically wraps powers of ten, fractions, scientific notation, and raw formulas into proper KaTeX $...$ tokens
 * so students never encounter raw programming codes or unformatted math.
 */
export function autoFormatMathAndPowers(text: string): string {
  if (!text) return "";

  // Split out already-delimited math ($$...$$ or $...$) and markdown bold (**...**)
  const segments = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]*?\$|\*\*[^*]+\*\*)/g);

  return segments
    .map((seg) => {
      if (!seg) return "";
      // If already a delimited block, keep as-is
      if (seg.startsWith("$") || seg.startsWith("**")) return seg;

      let s = seg;

      // 1. Fractions of powers of ten: (10^8)/(10^2) or 10^8 / 10^2 -> $\frac{10^8}{10^2}$
      s = s.replace(
        /(?:\(?\b10\^\{?([+-]?\d+)\}?\)?)\s*\/\s*(?:\(?\b10\^\{?([+-]?\d+)\}?\)?)/g,
        "___POWFRAC_$1_$2___"
      );

      // 2. Scientific notation with powers of 10: 6.674 * 10^-11, 3.00 × 10^8, 6.022 × 10^23
      s = s.replace(
        /(\b\d+(?:\.\d+)?)\s*(?:[×*]|\s*\\times\s*|\s*\\cdot\s*)\s*10\^\{?([+-]?\d+)\}?/g,
        "___SCINOT_$1_$2___"
      );

      // 3. Isolated powers of 10: 10^-11, 10^8, 10^23, 10^-7, 10^-34, 10^-19
      s = s.replace(
        /(?<![a-zA-Z0-9_])10\^\{?([+-]?\d+)\}?(?![a-zA-Z0-9_])/g,
        "___POWTEN_$1___"
      );

      // 4. Standalone numeric fractions: 1/2, 3/4, 2/3, 1/4, 1/3, 1/6, 1/8, 20/10
      s = s.replace(
        /(?:^|(?<=\s|\())(1\/2|1\/3|1\/4|3\/4|2\/3|1\/6|1\/8|20\/10)(?=\s|[.,;)]|$)/g,
        "___NUMFRAC_$1___"
      );

      // 5. Common physical units with powers: m/s^2, kg/m^3, cm^3, cm^2, m^3, m^2
      s = s.replace(/\b([cmk]?m)\/s\^2\b/g, "$\\text{$1/s}^2$");
      s = s.replace(/\bkg\/m\^3\b/g, "$\\text{kg/m}^3$");
      s = s.replace(/\b([cmk]?m)\^([23])\b/g, "$\\text{$1}^{$2}$");

      // 6. Raw standalone LaTeX commands lacking dollar signs: \frac{a}{b}, \sqrt{x}, \lim, \int, \det, \sum
      s = s.replace(
        /(\\(?:frac|sqrt|lim|int|sum|det|to|pm)\b[^{}]*(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*)/g,
        (m) => `$${m.trim()}$`
      );

      // Unpack placeholders using clean replacer functions (avoiding JS $$ string escaping)
      s = s.replace(
        /___POWFRAC_([^_]+)_([^_]+)___/g,
        (_, num, den) => `$\\frac{10^{${num}}}{10^{${den}}}$`
      );
      s = s.replace(
        /___SCINOT_([^_]+)_([^_]+)___/g,
        (_, coeff, exp) => `$${coeff} \\times 10^{${exp}}$`
      );
      s = s.replace(/___POWTEN_([^_]+)___/g, (_, exp) => `$10^{${exp}}$`);
      s = s.replace(/___NUMFRAC_([^_]+)___/g, (_, f) => {
        const [n, d] = f.split("/");
        return `$\\frac{${n}}{${d}}$`;
      });

      return s;
    })
    .join("");
}

/**
 * Intelligent math and textbook text formatter.
 * Processes inline math `$..$`, block math `$$..$$`, markdown `**bold**`,
 * and plain-text scientific notation or fractions into beautiful KaTeX representation.
 */
export const FormattedMathText: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = "" }) => {
  if (!text) return null;

  // 1. Pre-format powers of ten, fractions, and raw LaTeX commands
  const processedText = autoFormatMathAndPowers(text);

  // 2. Tokenize into math ($$...$$ or $...$), bold (**...**), and regular text
  const parts = processedText.split(/(\$\$[\s\S]*?\$\$|\$[^\$]*?\$|\*\*[^*]+\*\*)/g);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;

        if (part.startsWith("$$") && part.endsWith("$$")) {
          const rawLatex = part.slice(2, -2);
          return <MathFormula key={idx} latex={rawLatex} display={true} />;
        }

        if (part.startsWith("$") && part.endsWith("$")) {
          const rawLatex = part.slice(1, -1);
          return <MathFormula key={idx} latex={rawLatex} display={false} />;
        }

        if (part.startsWith("**") && part.endsWith("**")) {
          const boldContent = part.slice(2, -2);
          return (
            <strong key={idx} className="font-extrabold text-slate-900 dark:text-slate-100">
              {boldContent}
            </strong>
          );
        }

        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};

/**
 * Converts standard plain-text math formulas into standard LaTeX notation.
 */
export function convertTextToLatex(raw: string): string {
  let s = raw.trim();

  // Chemical formulas special case
  if (s.includes("->") && (s.includes("CO2") || s.includes("H2O") || s.includes("C6H12O6"))) {
    return s
      .replace(/CO2/g, "\\text{CO}_2")
      .replace(/H2O/g, "\\text{H}_2\\text{O}")
      .replace(/C6H12O6/g, "\\text{C}_6\\text{H}_{12}\\text{O}_6")
      .replace(/O2/g, "\\text{O}_2")
      .replace(/->/g, "\\to ");
  }

  // Common physics & math equations
  s = s
    .replace(/x\s*=\s*\(-b\s*\+-\s*sqrt\(b\^2\s*-\s*4ac\)\)\s*\/\s*\(?2a\)?/gi, "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}")
    .replace(/\(-b\s*\+-\s*sqrt\(b\^2\s*-\s*4ac\)\)\s*\/\s*\(?2a\)?/gi, "\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}")
    .replace(/v_f\s*=\s*v_i\s*\+\s*at/g, "v_f = v_i + at")
    .replace(/S\s*=\s*v_i\s*\*?\s*t\s*\+\s*1\/2\s*\*?\s*a\s*\*?\s*t\^2/gi, "S = v_i t + \\frac{1}{2}at^2")
    .replace(/S\s*=\s*v_i\s*t\s*\+\s*\(1\/2\)\s*a\s*t\^2/gi, "S = v_i t + \\frac{1}{2}at^2")
    .replace(/2as\s*=\s*v_f\^2\s*-\s*v_i\^2/gi, "2as = v_f^2 - v_i^2")
    .replace(/KE\s*=\s*1\/2\s*\*?\s*m\s*\*?\s*v\^2/gi, "K.E. = \\frac{1}{2}mv^2")
    .replace(/1\/2\s*\*?\s*m\s*\*?\s*v\^2/gi, "\\frac{1}{2}mv^2")
    .replace(/PE\s*=\s*m\s*\*?\s*g\s*\*?\s*h/gi, "P.E. = mgh")
    .replace(/F\s*=\s*G\s*\*?\s*\(?m1\s*\*?\s*m2\)?\s*\/\s*r\^2/gi, "F = G\\frac{m_1 m_2}{r^2}")
    .replace(/g\s*=\s*GM\s*\/\s*R\^2/gi, "g = \\frac{GM}{R^2}")
    .replace(/P\s*=\s*F\s*\/\s*A/gi, "P = \\frac{F}{A}")
    .replace(/w\s*=\s*m\s*\*?\s*g/gi, "w = mg")
    .replace(/F\s*=\s*m\s*\*?\s*a/gi, "F = ma")
    .replace(/W\s*=\s*F\s*\*?\s*d\s*\*?\s*cos\(?theta\)?/gi, "W = F \\cdot d \\cos\\theta")
    .replace(/P\s*=\s*W\s*\/\s*t/gi, "P = \\frac{W}{t}")
    .replace(/V\s*=\s*I\s*\*?\s*R/gi, "V = IR")
    .replace(/P\s*=\s*V\s*\*?\s*I\s*=\s*I\^2\s*\*?\s*R/gi, "P = VI = I^2R")
    .replace(/F\s*=\s*k\s*\*?\s*\(?q1\s*\*?\s*q2\)?\s*\/\s*r\^2/gi, "F = k\\frac{q_1 q_2}{r^2}")
    .replace(/rho\s*=\s*m\s*\/\s*V/gi, "\\rho = \\frac{m}{V}")
    .replace(/P1V1\s*=\s*P2V2/gi, "P_1V_1 = P_2V_2")
    .replace(/PV\s*=\s*nRT/gi, "PV = nRT")
    .replace(/V1\/T1\s*=\s*V2\/T2/gi, "\\frac{V_1}{T_1} = \\frac{V_2}{T_2}")
    .replace(/sin\^2\s*\(?theta\)?\s*\+\s*cos\^2\s*\(?theta\)?\s*=\s*1/gi, "\\sin^2\\theta + \\cos^2\\theta = 1")
    .replace(/1\s*\+\s*tan\^2\s*\(?theta\)?\s*=\s*sec\^2\s*\(?theta\)?/gi, "1 + \\tan^2\\theta = \\sec^2\\theta")
    .replace(/A\s*=\s*pi\s*\*?\s*r\^2/gi, "A = \\pi r^2")
    .replace(/C\s*=\s*2\s*\*?\s*pi\s*\*?\s*r/gi, "C = 2\\pi r")
    .replace(/a\^2\s*\+\s*b\^2\s*=\s*c\^2/gi, "a^2 + b^2 = c^2")
    .replace(/T\s*=\s*2pi\s*\*?\s*sqrt\(l\/g\)/gi, "T = 2\\pi\\sqrt{\\frac{l}{g}}")
    .replace(/T\s*=\s*2pi\s*\*?\s*sqrt\(m\/k\)/gi, "T = 2\\pi\\sqrt{\\frac{m}{k}}")
    .replace(/1\/f\s*=\s*1\/p\s*\+\s*1\/q/gi, "\\frac{1}{f} = \\frac{1}{p} + \\frac{1}{q}")
    .replace(/pH\s*=\s*-log\s*\[H\+\]/gi, "\\text{pH} = -\\log[\\text{H}^+]")
    .replace(/pOH\s*=\s*-log\s*\[OH-\]/gi, "\\text{pOH} = -\\log[\\text{OH}^-]")
    .replace(/M\s*=\s*n\s*\/\s*V/gi, "M = \\frac{n}{V}")
    .replace(/n\s*=\s*m\s*\/\s*M/gi, "n = \\frac{m}{M_{mol}}")
    .replace(/E\s*=\s*m\s*\*?\s*c\^2/gi, "E = mc^2")
    .replace(/dy\/dx/gi, "\\frac{dy}{dx}")
    .replace(/ax\^2\s*\+\s*bx\s*\+\s*c\s*=\s*0/gi, "ax^2 + bx + c = 0")
    .replace(/sqrt\(([^)]+)\)/g, "\\sqrt{$1}")
    .replace(/\(([^)]+)\)\/\(([^)]+)\)/g, "\\frac{$1}{$2}")
    .replace(/\b(\d+)\/(\d+)\b/g, "\\frac{$1}{$2}")
    .replace(/\^([+-]?\d+)/g, "^{$1}")
    .replace(/_([a-zA-Z0-9]+)/g, "_{$1}")
    .replace(/\+-/g, "\\pm ")
    .replace(/\*\*/g, "^")
    .replace(/\*/g, " \\cdot ")
    .replace(/\bpi\b/gi, "\\pi ")
    .replace(/\btheta\b/gi, "\\theta ")
    .replace(/\blambda\b/gi, "\\lambda ")
    .replace(/\bDelta\b/g, "\\Delta ")
    .replace(/\bdelta\b/g, "\\delta ")
    .replace(/\bomega\b/gi, "\\omega ")
    .replace(/\bmu\b/g, "\\mu ");

  return s;
}

/**
 * Dedicated Math Card Component for high-yield formulas with proper fraction bars,
 * exponents, radicals, and variable explanations.
 */
export const MathFormulaCard: React.FC<{
  title: string;
  formula: string;
  description?: string;
  variables?: { symbol: string; meaning: string }[];
  className?: string;
}> = ({ title, formula, description, variables, className = "" }) => {
  const latex = useMemo(() => {
    if (formula.startsWith("$") || formula.includes("\\")) {
      return formula.replace(/^\$+|\$+$/g, "");
    }
    return convertTextToLatex(formula);
  }, [formula]);

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-slate-50 to-teal-50/70 dark:from-indigo-950/40 dark:via-slate-900 dark:to-teal-950/30 border border-indigo-200/80 dark:border-indigo-800/60 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="text-xs sm:text-sm font-black text-indigo-950 dark:text-indigo-200 uppercase tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          {title}
        </h4>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
          Formula
        </span>
      </div>

      {/* Primary Mathematical Display */}
      <div className="py-2.5 px-3 rounded-xl bg-white/95 dark:bg-slate-950/90 border border-indigo-100 dark:border-slate-800 flex items-center justify-center text-center overflow-x-auto shadow-inner text-slate-900 dark:text-slate-100 text-sm sm:text-base">
        <MathFormula latex={latex} display={true} />
      </div>

      {description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
          {description}
        </p>
      )}

      {variables && variables.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/60 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {variables.map((v, idx) => (
            <div key={idx} className="text-[11px] flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                <MathFormula latex={v.symbol} />
              </span>
              <span className="truncate">= {v.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
