import { describe, expect, it } from 'vitest';
import { optimizeImage } from './image';

describe('optimizeImage', () => {
  it('adds format, quality and width to a Cloudinary upload URL', () => {
    expect(
      optimizeImage('https://res.cloudinary.com/demo/image/upload/v1/media/team_logos/a_b1', 176),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_176/v1/media/team_logos/a_b1',
    );
  });

  it('leaves other URLs untouched', () => {
    const local = 'http://localhost:8000/media/team_logos/a.png';
    expect(optimizeImage(local, 176)).toBe(local);
    const other = 'https://example.com/image/upload/a.png';
    expect(optimizeImage(other, 176)).toBe(other);
  });
});
