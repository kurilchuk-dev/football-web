import { LOGO_WIDTH, optimizeImage } from '@/api/image';
import type { StandingRow } from '@/api/types';
import { LEAGUE_NAME, PODIUM_PLACES } from './constants';

/** Layout in CSS pixels; the canvas is drawn at SCALE times that for a sharp picture. */
const WIDTH = 1080;
const SCALE = 2;
const PADDING = 56;
const HEADER_HEIGHT = 230;
const TABLE_HEAD_HEIGHT = 58;
const ROW_HEIGHT = 76;
const FOOTER_HEIGHT = 96;

/** Column centers of the numbers (and the right edge of the team name). */
const COLUMNS = { played: 650, won: 716, drawn: 776, lost: 836, goals: 930, points: 1012 } as const;
const NAME_LEFT = 196;
const NAME_RIGHT = 600;

const LOGO_TIMEOUT_MS = 8000;
const MEDALS = ['#f5c542', '#c4cbd3', '#cd7f32'];

/** The picture always uses the dark palette, whatever theme the visitor has chosen. */
const PALETTE = {
  bg: '#0b0f0d',
  surface: '#111814',
  border: '#223029',
  text: '#f2f5f0',
  muted: '#9aa59e',
};

const BODY_FONT = '"Manrope Variable", system-ui, sans-serif';
const DISPLAY_FONT = '"Unbounded Variable", sans-serif';

export interface StandingsImageOptions {
  /** "станом на 16 листопада 2026 р." */
  dateLabel: string;
  /** Site address printed at the bottom. */
  footer: string;
}

/** Height of the picture in CSS pixels for a table of this many teams. */
export function imageHeight(teamCount: number): number {
  return HEADER_HEIGHT + TABLE_HEAD_HEIGHT + teamCount * ROW_HEIGHT + FOOTER_HEIGHT;
}

/** "turnirna-tablytsia-2026-11-16.png" (the day in the visitor's local time). */
export function imageFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `turnirna-tablytsia-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.png`;
}

/** "+3", "0", "-2" */
export function formatGoalDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** Cuts the text and adds "…" until it fits `maxWidth` (measured by the given function). */
export function ellipsize(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string {
  if (measure(text) <= maxWidth) return text;
  let end = text.length;
  while (end > 1 && measure(`${text.slice(0, end).trimEnd()}…`) > maxWidth) end--;
  return `${text.slice(0, end).trimEnd()}…`;
}

/** Club colors come from the page itself (they are taken from the logo at runtime). */
function readAccent() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const accent = read('--accent', '#ef3e39');
  return {
    accent,
    fill: read('--accent-fill', accent),
    onAccent: read('--on-accent', '#ffffff'),
  };
}

/** Loads a team logo; resolves null when it cannot be loaded in time. */
function loadLogo(url: string | null | undefined): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    // Anonymous CORS, or the canvas could not be exported. A separate cache key, because a plain
    // <img> may already have cached this URL without CORS headers.
    image.crossOrigin = 'anonymous';
    const small = optimizeImage(url, LOGO_WIDTH);
    const timer = setTimeout(() => resolve(null), LOGO_TIMEOUT_MS);
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    image.src = `${small}${small.includes('?') ? '&' : '?'}table`;
  });
}

async function waitForFonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load(`800 40px ${DISPLAY_FONT}`, 'Турнірна таблиця 0123456789'),
    document.fonts.load(`600 28px ${BODY_FONT}`, 'Команда абвгдеєжзиіїйклмн'),
  ]).catch(() => undefined);
}

