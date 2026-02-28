import type { NoteType } from '../value-objects/note-type.vo';

/** Entity: a single release note (id is identity). Body is Markdown (note_md). */
export interface ReleaseNoteEntity {
  readonly id: string;
  readonly type: NoteType;
  readonly title: string;
  /** Markdown content. Legacy: "content" is accepted when loading. */
  readonly note_md: string;
  readonly images?: readonly string[];
}
