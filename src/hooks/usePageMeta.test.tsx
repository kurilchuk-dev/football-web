import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PageMeta } from '@/seo/pageMeta';
import { usePageMeta } from './usePageMeta';

const meta: PageMeta = { title: 'Матчі', description: 'List', path: '/matches' };
const render = (value: PageMeta) =>
  renderHook((props: PageMeta) => usePageMeta(props), { initialProps: value });
const canonical = () => document.querySelector('link[rel="canonical"]')?.getAttribute('href');
const content = (selector: string) => document.querySelector(selector)?.getAttribute('content');

describe('usePageMeta', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="description" content="Default">';
  });
  afterEach(() => {
    document.head.innerHTML = '';
    vi.unstubAllEnvs();
  });

  it('sets the title, the description and the social preview texts', () => {
    render(meta);
    expect(document.title).toBe('Матчі');
    expect(content('meta[name="description"]')).toBe('List');
    expect(content('meta[property="og:title"]')).toBe('Матчі');
    expect(content('meta[property="og:description"]')).toBe('List');
  });

  it('adds noindex and removes it on the next page', () => {
    const { rerender } = render({ ...meta, noindex: true });
    expect(content('meta[name="robots"]')).toBe('noindex');
    rerender(meta);
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('keeps one canonical link, with a slash only on the home page', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://example.com/');
    const { rerender } = render(meta);
    expect(canonical()).toBe('https://example.com/matches');
    expect(content('meta[property="og:url"]')).toBe('https://example.com/matches');
    rerender({ ...meta, path: '/' });
    expect(canonical()).toBe('https://example.com/');
    expect(document.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  });

  it('adds no canonical without a site address or on noindex pages', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    const { rerender } = render(meta);
    expect(canonical()).toBeUndefined();
    vi.stubEnv('VITE_SITE_URL', 'https://example.com');
    rerender({ ...meta, title: 'x', noindex: true });
    expect(canonical()).toBeUndefined();
  });

  it('replaces the structured data of the previous page', () => {
    const { rerender } = render({ ...meta, jsonLd: [{ '@type': 'A' }] });
    rerender({ ...meta, jsonLd: [{ '@type': 'B' }] });
    const scripts = document.querySelectorAll('script[data-page-ld]');
    expect(scripts).toHaveLength(1);
    expect(scripts[0].textContent).toBe('{"@type":"B"}');
  });
});
