import { LOGO_WIDTH, TEAM_PHOTO_WIDTH } from '@/api/image';
import type { Match } from '@/api/types';
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
import { DATE_TBD, TIME_TBD, formatDayHeading, formatMatchTime, hasDate, hasTime } from './utils';

/** Layout in CSS pixels; the canvas is drawn at SCALE times that for a sharp picture. */
const WIDTH = 1080;
const HEIGHT = 1350;
const SCALE = 2;
const PADDING = 56;
/** The two team photos sit side by side, split by a thin line in the middle. */
const SPLIT_X = WIDTH / 2;
const SPLIT_GAP = 4;
const LOGO_CENTERS = [250, 830] as const;
/** The center circle of the pitch, with "VS" inside. */
const CENTER_RADIUS = 122;
/** The photo band: below the header, so the title does not cover the heads. */
const PHOTO_TOP = 165;

interface Layout {
  /** At least one team has a photo: the photo stage is shown and the crests sit on its lower edge. */
  photos: boolean;
  /** Height of the photo stage (0 without photos). */
  stage: number;
  /** Vertical middle of the crests. */
  logoY: number;
  /** The crest is fitted into this square inside the plate. */
  logoFit: number;
  /** Vertical middle of the team names. */
  nameY: number;
}

/** With photos the top part is given to them. Without any photo no room is kept for them. */
const WITH_PHOTOS: Layout = {
  photos: true,
  stage: 525,
  logoY: 705,
  logoFit: 220,
  nameY: 858,
};
const WITHOUT_PHOTOS: Layout = {
  photos: false,
  stage: 0,
  logoY: 520,
  logoFit: 310,
  nameY: 785,
};

const hasPicture = (image: HTMLImageElement | null) => Boolean(image && image.naturalWidth > 0);

const CARD = { x: PADDING, y: 985, width: WIDTH - 2 * PADDING, height: 240, cut: 26 };
const TIME_BLOCK_X = 640;

type Context = CanvasRenderingContext2D;
type Colors = ReturnType<typeof readAccent>;
type Pictures = (HTMLImageElement | null)[];

export interface AnnouncementOptions {
  /** Name of the competition, printed at the top. */
  leagueName: string;
  /** Site address printed at the bottom. */
  footer: string;
}

/** "anons-matchu-2026-11-14.png" (or the match id while the date is not set). */
export function announcementFileName(match: Pick<Match, 'id' | 'date'>): string {
  return `anons-matchu-${match.date ?? match.id}.png`;
}

/** "ВІВТОРОК" and "10 ЛИСТОПАДА" from "вівторок, 10 листопада". */
export function splitDayHeading(heading: string): { weekday: string; date: string } {
  const [weekday, ...rest] = heading.split(', ');
  return { weekday: weekday.toUpperCase(), date: rest.join(', ').toUpperCase() };
}

/** Breaks the text into at most `maxLines` lines that fit `maxWidth`; a cut end gets "…". */
export function wrapLines(
  text: string,
  maxWidth: number,
  maxLines: number,
  measure: (text: string) => number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (let index = 0; index < words.length; index++) {
    const candidate = current ? `${current} ${words[index]}` : words[index];
    if (current && measure(candidate) > maxWidth) {
      if (lines.length === maxLines - 1) {
        // The rest does not fit on the last line: keep it all there and shorten it.
        return [...lines, ellipsize([current, ...words.slice(index)].join(' '), maxWidth, measure)];
      }
      lines.push(current);
      current = words[index];
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(ellipsize(current, maxWidth, measure));
  return lines;
}

async function waitForFonts() {
  if (!document.fonts) return;
  await Promise.all([
    document.fonts.load(`800 40px ${DISPLAY_FONT}`, 'АНОНС МАТЧУ 0123456789:'),
    document.fonts.load(`700 24px ${BODY_FONT}`, 'Чемпіонат абвгдеєжзиіїйклмн'),
  ]).catch(() => undefined);
}

/** "#rrggbb" or "rgb(...)" with an alpha channel; other formats are returned unchanged. */
function withAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex) {
    const value = parseInt(hex[1], 16);
    return `rgba(${value >> 16},${(value >> 8) & 255},${value & 255},${alpha})`;
  }
  const rgb = /^rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(color);
  return rgb ? `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})` : color;
}

