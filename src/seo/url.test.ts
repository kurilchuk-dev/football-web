import { describe, expect, it } from 'vitest';
import { canonicalUrl, isSamePage } from './url';

describe('addresses', () => {
  it('keeps a slash only on the home page', () => {
    expect(canonicalUrl('https://a.ua', '/')).toBe('https://a.ua/');
    expect(canonicalUrl('https://a.ua', '/matches/')).toBe('https://a.ua/matches');
  });

  it('knows whether the built HTML belongs to the address', () => {
    expect(isSamePage('/matches', '/matches/')).toBe(true);
    expect(isSamePage('/', '/')).toBe(true);
    expect(isSamePage('/', '/nope')).toBe(false);
    expect(isSamePage(undefined, '/')).toBe(false);
  });
});
