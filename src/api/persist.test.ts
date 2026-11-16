import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPersister } from './persist';

afterEach(() => vi.unstubAllGlobals());

describe('createPersister', () => {
  it('works when localStorage is available', () => {
    expect(createPersister()).toHaveProperty('persistClient');
  });

  it('does not throw when localStorage is blocked', () => {
    vi.stubGlobal('localStorage', undefined);
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    expect(() => createPersister()).not.toThrow();
  });
});
