import {
  Component,
  inject,
  signal,
  input,
  effect,
  computed,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { SafeHtml } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { ReleaseNotesPanelService } from './release-notes-panel.service';
import { Release, ReleaseNote } from './models/release-notes.model';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

@Component({
  selector: 'lib-release-notes-panel, release-notes-drawer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('drawerSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms ease-out', style({ transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('overlayFade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
    trigger('expandCollapse', [
      state('collapsed', style({ maxHeight: '0', overflow: 'hidden', opacity: 0, padding: 0, margin: 0 })),
      state('expanded', style({ maxHeight: '2000px', overflow: 'visible', opacity: 1 })),
      transition('collapsed <=> expanded', animate('200ms ease-in-out')),
    ]),
  ],
  template: `
    @if (service.isOpen()) {
      <div
        class="rn-overlay"
        (click)="service.close()"
        role="button"
        tabindex="0"
        (keydown.escape)="service.close()"
        [@overlayFade]
      ></div>
      <aside
        class="rn-drawer"
        role="dialog"
        aria-label="Release notes"
        [@drawerSlide]
      >
        <div class="rn-drawer-header">
          <h2 class="rn-drawer-title">Release notes</h2>
          <button mat-icon-button (click)="service.close()" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        @if (service.releaseNotesData()?.releases?.length) {
          <div class="rn-filters">
            <mat-form-field class="rn-search-field" appearance="outline" subscriptSizing="dynamic">
              <mat-label>Search</mat-label>
              <input
                matInput
                type="text"
                [value]="searchQuery()"
                (input)="applySearchQueryFromInput($event)"
                placeholder="Title or content…"
              />
              <span matPrefix class="rn-search-icon">
                <span class="material-symbols-outlined">search</span>
              </span>
            </mat-form-field>
            <div class="rn-type-filters">
              <label class="rn-checkbox-label">
                <mat-checkbox [checked]="filterNew()" (change)="filterNew.set($event.checked)" />
                <span>NEW</span>
              </label>
              <label class="rn-checkbox-label">
                <mat-checkbox [checked]="filterUpdate()" (change)="filterUpdate.set($event.checked)" />
                <span>UPDATE</span>
              </label>
              <label class="rn-checkbox-label">
                <mat-checkbox [checked]="filterBug()" (change)="filterBug.set($event.checked)" />
                <span>BUG</span>
              </label>
            </div>
          </div>
        }
        <div class="rn-drawer-content">
          @if (!service.releaseNotesData()) {
            <p class="rn-loading">Loading…</p>
          } @else if (!service.releaseNotesData()?.releases?.length) {
            <p class="rn-empty">No release notes available.</p>
          } @else {
            @if (service.hasCurrentVersion() && service.newerReleases().length > 0) {
              <section class="rn-section rn-section-newer">
                <h3 class="rn-section-title">Features available in newer versions</h3>
                <p class="rn-upgrade-hint">Upgrade to the latest version to access the following improvements.</p>
                @for (release of filteredNewerReleases(); track releaseVersionKey(release)) {
                  <div class="rn-release-block" [class.rn-collapsed]="!isExpanded(release)">
                    <button
                      type="button"
                      class="rn-release-header-btn"
                      (click)="toggleRelease(release)"
                      [attr.aria-expanded]="isExpanded(release)"
                    >
                      <span class="rn-version">{{ releaseHeader(release) }}</span>
                      @if (service.isReleaseUnread(service.releaseKey(release))) {
                        <span class="rn-unread-badge" aria-label="Unread"></span>
                      }
                      <span class="rn-expand-icon" [class.rn-expanded]="isExpanded(release)">
                        <span class="material-symbols-outlined">expand_more</span>
                      </span>
                    </button>
                    <div
                      class="rn-release-body"
                      [@expandCollapse]="isExpanded(release) ? 'expanded' : 'collapsed'"
                    >
                      <div class="rn-release-body-inner">
                        @for (note of release.notes; track note.id) {
                          <div class="rn-note">
                            <div class="rn-note-head">
                              <span class="rn-note-title">{{ note.title }}</span>
                              <mat-chip-set>
                                <mat-chip [attr.data-type]="note.type">{{ note.type }}</mat-chip>
                              </mat-chip-set>
                            </div>
                            <div class="rn-note-content rn-markdown" [innerHTML]="getNoteBodyHtml(note)"></div>
                            @if (note.images?.length) {
                              <div class="rn-note-images">
                                @for (img of note.images; track img) {
                                  <img [src]="imageUrl(img)" alt="" class="rn-img" loading="lazy" />
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </section>
            }
            @if (filteredPastReleases().length > 0) {
              <section class="rn-section">
                <h3 class="rn-section-title">{{ getSectionTitle() }}</h3>
                <p class="rn-section-hint">Releases up to your current version. Expand a release to see its notes.</p>
                @for (release of filteredPastReleases(); track releaseVersionKey(release)) {
                  <div class="rn-release-block" [class.rn-collapsed]="!isExpanded(release)">
                    <button
                      type="button"
                      class="rn-release-header-btn"
                      (click)="toggleRelease(release)"
                      [attr.aria-expanded]="isExpanded(release)"
                    >
                      <span class="rn-version">{{ releaseHeader(release) }}</span>
                      @if (service.isReleaseUnread(service.releaseKey(release))) {
                        <span class="rn-unread-badge" aria-label="Unread"></span>
                      }
                      <span class="rn-expand-icon" [class.rn-expanded]="isExpanded(release)">
                        <span class="material-symbols-outlined">expand_more</span>
                      </span>
                    </button>
                    <div
                      class="rn-release-body"
                      [@expandCollapse]="isExpanded(release) ? 'expanded' : 'collapsed'"
                    >
                      <div class="rn-release-body-inner">
                        @for (note of release.notes; track note.id) {
                          <div class="rn-note">
                            <div class="rn-note-head">
                              <span class="rn-note-title">{{ note.title }}</span>
                              <mat-chip-set>
                                <mat-chip [attr.data-type]="note.type">{{ note.type }}</mat-chip>
                              </mat-chip-set>
                            </div>
                            <div class="rn-note-content rn-markdown" [innerHTML]="getNoteBodyHtml(note)"></div>
                            @if (note.images?.length) {
                              <div class="rn-note-images">
                                @for (img of note.images; track img) {
                                  <img [src]="imageUrl(img)" alt="" class="rn-img" loading="lazy" />
                                }
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </section>
            }
          }
        </div>
      </aside>
    }
  `,
  styles: [
    `
      /* Self-contained theme: fixed colors and font so the panel looks the same in every host app */
      .rn-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 1000;
      }
      .rn-drawer {
        position: fixed;
        top: 0;
        right: 0;
        width: 840px;
        max-width: 100%;
        height: 100%;
        background: #fff;
        color: rgba(0, 0, 0, 0.87);
        font-family: Roboto, 'Helvetica Neue', sans-serif;
        box-shadow: -2px 0 12px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        display: flex;
        flex-direction: column;
      }
      .rn-drawer-header {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
      }
      .rn-drawer-header button[mat-icon-button] {
        color: rgba(0, 0, 0, 0.6);
      }
      .rn-drawer-header button[mat-icon-button]:hover {
        color: rgba(0, 0, 0, 0.87);
      }
      .rn-drawer-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.87);
      }
      .rn-filters {
        flex-shrink: 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
        padding: 12px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(0, 0, 0, 0.02);
      }
      .rn-search-field {
        flex: 1;
        min-width: 160px;
        font-size: 0.95rem;
      }
      .rn-search-field .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
      .rn-search-icon {
        display: inline-flex;
        margin-right: 8px;
        color: rgba(0, 0, 0, 0.5);
      }
      .rn-search-icon .material-symbols-outlined {
        font-size: 20px;
      }
      .rn-type-filters {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .rn-checkbox-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.87);
        user-select: none;
      }
      .rn-drawer-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px 20px;
      }
      .rn-loading,
      .rn-empty {
        margin: 0;
        color: rgba(0, 0, 0, 0.6);
        font-size: 0.95rem;
      }
      .rn-section {
        margin-bottom: 24px;
      }
      .rn-section-title {
        margin: 0 0 8px;
        font-size: 1rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
      }
      .rn-section-hint {
        margin: 0 0 12px;
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.4;
      }
      .rn-upgrade-hint {
        margin: 0 0 12px;
        font-size: 0.9rem;
        color: rgba(0, 0, 0, 0.6);
        line-height: 1.4;
      }
      .rn-release-block {
        margin-bottom: 0;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 0;
        overflow: hidden;
      }
      .rn-release-block:first-of-type {
        border-radius: 8px 8px 0 0;
      }
      .rn-release-block:last-of-type {
        border-radius: 0 0 8px 8px;
      }
      .rn-release-block:only-of-type {
        border-radius: 8px;
      }
      .rn-release-block + .rn-release-block {
        border-top: none;
      }
      .rn-release-block.rn-collapsed {
        border-color: rgba(0, 0, 0, 0.03);
      }
      .rn-release-header-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
        padding: 12px 14px;
        border: none;
        background: rgba(0, 0, 0, 0.03);
        cursor: pointer;
        font: inherit;
        text-align: left;
      }
      .rn-release-header-btn:hover {
        background: rgba(0, 0, 0, 0.06);
      }
      .rn-version {
        font-size: 0.95rem;
        font-weight: 600;
        color: rgba(0, 0, 0, 0.87);
        flex: 1;
      }
      .rn-unread-badge {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #1976d2;
        flex-shrink: 0;
      }
      .rn-expand-icon {
        flex-shrink: 0;
        transition: transform 0.2s ease;
      }
      .rn-expand-icon.rn-expanded {
        transform: rotate(180deg);
      }
      .rn-expand-icon .material-symbols-outlined {
        font-size: 20px;
        color: rgba(0, 0, 0, 0.6);
      }
      .rn-release-body {
        box-sizing: border-box;
      }
      .rn-release-body-inner {
        padding: 12px 14px 14px 14px;
        box-sizing: border-box;
      }
      .rn-note {
        margin-bottom: 16px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 8px;
      }
      .rn-note:last-child {
        margin-bottom: 0;
      }
      .rn-note-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 6px;
      }
      .rn-note-title {
        font-weight: 500;
        font-size: 0.95rem;
        flex: 1;
        min-width: 0;
      }
      .rn-note-head mat-chip-set {
        flex-shrink: 0;
      }
      .rn-note-head mat-chip {
        font-size: 0.7rem;
        font-weight: 600;
        min-height: 22px;
      }
      .rn-note-head mat-chip[data-type='NEW'] {
        --mdc-chip-elevated-container-color: rgba(25, 118, 210, 0.2);
        --mdc-chip-label-text-color: #1565c0;
      }
      .rn-note-head mat-chip[data-type='UPDATE'] {
        --mdc-chip-elevated-container-color: rgba(255, 152, 0, 0.2);
        --mdc-chip-label-text-color: #e65100;
      }
      .rn-note-head mat-chip[data-type='BUG'] {
        --mdc-chip-elevated-container-color: rgba(211, 47, 47, 0.2);
        --mdc-chip-label-text-color: #c62828;
      }
      .rn-note-content {
        font-size: 0.9rem;
        line-height: 1.5;
        color: rgba(0, 0, 0, 0.75);
        word-wrap: break-word;
      }
      .rn-note-content.rn-markdown :deep(h1) { font-size: 1.1rem; margin: 0.5em 0 0.25em; font-weight: 600; }
      .rn-note-content.rn-markdown :deep(h2) { font-size: 1.05rem; margin: 0.5em 0 0.25em; font-weight: 600; }
      .rn-note-content.rn-markdown :deep(h3) { font-size: 1rem; margin: 0.4em 0 0.2em; font-weight: 600; }
      .rn-note-content.rn-markdown :deep(p) { margin: 0.4em 0; }
      .rn-note-content.rn-markdown :deep(ul), .rn-note-content.rn-markdown :deep(ol) { margin: 0.4em 0; padding-left: 1.5em; }
      .rn-note-content.rn-markdown :deep(code) { background: rgba(0,0,0,0.06); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
      .rn-note-content.rn-markdown :deep(pre) { background: rgba(0,0,0,0.06); padding: 12px; border-radius: 6px; overflow-x: auto; margin: 0.5em 0; }
      .rn-note-content.rn-markdown :deep(pre code) { background: none; padding: 0; }
      .rn-note-content.rn-markdown :deep(a) { color: #1565c0; }
      .rn-note-content.rn-markdown :deep(img) { max-width: 100%; height: auto; border-radius: 6px; }
      .rn-note-images {
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .rn-img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
      }
    `,
  ],
})
export class ReleaseNotesPanelComponent {
  protected readonly service = inject(ReleaseNotesPanelService);
  private readonly sanitizer = inject(DomSanitizer);