function text(
  context: Context,
  value: string,
  x: number,
  y: number,
  font: string,
  color: string,
  align: CanvasTextAlign = 'left',
  spacing = 0,
) {
  const spaced = context as Context & { letterSpacing?: string };
  context.font = font;
  context.fillStyle = color;
  context.textAlign = align;
  context.textBaseline = 'middle';
  if ('letterSpacing' in spaced) spaced.letterSpacing = `${spacing}px`;
  context.fillText(value, x, y);
  if ('letterSpacing' in spaced) spaced.letterSpacing = '0px';
}

/** Polygon with two opposite corners cut off (the same "cut" shape the site cards have). */
function cutPath(context: Context, x: number, y: number, w: number, h: number, cut: number) {
  context.beginPath();
  context.moveTo(x + cut, y);
  context.lineTo(x + w, y);
  context.lineTo(x + w, y + h - cut);
  context.lineTo(x + w - cut, y + h);
  context.lineTo(x, y + h);
  context.lineTo(x, y + cut);
  context.closePath();
}

/**
 * Draws the picture so that it covers the box completely (the overflow is cropped).
 * `focusY` is which part of the cropped height stays: 0 the top, 0.5 the middle, 1 the bottom.
 */
function drawCover(
  context: Context,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  focusY = 0.5,
) {
  const ratio = Math.max(w / image.naturalWidth, h / image.naturalHeight);
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  context.drawImage(
    image,
    x + (w - drawWidth) / 2,
    y + (h - drawHeight) * focusY,
    drawWidth,
    drawHeight,
  );
}

/** Alternating light and dark bands, like the stripes of a freshly mown pitch. */
function drawStripes(context: Context, top: number, height: number) {
  context.fillStyle = PALETTE.surface;
  context.fillRect(0, top, WIDTH, height);
  context.fillStyle = 'rgba(255,255,255,0.028)';
  for (let x = 0; x < WIDTH; x += 180) context.fillRect(x, top, 90, height);
}

/** The picture blurred to fill the box (shrinking it and stretching it back is a cheap blur). */
function drawBlurredFill(
  context: Context,
  image: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const small = document.createElement('canvas');
  small.width = 36;
  small.height = Math.max(1, Math.round((36 * h) / w));
  const smallContext = small.getContext('2d');
  if (!smallContext) return;
  drawCover(smallContext, image, 0, 0, small.width, small.height);
  context.save();
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(small, x, y, w, h);
  context.fillStyle = 'rgba(11,15,13,0.45)';
  context.fillRect(x, y, w, h);
  context.restore();
}

/**
 * One team photo in its half of the band. The whole photo is shown, whatever its proportions:
 * it is fitted into the box and the leftover space is filled with a blurred copy of itself.
 */
function drawHalf(
  context: Context,
  side: 'home' | 'away',
  photo: HTMLImageElement | null,
  stage: number,
) {
  const x = side === 'home' ? 0 : SPLIT_X + SPLIT_GAP / 2;
  const w = SPLIT_X - SPLIT_GAP / 2;
  const y = PHOTO_TOP;
  const h = stage - PHOTO_TOP;
  context.save();
  context.beginPath();
  context.rect(x, y, w, h);
  context.clip();
  if (photo && hasPicture(photo)) {
    drawBlurredFill(context, photo, x, y, w, h);
    const ratio = Math.min(w / photo.naturalWidth, h / photo.naturalHeight);
    const drawWidth = photo.naturalWidth * ratio;
    const drawHeight = photo.naturalHeight * ratio;
    context.drawImage(
      photo,
      x + (w - drawWidth) / 2,
      y + (h - drawHeight) / 2,
      drawWidth,
      drawHeight,
    );
  } else {
    // This team has no photo: quiet stripes, the other half keeps its photo.
    drawStripes(context, y, h);
  }
  context.restore();
}

/** Two soft beams of light from the top corners, like stadium floodlights. */
function drawFloodlights(context: Context) {
  context.save();
  context.globalCompositeOperation = 'lighter';
  const beams = [
    { from: 70, to: 360 },
    { from: WIDTH - 70, to: WIDTH - 360 },
  ];
  for (const { from, to } of beams) {
    const gradient = context.createLinearGradient(0, 0, 0, 900);
    gradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(from - 40, 0);
    context.lineTo(from + 40, 0);
    context.lineTo(to + 300, 900);
    context.lineTo(to - 300, 900);
    context.closePath();
    context.fill();
  }
  context.restore();
}

