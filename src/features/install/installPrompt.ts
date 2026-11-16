import { useSyncExternalStore } from 'react';

/** The (non-standard, Chromium) event that lets a page offer its own install button. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * - `prompt`: the browser can install the site right now (Chrome, Edge, Samsung Internet).
 * - `ios`: iPhone/iPad, where there is no install API: show where the Share menu item is.
 * - `none`: already installed, or the browser cannot install the site.
 */
export type InstallState = 'prompt' | 'ios' | 'none';

let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

// Registered when this module loads (early), because the browser fires the event only once,
// often before the first component has rendered.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    emit();
  });
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || nav.standalone);
}

function isIos(): boolean {
  const iPadOnMac = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || iPadOnMac;
}

function getState(): InstallState {
  if (installed || isStandalone()) return 'none';
  if (deferred) return 'prompt';
  return isIos() ? 'ios' : 'none';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Opens the browser's install dialog (only when the state is `prompt`). */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // The event can be used once. After accepting, `appinstalled` follows; after dismissing,
  // Chrome fires a fresh beforeinstallprompt later, so hide the button for now.
  deferred = null;
  if (outcome === 'accepted') installed = true;
  emit();
}

export function useInstallState(): InstallState {
  return useSyncExternalStore(subscribe, getState, () => 'none');
}