  /** Current application version for version-aware grouping. */
  readonly currentVersion = input<string | null>(null);

  /** When true, drawer opens automatically when new releases exist that the user has not seen. */
  readonly autoOpenOnNewRelease = input<boolean>(false);

  /** Base URL for resolving relative image paths (e.g. from notes JSON folder). */
  private readonly imageBaseUrl = signal<string>('');

  /** Which release keys are expanded (default: newest per section). */
  private readonly expandedKeys = signal<Set<string>>(new Set());

  /** Search filter: matches against note title and body (plain text). */
  protected readonly searchQuery = signal('');

  /** Type filters: which note types to show (default all on). */
  protected readonly filterNew = signal(true);
  protected readonly filterUpdate = signal(true);
  protected readonly filterBug = signal(true);

  /** Past releases with notes filtered by search and type; releases with no matching notes are hidden. */
  readonly filteredPastReleases = computed(() => {
    const releases = this.service.pastReleases();
    return this.filterReleases(releases);
  });

  /** Newer releases with notes filtered by search and type; releases with no matching notes are hidden. */
  readonly filteredNewerReleases = computed(() => {
    const releases = this.service.newerReleases();
    return this.filterReleases(releases);
  });

  constructor() {
    effect(() => {
      const v = this.currentVersion();
      this.service.setCurrentVersion(v ?? null);
    });
    effect(() => {
      this.service.setAutoOpenOnNewRelease(this.autoOpenOnNewRelease());
    });
    effect(() => {
      const past = this.service.pastReleases();
      const newer = this.service.newerReleases();
      const defaultExpanded = new Set<string>();
      if (past.length > 0) defaultExpanded.add(this.service.releaseKey(past[0]));
      if (newer.length > 0) defaultExpanded.add(this.service.releaseKey(newer[0]));
      this.expandedKeys.update((prev) => {
        const next = new Set(prev);
        defaultExpanded.forEach((k) => next.add(k));
        return next;
      });
    });
    effect(() => {
      const q = this.searchQuery().trim();
      if (q === '') return;
      const past = this.filteredPastReleases();
      const newer = this.filteredNewerReleases();
      const allKeys = new Set<string>();
      past.forEach((r) => allKeys.add(this.service.releaseKey(r)));
      newer.forEach((r) => allKeys.add(this.service.releaseKey(r)));
      this.expandedKeys.set(allKeys);
    });
  }

