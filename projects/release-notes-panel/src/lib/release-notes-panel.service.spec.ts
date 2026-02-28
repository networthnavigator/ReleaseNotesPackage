import { TestBed } from '@angular/core/testing';

import { ReleaseNotesPanelService } from './release-notes-panel.service';

describe('ReleaseNotesPanelService', () => {
  let service: ReleaseNotesPanelService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReleaseNotesPanelService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
