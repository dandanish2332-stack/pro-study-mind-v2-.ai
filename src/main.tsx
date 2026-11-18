// Defensive guard for environments / browser extensions where window.fetch getter is non-writable
try {
  const globalObj = typeof window !== "undefined" ? window : typeof globalThis !== "undefined" ? globalThis : null;
  if (globalObj) {
    let _fetch = globalObj.fetch ? globalObj.fetch.bind(globalObj) : null;
    let p: any = globalObj;
    while (p) {
      try {
        const d = Object.getOwnPropertyDescriptor(p, "fetch");
        if (d && (!d.writable || !d.set)) {
          Object.defineProperty(p, "fetch", {
            get: () => _fetch,
            set: (fn) => {
              _fetch = fn;
            },
            configurable: true,
            enumerable: true,
          });
        }
      } catch (e) {}
      p = Object.getPrototypeOf(p);
    }
    try {
      Object.defineProperty(globalObj, "fetch", {
        get: () => _fetch,
        set: (fn) => {
          _fetch = fn;
        },
        configurable: true,
        enumerable: true,
      });
    } catch (e) {}
  }
} catch (e) {}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import 'katex/dist/katex.min.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
