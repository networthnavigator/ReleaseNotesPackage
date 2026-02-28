/*
 * Public API Surface of release-notes-panel
 */

export {
  ReleaseNotesPanelService,
  ReleaseNotesService,
} from './lib/release-notes-panel.service';
export * from './lib/release-notes-panel.component';
export * from './lib/models/release-notes.model';
export type { LoadReleaseNotesPort } from './lib/application/ports/load-release-notes.port';
export { FetchReleaseNotesAdapter } from './lib/infrastructure/adapters/fetch-release-notes.adapter';
