import jsPDF from "jspdf";
import { StudentPDFDocument } from "../types";

/**
 * Converts LaTeX formulas to clean human-readable text for PDF rendering
 */
function cleanMathForPdf(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // Strip markdown bold
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    .replace(/\\implies\b/g, "⇒")
    .replace(/\\iff\b/g, "⇔")
    .replace(/\\to\b/g, "→")
    .replace(/\\longleftrightarrow\b/g, "⟷")
    .replace(/\\rightleftharpoons\b/g, "⇌")
    .replace(/\\left\(/g, "(")
    .replace(/\\right\)/g, ")")
    .replace(/\\left\[/g, "[")
    .replace(/\\right\]/g, "]")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "($2)^(1/$1)")
    .replace(/\\pm\b/g, "±")
    .replace(/\\propto\b/g, "∝")
    .replace(/\\cdot\b/g, "·")
    .replace(/\\times\b/g, "×")
    .replace(/\\div\b/g, "÷")
    .replace(/\\pi\b/g, "π")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\lambda\b/g, "λ")
    .replace(/\\Delta\b/g, "Δ")
    .replace(/\\nabla\b/g, "∇")
    .replace(/\\partial\b/g, "∂")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\neq\b|\\ne\b/g, "≠")
    .replace(/\\le\b|\\leq\b/g, "≤")
    .replace(/\\ge\b|\\geq\b/g, "≥")
    .replace(/\\in\b/g, "∈")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\rho\b/g, "ρ")
    .replace(/\\omega\b/g, "ω")
    .replace(/\\Phi\b/g, "Φ")
    .replace(/\\varepsilon_0\b/g, "ε₀")
    .replace(/\\varepsilon\b/g, "ε")
    .replace(/\\mu_0\b/g, "μ₀")
    .replace(/\\int\b/g, "∫")
    .replace(/\\sum\b/g, "Σ")
    .replace(/\\infty\b/g, "∞")
    .replace(/\\circ\b/g, "°")
    .replace(/\\degree\b/g, "°")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\mathrm\{([^}]+)\}/g, "$1")
    .replace(/\\vec\{([^}]+)\}/g, "$1")
    .replace(/\\bold\{([^}]+)\}/g, "$1")
    .replace(/\\text\{([^}]+)\}/g, "$1")
    .replace(/\\Big\||\\big\|/g, "|")
    .replace(/\\quad|\\qquad/g, "   ")
    .replace(/\\binom\{([^}]+)\}\{([^}]+)\}/g, "C($1,$2)")
    .replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, "[$1]")
    .replace(/\\\\/g, ", ")
    .replace(/&/g, " ")
    .replace(/\^2\b/g, "²")
    .replace(/\^3\b/g, "³")
    .replace(/\^\{([^}]+)\}/g, "^($1)")
    .replace(/_\{([^}]+)\}/g, "_$1")
    .replace(/\\/g, "");
}

/**
 * Generates a clean, professional, multi-page PDF document using jsPDF
 * formatted specifically for academic study and local student files.
 */