/** Neutral steel, used for a crest that has no clear color of its own (black and white). */
const NEUTRAL_TINT = '#7f93a8';

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let hue =
    max === rn
      ? (gn - bn) / d + (gn < bn ? 6 : 0)
      : max === gn
        ? (bn - rn) / d + 2
        : (rn - gn) / d + 4;
  hue *= 60;
  return [hue, sat, l];
}

function hslToHex(h: number, sat: number, l: number): string {
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const value = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * The main color of a crest as "#rrggbb", brightened so that it shows on a dark poster; null when
 * the crest is black and white (or cannot be read), then a neutral tone is used instead.
 */
export function dominantTint(image: HTMLImageElement | null): string | null {
  if (!image || !hasPicture(image)) return null;
  try {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return null;
    const ratio = Math.min(size / image.naturalWidth, size / image.naturalHeight);
    const w = image.naturalWidth * ratio;
    const h = image.naturalHeight * ratio;
    context.drawImage(image, (size - w) / 2, (size - h) / 2, w, h);
    const { data } = context.getImageData(0, 0, size, size);

    // Pixels are grouped by hue (12 groups); the group with the most saturated, bright area wins.
    const groups = Array.from({ length: 12 }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
    let opaque = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 200) continue;
      opaque++;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      if (saturation < 0.35 || max < 55) continue;
      const [hue] = rgbToHsl(r, g, b);
      const weight = saturation * (max / 255);
      const group = groups[Math.floor(hue / 30) % 12];
      group.weight += weight;
      group.r += r * weight;
      group.g += g * weight;
      group.b += b * weight;
    }
    const best = groups.reduce((top, group) => (group.weight > top.weight ? group : top));
    if (opaque === 0 || best.weight < opaque * 0.025) return null;
    const [hue] = rgbToHsl(best.r / best.weight, best.g / best.weight, best.b / best.weight);
    return hslToHex(hue, 0.75, 0.5);
  } catch {
    return null;
  }
}

/**
 * A stadium at night, lit in the colors of the two crests: the left side takes the color of the
 * first team, the right side the color of the second. A dark sky, the grass in perspective, a pool
 * of floodlight on the pitch and a fine grain for a printed, premium feel.
 */
