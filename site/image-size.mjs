// Reads width/height from PNG, GIF, JPEG and WebP headers, so <img> tags can
// reserve their space (no layout shift while images load).

import { openSync, readSync, closeSync, existsSync } from 'node:fs'

const cache = new Map()

function head(path, bytes) {
  const fd = openSync(path, 'r')
  const buf = Buffer.alloc(bytes)
  const n = readSync(fd, buf, 0, bytes, 0)
  closeSync(fd)
  return buf.subarray(0, n)
}

export function imageSize(path) {
  if (cache.has(path)) return cache.get(path)
  let size = null
  if (existsSync(path)) {
    const b = head(path, 256 * 1024)
    if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) {
      size = { width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
    } else if (b.toString('ascii', 0, 3) === 'GIF') {
      size = { width: b.readUInt16LE(6), height: b.readUInt16LE(8) }
    } else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = b.toString('ascii', 12, 16)
      if (chunk === 'VP8 ') size = { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
      else if (chunk === 'VP8L') {
        const bits = b.readUInt32LE(21)
        size = { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
      } else if (chunk === 'VP8X') size = { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 }
    } else if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue }
        const marker = b[i + 1]
        const len = b.readUInt16BE(i + 2)
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          size = { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) }
          break
        }
        i += 2 + len
      }
    }
  }
  if (size && !(size.width > 0 && size.height > 0)) size = null
  cache.set(path, size)
  return size
}
