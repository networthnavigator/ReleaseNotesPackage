import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleaseNotesPanelComponent } from './release-notes-panel.component';

describe('ReleaseNotesPanelComponent', () => {
  let component: ReleaseNotesPanelComponent;
  let fixture: ComponentFixture<ReleaseNotesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseNotesPanelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReleaseNotesPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
