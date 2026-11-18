import React, { useState } from "react";
import { Fingerprint, Lock, ShieldCheck, X, CheckCircle2 } from "lucide-react";
import { useApp } from "../context/AppContext";

export const BiometricModal: React.FC = () => {
  const {
    isBiometricModalOpen,
    setIsBiometricModalOpen,
    biometricSuccessCallback,
  } = useApp();

  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const [pinError, setPinError] = useState<string | null>(null);

  if (!isBiometricModalOpen) return null;

  const handleSimulateScan = () => {
    setIsScanning(true);
    setPinError(null);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      setTimeout(() => {
        setScanSuccess(false);
        setIsBiometricModalOpen(false);
        if (biometricSuccessCallback) {
          biometricSuccessCallback();
        }
      }, 600);
    }, 1200);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (pinInput === "1234" || pinInput.length >= 4) {
      setScanSuccess(true);
      setTimeout(() => {
        setScanSuccess(false);
        setIsBiometricModalOpen(false);
        if (biometricSuccessCallback) {
          biometricSuccessCallback();
        }
      }, 500);
    } else {
      setPinError("Invalid Security PIN (Default PIN is 1234)");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 text-slate-100 p-6 shadow-2xl text-center">
        <button
          onClick={() => setIsBiometricModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h3 className="text-lg font-bold text-white mb-1">Biometric Authentication</h3>
        <p className="text-xs text-slate-400 mb-6">
          TouchID / FaceID Passkey Verification for Encrypted Vault Access
        </p>

        {/* Scan Target */}
        <div className="my-6 flex flex-col items-center justify-center">
          <button
            onClick={handleSimulateScan}
            disabled={isScanning || scanSuccess}
            className={`relative p-6 rounded-full transition-all duration-300 ${
              scanSuccess
                ? "bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500"
                : isScanning
                ? "bg-indigo-600/30 text-indigo-400 border-2 border-indigo-500 animate-pulse scale-105"
                : "bg-slate-800/80 hover:bg-slate-800 text-indigo-400 border-2 border-slate-700 hover:border-indigo-500"
            }`}
          >
            {scanSuccess ? (
              <CheckCircle2 className="w-12 h-12" />
            ) : (
              <Fingerprint className={`w-12 h-12 ${isScanning ? "animate-bounce" : ""}`} />
            )}
          </button>
          <p className="text-xs font-semibold text-slate-300 mt-3">
            {scanSuccess
              ? "Access Granted! Unlocking..."
              : isScanning
              ? "Scanning Fingerprint / Face ID..."
              : "Tap Sensor to Verify Biometrics"}
          </p>
        </div>

        {/* Or PIN Entry */}
        <div className="pt-4 border-t border-slate-800 text-left">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">OR ENTER MASTER PIN (Default: 1234):</p>
          <form onSubmit={handlePinSubmit} className="flex gap-2">
            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
            >
              Verify
            </button>
          </form>
          {pinError && <p className="text-[11px] text-rose-400 font-semibold mt-1.5">{pinError}</p>}
        </div>
      </div>
    </div>
  );
};
