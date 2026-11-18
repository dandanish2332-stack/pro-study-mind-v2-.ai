import React, { useMemo } from "react";
import katex from "katex";

interface MathFormulaRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

/**
 * Converts common pseudo-math or plain text formulas to standard LaTeX
 * if not already formatted with LaTeX backslashes or dollar signs.
 */
function cleanAndConvertFormulaToLatex(text: string): string {
  if (!text) return "";

  // If already contains typical LaTeX commands, return trimmed
  if (text.includes("\\frac") || text.includes("\\sqrt") || text.includes("\\int") || text.includes("\\sum")) {
    return text;
  }

  let converted = text;

  // Replace common unicode math symbols with LaTeX commands
  converted = converted
    .replace(/±/g, "\\pm ")
    .replace(/×/g, "\\times ")
    .replace(/÷/g, "\\div ")
    .replace(/≠/g, "\\neq ")
    .replace(/≤/g, "\\le ")
    .replace(/≥/g, "\\ge ")
    .replace(/≈/g, "\\approx ")
    .replace(/∞/g, "\\infty ")
    .replace(/→/g, "\\to ")
    .replace(/⇌/g, "\\rightleftharpoons ")
    .replace(/α/g, "\\alpha ")
    .replace(/β/g, "\\beta ")
    .replace(/γ/g, "\\gamma ")
    .replace(/δ/g, "\\delta ")
    .replace(/Δ/g, "\\Delta ")
    .replace(/θ/g, "\\theta ")
    .replace(/λ/g, "\\lambda ")
    .replace(/μ/g, "\\mu ")
    .replace(/π/g, "\\pi ")
    .replace(/σ/g, "\\sigma ")
    .replace(/ω/g, "\\omega ")
    .replace(/Ω/g, "\\Omega ")
    .replace(/ε₀/g, "\\varepsilon_0 ")
    .replace(/ε/g, "\\varepsilon ");

  // Handle common square root patterns: √(expr) or sqrt(expr)
  converted = converted.replace(/√\(([^)]+)\)/g, "\\sqrt{$1}");
  converted = converted.replace(/sqrt\(([^)]+)\)/gi, "\\sqrt{$1}");
  converted = converted.replace(/√([a-zA-Z0-9]+)/g, "\\sqrt{$1}");

  // Superscript unicode digits to LaTeX power: ², ³, ⁴, ⁻¹, etc.
  converted = converted
    .replace(/²/g, "^{2}")
    .replace(/³/g, "^{3}")
    .replace(/⁴/g, "^{4}")
    .replace(/⁵/g, "^{5}")
    .replace(/⁶/g, "^{6}")
    .replace(/⁷/g, "^{7}")
    .replace(/⁸/g, "^{8}")
    .replace(/⁹/g, "^{9}")
    .replace(/⁰/g, "^{0}")
    .replace(/⁻¹/g, "^{-1}")
    .replace(/⁻²/g, "^{-2}")
    .replace(/⁻³/g, "^{-3}")
    .replace(/⁻⁴/g, "^{-4}")
    .replace(/⁻⁵/g, "^{-5}")
    .replace(/⁻⁶/g, "^{-6}")
    .replace(/⁻⁷/g, "^{-7}")
    .replace(/⁻⁸/g, "^{-8}")
    .replace(/⁻⁹/g, "^{-9}")
    .replace(/⁻/g, "^{-}");

  // Subscript unicode digits: ₀, ₁, ₂, etc.
  converted = converted
    .replace(/₀/g, "_0")
    .replace(/₁/g, "_1")
    .replace(/₂/g, "_2")
    .replace(/₃/g, "_3")
    .replace(/₄/g, "_4")
    .replace(/₅/g, "_5")
    .replace(/₆/g, "_6")
    .replace(/₇/g, "_7")
    .replace(/₈/g, "_8")
    .replace(/₉/g, "_9");

  // Common fraction patterns: (1/2) -> \frac{1}{2}
  converted = converted.replace(/\(1\/2\)/g, "\\frac{1}{2}");
  converted = converted.replace(/\(1\/3\)/g, "\\frac{1}{3}");
  converted = converted.replace(/\(1\/4\)/g, "\\frac{1}{4}");
  converted = converted.replace(/\(3\/4\)/g, "\\frac{3}{4}");
  converted = converted.replace(/1\/2\s*/g, "\\frac{1}{2} ");
  converted = converted.replace(/1\/3\s*/g, "\\frac{1}{3} ");
  converted = converted.replace(/1\/4\s*/g, "\\frac{1}{4} ");

  return converted;
}

/**
 * Single formula renderer component using KaTeX
 */
