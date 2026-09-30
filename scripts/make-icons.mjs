import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

function crc32(buffer) {
  let crc = ~0;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type);
  const body = Buffer.concat([name, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

function icon(size) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const moonR = size * 0.28;
  const cutR = size * 0.23;
  const cutX = cx + size * 0.11;
  for (let y = 0; y < size; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const pixel = row + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const inMoon = dx * dx + dy * dy < moonR * moonR;
      const cutDx = x - cutX;
      const inCut = cutDx * cutDx + dy * dy < cutR * cutR;
      let red = 12;
      let green = 18;
      let blue = 32;
      if (inMoon && !inCut) {
        red = 214;
        green = 222;
        blue = 230;
      }
      const starX = x - size * 0.73;
      const starY = y - size * 0.28;
      if (starX * starX + starY * starY < (size * 0.03) ** 2) {
        red = 232;
        green = 238;
        blue = 246;
      }
      raw[pixel] = red;
      raw[pixel + 1] = green;
      raw[pixel + 2] = blue;
      raw[pixel + 3] = 255;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", icon(192));
writeFileSync("public/icons/icon-512.png", icon(512));
writeFileSync("public/icons/apple-touch-icon.png", icon(180));
