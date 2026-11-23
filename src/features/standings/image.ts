import { LOGO_WIDTH } from '@/api/image';
import type { StandingRow } from '@/api/types';
import {
  BODY_FONT,
  DISPLAY_FONT,
  PALETTE,
  drawLinkPill,
  ellipsize,
  loadImage,
  readAccent,
  roundedRectPath,
  toBlob,
} from '@/lib/canvas';
import { LEAGUE_NAME, PODIUM_PLACES } from './constants';

/** Layout in CSS pixels; the canvas is drawn at SCALE times that for a sharp picture. */
const WIDTH = 1080;
const SCALE = 2;
const PADDING = 56;
const HEADER_HEIGHT = 230;
const TABLE_HEAD_HEIGHT = 58;
const ROW_HEIGHT = 76;
const FOOTER_HEIGHT = 56;

/** Column centers of the numbers (and the right edge of the team name). */
const COLUMNS = { played: 650, won: 716, drawn: 776, lost: 836, goals: 930, points: 1012 } as const;
const NAME_LEFT = 196;
const NAME_RIGHT = 600;

const MEDALS = ['#f5c542', '#c4cbd3', '#cd7f32'];

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

export { ellipsize };

/** "+3", "0", "-2" */
export function formatGoalDifference(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

/** Loads a team logo; resolves null when it cannot be loaded in time. */
const loadLogo = (url: string | null | undefined) => loadImage(url, LOGO_WIDTH, 'table');

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
  // The site address at the top right, inside the margins, away from the edges that get cropped.
  drawLinkPill(context, options.footer, WIDTH - PADDING, 74, {
    size: 22,
    fill: PALETTE.surface,
    color: PALETTE.text,
    border: PALETTE.border,
    maxWidth: 400,
    align: 'right',
  });
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
      roundedRectPath(context, PADDING - 20, top + 4, WIDTH - 2 * PADDING + 40, ROW_HEIGHT - 8, 18);
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
