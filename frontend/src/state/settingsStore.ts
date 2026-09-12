import { create } from 'zustand';

/**
 * App-level settings (demo mode, presentation mode).
 * Demo mode drives realistic sample data + live-looking AI insights by default.
 * Presentation mode renders a clean fullscreen KPI dashboard for projectors.
 */

const SETTINGS_KEY = 'lumina.settings.v1';

interface SettingsState {
  demoMode: boolean;
  presentationMode: boolean;
  setDemoMode: (value: boolean) => void;
  toggleDemoMode: () => void;
  setPresentationMode: (value: boolean) => void;
  togglePresentationMode: () => void;
}

function loadInitial(): Pick<SettingsState, 'demoMode' | 'presentationMode'> {
  const fallback = { demoMode: true, presentationMode: false };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SettingsState>;
    return {
      demoMode: parsed.demoMode ?? fallback.demoMode,
      presentationMode: parsed.presentationMode ?? fallback.presentationMode,
    };
  } catch {
    return fallback;
  }
}

function persist(state: SettingsState) {
  try {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ demoMode: state.demoMode, presentationMode: state.presentationMode }),
    );
  } catch {
    /* ignore quota/private-mode errors */
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...loadInitial(),

  setDemoMode: (demoMode) => {
    set({ demoMode });
    persist(get());
  },
  toggleDemoMode: () => {
    set((s) => ({ demoMode: !s.demoMode }));
    persist(get());
  },
  setPresentationMode: (presentationMode) => {
    set({ presentationMode });
    persist(get());
  },
  togglePresentationMode: () => {
    set((s) => ({ presentationMode: !s.presentationMode }));
    persist(get());
  },
}));