  protected getSectionTitle(): string {
    return this.service.hasCurrentVersion() ? 'Your version history' : "What's new";
  }

  protected releaseVersionKey(release: Release): string {
    return release.version ?? release.date ?? 'draft';
  }

  protected releaseHeader(release: Release): string {
    if (release.version && release.date) return `${release.version} — ${release.date}`;
    if (release.version) return release.version;
    if (release.date) return release.date;
    return 'Unreleased';
  }

  protected isExpanded(release: Release): boolean {
    return this.expandedKeys().has(this.service.releaseKey(release));
  }

  protected toggleRelease(release: Release): void {
    const key = this.service.releaseKey(release);
    this.expandedKeys.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected applySearchQueryFromInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.searchQuery.set(el?.value ?? '');
  }

  /**
   * Filter releases by search (title + body) and by type checkboxes.
   * Returns releases with only matching notes; releases with zero matches are omitted.
   */
  private filterReleases(releases: Release[]): Release[] {
    const q = this.searchQuery().trim().toLowerCase();
    const allowNew = this.filterNew();
    const allowUpdate = this.filterUpdate();
    const allowBug = this.filterBug();
    const result: Release[] = [];
    for (const release of releases) {
      const notes = (release.notes ?? []).filter((note) => {
        const typeOk =
          (note.type === 'NEW' && allowNew) ||
          (note.type === 'UPDATE' && allowUpdate) ||
          (note.type === 'BUG' && allowBug);
        if (!typeOk) return false;
        if (q === '') return true;
        const title = (note.title ?? '').toLowerCase();
        const body = this.getNoteBody(note).toLowerCase();
        return title.includes(q) || body.includes(q);
      });
      if (notes.length > 0) {
        result.push({ ...release, notes });
      }
    }
    return result;
  }

