/* @flow */

import type { Cell } from './Cell';
import type { State } from '../reducers';

import {
  TILE_SIZE,
  THREE_TILE_SIZE,
  TILE_ZOOM_LEVEL,
} from './constants';

/**
 * http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
 * @param n
 * @param m
 * @returns {number} remainder
 */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/*
 * returns random integer
 * @param min Minimum of random integer
 * @param max Maximum of random integer
 * @return random integer between min and max (min <= ret <= max)
 */
export function getRandomInt(min, max) {
  const range = max - min + 1;
  return min + (Math.floor(Math.random() * range));
}

export function distMax([x1, y1]: Cell, [x2, y2]: Cell): number {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(n, max));
}

/*
 * convert YYYY-MM-DD to YYYYMMDD
 */
export function dateToString(date: string) {
  // YYYY-MM-DD
  return date.substr(0, 4) + date.substr(5, 2) + date.substr(8, 2);
}

/*
 * get current date in YYYY-MM-DD
 */
export function getToday() {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  if (month < 10) month = `0${month}`;
  if (day < 10) day = `0${day}`;
  return `${date.getFullYear()}-${month}-${day}`;
}

// z is assumed to be height here
// in ui and rendeer, y is height
export function getChunkOfPixel(
  canvasSize: number,
  x: number,
  y: number,
  z: number = null,
): Cell {
  const tileSize = (z === null) ? TILE_SIZE : THREE_TILE_SIZE;
  const width = (z == null) ? y : z;
  const cx = Math.floor((x + (canvasSize / 2)) / tileSize);
  const cy = Math.floor((width + (canvasSize / 2)) / tileSize);
  return [cx, cy];
}

export function getTileOfPixel(
  tileScale: number,
  pixel: Cell,
  canvasSize: number = null,
): Cell {
  const target = pixel.map(
    (x) => Math.floor((x + canvasSize / 2) / TILE_SIZE * tileScale),
  );
  return target;
}

export function getMaxTiledZoom(canvasSize: number): number {
  if (!canvasSize) return 0;
  return Math.log2(canvasSize / TILE_SIZE) / TILE_ZOOM_LEVEL * 2;
}

export function getHistoricalCanvasSize(
  historicalDate: string,
  canvasSize: number,
  historicalSizes: Array,
) {
  if (historicalDate && historicalSizes) {
    let i = historicalSizes.length;
    while (i > 0) {
      i -= 1;
      const [date, size] = historicalSizes[i];
      if (historicalDate <= date) {
        return size;
      }
    }
  }
  return canvasSize;
}

export function getCanvasBoundaries(canvasSize: number): number {
  const canvasMinXY = -canvasSize / 2;
  const canvasMaxXY = canvasSize / 2 - 1;
  return [canvasMinXY, canvasMaxXY];
}

// z is assumed to be height here
// in ui and rendeer, y is height
export function getOffsetOfPixel(
  canvasSize: number = null,
  x: number,
  y: number,
  z: number = null,
): number {
  const tileSize = (z === null) ? TILE_SIZE : THREE_TILE_SIZE;
  const width = (z == null) ? y : z;
  let offset = (z === null) ? 0 : (y * tileSize * tileSize);
  const modOffset = mod((canvasSize / 2), tileSize);
  const cx = mod(x + modOffset, tileSize);
  const cy = mod(width + modOffset, tileSize);
  offset += (cy * tileSize) + cx;
  return offset;
}

/*
 * Searches Object for element with ident string and returns its key
 * Used for getting canvas id from given ident-string (see canvases.json)
 * @param obj Object
 * @param ident ident string
 * @return key
 */
export function getIdFromObject(obj: Object, ident: string): number {
  const ids = Object.keys(obj);
  for (let i = 0; i < ids.length; i += 1) {
    const key = ids[i];
    if (obj[key].ident === ident) {
      return parseInt(key, 10);
    }
  }
  return null;
}

// z is returned as height here
// in ui and rendeer, y is height
export function getPixelFromChunkOffset(
  i: number,
  j: number,
  offset: number,
  canvasSize: number,
  is3d: boolean = false,
): Cell {
  const tileSize = (is3d) ? THREE_TILE_SIZE : TILE_SIZE;
  const cx = offset % tileSize;
  const off = offset - cx;
  let cy = off % (tileSize * tileSize);
  const z = (is3d) ? (off - cy) / tileSize / tileSize : null;
  cy /= tileSize;

  const devOffset = canvasSize / 2 / tileSize;
  const x = ((i - devOffset) * tileSize) + cx;
  const y = ((j - devOffset) * tileSize) + cy;
  return [x, y, z];
}

