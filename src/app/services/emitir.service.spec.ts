import { TestBed } from '@angular/core/testing';

import { EmitirService } from './emitir.service';

describe('EmitirService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EmitirService = TestBed.get(EmitirService);
    expect(service).toBeTruthy();
  });
});