export const MathExpression: React.FC<{
  math: string;
  displayMode?: boolean;
  className?: string;
}> = ({ math, displayMode = false, className = "" }) => {
  const html = useMemo(() => {
    try {
      const cleanMath = cleanAndConvertFormulaToLatex(math);
      return katex.renderToString(cleanMath, {
        displayMode,
        throwOnError: false,
        strict: false,
      });
    } catch (err) {
      // Fallback: sanitized text
      return `<span class="font-mono text-indigo-500">${math}</span>`;
    }
  }, [math, displayMode]);

  return (
    <span
      className={`katex-render-container ${displayMode ? "block my-2.5 overflow-x-auto py-1" : "inline-block align-middle mx-0.5"} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * Universal text renderer that splits text containing $...$ or $$...$$
 * or LaTeX blocks and renders regular text alongside formatted KaTeX math equations.
 */
export const MathFormulaRenderer: React.FC<MathFormulaRendererProps> = ({
  content,
  className = "",
  inline = false,
}) => {
  const parts = useMemo(() => {
    if (!content) return [];

    // Check if the string has math blocks ($$..$$ or $..$)
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    const tokens = content.split(mathRegex);

    return tokens.map((token, index) => {
      if (token.startsWith("$$") && token.endsWith("$$")) {
        const math = token.slice(2, -2).trim();
        return {
          id: index,
          isMath: true,
          displayMode: true,
          math,
        };
      } else if (token.startsWith("$") && token.endsWith("$") && token.length > 2) {
        const math = token.slice(1, -1).trim();
        return {
          id: index,
          isMath: true,
          displayMode: false,
          math,
        };
      }

      // Check if this chunk is itself an obvious pure equation (like "v_f = v_i + at" or "E = mc^2")
      // Only do this if it contains equation signs and mathematical operators without being a long text sentence
      const isShortFormula =
        !token.includes("\n") &&
        token.length < 90 &&
        /=|<|>|≤|≥|\\frac|\\sqrt|\^|_|\+|-|\*|\//.test(token) &&
        !token.toLowerCase().includes(" because ") &&
        !token.toLowerCase().includes(" according to ") &&
        !token.toLowerCase().includes(" where ") &&
        token.trim().length > 2;

      // If it looks like a formula with special symbols, convert it directly
      if (
        token.includes("\\frac") ||
        token.includes("\\sqrt") ||
        token.includes("^{") ||
        token.includes("_{") ||
        (token.includes("²") && token.includes("=")) ||
        (token.includes("³") && token.includes("=")) ||
        (token.includes("√") && token.includes("="))
      ) {
        return {
          id: index,
          isMath: true,
          displayMode: false,
          math: token.trim(),
        };
      }

      return {
        id: index,
        isMath: false,
        text: token,
      };
    });
  }, [content]);

  if (inline) {
    return (
      <span className={className}>
        {parts.map((p) =>
          p.isMath ? (
            <MathExpression
              key={p.id}
              math={p.math || ""}
              displayMode={p.displayMode}
            />
          ) : (
            <span key={p.id}>{p.text}</span>
          )
        )}
      </span>
    );
  }

  return (
    <div className={className}>
      {parts.map((p) =>
        p.isMath ? (
          <MathExpression
            key={p.id}
            math={p.math || ""}
            displayMode={p.displayMode}
          />
        ) : (
          <span key={p.id}>{p.text}</span>
        )
      )}
    </div>
  );
};

/**
 * Formula Card Component for dedicated Cheatsheets and Solved Numerical Formulas
 */
export interface FormulaCardProps {
  title: string;
  subject: string;
  grade: string;
  formulaLatex: string;
  description?: string;
  variables?: { symbol: string; meaning: string; unit?: string }[];
  derivationSteps?: string[];
  example?: string;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  title,
  subject,
  grade,
  formulaLatex,
  description,
  variables,
  derivationSteps,
  example,
}) => {
  const [copied, setCopied] = React.useState(false);
  const [showDerivation, setShowDerivation] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formulaLatex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {subject}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {grade}
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
        </div>

        <button
          onClick={handleCopy}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors"
          title="Copy LaTeX formula"
        >
          {copied ? "Copied! ✓" : "Copy"}
        </button>
      </div>

      {/* Prominently Rendered Math Equation */}
      <div className="my-3 p-3.5 rounded-xl bg-indigo-50/50 dark:bg-slate-950/80 border border-indigo-100 dark:border-indigo-950 flex items-center justify-center overflow-x-auto text-indigo-950 dark:text-indigo-200 text-base sm:text-lg">
        <MathExpression math={formulaLatex} displayMode={true} />
      </div>

      {description && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
          {description}
        </p>
      )}

      {/* Variables breakdown with symbols, meanings, and units */}
      {variables && variables.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Terms & Physical Units:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {variables.map((v, i) => (
              <div key={i} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  <MathExpression math={v.symbol} />:
                </span>
                <span className="truncate">{v.meaning}</span>
                {v.unit && (
                  <span className="text-[10px] text-slate-400">({v.unit})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Step-by-Step Derivation Toggle */}
      {derivationSteps && derivationSteps.length > 0 && (
        <div className="mt-3 pt-2">
          <button
            onClick={() => setShowDerivation(!showDerivation)}
            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            {showDerivation ? "Hide Step-by-Step Proof ▲" : "View Step-by-Step Derivation ▼"}
          </button>

          {showDerivation && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs animate-fadeIn">
              {derivationSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-indigo-500 shrink-0">Step {idx + 1}:</span>
                  <div className="flex-1">
                    <MathFormulaRenderer content={step} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {example && (
        <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-[11px] text-emerald-900 dark:text-emerald-300">
          <span className="font-bold">Exam Example: </span>
          <MathFormulaRenderer content={example} inline />
        </div>
      )}
    </div>
  );
};
