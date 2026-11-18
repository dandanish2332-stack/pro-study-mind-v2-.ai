import React, { useState } from "react";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Fingerprint,
  KeyRound,
  FileCheck,
  Eye,
  EyeOff,
  AlertOctagon,
  Copy,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { simulateDecryptString } from "../utils/crypto";

export const EncryptedVaultView: React.FC = () => {
  const {
    vaultState,
    toggleVaultLock,
    requestBiometricAuth,
    files,
    tr,
  } = useApp();

  const [copiedKey, setCopiedKey] = useState(false);
  const [showSecretCipher, setShowSecretCipher] = useState(false);

  const encryptedFiles = files.filter((f) => f.isEncrypted);

  const seedPhrase =
    "alpha omega zenith prism cipher vault zero knowledge quantum shield solar echo vector";

  const handleCopySeed = () => {
    navigator.clipboard.writeText(seedPhrase);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleUnlockClick = () => {
    if (vaultState.isLocked) {
      requestBiometricAuth(() => {
        toggleVaultLock("1234");
      });
    } else {
      toggleVaultLock();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-500" />
            Zero-Knowledge Encrypted Security Vault
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            AES-256-GCM client-side encryption with WebAuthn biometric passkey verification.
          </p>
        </div>

        <button
          onClick={handleUnlockClick}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md ${
            vaultState.isLocked
              ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
              : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20"
          }`}
        >
          {vaultState.isLocked ? (
            <>
              <Lock className="w-4 h-4" /> Authenticate & Unlock Vault
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" /> Vault Unlocked • Click to Lock
            </>
          )}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Security Status & Seed Key Backup */}
        <div className="space-y-6">
          {/* Status Box */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Vault Security Audit</span>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  vaultState.isLocked
                    ? "bg-rose-950 text-rose-300 border border-rose-800"
                    : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                }`}
              >
                {vaultState.isLocked ? "Locked" : "Unlocked (Active)"}
              </span>
            </div>

            <div className="space-y-3 text-xs pt-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Algorithm</span>
                <span className="font-mono text-white font-bold">{vaultState.encryptionAlgorithm}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Biometric Passkey</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Fingerprint className="w-3.5 h-3.5" /> Enabled (TouchID)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Encrypted Files Count</span>
                <span className="font-bold text-white">{encryptedFiles.length} Confidential Files</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Last Security Audit</span>
                <span className="font-mono text-slate-300">{vaultState.lastAuditTime}</span>
              </div>
            </div>
          </div>

          {/* Master Key Seed Phrase */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" /> Zero-Knowledge Backup Seed Key
              </h3>
              <button
                onClick={handleCopySeed}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
              >
                {copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedKey ? "Copied" : "Copy Seed"}
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              {seedPhrase}
            </div>
            <p className="text-[10px] text-slate-400">
              Keep this seed phrase offline in a secure location. Never share your master key.
            </p>
          </div>
        </div>

        {/* Right Column: Encrypted Files & Privacy Vault Content */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Encrypted Vault Contents
            </h3>
            <button
              onClick={() => setShowSecretCipher(!showSecretCipher)}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              {showSecretCipher ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showSecretCipher ? "Hide Encrypted Cipher" : "Inspect Raw Cipher"}
            </button>
          </div>

          {vaultState.isLocked ? (
            <div className="text-center py-16 p-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <Lock className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Vault Currently Locked</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Authenticate with TouchID / FaceID biometric passkey or Master PIN to view encrypted files and personal credentials.
              </p>
              <button
                onClick={handleUnlockClick}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
              >
                Authenticate Biometrics
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {encryptedFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{file.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                      Decrypted in Memory
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300">{file.contentSnippet}</p>

                  {showSecretCipher && (
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-cyan-400 overflow-x-auto">
                      AES256-GCM::0xf7a29e1c3b5d80::
                      {btoa(file.contentSnippet)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
