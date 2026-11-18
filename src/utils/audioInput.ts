/**
 * Audio and Microphone Input Management Utility
 * Safely handles browser microphone permissions, getUserMedia streams, MediaRecorder, and AI transcription fallback
 */

export interface MicPermissionStatus {
  granted: boolean;
  error?: string;
  stream?: MediaStream;
}

/**
 * Request explicit microphone permission from the user
 */
export async function requestMicrophoneAccess(): Promise<MicPermissionStatus> {
  if (typeof window === "undefined") {
    return {
      granted: false,
      error: "Window object is not available.",
    };
  }

  // Check if getUserMedia is supported
  const hasMediaDevices = !!(navigator?.mediaDevices?.getUserMedia);
  const legacyGetUserMedia =
    (navigator as any)?.getUserMedia ||
    (navigator as any)?.webkitGetUserMedia ||
    (navigator as any)?.mozGetUserMedia ||
    (navigator as any)?.msGetUserMedia;

  if (!hasMediaDevices && !legacyGetUserMedia) {
    return {
      granted: false,
      error: "Microphone recording is not supported in this browser. Please use Chrome, Edge, Safari, or Firefox.",
    };
  }

  try {
    let stream: MediaStream;
    if (hasMediaDevices) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (constraintErr: any) {
        // Fall back to basic audio constraint if device doesn't support advanced audio parameters
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
    } else {
      stream = await new Promise<MediaStream>((resolve, reject) => {
        legacyGetUserMedia.call(
          navigator,
          { audio: true },
          (s: MediaStream) => resolve(s),
          (err: any) => reject(err)
        );
      });
    }

    return {
      granted: true,
      stream,
    };
  } catch (err: any) {
    let errorMsg = "Microphone permission was denied.";
    const errName = err?.name || "";
    const errMsg = err?.message || "";

    if (errName === "NotAllowedError" || errName === "PermissionDeniedError" || errMsg.includes("Permission denied") || errMsg.includes("Permission dismissed")) {
      errorMsg = "Microphone access was denied. Please click the lock/camera icon in your browser URL bar and allow Microphone access.";
    } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
      errorMsg = "No microphone input device detected. Please connect a headset or microphone.";
    } else if (errName === "NotReadableError" || errName === "TrackStartError") {
      errorMsg = "Microphone is currently occupied by another program. Please close other voice tabs and retry.";
    } else if (errName === "SecurityError") {
      errorMsg = "Microphone access blocked by browser security. Please open the app in a dedicated browser tab.";
    }

    return {
      granted: false,
      error: errorMsg,
    };
  }
}

/**
 * Helper to release all tracks of an audio stream
 */
export function releaseAudioStream(stream: MediaStream | null | undefined) {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (e) {}
    });
  } catch (e) {}
}

/**
 * Check if Speech Recognition API is supported in the browser
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Get Speech Recognition constructor
 */
export function getSpeechRecognitionClass(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Send audio blob to server for AI transcription using Gemini
 */
export async function transcribeAudioViaServer(
  audioBlob: Blob,
  language: string = "EN"
): Promise<string> {
  try {
    const base64Audio = await blobToBase64(audioBlob);
    const mimeType = audioBlob.type || "audio/webm";

    const response = await fetch("/api/ai/transcribe-audio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audioBase64: base64Audio,
        mimeType,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();
    return data.transcript || "";
  } catch (err: any) {
    console.warn("AI transcription error:", err?.message || err);
    return "";
  }
}

/**
 * Convert Blob to Base64 string without data prefix
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Safe AudioRecorder wrapper supporting MediaRecorder across modern browsers
 */
export class SafeAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isExternalStream: boolean = false;
  private mimeType: string = "audio/webm";

  async start(providedStream?: MediaStream): Promise<boolean> {
    this.audioChunks = [];
    if (providedStream && providedStream.active) {
      this.stream = providedStream;
      this.isExternalStream = true;
    } else {
      const perm = await requestMicrophoneAccess();
      if (!perm.granted || !perm.stream) {
        return false;
      }
      this.stream = perm.stream;
      this.isExternalStream = false;
    }

    // Pick supported MIME type
    if (typeof MediaRecorder !== "undefined") {
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        this.mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/webm")) {
        this.mimeType = "audio/webm";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        this.mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
        this.mimeType = "audio/ogg";
      } else {
        this.mimeType = "";
      }

      try {
        const options: MediaRecorderOptions = this.mimeType ? { mimeType: this.mimeType } : {};
        this.mediaRecorder = new MediaRecorder(this.stream, options);

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.start(250); // Slice every 250ms
        return true;
      } catch (err) {
        console.warn("MediaRecorder start error:", err);
        return false;
      }
    }

    return false;
  }

  stop(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === "inactive") {
        if (this.audioChunks.length > 0) {
          const type = this.mimeType || "audio/webm";
          const blob = new Blob(this.audioChunks, { type });
          this.cleanup();
          resolve(blob.size > 0 ? blob : null);
          return;
        }
        this.cleanup();
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const type = this.mimeType || "audio/webm";
          const blob = new Blob(this.audioChunks, { type });
          this.cleanup();
          resolve(blob.size > 0 ? blob : null);
        } catch (e) {
          this.cleanup();
          resolve(null);
        }
      };

      try {
        if (this.mediaRecorder.state === "recording") {
          try {
            this.mediaRecorder.requestData();
          } catch (reqErr) {}
        }
        this.mediaRecorder.stop();
      } catch (e) {
        if (this.audioChunks.length > 0) {
          const type = this.mimeType || "audio/webm";
          const blob = new Blob(this.audioChunks, { type });
          this.cleanup();
          resolve(blob.size > 0 ? blob : null);
          return;
        }
        this.cleanup();
        resolve(null);
      }
    });
  }

  isRecording(): boolean {
    return !!(this.mediaRecorder && this.mediaRecorder.state === "recording");
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  cleanup() {
    if (this.stream && !this.isExternalStream) {
      releaseAudioStream(this.stream);
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
