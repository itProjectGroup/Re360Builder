import { TestBed } from '@angular/core/testing';

import { HotspotInfoService } from './hotspot-info.service';

describe('HotspotInfoService', () => {
  let service: HotspotInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HotspotInfoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
