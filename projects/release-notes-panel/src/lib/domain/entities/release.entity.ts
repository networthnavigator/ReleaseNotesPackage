import type { ReleaseNoteEntity } from './release-note.entity';

/**
 * Aggregate root: a release with version, date and notes.
 * Identity: (version, date) or "draft" when both are null.
 */
export interface ReleaseEntity {
  readonly version: string | null;
  readonly date: string | null;
  readonly notes: readonly ReleaseNoteEntity[];
}

/** Is a released version (has both version and date). */
export function isReleasedRelease(r: ReleaseEntity): boolean {
  return r.version != null && r.date != null;
}
