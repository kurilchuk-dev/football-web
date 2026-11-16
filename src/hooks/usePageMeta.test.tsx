import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePageMeta } from './usePageMeta';

describe('usePageMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="Default">';
    document.title = 'Черкаси ФАМ';
  });
  afterEach(() => {
    document.head.innerHTML = '';
    vi.unstubAllEnvs();
    history.pushState({}, '', '/');
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

  it('adds a canonical link for the current path when the site address is set', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com/');
    history.pushState({}, '', '/matches/');
    const { unmount } = renderHook(() => usePageMeta({ title: 'Матчі' }));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://example.com/matches',
    );
    unmount();
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('uses the bare site address as canonical on the home page', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com');
    renderHook(() => usePageMeta());
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://example.com',
    );
  });

  it('adds no canonical without a site address or on noindex pages', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    renderHook(() => usePageMeta());
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();

    vi.stubEnv('VITE_SITE_URL', 'https://example.com');
    renderHook(() => usePageMeta({ noindex: true }));
    expect(document.querySelector('link[rel="canonical"]')).toBeNull();
  });
});