function drawStadium(context: Context, tints: [string, string], layout: Layout) {
  const bottom = CARD.y;
  const horizon = layout.photos ? 470 : 300;
  const [left, right] = tints;

  // The dark night.
  const base = context.createLinearGradient(0, 0, 0, bottom);
  base.addColorStop(0, '#05070a');
  base.addColorStop(0.5, '#090c11');
  base.addColorStop(1, '#07090d');
  context.fillStyle = base;
  context.fillRect(0, 0, WIDTH, bottom);

  // Each side glows in the color of its team.
  for (const [index, tint] of [left, right].entries()) {
    const x = LOGO_CENTERS[index];
    const glow = context.createRadialGradient(x, layout.logoY, 0, x, layout.logoY, 620);
    glow.addColorStop(0, withAlpha(tint, 0.5));
    glow.addColorStop(0.55, withAlpha(tint, 0.16));
    glow.addColorStop(1, withAlpha(tint, 0));
    context.fillStyle = glow;
    context.fillRect(0, 0, WIDTH, bottom);
  }

  // Mown stripes in perspective: wedges that fan out from a point on the horizon.
  const wedge = 170;
  context.save();
  context.beginPath();
  context.rect(0, horizon, WIDTH, bottom - horizon);
  context.clip();
  context.fillStyle = 'rgba(255,255,255,0.05)';
  for (let i = -9; i < 9; i += 2) {
    context.beginPath();
    context.moveTo(WIDTH / 2, horizon - 40);
    context.lineTo(WIDTH / 2 + i * wedge, bottom);
    context.lineTo(WIDTH / 2 + (i + 1) * wedge, bottom);
    context.closePath();
    context.fill();
  }
  // A haze over the horizon, so the pitch comes out of the dark instead of starting on a line.
  const haze = context.createLinearGradient(0, horizon, 0, horizon + 200);
  haze.addColorStop(0, 'rgba(7,9,13,0.9)');
  haze.addColorStop(1, 'rgba(7,9,13,0)');
  context.fillStyle = haze;
  context.fillRect(0, horizon, WIDTH, 200);
  context.restore();

  // The pool of floodlight on the grass, an ellipse under the crests.
  context.save();
  context.translate(WIDTH / 2, layout.logoY + 150);
  context.scale(1, 0.4);
  const pool = context.createRadialGradient(0, 0, 0, 0, 0, 560);
  pool.addColorStop(0, 'rgba(255,255,255,0.16)');
  pool.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  pool.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = pool;
  context.fillRect(-WIDTH, -800, 2 * WIDTH, 1600);
  context.restore();

  // A wide diagonal glint that runs from one team color to the other.
  context.save();
  context.beginPath();
  context.rect(0, 0, WIDTH, bottom);
  context.clip();
  const glint = context.createLinearGradient(0, 0, WIDTH, 0);
  glint.addColorStop(0, withAlpha(left, 0));
  glint.addColorStop(0.3, withAlpha(left, 0.2));
  glint.addColorStop(0.7, withAlpha(right, 0.2));
  glint.addColorStop(1, withAlpha(right, 0));
  context.fillStyle = glint;
  context.beginPath();
  context.moveTo(0, bottom - 120);
  context.lineTo(WIDTH, bottom - 420);
  context.lineTo(WIDTH, bottom - 330);
  context.lineTo(0, bottom + 10);
  context.closePath();
  context.fill();
  context.restore();

  // A fine grain (the same dots every time, so the picture does not flicker between exports).
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  context.fillStyle = 'rgba(255,255,255,0.045)';
  for (let i = 0; i < 3200; i++) context.fillRect(random() * WIDTH, random() * bottom, 1.6, 1.6);

  // The center circle holds the "VS"; its ring runs from one team color to the other.
  context.beginPath();
  context.arc(WIDTH / 2, layout.logoY, CENTER_RADIUS, 0, Math.PI * 2);
  context.fillStyle = 'rgba(5,7,10,0.82)';
  context.fill();
  const ring = context.createLinearGradient(
    WIDTH / 2 - CENTER_RADIUS,
    0,
    WIDTH / 2 + CENTER_RADIUS,
    0,
  );
  ring.addColorStop(0, left);
  ring.addColorStop(1, right);
  context.strokeStyle = ring;
  context.lineWidth = 4;
  context.stroke();
}

/** A simple football: a white ball with a dark pentagon and the seams running to its edge. */
function drawBall(context: Context, cx: number, cy: number, radius: number) {
  context.save();
  context.fillStyle = PALETTE.text;
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = PALETTE.bg;
  context.fillStyle = PALETTE.bg;
  context.lineWidth = Math.max(1.5, radius * 0.09);
  context.lineJoin = 'round';
  const corners = Array.from({ length: 5 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return {
      angle,
      x: cx + Math.cos(angle) * radius * 0.4,
      y: cy + Math.sin(angle) * radius * 0.4,
    };
  });
  context.beginPath();
  corners.forEach((c, i) => (i === 0 ? context.moveTo(c.x, c.y) : context.lineTo(c.x, c.y)));
  context.closePath();
  context.fill();
  for (const c of corners) {
    context.beginPath();
    context.moveTo(c.x, c.y);
    context.lineTo(cx + Math.cos(c.angle) * radius * 0.92, cy + Math.sin(c.angle) * radius * 0.92);
    context.stroke();
  }
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.stroke();
  context.restore();
}

