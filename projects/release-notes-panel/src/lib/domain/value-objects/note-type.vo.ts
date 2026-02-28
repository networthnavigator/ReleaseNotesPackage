/** Value object: type of a release note (NEW, UPDATE, BUG). */
export type NoteType = 'NEW' | 'UPDATE' | 'BUG';

export const NOTE_TYPES: NoteType[] = ['NEW', 'UPDATE', 'BUG'];

export function isNoteType(value: string): value is NoteType {
  return NOTE_TYPES.includes(value as NoteType);
}
