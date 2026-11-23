import { beforeEach, describe, expect, it } from 'vitest';
import { insertPreloadScript, preloadScript } from './preload.ts';

const options = {
  apiUrl: 'https://api.example.com/api/',
  routes: { '/': ['/teams/', '/matches/upcoming/'], '/team': ['/teams/'] },
  freshMs: 120_000,
  storageKey: 'cache',
};

const run = () => new Function(preloadScript(options))();
const hrefs = () =>
  [...document.head.querySelectorAll('link[rel="preload"]')].map((l) => l.getAttribute('href'));

beforeEach(() => {
  document.head.innerHTML = '';
  localStorage.clear();
  history.pushState({}, '', '/');
});

describe('preloadScript', () => {
  it('starts the requests of the current route as cors fetch preloads', () => {
    run();
    expect(hrefs()).toEqual([
      'https://api.example.com/api/teams/',
      'https://api.example.com/api/matches/upcoming/',
    ]);
    const link = document.head.querySelector('link')!;
    expect(link.getAttribute('as')).toBe('fetch');
    expect(link.getAttribute('crossorigin')).toBe('anonymous');
  });

  it('ignores a trailing slash in the page address', () => {
    history.pushState({}, '', '/team/');
    run();
    expect(hrefs()).toEqual(['https://api.example.com/api/teams/']);
  });

  it('does nothing for an unknown route', () => {
    history.pushState({}, '', '/nope');
    run();
    expect(hrefs()).toEqual([]);
  });

  it('skips the preload while the saved data is still fresh', () => {
    localStorage.setItem('cache', JSON.stringify({ timestamp: Date.now(), buster: 'v1' }));
    run();
    expect(hrefs()).toEqual([]);
  });

  it('preloads when the fresh saved data belongs to another build', () => {
    const saved = JSON.stringify({ buster: 'old', timestamp: Date.now() });
    localStorage.setItem('cache', saved);
    new Function(preloadScript({ ...options, buster: 'new' }))();
    expect(hrefs()).toHaveLength(2);

    document.head.innerHTML = '';
    localStorage.setItem('cache', JSON.stringify({ buster: 'new', timestamp: Date.now() }));
    new Function(preloadScript({ ...options, buster: 'new' }))();
    expect(hrefs()).toEqual([]);
  });

  it('preloads when the saved data is old or unreadable', () => {
    localStorage.setItem('cache', JSON.stringify({ timestamp: Date.now() - 10 * 60_000 }));
    run();
    expect(hrefs()).toHaveLength(2);

    document.head.innerHTML = '';
    localStorage.setItem('cache', 'not json');
    run();
    expect(hrefs()).toHaveLength(2);
  });
});

describe('insertPreloadScript', () => {
  it('puts the script right after <meta charset>, before everything else', () => {
    const html = '<head><meta charset="UTF-8" /><link rel="stylesheet" href="a.css"></head>';
    const result = insertPreloadScript(html, 'go()');
    expect(result.indexOf('<script>go()</script>')).toBeGreaterThan(
      result.indexOf('<meta charset'),
    );
    expect(result.indexOf('<script>go()</script>')).toBeLessThan(result.indexOf('<link'));
  });

  it('leaves the page alone when there is no <meta charset>', () => {
    expect(insertPreloadScript('<head></head>', 'go()')).toBe('<head></head>');
  });
});
