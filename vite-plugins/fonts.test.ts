import { describe, expect, it } from 'vitest';
import { fontPreloadTags } from './fonts.ts';

describe('fontPreloadTags', () => {
  it('makes a crossorigin font preload for each file', () => {
    const tags = fontPreloadTags(['assets/a-1.woff2', 'assets/b-2.woff2']);
    expect(tags).toContain(
      '<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/a-1.woff2">',
    );
    expect(tags).toContain('href="/assets/b-2.woff2"');
    expect(tags.match(/<link/g)).toHaveLength(2);
  });

  it('returns nothing for no files', () => {
    expect(fontPreloadTags([])).toBe('');
  });
});
