import type { ReleaseNotesAggregate } from '../../domain/aggregates/release-notes.aggregate';

/** Port (interface): load release notes from a source. Infrastructure implements this. */
export interface LoadReleaseNotesPort {
  load(url: string): Promise<ReleaseNotesAggregate | null>;
}
