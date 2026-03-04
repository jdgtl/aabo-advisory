import type { PdfInputs } from "./pdf/generatePdf";

/** Shared mutable ref so the sticky bar can read current calculator inputs on demand. */
let _current: PdfInputs | null = null;
let _userEmail: string | undefined;

export function setCalculatorState(inputs: PdfInputs) {
  _current = inputs;
}

export function getCalculatorState(): PdfInputs | null {
  return _current;
}

export function setUserEmail(email: string | undefined) {
  _userEmail = email;
  // Notify listeners
  _emailListeners.forEach((fn) => fn(email));
}

export function getUserEmail(): string | undefined {
  return _userEmail;
}

type EmailListener = (email: string | undefined) => void;
const _emailListeners: EmailListener[] = [];

export function onUserEmailChange(fn: EmailListener): () => void {
  _emailListeners.push(fn);
  return () => {
    const idx = _emailListeners.indexOf(fn);
    if (idx >= 0) _emailListeners.splice(idx, 1);
  };
}
