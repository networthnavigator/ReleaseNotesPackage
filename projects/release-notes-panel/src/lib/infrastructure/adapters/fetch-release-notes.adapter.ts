import { Injectable } from '@angular/core';
import type { LoadReleaseNotesPort } from '../../application/ports/load-release-notes.port';
import type { ReleaseNotesAggregate } from '../../domain/aggregates/release-notes.aggregate';

/** Infrastructure adapter: load release notes via HTTP fetch. */
@Injectable({ providedIn: 'root' })
export class FetchReleaseNotesAdapter implements LoadReleaseNotesPort {
  async load(url: string): Promise<ReleaseNotesAggregate | null> {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data?.releases && Array.isArray(data.releases)) return data as ReleaseNotesAggregate;
      return null;
    } catch {
      return null;
    }
  }
}