export function generateStudentPDF(docData: StudentPDFDocument, studentName?: string): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178mm
  let currentY = margin;

  const title = docData?.title || "Academic Study Notes";
  const subject = docData?.subject || "General";
  const grade = docData?.grade || "All Levels";
  const category = (docData?.category || "Complete Study Guide").toUpperCase();
  const description = docData?.description || "";
  const sections = Array.isArray(docData?.sections) ? docData.sections : [];

  // Helper for page numbers and header
  const totalPagesExp = "{total_pages_count_string}";

  const drawPageDecoration = (pageNum: number) => {
    // Top subtle rule & mini header on pages > 1
    if (pageNum > 1) {
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(title, margin, 10);
      doc.text(`${subject} • ${grade}`, pageWidth - margin, 10, { align: "right" });

      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    // Bottom footer on every page
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Pro Study Mind v2.0 • Student Academic Resource Library", margin, pageHeight - 7);
    
    // Page count
    const pageString = `Page ${pageNum}`;
    doc.text(pageString, pageWidth - margin, pageHeight - 7, { align: "right" });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 20) {
      doc.addPage();
      currentY = 18;
      const pageCount = (doc.internal as any).getNumberOfPages();
      drawPageDecoration(pageCount);
    }
  };

  // --- PAGE 1: HEADER & TITLE BLOCK ---
  drawPageDecoration(1);

  // Decorative Subject Header Ribbon
  const cleanTitleForHeader = cleanMathForPdf(title);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  const titleLines = doc.splitTextToSize(cleanTitleForHeader, contentWidth - 12);
  const ribbonHeight = Math.max(22, 12 + titleLines.length * 5.5);

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, currentY, contentWidth, ribbonHeight, 3, 3, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(99, 102, 241); // indigo-500
  doc.text(category, margin + 6, currentY + 6.5);

  doc.setFontSize(titleLines.length > 2 ? 11 : 12.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(titleLines, margin + 6, currentY + 13.5);

  currentY += ribbonHeight + 4;

  // Metadata Card / Bar
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, 14, 2, 2, "FD");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105); // slate-600

  const metaText1 = `Subject: ${subject}`;
  const metaText2 = `Grade: ${grade}`;
  const metaText3 = `Date: ${new Date().toLocaleDateString()}`;
  const metaText4 = studentName ? `Student: ${studentName}` : `Verified Study Material`;

  doc.text(metaText1, margin + 4, currentY + 9);
  doc.text(metaText2, margin + 45, currentY + 9);
  doc.text(metaText3, margin + 95, currentY + 9);
  doc.text(metaText4, margin + 135, currentY + 9);

  currentY += 19;

  // Description / Objective Box
  if (description) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(71, 85, 105);
    const splitDesc = doc.splitTextToSize(`Overview: ${description}`, contentWidth);
    doc.text(splitDesc, margin, currentY);
    currentY += splitDesc.length * 4.5 + 4;
  }

  // Divider
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 7;

  // --- RENDER SECTIONS ---
  sections.forEach((sec, sIdx) => {
    checkPageBreak(25);

    // Section Number & Heading
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, currentY - 2, contentWidth, 8, 1.5, 1.5, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`${sIdx + 1}. ${sec.heading || "Section"}`, margin + 3, currentY + 3.5);
    currentY += 10;

    if (sec.subheading) {
      checkPageBreak(12);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text(sec.subheading, margin + 2, currentY);
      currentY += 5;
    }

    // Paragraphs / Content lines
    const paragraphs = Array.isArray(sec.content) ? sec.content : [String(sec.content || "")];
    paragraphs.forEach((paragraph) => {
      checkPageBreak(15);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(51, 65, 85); // slate-700

      const isBullet = paragraph.trim().startsWith("•") || paragraph.trim().startsWith("-");
      const cleanPara = cleanMathForPdf(isBullet ? paragraph.replace(/^[-•]\s*/, "") : paragraph);
      const textX = isBullet ? margin + 5 : margin + 1;
      const availableWidth = isBullet ? contentWidth - 6 : contentWidth - 2;

      if (isBullet) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(79, 70, 229);
        doc.text("•", margin + 1.5, currentY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(51, 65, 85);
      }

      const wrapped = doc.splitTextToSize(cleanPara, availableWidth);
      doc.text(wrapped, textX, currentY);
      currentY += wrapped.length * 4.2 + 2;
    });

    // Callout boxes (Formulas, Key Definitions, Exam Tips, Practice Questions)
    if (sec.callouts && sec.callouts.length > 0) {
      sec.callouts.forEach((callout) => {
        const titleText = `${callout.type === "formula" ? "FORMULA" : callout.type === "exam_tip" ? "EXAM TIP" : callout.type === "key_definition" ? "KEY DEFINITION" : "PRACTICE QUESTION"}: ${callout.title}`;
        
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        const cleanCalloutText = cleanMathForPdf(callout.text);
        const bodyWrapped = doc.splitTextToSize(cleanCalloutText, contentWidth - 10);
        const boxHeight = 10 + bodyWrapped.length * 4 + 2;

        checkPageBreak(boxHeight + 5);

        // Styling based on callout type
        let bgColor = [248, 250, 252]; // slate-50
        let borderColor = [99, 102, 241]; // indigo-500
        let textColor = [79, 70, 229];

        if (callout.type === "formula") {
          bgColor = [240, 253, 250]; // teal-50
          borderColor = [20, 184, 166]; // teal-500
          textColor = [15, 118, 110];
        } else if (callout.type === "exam_tip") {
          bgColor = [255, 251, 235]; // amber-50
          borderColor = [245, 158, 11]; // amber-500
          textColor = [180, 83, 9];
        } else if (callout.type === "key_definition") {
          bgColor = [238, 242, 255]; // indigo-50
          borderColor = [99, 102, 241]; // indigo-500
          textColor = [67, 56, 202];
        } else if (callout.type === "practice_question") {
          bgColor = [254, 242, 242]; // rose-50
          borderColor = [244, 63, 94]; // rose-500
          textColor = [190, 18, 60];
        }

        // Callout card background
        doc.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        doc.roundedRect(margin, currentY, contentWidth, boxHeight, 2, 2, "F");

        // Accent left bar
        doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(margin, currentY, 2.5, boxHeight, "F");

        // Callout Title
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        doc.text(titleText, margin + 5, currentY + 5.5);

        // Callout Body
        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(30, 41, 59); // slate-800
        doc.text(bodyWrapped, margin + 5, currentY + 10);

        currentY += boxHeight + 4;
      });
    }

    currentY += 4;
  });

  return doc;
}

/**
 * Triggers a direct download to the user's local disk/downloads folder.
 */
export function downloadStudentPDFFile(docData: StudentPDFDocument, studentName?: string): string {
  const doc = generateStudentPDF(docData, studentName);
  const rawTitle = docData?.title || "Student_Study_Notes";
  const cleanTitle = rawTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${cleanTitle}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Generates an in-memory Data URL or Blob URL for instant live preview inside an iframe/viewer.
 */
export function getStudentPDFDataUrl(docData: StudentPDFDocument, studentName?: string): string {
  const doc = generateStudentPDF(docData, studentName);
  return doc.output("datauristring");
}
