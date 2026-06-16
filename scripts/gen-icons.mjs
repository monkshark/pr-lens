import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(here, '../public/icons')
mkdirSync(outDir, { recursive: true })

const BG = [124, 108, 245]
const FG = [255, 255, 255]
const SIZES = [16, 32, 48, 128]
const SS = 4

function crcTable() {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c >>> 0
  }
  return t
}
const CRC = crcTable()

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const body = Buffer.concat([typeBuf, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

function inRoundRect(x, y, s, r) {
  if (x < 0 || y < 0 || x > s || y > s) return false
  const cx = Math.min(Math.max(x, r), s - r)
  const cy = Math.min(Math.max(y, r), s - r)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= r * r
}

function render(size) {
  const r = size * 0.22
  const cx = size / 2
  const cy = size / 2
  const ro = size * 0.3
  const ri = ro - size * 0.11
  const px = Buffer.alloc(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rs = 0
      let gs = 0
      let bs = 0
      let as = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const fx = x + (sx + 0.5) / SS
          const fy = y + (sy + 0.5) / SS
          if (!inRoundRect(fx, fy, size, r)) continue
          const d = Math.hypot(fx - cx, fy - cy)
          const col = d >= ri && d <= ro ? FG : BG
          rs += col[0]
          gs += col[1]
          bs += col[2]
          as += 255
        }
      }
      const n = SS * SS
      const cov = as / (255 * n)
      const i = (y * size + x) * 4
      if (cov === 0) continue
      px[i] = Math.round(rs / (n * cov))
      px[i + 1] = Math.round(gs / (n * cov))
      px[i + 2] = Math.round(bs / (n * cov))
      px[i + 3] = Math.round(as / n)
    }
  }

  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    px.copy(
      raw,
      y * (size * 4 + 1) + 1,
      y * size * 4,
      y * size * 4 + size * 4,
    )
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

for (const s of SIZES) {
  writeFileSync(resolve(outDir, `icon-${s}.png`), render(s))
  console.log(`icon-${s}.png`)
}