export function getCellInsideChunk(
  canvasSize: number,
  pixel: Cell,
): Cell {
  return pixel.map((x) => mod(x + canvasSize / 2, TILE_SIZE));
}

export function screenToWorld(
  state: State,
  $viewport: HTMLCanvasElement,
  [x, y]: Cell,
): Cell {
  const { view, viewscale } = state.canvas;
  const [viewX, viewY] = view;
  const { width, height } = $viewport;
  return [
    Math.floor(((x - (width / 2)) / viewscale) + viewX),
    Math.floor(((y - (height / 2)) / viewscale) + viewY),
  ];
}

export function worldToScreen(
  state: State,
  $viewport: HTMLCanvasElement,
  [x, y]: Cell,
): Cell {
  const { view, viewscale } = state.canvas;
  const [viewX, viewY] = view;
  const { width, height } = $viewport;
  return [
    ((x - viewX) * viewscale) + (width / 2),
    ((y - viewY) * viewscale) + (height / 2),
  ];
}

export function durationToString(
  ms: number,
  smallest: boolean = false,
): string {
  const seconds = Math.ceil(ms / 1000);
  let timestring: string;
  if (seconds < 60 && smallest) {
    timestring = seconds;
  } else {
    // eslint-disable-next-line max-len
    timestring = `${Math.floor(seconds / 60)}:${(`0${seconds % 60}`).slice(-2)}`;
  }
  return timestring;
}

const postfix = ['k', 'M', 'B'];
export function numberToString(num: number): string {
  if (!num) {
    return 'N/A';
  }
  if (num < 1000) {
    return num;
  }
  let postfixNum = 0;
  while (postfixNum < postfix.length) {
    if (num < 10000) {
      // eslint-disable-next-line max-len
      return `${Math.floor(num / 1000)}.${(`0${Math.floor((num % 1000) / 10)}`).slice(-2)}${postfix[postfixNum]}`;
    } if (num < 100000) {
      // eslint-disable-next-line max-len
      return `${Math.floor(num / 1000)}.${Math.floor((num % 1000) / 100)}${postfix[postfixNum]}`;
    } if (num < 1000000) {
      return Math.floor(num / 1000) + postfix[postfixNum];
    }
    postfixNum += 1;
    num = Math.round(num / 1000);
  }
  return '';
}

export function numberToStringFull(num: number): string {
  if (num < 0) {
    return `${num} :-(`;
  } if (num < 1000) {
    return num;
  } if (num < 1000000) {
    return `${Math.floor(num / 1000)}.${(`00${String(num % 1000)}`).slice(-3)}`;
  }

  // eslint-disable-next-line max-len
  return `${Math.floor(num / 1000000)}.${(`00${String(Math.floor(num / 1000))}`).slice(-3)}.${(`00${String(num % 1000)}`).slice(-3)}`;
}

/*
 * generates a color based on a given string
 */
export function colorFromText(str: string) {
  if (!str) return '#000000';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const c = (hash & 0x00FFFFFF)
    .toString(16)
    .toUpperCase();

  return `#${'00000'.substring(0, 6 - c.length)}${c}`;
}

/*
 * sets a color into bright or dark mode
 */
export function setBrightness(hex, dark: boolean = false) {
  hex = hex.replace(/^\s*#|\s*$/g, '');

  if (hex.length === 3) {
    hex = hex.replace(/(.)/g, '$1$1');
  }

  let r = Math.floor(parseInt(hex.substr(0, 2), 16) / 2);
  let g = Math.floor(parseInt(hex.substr(2, 2), 16) / 2);
  let b = Math.floor(parseInt(hex.substr(4, 2), 16) / 2);
  if (dark) {
    r += 128;
    g += 128;
    b += 128;
  }
  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`;
}

/*
 * create RegExp to search for ping in chat messages
 * @param name name
 * @return regular expression to search for name in message
 */
export function createNameRegExp(name: string) {
  if (!name) return null;
  return new RegExp(`(^|\\s+)(@${name})(\\s+|$)`, 'g');
}