function drawBackground(
  context: Context,
  photos: Pictures,
  colors: Colors,
  layout: Layout,
  tints: [string, string],
) {
  const { stage, logoY } = layout;
  context.fillStyle = PALETTE.bg;
  context.fillRect(0, 0, WIDTH, HEIGHT);
  drawStadium(context, tints, layout);
  drawFloodlights(context);

  if (layout.photos) {
    drawStripes(context, 0, PHOTO_TOP);
    drawHalf(context, 'home', photos[0], stage);
    drawHalf(context, 'away', photos[1], stage);

    // A short fade at the bottom edge of the band; the photos themselves stay untouched.
    const fade = context.createLinearGradient(0, stage - 60, 0, stage + 24);
    fade.addColorStop(0, withAlpha(PALETTE.bg, 0));
    fade.addColorStop(1, PALETTE.bg);
    context.fillStyle = fade;
    context.fillRect(0, stage - 60, WIDTH, 84);

    // A club-colored line between the two photos.
    context.save();
    context.shadowColor = colors.accent;
    context.shadowBlur = 20;
    context.fillStyle = colors.fill;
    context.fillRect(SPLIT_X - SPLIT_GAP / 2, PHOTO_TOP, SPLIT_GAP, stage - PHOTO_TOP);
    context.restore();
  } else {
    // No photos at all: the stadium takes the whole space, nothing is reserved for them.

    // The top gets a shade for the header text.
    const top = context.createLinearGradient(0, 0, 0, 260);
    top.addColorStop(0, withAlpha(PALETTE.bg, 0.8));
    top.addColorStop(1, withAlpha(PALETTE.bg, 0));
    context.fillStyle = top;
    context.fillRect(0, 0, WIDTH, 260);
  }

  // A soft light behind both crests, like a spotlight.
  for (const x of LOGO_CENTERS) {
    const glow = context.createRadialGradient(x, logoY, 0, x, logoY, 260);
    glow.addColorStop(0, 'rgba(255,255,255,0.1)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    context.fillStyle = glow;
    context.fillRect(0, logoY - 300, WIDTH, 600);
  }

  // A soft vignette: the edges are a little darker than the middle.
  const vignette = context.createRadialGradient(
    WIDTH / 2,
    HEIGHT * 0.45,
    HEIGHT * 0.3,
    WIDTH / 2,
    HEIGHT * 0.45,
    HEIGHT * 0.85,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  // The club bar on the left edge, like the table picture has.
  context.fillStyle = colors.fill;
  context.fillRect(0, 0, 14, HEIGHT);
}

function drawCrest(
  context: Context,
  team: Match['home_team'],
  logo: HTMLImageElement | null,
  centerX: number,
  colors: Colors,
  layout: Layout,
) {
  const { logoY, logoFit, nameY } = layout;

  if (logo && hasPicture(logo)) {
    // Just the crest, lifted off the background by a shadow.
    const ratio = Math.min(logoFit / logo.naturalWidth, logoFit / logo.naturalHeight);
    const w = logo.naturalWidth * ratio;
    const h = logo.naturalHeight * ratio;
    context.save();
    context.shadowColor = 'rgba(0,0,0,0.65)';
    context.shadowBlur = 36;
    context.shadowOffsetY = 14;
    context.drawImage(logo, centerX - w / 2, logoY - h / 2, w, h);
    context.restore();
  } else {
    drawShield(context, team, centerX, logoY, logoFit, colors);
  }

  // The name under the crest, on up to two lines.
  const font = `800 38px ${DISPLAY_FONT}`;
  context.font = font;
  const lines = wrapLines(team.name.toUpperCase(), 440, 2, (t) => context.measureText(t).width);
  const top = nameY - ((lines.length - 1) * 48) / 2;
  lines.forEach((line, index) => {
    text(
      context,
      line,
      centerX,
      top + index * 48,
      font,
      team.is_our_team ? colors.accent : PALETTE.text,
      'center',
    );
  });

  // A short bar under the name: club color for our team.
  const barY = top + (lines.length - 1) * 48 + 38;
  context.fillStyle = team.is_our_team ? colors.fill : 'rgba(242,245,240,0.35)';
  context.fillRect(centerX - 36, barY, 72, 5);
}

/** A crest shape with the first letter, for a team that has no logo. */
function drawShield(
  context: Context,
  team: Match['home_team'],
  cx: number,
  cy: number,
  size: number,
  colors: Colors,
) {
  const w = size * 0.86;
  const h = size;
  const left = cx - w / 2;
  const top = cy - h / 2;
  context.save();
  context.shadowColor = 'rgba(0,0,0,0.6)';
  context.shadowBlur = 36;
  context.shadowOffsetY = 14;
  context.beginPath();
  context.moveTo(left, top + 14);
  context.quadraticCurveTo(cx, top - 14, left + w, top + 14);
  context.lineTo(left + w, top + h * 0.55);
  context.quadraticCurveTo(left + w, top + h * 0.85, cx, top + h);
  context.quadraticCurveTo(left, top + h * 0.85, left, top + h * 0.55);
  context.closePath();
  context.fillStyle = team.is_our_team ? colors.fill : PALETTE.surface;
  context.fill();
  context.restore();
  context.strokeStyle = team.is_our_team ? colors.accent : 'rgba(242,245,240,0.3)';
  context.lineWidth = 5;
  context.stroke();
  text(
    context,
    team.name.charAt(0).toUpperCase(),
    cx,
    cy - 6,
    `800 ${Math.round(size * 0.52)}px ${DISPLAY_FONT}`,
    team.is_our_team ? colors.onAccent : PALETTE.text,
    'center',
  );
}

function drawHeader(context: Context, match: Match, options: AnnouncementOptions, colors: Colors) {
  drawBall(context, PADDING + 20, 80, 20);
  text(
    context,
    options.leagueName.toUpperCase(),
    PADDING + 56,
    80,
    `700 22px ${BODY_FONT}`,
    PALETTE.text,
    'left',
    1.5,
  );
  text(context, 'АНОНС МАТЧУ', PADDING, 156, `800 60px ${DISPLAY_FONT}`, PALETTE.text);

  if (match.round) {
    const label = `ТУР ${match.round}`;
    context.font = `800 24px ${BODY_FONT}`;
    const width = context.measureText(label).width + 52;
    const x = WIDTH - PADDING - width;
    roundedRectPath(context, x, 58, width, 44, 22);
    context.fillStyle = colors.fill;
    context.fill();
    text(context, label, x + width / 2, 81, `800 24px ${BODY_FONT}`, colors.onAccent, 'center', 1);
  }
}

function drawVersus(context: Context, logoY: number) {
  context.save();
  context.font = `800 76px ${DISPLAY_FONT}`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineJoin = 'round';
  context.lineWidth = 3;
  context.strokeStyle = 'rgba(242,245,240,0.62)';
  context.shadowColor = 'rgba(0,0,0,0.6)';
  context.shadowBlur = 24;
  context.strokeText('VS', WIDTH / 2, logoY);
  context.restore();
}

/**
 * The site address on the center axis of the poster, right above the "VS" medallion. It is kept
 * quiet: gray text on a dark plate, so that it is there but does not compete with the teams.
 */
function drawSiteBadge(context: Context, options: AnnouncementOptions, layout: Layout) {
  drawLinkPill(context, options.footer, WIDTH / 2, layout.logoY - CENTER_RADIUS - 44, {
    size: 24,
    fill: 'rgba(14,18,24,0.72)',
    color: 'rgba(206,213,209,0.78)',
    border: 'rgba(255,255,255,0.16)',
    maxWidth: 460,
    align: 'center',
  });
}

function drawInfoCard(context: Context, match: Match, colors: Colors) {
  const { x, y, width, height, cut } = CARD;

  // Card body.
  cutPath(context, x, y, width, height, cut);
  context.fillStyle = PALETTE.surface;
  context.fill();
  context.strokeStyle = PALETTE.border;
  context.lineWidth = 2;
  context.stroke();

  // The time on a club-colored block that reaches to the card's edge.
  context.save();
  cutPath(context, x, y, width, height, cut);
  context.clip();
  context.fillStyle = colors.fill;
  context.fillRect(TIME_BLOCK_X, y, x + width - TIME_BLOCK_X, height);
  context.restore();

  const blockCenter = (TIME_BLOCK_X + x + width) / 2;
  const blockWidth = x + width - TIME_BLOCK_X - 48;
  text(
    context,
    'ПОЧАТОК',
    blockCenter,
    y + 58,
    `800 20px ${BODY_FONT}`,
    withAlpha(colors.onAccent, 0.78),
    'center',
    3,
  );
  if (hasTime(match)) {
    const label = formatMatchTime(match.time);
    let size = 96;
    context.font = `800 ${size}px ${DISPLAY_FONT}`;
    while (size > 48 && context.measureText(label).width > blockWidth) {
      size -= 4;
      context.font = `800 ${size}px ${DISPLAY_FONT}`;
    }
    text(
      context,
      label,
      blockCenter,
      y + height / 2 + 24,
      `800 ${size}px ${DISPLAY_FONT}`,
      colors.onAccent,
      'center',
    );
  } else {
    text(
      context,
      TIME_TBD,
      blockCenter,
      y + height / 2 + 24,
      `800 30px ${BODY_FONT}`,
      colors.onAccent,
      'center',
    );
  }

  // The date on the left.
  const left = x + 44;
  text(context, 'ДАТА', left, y + 58, `800 20px ${BODY_FONT}`, PALETTE.muted, 'left', 3);
  if (hasDate(match)) {
    const { weekday, date } = splitDayHeading(formatDayHeading(match.date));
    text(context, weekday, left, y + 118, `800 34px ${DISPLAY_FONT}`, colors.accent);
    context.font = `800 44px ${DISPLAY_FONT}`;
    const dateText = ellipsize(date, TIME_BLOCK_X - left - 24, (t) => context.measureText(t).width);
    text(context, dateText, left, y + 178, `800 44px ${DISPLAY_FONT}`, PALETTE.text);
  } else {
    text(context, DATE_TBD, left, y + 130, `800 34px ${BODY_FONT}`, PALETTE.text);
  }
}

/** A thin cut-corner frame around the whole picture, the cut corners picked out in club color. */
function drawFrame(context: Context, colors: Colors) {
  const inset = 26;
  const [x, y, w, h, cut] = [inset, inset, WIDTH - 2 * inset, HEIGHT - 2 * inset, 44];
  context.save();
  context.lineJoin = 'round';
  cutPath(context, x, y, w, h, cut);
  context.strokeStyle = 'rgba(242,245,240,0.12)';
  context.lineWidth = 2;
  context.stroke();

  context.strokeStyle = colors.fill;
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(x, y + cut + 60);
  context.lineTo(x, y + cut);
  context.lineTo(x + cut, y);
  context.lineTo(x + cut + 60, y);
  context.moveTo(x + w, y + h - cut - 60);
  context.lineTo(x + w, y + h - cut);
  context.lineTo(x + w - cut, y + h);
  context.lineTo(x + w - cut - 60, y + h);
  context.stroke();
  context.restore();
}

function draw(
  context: Context,
  match: Match,
  images: { logos: Pictures; photos: Pictures; tints: (string | null)[] },
  options: AnnouncementOptions,
) {
  const colors = readAccent();
  const layout = images.photos.some(hasPicture) ? WITH_PHOTOS : WITHOUT_PHOTOS;
  // The team's own color; a crest with no clear color gets a neutral tone (our team: the club color).
  const tints: [string, string] = [
    images.tints[0] ?? (match.home_team.is_our_team ? colors.accent : NEUTRAL_TINT),
    images.tints[1] ?? (match.away_team.is_our_team ? colors.accent : NEUTRAL_TINT),
  ];
  drawBackground(context, images.photos, colors, layout, tints);
  drawHeader(context, match, options, colors);
  drawCrest(context, match.home_team, images.logos[0], LOGO_CENTERS[0], colors, layout);
  drawCrest(context, match.away_team, images.logos[1], LOGO_CENTERS[1], colors, layout);
  drawVersus(context, layout.logoY);
  drawSiteBadge(context, options, layout);
  drawInfoCard(context, match, colors);
  drawFrame(context, colors);
}

/** Draws the announcement of an upcoming match as a PNG picture ready to be saved or shared. */
export async function renderAnnouncementImage(
  match: Match,
  options: AnnouncementOptions,
): Promise<Blob> {
  await waitForFonts();
  const teams = [match.home_team, match.away_team];
  const [logos, photos] = await Promise.all([
    Promise.all(teams.map((team) => loadImage(team.logo, LOGO_WIDTH * 2, 'announce'))),
    Promise.all(teams.map((team) => loadImage(team.photo, TEAM_PHOTO_WIDTH, 'announce'))),
  ]);

  const tints = logos.map(dominantTint);
  const render = (images: { logos: Pictures; photos: Pictures; tints: (string | null)[] }) => {
    const canvas = document.createElement('canvas');
    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT * SCALE;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas is not supported');
    context.scale(SCALE, SCALE);
    draw(context, match, images, options);
    return toBlob(canvas);
  };

  try {
    return await render({ logos, photos, tints });
  } catch {
    // An image without CORS headers makes the canvas unexportable: draw without the photos.
    try {
      return await render({ logos, photos: [null, null], tints });
    } catch {
      return render({ logos: [null, null], photos: [null, null], tints: [null, null] });
    }
  }
}
