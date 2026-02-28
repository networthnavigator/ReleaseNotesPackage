import type { ReleaseEntity } from '../entities/release.entity';

/** Aggregate: the full release notes data (list of releases). */
export interface ReleaseNotesAggregate {
  readonly releases: readonly ReleaseEntity[];
}