function draw(
  context: CanvasRenderingContext2D,
  rows: StandingRow[],
  logos: (HTMLImageElement | null)[],
  options: StandingsImageOptions,
) {
  const colors = readAccent();
  const height = imageHeight(rows.length);
  const text = (
    value: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = 'left',
  ) => {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'middle';
    context.fillText(value, x, y);
  };

  context.fillStyle = PALETTE.bg;
  context.fillRect(0, 0, WIDTH, height);
  // A club-colored bar on the left edge, like the site's accent.
  context.fillStyle = colors.fill;
  context.fillRect(0, 0, 14, height);

  text(LEAGUE_NAME.toUpperCase(), PADDING, 74, `700 22px ${BODY_FONT}`, PALETTE.muted);
  text('Турнірна таблиця', PADDING, 132, `800 54px ${DISPLAY_FONT}`, PALETTE.text);
  text(options.dateLabel, PADDING, 190, `600 26px ${BODY_FONT}`, PALETTE.muted);

  // Column titles.
  const headY = HEADER_HEIGHT + TABLE_HEAD_HEIGHT / 2;
  const head = `700 20px ${BODY_FONT}`;
  text('#', PADDING + 36, headY, head, PALETTE.muted, 'center');
  text('КОМАНДА', NAME_LEFT, headY, head, PALETTE.muted);
  for (const [label, x] of [
    ['І', COLUMNS.played],
    ['В', COLUMNS.won],
    ['Н', COLUMNS.drawn],
    ['П', COLUMNS.lost],
    ['М', COLUMNS.goals],
    ['О', COLUMNS.points],
  ] as const) {
    text(label, x, headY, head, PALETTE.muted, 'center');
  }

  rows.forEach((row, index) => {
    const top = HEADER_HEIGHT + TABLE_HEAD_HEIGHT + index * ROW_HEIGHT;
    const middle = top + ROW_HEIGHT / 2;
    const ours = row.team.is_our_team;
    const color = ours ? colors.onAccent : PALETTE.text;
    const quiet = ours ? colors.onAccent : PALETTE.muted;

    // Row background: the club's own row is filled, the others get a thin separator.
    if (ours) {
      context.fillStyle = colors.fill;
      context.beginPath();
      const [x, y, w, h] = [PADDING - 20, top + 4, WIDTH - 2 * PADDING + 40, ROW_HEIGHT - 8];
      // roundRect is missing in older browsers: a plain rectangle is fine there.
      if (typeof context.roundRect === 'function') context.roundRect(x, y, w, h, 18);
      else context.rect(x, y, w, h);
      context.fill();
    } else {
      context.fillStyle = PALETTE.border;
      context.fillRect(PADDING, top + ROW_HEIGHT - 1, WIDTH - 2 * PADDING, 1);
    }

    // Place: the podium gets a medal-colored ring.
    const placeX = PADDING + 36;
    if (row.position <= PODIUM_PLACES) {
      context.strokeStyle = MEDALS[row.position - 1];
      context.lineWidth = 3;
      context.beginPath();
      context.arc(placeX, middle, 22, 0, Math.PI * 2);
      context.stroke();
    }
    text(String(row.position), placeX, middle + 1, `800 24px ${DISPLAY_FONT}`, color, 'center');

    // Logo (fitted into a square) or the first letter in a circle.
    const box = 52;
    const logoX = NAME_LEFT - box - 14;
    const logo = logos[index];
    if (logo && logo.naturalWidth > 0) {
      const ratio = Math.min(box / logo.naturalWidth, box / logo.naturalHeight);
      const w = logo.naturalWidth * ratio;
      const h = logo.naturalHeight * ratio;
      context.drawImage(logo, logoX + (box - w) / 2, middle - h / 2, w, h);
    } else {
      context.fillStyle = ours ? 'rgba(255,255,255,0.22)' : PALETTE.border;
      context.beginPath();
      context.arc(logoX + box / 2, middle, box / 2 - 4, 0, Math.PI * 2);
      context.fill();
      text(
        row.team.name.charAt(0).toUpperCase(),
        logoX + box / 2,
        middle + 1,
        `700 22px ${BODY_FONT}`,
        color,
        'center',
      );
    }

    const nameFont = `${ours ? 800 : 600} 28px ${BODY_FONT}`;
    context.font = nameFont;
    const name = ellipsize(
      row.team.name,
      NAME_RIGHT - NAME_LEFT,
      (t) => context.measureText(t).width,
    );
    text(name, NAME_LEFT, middle + 1, nameFont, color);

    const num = `600 28px ${BODY_FONT}`;
    text(String(row.played), COLUMNS.played, middle + 1, num, color, 'center');
    text(String(row.won), COLUMNS.won, middle + 1, num, quiet, 'center');
    text(String(row.drawn), COLUMNS.drawn, middle + 1, num, quiet, 'center');
    text(String(row.lost), COLUMNS.lost, middle + 1, num, quiet, 'center');
    text(`${row.goals_for}:${row.goals_against}`, COLUMNS.goals, middle + 1, num, quiet, 'center');
    text(String(row.points), COLUMNS.points, middle + 1, `800 34px ${BODY_FONT}`, color, 'center');
  });

  text(
    options.footer,
    WIDTH / 2,
    height - FOOTER_HEIGHT / 2 + 4,
    `600 24px ${BODY_FONT}`,
    PALETTE.muted,
    'center',
  );
}

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('empty image'))),
        'image/png',
      );
    } catch (error) {
      reject(error);
    }
  });
}

/** Draws the table as a PNG picture ready to be saved or shared. */
export async function renderStandingsImage(
  rows: StandingRow[],
  options: StandingsImageOptions,
): Promise<Blob> {
  await waitForFonts();
  const logos = await Promise.all(rows.map((row) => loadLogo(row.team.logo)));

  const render = (images: (HTMLImageElement | null)[]) => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH * SCALE;
    canvas.height = imageHeight(rows.length) * SCALE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas is not supported');
    context.scale(SCALE, SCALE);
    draw(context, rows, images, options);
    return toBlob(canvas);
  };

  try {
    return await render(logos);
  } catch {
    // A logo without CORS headers makes the canvas unexportable: draw the letters instead.
    return render(rows.map(() => null));
  }
}
