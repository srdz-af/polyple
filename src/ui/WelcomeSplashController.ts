import { readScenePayloadFromText } from '../scene/sceneUrlState';
import { safeLocalStorageGet, safeLocalStorageSet } from '../utils/localStorage';

type RecentSceneEntry = { payload: string; name: string };

type WelcomeSplashElements = {
  splash: HTMLDivElement | null;
  recentList: HTMLDivElement | null;
  dontShowInput: HTMLInputElement | null;
};

type WelcomeSplashOptions = {
  loadPayload: (payload: string) => Promise<string | void>;
  hiddenKey?: string;
  recentKey?: string;
  maxRecentScenes?: number;
};

const DEFAULT_HIDDEN_KEY = 'polyple.welcomeSplashHidden';
const DEFAULT_RECENT_KEY = 'polyple.recentScenePayloads';
const DEFAULT_MAX_RECENT_SCENES = 5;

function sanitizeSceneName(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/gu, ' ').slice(0, 80);
}

function shortScenePayload(payload: string) {
  if (payload.length <= 22) return payload;
  return `${payload.slice(0, 11)}...${payload.slice(-8)}`;
}

export class WelcomeSplashController {
  private readonly splash: HTMLDivElement | null;
  private readonly recentList: HTMLDivElement | null;
  private readonly dontShowInput: HTMLInputElement | null;
  private readonly hiddenKey: string;
  private readonly recentKey: string;
  private readonly maxRecentScenes: number;
  private readonly loadPayload: (payload: string) => Promise<string | void>;

  constructor(elements: WelcomeSplashElements, options: WelcomeSplashOptions) {
    this.splash = elements.splash;
    this.recentList = elements.recentList;
    this.dontShowInput = elements.dontShowInput;
    this.hiddenKey = options.hiddenKey ?? DEFAULT_HIDDEN_KEY;
    this.recentKey = options.recentKey ?? DEFAULT_RECENT_KEY;
    this.maxRecentScenes = options.maxRecentScenes ?? DEFAULT_MAX_RECENT_SCENES;
    this.loadPayload = options.loadPayload;
  }

  rememberScene(payload: string, name = '') {
    const normalizedPayload = readScenePayloadFromText(payload);
    if (!normalizedPayload) return;
    const normalizedName = sanitizeSceneName(name);
    const existing = this.readRecentScenes().find(entry => entry.payload === normalizedPayload);
    const entries = this.readRecentScenes().filter(entry => entry.payload !== normalizedPayload);
    entries.unshift({ payload: normalizedPayload, name: normalizedName || existing?.name || '' });
    this.writeRecentScenes(entries);
    this.renderRecentScenes();
  }

  showIfNeeded() {
    if (!this.splash || !this.shouldShow()) return;
    this.renderRecentScenes();
    this.splash.hidden = false;
  }

  hide(persistPreference = false) {
    if (persistPreference || this.dontShowInput?.checked) {
      if (!safeLocalStorageSet(this.hiddenKey, '1')) {
        console.warn('Unable to store welcome splash preference');
      }
    }
    if (this.splash) this.splash.hidden = true;
  }

  private shouldShow() {
    return safeLocalStorageGet(this.hiddenKey) !== '1';
  }

  private normalizeRecentSceneEntry(value: unknown): RecentSceneEntry | null {
    if (typeof value === 'string') {
      const payload = readScenePayloadFromText(value);
      return payload ? { payload, name: '' } : null;
    }
    if (typeof value !== 'object' || value === null) return null;
    const raw = value as { p?: unknown; payload?: unknown; n?: unknown; name?: unknown };
    const payloadSource = typeof raw.p === 'string' ? raw.p : raw.payload;
    const payload = typeof payloadSource === 'string' ? readScenePayloadFromText(payloadSource) : null;
    if (!payload) return null;
    return {
      payload,
      name: sanitizeSceneName(typeof raw.n === 'string' ? raw.n : raw.name),
    };
  }

  private readRecentScenes() {
    try {
      const raw = safeLocalStorageGet(this.recentKey);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      const seen = new Set<string>();
      const entries: RecentSceneEntry[] = [];
      for (const value of parsed) {
        const entry = this.normalizeRecentSceneEntry(value);
        if (!entry || seen.has(entry.payload)) continue;
        seen.add(entry.payload);
        entries.push(entry);
        if (entries.length >= this.maxRecentScenes) break;
      }
      return entries;
    } catch {
      return [];
    }
  }

  private writeRecentScenes(entries: RecentSceneEntry[]) {
    const stored = safeLocalStorageSet(this.recentKey, JSON.stringify(entries.slice(0, this.maxRecentScenes).map(entry => ({
      p: entry.payload,
      n: entry.name || undefined,
    }))));
    if (!stored) console.warn('Unable to store recent scene list');
  }

  private renderRecentScenes() {
    if (!this.recentList) return;
    this.recentList.textContent = '';
    const entries = this.readRecentScenes();
    if (!entries.length) {
      const empty = document.createElement('div');
      empty.id = 'welcome-recent-empty';
      empty.textContent = 'No saved scenes yet.';
      this.recentList.appendChild(empty);
      return;
    }

    entries.forEach((entry, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'welcome-recent-scene';
      const name = entry.name || `Scene ${idx + 1}`;
      button.title = `Load ${name}`;
      button.setAttribute('aria-label', `Load ${name}`);

      const label = document.createElement('span');
      label.textContent = name;
      const hash = document.createElement('span');
      hash.textContent = shortScenePayload(entry.payload);
      button.append(label, hash);
      button.addEventListener('click', () => {
        void this.loadRecentScenePayload(entry.payload);
      });
      this.recentList?.appendChild(button);
    });
  }

  private async loadRecentScenePayload(payload: string) {
    try {
      const name = await this.loadPayload(payload);
      this.rememberScene(payload, sanitizeSceneName(name));
      this.hide();
    } catch (err) {
      console.warn('Unable to load recent scene URL state', err);
      window.alert('Unable to load recent scene.');
    }
  }
}