  /** Raw markdown body; supports legacy "content" from old JSON. */
  getNoteBody(note: ReleaseNote & { note_md?: string; content?: string }): string {
    return note.note_md ?? (note as { content?: string }).content ?? '';
  }

  /** Image base URL: explicit imageBaseUrl, or directory of notesUrl when loaded via loadFromUrl. */
  private getEffectiveImageBase(): string {
    const explicit = this.imageBaseUrl();
    if (explicit) return explicit;
    const url = this.service.notesUrl();
    if (!url) return '';
    const lastSlash = url.lastIndexOf('/');
    if (lastSlash <= 0) return '';
    const dir = url.slice(0, lastSlash);
    return dir.startsWith('http') || dir.startsWith('/') ? dir : '/' + dir;
  }

  /** Rendered note body as safe HTML (markdown applied). Inline image srcs are rewritten via resolver or image base. */
  protected getNoteBodyHtml(note: ReleaseNote & { note_md?: string; content?: string }): SafeHtml {
    const raw = this.getNoteBody(note);
    if (raw == null || raw === '') return this.sanitizer.bypassSecurityTrustHtml('');
    let html = marked.parse(raw, { async: false });
    html = typeof html === 'string' ? html : '';
    const base = this.getEffectiveImageBase();
    const baseSlash = base ? (base.endsWith('/') ? base : base + '/') : '';
    html = html.replace(
      /<img([^>]*)\ssrc="([^"]+)"/gi,
      (_, attrs, src) => {
        if (src.startsWith('http') || src.startsWith('data:')) return `<img${attrs} src="${src}"`;
        const fromResolver = this.service.resolveImageUrl(src);
        if (fromResolver) return `<img${attrs} src="${fromResolver}"`;
        if (baseSlash) {
          const resolved = src.startsWith('/') ? baseSlash + src.slice(1) : baseSlash + src;
          return `<img${attrs} src="${resolved}"`;
        }
        return `<img${attrs} src="${src}"`;
      }
    );
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  protected imageUrl(path: string): string {
    const fromResolver = this.service.resolveImageUrl(path);
    if (fromResolver) return fromResolver;
    const base = this.getEffectiveImageBase();
    if (!base) return path;
    const b = base.endsWith('/') ? base : base + '/';
    return path.startsWith('http') ? path : b + path.replace(/^\//, '');
  }
}
