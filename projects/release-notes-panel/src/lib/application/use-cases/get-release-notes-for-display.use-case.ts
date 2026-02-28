import type { ReleaseEntity } from '../../domain/entities/release.entity';
import { isReleasedRelease } from '../../domain/entities/release.entity';
import type { ReleaseNotesAggregate } from '../../domain/aggregates/release-notes.aggregate';
import { compareVersions } from '../../domain/value-objects/version.vo';

/** Output DTO for the display use case. */
export interface ReleaseNotesForDisplay {
  pastReleases: ReleaseEntity[];
  newerReleases: ReleaseEntity[];
}

/**
 * Use case: get release notes grouped by current app version.
 * Past = released versions <= currentVersion; Newer = released versions > currentVersion.
 * Both lists are ordered latest first (version desc, then date desc).
 */
export function getReleaseNotesForDisplay(
  data: ReleaseNotesAggregate | null,
  currentVersion: string | null
): ReleaseNotesForDisplay {
  if (!data?.releases?.length) {
    return { pastReleases: [], newerReleases: [] };
  }
  const released = data.releases.filter((r): r is ReleaseEntity => isReleasedRelease(r)) as ReleaseEntity[];
  released.sort((a, b) => {
    const v = compareVersions(b.version ?? '', a.version ?? '');
    if (v !== 0) return v;
    return (b.date ?? '').localeCompare(a.date ?? '');
  });
  if (!currentVersion) {
    return { pastReleases: [...released], newerReleases: [] };
  }
  const pastReleases = released.filter((r) => compareVersions(r.version!, currentVersion) <= 0);
  const newerReleases = released.filter((r) => compareVersions(r.version!, currentVersion) > 0);
  return { pastReleases, newerReleases };
}
