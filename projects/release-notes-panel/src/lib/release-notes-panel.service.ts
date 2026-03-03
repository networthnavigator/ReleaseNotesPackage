import { Injectable, signal, computed, inject } from '@angular/core';
import type { ReleaseNotesAggregate } from './domain/aggregates/release-notes.aggregate';
import type { LoadReleaseNotesPort } from './application/ports/load-release-notes.port';
import { getReleaseNotesForDisplay } from './application/use-cases/get-release-notes-for-display.use-case';
import { FetchReleaseNotesAdapter } from './infrastructure/adapters/fetch-release-notes.adapter';

const DEFAULT_STORAGE_KEY = 'release-notes-viewed';

/**
 * Presentation facade: coordinates loading (via port), current version, UI state, and unread tracking.
 * Depends on application layer (use case) and infrastructure (port implementation).
 */
@Injectable({
  providedIn: 'root',
})
export class ReleaseNotesPanelService {
  private readonly loadPort: LoadReleaseNotesPort = inject(FetchReleaseNotesAdapter);

  private readonly data = signal<ReleaseNotesAggregate | null>(null);
  private readonly currentVersion = signal<string | null>(null);
  private readonly openState = signal(false);
  private readonly notesUrlSignal = signal<string | null>(null);

  /** localStorage key for tracking which releases have been viewed. */
  private storageKey = DEFAULT_STORAGE_KEY;

  /** When true, open the drawer automatically when new releases exist that the user has not seen. */
  autoOpenOnNewRelease = false;

  /** Optional resolver for image paths (e.g. from editor in-memory store). When set, used before imageBaseUrl. */
  private imageUrlResolver: ((path: string) => string | null) | null = null;

  setImageUrlResolver(resolver: ((path: string) => string | null) | null): void {
    this.imageUrlResolver = resolver;
  }

  /** Resolve an image path to a URL. Returns null if no resolver or resolver returns null (caller can fall back to base URL). */
  resolveImageUrl(path: string): string | null {
    if (this.imageUrlResolver) return this.imageUrlResolver(path);
    return null;
  }

  readonly isOpen = this.openState.asReadonly();
  readonly currentAppVersion = this.currentVersion.asReadonly();
  /** URL the notes were loaded from (e.g. for deriving image base). */
  readonly notesUrl = this.notesUrlSignal.asReadonly();

  /** True when the host app has set a version (enables "Your version history" and "Newer versions" split). */
  readonly hasCurrentVersion = computed(() => {
    const v = this.currentVersion();
    return v != null && v.trim() !== '';
  });

  /** Raw data for template (loading/empty checks). */
  readonly releaseNotesData = this.data.asReadonly();

  /** Releases <= current version (use case output). */
  readonly pastReleases = computed(() => {
    const d = this.data();
    const v = this.currentVersion();
    const { pastReleases: past } = getReleaseNotesForDisplay(d, v);
    return past;
  });

  /** Releases > current version (use case output). */
  readonly newerReleases = computed(() => {
    const d = this.data();
    const v = this.currentVersion();
    const { newerReleases: newer } = getReleaseNotesForDisplay(d, v);
    return newer;
  });

  setCurrentVersion(version: string | null): void {
    this.currentVersion.set(version);
  }

  setStorageKey(key: string): void {
    this.storageKey = key || DEFAULT_STORAGE_KEY;
  }

  private getViewedKeys(): Set<string> {
    if (typeof localStorage === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(this.storageKey);
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  }

  private setViewedKeys(keys: Set<string>): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...keys]));
    } catch {
      /* ignore */
    }
  }

  /** Whether the release (by key) has not been viewed yet. */
  isReleaseUnread(releaseKey: string): boolean {
    return !this.getViewedKeys().has(releaseKey);
  }

  /** Mark the given release keys as read. Call when drawer opens or when releases become visible. */
  markReleasesAsRead(releaseKeys: string[]): void {
    const viewed = this.getViewedKeys();
    releaseKeys.forEach((k) => viewed.add(k));
    this.setViewedKeys(viewed);
  }

  loadFromUrl(url: string): void {
    this.notesUrlSignal.set(url);
    this.loadPort.load(url).then((aggregate) => {
      const normalized = aggregate ? this.normalizeAggregate(aggregate) : null;
      this.data.set(normalized);
      this.checkAutoOpen();
    });
  }

  /** Load data directly from JSON string (e.g. for preview in an editor). */
  loadFromJson(json: string): void {
    try {
      const parsed = JSON.parse(json) as ReleaseNotesAggregate;
      this.data.set(parsed?.releases ? this.normalizeAggregate(parsed) : null);
      this.checkAutoOpen();
    } catch {
      this.data.set(null);
    }
  }

  private checkAutoOpen(): void {
    if (!this.autoOpenOnNewRelease) return;
    const newer = this.newerReleases();
    if (newer.length === 0) return;
    const viewed = this.getViewedKeys();
    const hasUnreadNewer = newer.some((r) => !viewed.has(this.releaseKey(r)));
    if (hasUnreadNewer) this.openState.set(true);
  }

  releaseKey(release: { version: string | null; date: string | null }): string {
    return `${release.version ?? ''}\u0000${release.date ?? ''}`;
  }

  /** Map legacy "content" to note_md when loading JSON. */
  private normalizeAggregate(aggregate: ReleaseNotesAggregate): ReleaseNotesAggregate {
    type LoadedNote = { id: string; type: string; title: string; note_md?: string; content?: string; images?: readonly string[] };
    return {
      releases: aggregate.releases.map((r) => ({
        version: r.version,
        date: r.date,
        notes: r.notes.map((n: LoadedNote) => ({
          id: n.id,
          type: n.type as 'NEW' | 'UPDATE' | 'BUG',
          title: n.title,
          note_md: n.note_md ?? n.content ?? '',
          images: n.images ? [...n.images] : undefined,
        })),
      })),
    };
  }

  open(): void {
    const url = this.notesUrlSignal();
    if (url) this.loadFromUrl(url);
    this.openState.set(true);
    this.markVisibleReleasesAsRead();
  }

  /** Mark all currently loaded releases as read (for unread tracking). */
  markVisibleReleasesAsRead(): void {
    const d = this.data();
    if (!d?.releases?.length) return;
    const keys = d.releases
      .filter((r) => r.version != null || r.date != null)
      .map((r) => this.releaseKey(r));
    this.markReleasesAsRead(keys);
  }

  close(): void {
    this.openState.set(false);
  }

  toggle(): void {
    this.openState.update((v) => !v);
  }
}

/** Alias for ReleaseNotesPanelService (e.g. release-notes-drawer usage). */
export const ReleaseNotesService = ReleaseNotesPanelService;
