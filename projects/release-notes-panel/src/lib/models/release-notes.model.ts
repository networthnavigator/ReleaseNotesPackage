/**
 * Public DTOs / model (backward compatibility).
 * Aligned with domain entities.
 */
export type { NoteType } from '../domain/value-objects/note-type.vo';
export type { ReleaseNoteEntity as ReleaseNote } from '../domain/entities/release-note.entity';
export type { ReleaseEntity as Release } from '../domain/entities/release.entity';
export type { ReleaseNotesAggregate as ReleaseNotesData } from '../domain/aggregates/release-notes.aggregate';
