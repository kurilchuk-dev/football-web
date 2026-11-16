import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { usePageMeta } from './usePageMeta';

describe('usePageMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="Default">';
    document.title = 'Черкаси ФАМ';
  });
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('sets the title and description and restores them on unmount', () => {
    const { unmount } = renderHook(() => usePageMeta({ title: 'Матчі', description: 'List' }));
    expect(document.title).toBe('Матчі · Черкаси ФАМ');
    expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toBe(
      'List',
    );

    unmount();
    expect(document.title).toBe('Черкаси ФАМ');
    expect(document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content).toBe(
      'Default',
    );
  });

  it('uses just the site name without a title', () => {
    renderHook(() => usePageMeta());
    expect(document.title).toBe('Черкаси ФАМ');
  });

  it('adds a noindex robots tag and removes it on unmount', () => {
    const { unmount } = renderHook(() => usePageMeta({ title: 'Не знайдено', noindex: true }));
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
    unmount();
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });
});
