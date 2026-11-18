// Zero-knowledge encryption & AES-256 simulation utilities

export function generateEncryptedHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return "0x" + Math.abs(hash).toString(16).padStart(16, "f7a29e1c3b5d80");
}

export function simulateEncryptString(text: string, secretKey: string = "OmniKey-AES-256"): string {
  const encoded = btoa(encodeURIComponent(text));
  const signature = generateEncryptedHash(secretKey).substring(0, 8);
  return `AES256-GCM::${signature}::${encoded}`;
}

export function simulateDecryptString(cipherText: string): string {
  if (!cipherText.startsWith("AES256-GCM::")) {
    return cipherText;
  }
  try {
    const parts = cipherText.split("::");
    if (parts.length < 3) return cipherText;
    return decodeURIComponent(atob(parts[2]));
  } catch (e) {
    return "[Decryption Error: Invalid Key or Corrupted Payload]";
  }
}
