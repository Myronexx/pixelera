/* @flow */

import { getChunkOfPixel, getOffsetOfPixel } from '../../core/utils';
import {
  TILE_SIZE,
  THREE_TILE_SIZE,
  THREE_CANVAS_HEIGHT,
} from '../../core/constants';
// eslint-disable-next-line import/no-unresolved
import canvases from './canvases.json';
import logger from '../../core/logger';

import redis from '../redis';


const UINT_SIZE = 'u8';

const EMPTY_CACA = new Uint8Array(TILE_SIZE * TILE_SIZE);
const EMPTY_CHUNK_BUFFER = Buffer.from(EMPTY_CACA.buffer);
const THREE_EMPTY_CACA = new Uint8Array(
  THREE_TILE_SIZE * THREE_TILE_SIZE * THREE_CANVAS_HEIGHT,
);
const THREE_EMPTY_CHUNK_BUFFER = Buffer.from(THREE_EMPTY_CACA.buffer);

// cache existence of chunks
const chunks: Set<string> = new Set();


class RedisCanvas {
  // callback that gets informed about chunk changes
  static registerChunkChange = () => undefined;
  static setChunkChangeCallback(cb) {
    RedisCanvas.registerChunkChange = cb;
  }

  static getChunk(
    canvasId: number,
    i: number,
    j: number,
  ): Promise<Buffer> {
    // this key is also hardcoded into
    // core/tilesBackup.js
    // and ./EventData.js
    const key = `ch:${canvasId}:${i}:${j}`;
    return redis.getAsync(key);
  }

  static async setChunk(i: number, j: number, chunk: Uint8Array,
    canvasId: number) {
    if (chunk.length !== TILE_SIZE * TILE_SIZE) {
      logger.error(`Tried to set chunk with invalid length ${chunk.length}!`);
      return false;
    }
    const key = `ch:${canvasId}:${i}:${j}`;
    await redis.setAsync(key, Buffer.from(chunk.buffer));
    RedisCanvas.registerChunkChange(canvasId, [i, j]);
    return true;
  }

  static async setPixel(
    canvasId: number,
    color: number,
    x: number,
    y: number,
    z: number = null,
  ) {
    const canvasSize = canvases[canvasId].size;
    const [i, j] = getChunkOfPixel(canvasSize, x, y, z);
    const offset = getOffsetOfPixel(canvasSize, x, y, z);
    RedisCanvas.setPixelInChunk(i, j, offset, color, canvasId);
  }

  static async setPixelInChunk(
    i: number,
    j: number,
    offset: number,
    color: number,
    canvasId: number,
  ) {
    const key = `ch:${canvasId}:${i}:${j}`;

    if (!chunks.has(key)) {
      const is3D = canvases[canvasId].v;
      if (is3D) {
        await redis.setAsync(key, THREE_EMPTY_CHUNK_BUFFER, 'NX');
      } else {
        await redis.setAsync(key, EMPTY_CHUNK_BUFFER, 'NX');
      }
      chunks.add(key);
    }

    const args = [key, 'SET', UINT_SIZE, `#${offset}`, color];
    await redis.sendCommandAsync('bitfield', args);
    RedisCanvas.registerChunkChange(canvasId, [i, j]);
  }

  static async getPixelIfExists(
    canvasId: number,
    i: number,
    j: number,
    offset: number,
  ): Promise<number> {
    // 1st bit -> protected or not
    // 2nd bit -> unused
    // rest (6 bits) -> index of color
    const args = [
      `ch:${canvasId}:${i}:${j}`,
      'GET',
      UINT_SIZE,
      `#${offset}`,
    ];
    const result: ?number = await redis.sendCommandAsync('bitfield', args);
    if (!result) return null;
    const color = result[0];
    return color;
  }

  static async getPixelByOffset(
    canvasId: number,
    i: number,
    j: number,
    offset: number,
  ): Promise<number> {
    const clr = RedisCanvas.getPixelIfExists(canvasId, i, j, offset);
    return (clr == null) ? 0 : clr;
  }

  static async getPixel(
    canvasId: number,
    x: number,
    y: number,
    z: number = null,
  ): Promise<number> {
    const canvasSize = canvases[canvasId].size;
    const [i, j] = getChunkOfPixel(canvasSize, x, y, z);
    const offset = getOffsetOfPixel(canvasSize, x, y, z);

    const clr = RedisCanvas.getPixelIfExists(canvasId, i, j, offset);
    return (clr == null) ? 0 : clr;
  }
}

export default RedisCanvas;
