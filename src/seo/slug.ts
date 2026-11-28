const LETTERS: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'h',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'ie',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: '',
  ю: 'iu',
  я: 'ia',
};

/** "Черкаські Козаки" -> "cherkaski-kozaky" */
export function slugify(text: string): string {
  return Array.from(text.toLowerCase(), (char) => LETTERS[char] ?? char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The id comes first, so an address keeps working after a team is renamed: only the id is read,
 * and the canonical link points to the current spelling.
 */
export function matchPath(match: {
  id: number;
  home_team: { name: string };
  away_team: { name: string };
}): string {
  return `/matches/${match.id}-${slugify(`${match.home_team.name} ${match.away_team.name}`)}`;
}

export function teamPath(team: { id: number; name: string }): string {
  return `/teams/${team.id}-${slugify(team.name)}`;
}

/** The id at the start of an address part ("12-temp-bars" -> 12); null if there is none. */
export function idFromSlug(slug: string | undefined): number | null {
  const found = /^(\d+)(-|$)/.exec(slug ?? '');
  return found ? Number(found[1]) : null;
}
