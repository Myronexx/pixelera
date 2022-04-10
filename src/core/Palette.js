/*
 * Palette
 */

class Palette {
  length;
  rgb;
  colors;
  abgr;
  fl;

  constructor(colors) {
    this.length = colors.length;
    this.rgb = new Uint8Array(this.length * 3);
    this.colors = new Array(this.length);
    this.abgr = new Uint32Array(this.length);
    this.fl = new Array(this.length);

    let cnt = 0;
    for (let index = 0; index < colors.length; index++) {
      const r = colors[index][0];
      const g = colors[index][1];
      const b = colors[index][2];
      this.rgb[cnt++] = r;
      this.rgb[cnt++] = g;
      this.rgb[cnt++] = b;
      this.colors[index] = `rgb(${r}, ${g}, ${b})`;
      this.abgr[index] = (0xFF000000) | (b << 16) | (g << 8) | (r);
      this.fl[index] = [r / 256, g / 256, b / 256];
    }
  }

  /*
  * Check if a color is light (closer to white) or dark (closer to black)
  * @param color Index of color in palette
  * @return dark True if color is dark
  */
  isDark(color) {
    color *= 3;
    const r = this.rgb[color++];
    const g = this.rgb[color++];
    const b = this.rgb[color];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return (luminance < 128);
  }

  /*
   * Get last matching color index of RGB color
   * @param r r
   * @param g g
   * @param b b
   * @return index of color
   */
  getIndexOfColor(
    r,
    g,
    b,
  ) {
    const { rgb } = this;
    let i = rgb.length / 3;
    while (i > 0) {
      i -= 1;
      const off = i * 3;
      if (rgb[off] === r
          && rgb[off + 1] === g
          && rgb[off + 2] === b
      ) {
        return i;
      }
    }
    return null;
  }

  /*
   * Get closest matching color index of RGB color
   * @param r r
   * @param g g
   * @param b b
   * @return index of color
   */
  getClosestIndexOfColor(
    r,
    g,
    b,
  ) {
    const { rgb } = this;
    let i = rgb.length / 3;
    let closestIndex = 0;
    let closestDistance = null;
    while (i > 0) {
      i -= 1;
      const off = i * 3;
      let distance = (rgb[off] - r) ** 2;
      distance += (rgb[off + 1] - g) ** 2;
      distance += (rgb[off + 2] - b) ** 2;
      if (closestDistance === null || closestDistance > distance) {
        closestIndex = i;
        closestDistance = distance;
      }
    }
    return closestIndex;
  }

  /*
   * Take a buffer of indexed pixels and output it as ABGR Array
   * @param chunkBuffer Buffer of indexed pixels
   * @return ABRG Buffer
   */
  buffer2ABGR(chunkBuffer) {
    const { length } = chunkBuffer;
    const colors = new Uint32Array(length);
    let value;

    let pos = 0;
    for (let i = 0; i < length; i++) {
      value = (chunkBuffer[i] & 0x3F);
      colors[pos++] = this.abgr[value];
    }
    return colors;
  }

  /*
   * Take a buffer of indexed pixels and output it as RGB Array
   * @param chunkBuffer Buffer of indexed pixels
   * @return RGB Buffer
   */
  buffer2RGB(chunkBuffer) {
    const { length } = chunkBuffer;
    const colors = new Uint8Array(length * 3);
    let color;
    let value;
    const buffer = chunkBuffer;

    let c = 0;
    for (let i = 0; i < length; i++) {
      value = buffer[i];

      color = (value & 0x3F) * 3;
      colors[c++] = this.rgb[color++];
      colors[c++] = this.rgb[color++];
      colors[c++] = this.rgb[color];
    }
    return colors;
  }

  /*
   * Create a RGB Buffer of a specific size with just one color
   * @param color Color Index of color to use
   * @param length Length of needed Buffer
   * @return RGB Buffer of wanted size with just one color
   */
  oneColorBuffer(color, length) {
    const buffer = new Uint8Array(length * 3);
    const r = this.rgb[color * 3];
    const g = this.rgb[color * 3 + 1];
    const b = this.rgb[color * 3 + 2];
    let pos = 0;
    for (let i = 0; i < length; i++) {
      buffer[pos++] = r;
      buffer[pos++] = g;
      buffer[pos++] = b;
    }

    return buffer;
  }
}

export const COLORS_RGB = new Uint8Array([
  202, 227, 255, // first color is unset pixel in ocean
  255, 255, 255, // second color is unset pixel on land
  255, 255, 255, // white
  228, 228, 228, // light gray
  196, 196, 196, // silver
  136, 136, 136, // dark gray
  78, 78, 78, // darker gray
  0, 0, 0, // black
  244, 179, 174, // skin
  255, 167, 209, // light pink
  255, 84, 178, // pink
  255, 101, 101, // peach
  229, 0, 0, // red
  154, 0, 0, // dark red
  254, 164, 96, // light brown
  229, 149, 0, // orange
  160, 106, 66, // brown
  96, 64, 40, // dark brown
  245, 223, 176, // sand
  255, 248, 137, // khaki
  229, 217, 0, // yellow
  148, 224, 68, // light green
  2, 190, 1, // green
  104, 131, 56, // olive
  0, 101, 19, // dark green
  202, 227, 255, // sky blue
  0, 211, 221, // light blue
  0, 131, 199, // dark blue
  0, 0, 234, // blue
  25, 25, 115, // darker blue
  207, 110, 228, // light violette
  130, 0, 128, // violette
]);

export const COLORS_AMOUNT = COLORS_RGB.length / 3;
export const COLORS = new Array(COLORS_AMOUNT);
export const COLORS_ABGR = new Uint32Array(COLORS_AMOUNT);
export const TRANSPARENT = 0;


export default Palette;
