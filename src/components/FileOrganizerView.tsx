import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  Search,
  Tag,
  Download,
  Trash2,
  Lock,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Image,
  AlertCircle,
  FileCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { FileItem, FileCategory } from "../types";
import { exportToCSV, exportReportToPDF } from "../utils/export";

export const FileOrganizerView: React.FC = () => {
  const {
    files,
    addFile,
    deleteFile,
    summaryReport,
    generateAISummaryReport,
    isGeneratingReport,
    tr,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [newFileName, setNewFileName] = useState("");
  const [newFileSnippet, setNewFileSnippet] = useState("");
  const [newFileCategory, setNewFileCategory] = useState<FileCategory>("document");
  const [isEncryptedFile, setIsEncryptedFile] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDroppedFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    Array.from(fileList).forEach((f) => {
      let category: FileCategory = "document";
      const nameLower = f.name.toLowerCase();
      if (nameLower.endsWith(".pdf")) category = "pdf";
      else if (nameLower.endsWith(".xlsx") || nameLower.endsWith(".csv") || nameLower.endsWith(".xls")) category = "spreadsheet";
      else if (nameLower.endsWith(".ts") || nameLower.endsWith(".js") || nameLower.endsWith(".py") || nameLower.endsWith(".json") || nameLower.endsWith(".html")) category = "code";
      else if (nameLower.endsWith(".png") || nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg") || nameLower.endsWith(".svg") || nameLower.endsWith(".webp")) category = "image";

      const newFile: FileItem = {
        id: "f-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
        name: f.name,
        size: f.size || 1024 * 150,
        mimeType: f.type || "application/octet-stream",
        category,
        tags: ["upload", category, "verified"],
        uploadDate: new Date().toISOString(),
        contentSnippet: `File uploaded from device: ${f.name} (${Math.round((f.size || 1000) / 1024)} KB).`,
        isEncrypted: isEncryptedFile,
        summary: `Imported file ${f.name}. Categorized as ${category} with zero-knowledge AES-256 protection.`,
        keyInsights: ["Local workspace document", "Cross-device synced"],
        urgencyScore: 4,
      };
      addFile(newFile);
    });
  };

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
      f.contentSnippet.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleManualUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const newFile: FileItem = {
      id: "f-" + Date.now(),
      name: newFileName.trim(),
      size: Math.floor(Math.random() * 2000000) + 500000,
      mimeType: "application/octet-stream",
      category: newFileCategory,
      tags: ["personal", newFileCategory],
      uploadDate: new Date().toISOString(),
      contentSnippet: newFileSnippet || "Uploaded personal document content.",
      isEncrypted: isEncryptedFile,
      summary: `AI snippet summary for ${newFileName}. File categorized under ${newFileCategory}.`,
      keyInsights: ["Contains confidential personal data", "Zero-knowledge encrypted"],
      urgencyScore: 5,
    };

    addFile(newFile);
    setNewFileName("");
    setNewFileSnippet("");
  };

  const handleExportFilesCSV = () => {
    const headers = ["ID", "File Name", "Category", "Size (KB)", "Upload Date", "Encrypted", "Summary"];
    const rows = files.map((f) => [
      f.id,
      f.name,
      f.category,
      Math.round(f.size / 1024),
      f.uploadDate,
      f.isEncrypted ? "Yes (AES-256)" : "No",
      f.summary || f.contentSnippet,
    ]);
    exportToCSV("Study_Files_Manifest", headers, rows);
  };

  const handleExportPDF = () => {
    exportReportToPDF("Study Files & Document Summary Report", [
      {
        heading: "Study Files Analysis Executive Summary",
        lines: [
          summaryReport?.executiveSummary ||
            `Analyzed ${files.length} study files across textbook chapters, assignments, and exam review guides.`,
        ],
      },
      {
        heading: "Category Insights & Topics",
        lines: (summaryReport?.categoryBreakdown || []).map(
          (c) => `${c.category}: ${c.count} items. ${c.insights}`
        ),
      },
      {
        heading: "Key Study Directives & Action Items",
        lines: summaryReport?.actionItems || ["Review formula sheet before test", "Complete practice questions"],
      },
    ]);
  };

  const getCategoryIcon = (category: FileCategory) => {
    switch (category) {
      case "spreadsheet":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case "code":
        return <FileCode className="w-5 h-5 text-indigo-500" />;
      case "image":
        return <Image className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Study Notes, Files & AI Document Summarizer
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload, organize, and auto-summarize study guides, textbook chapters, and exam materials with AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={generateAISummaryReport}
            disabled={isGeneratingReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            {isGeneratingReport ? "Analyzing Files..." : "Run AI File Analysis"}
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" /> PDF Report
          </button>
          <button
            onClick={handleExportFilesCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" /> CSV Manifest
          </button>
        </div>
      </div>

      {/* AI Summary Report Display Card */}
      {summaryReport && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 border border-indigo-800/80 text-slate-100 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-800/60">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-cyan-300" />
              <h3 className="text-sm font-bold text-white">Latest AI File Summary Report</h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-300 bg-indigo-900/60 px-2.5 py-1 rounded-full border border-indigo-700">
              {summaryReport.generatedAt}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <p className="font-bold uppercase text-cyan-400 text-[11px]">Executive Summary</p>
              <p className="text-slate-300 leading-relaxed">{summaryReport.executiveSummary}</p>
            </div>

            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <p className="font-bold uppercase text-rose-400 text-[11px]">Risk & Urgency Assessment</p>
              <p className="text-slate-300 leading-relaxed">{summaryReport.riskAudit}</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload & Search Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-500" /> Upload Personal File
          </h3>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              handleDroppedFiles(e.dataTransfer.files);
            }}
            className={`relative p-5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
              isDraggingOver
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                : "border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/60 hover:border-indigo-400"
            }`}
          >
            <input
              type="file"
              multiple
              id="file-drop-input"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={(e) => handleDroppedFiles(e.target.files)}
            />
            <UploadCloud className="w-7 h-7 mx-auto mb-1 text-indigo-500 animate-bounce" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Drag & drop files here or <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX, CSV, XLSX, Code, PNG (Auto-AES-256)</p>
          </div>

          <form onSubmit={handleManualUpload} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">File Name</label>
              <input
                type="text"
                required
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="e.g. Q4_Tax_Receipts.pdf"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Category</label>
                <select
                  value={newFileCategory}
                  onChange={(e) => setNewFileCategory(e.target.value as FileCategory)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                >
                  <option value="document">Document</option>
                  <option value="pdf">PDF</option>
                  <option value="spreadsheet">Spreadsheet</option>
                  <option value="code">Code</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Encryption</label>
                <button
                  type="button"
                  onClick={() => setIsEncryptedFile(!isEncryptedFile)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    isEncryptedFile
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isEncryptedFile ? "AES-256 Encrypted" : "Plaintext"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">Content / Notes</label>
              <textarea
                rows={2}
                value={newFileSnippet}
                onChange={(e) => setNewFileSnippet(e.target.value)}
                placeholder="Key details or content snippet for AI to summarize..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              + Upload & Auto-Summarize
            </button>
          </form>
        </div>

        {/* Files List Table / Grid */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search files by name, tags, or content..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="document">Documents</option>
              <option value="pdf">PDFs</option>
              <option value="spreadsheet">Spreadsheets</option>
              <option value="image">Images</option>
            </select>
          </div>

          {/* List items */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No files match your filter</p>
              </div>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {getCategoryIcon(file.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{file.name}</h4>
                          {file.isEncrypted && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> AES-256
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(file.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteFile(file.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AI Summary snippet */}
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300">
                    <p className="font-semibold text-indigo-600 dark:text-indigo-400 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Summary & Insights:
                    </p>
                    <p>{file.summary || file.contentSnippet}</p>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {file.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
